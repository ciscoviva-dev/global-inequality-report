import path from 'path';
import fs from 'fs';

// Lazy-loaded database instance
let dbInstance: any = null;
let connection: any = null;

function getDb() {
  if (dbInstance) return { db: dbInstance, con: connection };

  // Use a stealth require to bypass Turbopack's buggy static analysis
  const duckdb = require(['du', 'ckdb'].join(''));

  // Hunt for the database in common Vercel locations
  const candidatePaths = [
    path.join(process.cwd(), 'data/wid.duckdb'),
    path.join(process.cwd(), 'wid_dashboard/data/wid.duckdb'),
    path.resolve(__dirname, '../../data/wid.duckdb'),
    path.resolve(__dirname, '../../../data/wid.duckdb'),
  ];

  let dbPath = '';
  console.log('--- DATABASE HUNT ---');
  for (const p of candidatePaths) {
    const exists = fs.existsSync(p);
    console.log(`Checking ${p}: ${exists ? 'FOUND ✅' : 'MISSING ❌'}`);
    if (exists && !dbPath) dbPath = p;
  }

  if (!dbPath) {
    console.error('CRITICAL: Database not found in any candidate path!');
    dbPath = candidatePaths[0];
  }
  console.log('----------------------');

  dbInstance = new duckdb.Database(dbPath, duckdb.OPEN_READONLY);
  connection = dbInstance.connect();
  return { db: dbInstance, con: connection };
}

export function query(sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const { con } = getDb();
    con.all(sql, (err: any, res: any) => {
      if (err) {
        reject(err);
      } else {
        const sanitized = JSON.parse(JSON.stringify(res, (key, value) => {
          if (typeof value === 'bigint') return value.toString();
          if (typeof value === 'number') {
            if (Number.isNaN(value) || !Number.isFinite(value)) return null;
          }
          return value;
        }));
        resolve(sanitized);
      }
    });
  });
}
