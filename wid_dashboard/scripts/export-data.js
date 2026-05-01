/**
 * Pre-build data export script.
 * Runs BEFORE `next build` to query DuckDB and save results as static JSON.
 * This eliminates the need for DuckDB at runtime on Vercel.
 */

const path = require('path');
const fs = require('fs');
const duckdb = require('duckdb');

const dbPath = path.join(__dirname, '../data/wid.duckdb');
const outputDir = path.join(__dirname, '../src/data');

if (!fs.existsSync(dbPath)) {
  console.error(`❌ Database not found at: ${dbPath}`);
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const db = new duckdb.Database(dbPath, duckdb.OPEN_READONLY);
const con = db.connect();

function query(sql) {
  return new Promise((resolve, reject) => {
    con.all(sql, (err, res) => {
      if (err) return reject(err);
      const sanitized = JSON.parse(JSON.stringify(res, (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        if (typeof value === 'number' && (!Number.isFinite(value) || Number.isNaN(value))) return null;
        return value;
      }));
      resolve(sanitized);
    });
  });
}

const majorRegions = `(
  'World (MER)', 'Europe (MER)', 'North America (MER)',
  'Latin America (MER)', 'East Asia (MER)', 'South & Southeast Asia (MER)',
  'MENA (MER)', 'Sub-Saharan Africa (MER)', 'Russia & Central Asia (MER)'
)`;

async function main() {
  console.log('📦 Exporting DuckDB data to static JSON...');

  // 1. Global data (for map + all charts)
  console.log('  → Exporting global data...');
  const globalData = await query(`
    SELECT year, region, country_code, percentile, category, value
    FROM main.fct_inequality_metrics
    ORDER BY year ASC
  `);
  fs.writeFileSync(path.join(outputDir, 'global-data.json'), JSON.stringify(globalData));
  console.log(`     ✅ ${globalData.length} rows`);

  // 2. Gap data (for dumbbell chart)
  console.log('  → Exporting gap data...');
  const gapData = await query(`
    SELECT year, region, percentile, income_share, wealth_share, inequality_gap
    FROM main.income_vs_wealth_inequality
    WHERE region IN ${majorRegions}
    ORDER BY year ASC
  `);
  fs.writeFileSync(path.join(outputDir, 'gap-data.json'), JSON.stringify(gapData));
  console.log(`     ✅ ${gapData.length} rows`);

  // 3. Summary/metadata table
  console.log('  → Exporting summary data...');
  const summaryData = await query(`SELECT * FROM wid_summary`);
  fs.writeFileSync(path.join(outputDir, 'summary-data.json'), JSON.stringify(summaryData));
  console.log(`     ✅ ${summaryData.length} rows`);

  con.close();
  db.close();
  console.log('\n✅ All data exported successfully!\n');
}

main().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
