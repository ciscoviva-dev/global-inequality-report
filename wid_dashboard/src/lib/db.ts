import path from 'path';
import fs from 'fs';

// Use standard require so Vercel's tracing system can see the dependency
const duckdb = require('duckdb');

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
  // Fallback to the most likely one to prevent total crash during init
  dbPath = candidatePaths[0];
}
console.log('----------------------');

const db = new duckdb.Database(dbPath, duckdb.OPEN_READONLY);
const con = db.connect();

export function query(sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    con.all(sql, (err: any, res: any) => {
      if (err) {
        reject(err);
      } else {
        // Sanitize results for JSON serialization (Next.js RSC boundary)
        // This handles BigInt, NaN, Infinity which are common in DuckDB results
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
