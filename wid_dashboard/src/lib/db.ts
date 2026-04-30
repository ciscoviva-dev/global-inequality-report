import path from 'path';

// Use dynamic require to bypass Turbopack/Webpack analysis of the native module
const duckdb = eval('require')('duckdb');

const dbPath = path.join(process.cwd(), 'data/wid.duckdb');

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
