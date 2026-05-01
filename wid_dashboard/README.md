# 🌍 Global Inequality Report

An interactive, editorial-grade data dashboard visualising **two centuries of economic divergence** across 200+ nations — built with a production-grade dbt + DuckDB data pipeline and deployed globally via Vercel.

**[→ Live Demo](https://global-inequality-report.vercel.app)**

---

## 📐 Architecture

This project demonstrates a full end-to-end data engineering and visualisation pipeline:

```
Raw WID Data (6GB Excel/CSV)
        │
        ▼
┌──────────────────┐
│   dbt Pipeline   │  ← SQL models, tests, and documentation
│  (wid_project/)  │    transforms raw data into analytical models
└──────────────────┘
        │ dbt run
        ▼
┌──────────────────┐
│  DuckDB (.duckdb)│  ← Lightweight, high-performance analytical DB
│   ~3MB snapshot  │    stores the modelled, clean data
└──────────────────┘
        │ node scripts/export-data.js (at build time)
        ▼
┌──────────────────┐
│  Static JSON     │  ← Pre-baked data files (no runtime DB needed)
│  (src/data/)     │    exported from DuckDB before every deployment
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Next.js 16      │  ← React Server Components serve pre-baked data
│  + Recharts      │    Charts rendered interactively on the client
│  + Framer Motion │
└──────────────────┘
        │
        ▼
     Vercel
  (Global CDN)
```

### Why this approach?
- **dbt** provides a structured, version-controlled, and testable transformation layer — precisely as used in professional data engineering teams.
- **DuckDB** handles the heavy lifting during local development and CI builds, querying 6GB of source data and producing a clean 3MB snapshot in seconds.
- **Static JSON export** eliminates runtime database dependencies, making the application globally deployable on serverless infrastructure at no cost.
- **No Docker required** — the pipeline runs natively via a lightweight Python virtual environment.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Data Transformation** | [dbt-core](https://docs.getdbt.com/) + [dbt-duckdb](https://github.com/duckdb/dbt-duckdb) |
| **Analytics Database** | [DuckDB](https://duckdb.org/) |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| **Charting** | [Recharts](https://recharts.org/) + [react-simple-maps](https://www.react-simple-maps.io/) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Deployment** | [Vercel](https://vercel.com/) |
| **Data Source** | [World Inequality Database (WID.world)](https://wid.world/) |

---

## 🗂 Project Structure

```
global-inequality-report/
├── wid_project/               # dbt project (data pipeline)
│   ├── models/                # SQL transformation models
│   │   ├── staging/           # Raw source cleaning
│   │   └── marts/             # Analytical fact tables
│   ├── seeds/                 # Source data snapshots
│   ├── tests/                 # dbt data quality tests
│   ├── wid.duckdb             # Modelled DuckDB snapshot (~3MB)
│   └── dbt_project.yml
│
├── wid_dashboard/             # Next.js application
│   ├── scripts/
│   │   └── export-data.js     # Pre-build DuckDB → JSON export script
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # Interactive chart components
│   │   ├── data/              # Pre-baked JSON (generated at build time)
│   │   └── lib/
│   │       └── db.ts          # Static JSON data loader
│   └── package.json
│
└── _SOURCES/                  # Archived raw WID source data (6GB, not in git)
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- Python 3.10+ (for the dbt pipeline, if re-modelling data)

### 1. Set up the dbt pipeline (optional — modelled snapshot already included)
```bash
cd wid_project
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
dbt run
```

### 2. Export data and run the dashboard
```bash
cd wid_dashboard
npm install
node scripts/export-data.js   # Exports DuckDB → src/data/*.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📊 Data Source

All data sourced from the **[World Inequality Database (WID.world)](https://wid.world/data/)**, covering pre-tax national income and net personal wealth shares for 200+ countries from 1820 to 2020.

---

## 📝 Deployment

Deployed on **Vercel** with automatic deployments on every push to `main`.

The build command `node scripts/export-data.js && next build` first queries the DuckDB snapshot to export clean JSON files, then builds the Next.js application. The result is a fully static, zero-dependency frontend with no runtime database server required — a lean, production-grade architecture suited to serverless hosting at scale.
