# Global Inequality Dashboard (1820—2020)

A high-fidelity editorial data visualization platform exploring two centuries of global economic divergence. This project leverages a modern data stack to transform complex historical datasets into interactive, accessible narratives.

## 🚀 The Tech Stack
- **Frontend**: Next.js 15, TypeScript, Framer Motion, Recharts, Tailwind CSS.
- **Data Engineering**: dbt (data build tool), DuckDB.
- **Primary Source**: World Inequality Database (WID.world).

## 🏛️ Architecture
The project is split into two main modules:
1.  **`wid_dashboard/`**: The presentation layer. A cinematic, responsive React application designed with an editorial aesthetic. It queries a local DuckDB instance for ultra-fast, client-side data exploration.
2.  **`wid_project/`**: The ELT layer. Uses dbt to clean, normalize, and model the raw historical data (Income, Wealth, and Percentile shares) into a highly optimized analytical schema.

## 📊 Key Features
- **The Global Picture**: An interactive choropleth map tracking capital concentration across 200+ nations.
- **Historical Trajectories**: Longitudinal analysis of income shifts among the Top 1% vs. Bottom 50% since 1820.
- **Ownership Gaps**: Benchmarking the "Rentier" nature of regional economies using dynamic dumbbell charts.
- **Metadata Explorer**: A searchable, deep-linkable database of the primary citations and methodologies used by WID researchers.

## 🛠️ Getting Started
### 1. Data Transformation (dbt)
```bash
cd wid_project
pip install -r requirements.txt
dbt seed
dbt run
```

### 2. Frontend Launch
```bash
cd ../wid_dashboard
npm install
npm run dev
```

## ☁️ Deployment Note
While the raw World Inequality Database contains gigabytes of data, this dashboard uses a **highly compressed and modeled DuckDB snapshot** (approx. 3MB). This allows the entire application to be deployed on serverless platforms like **Vercel** with near-zero latency and minimal cost.

---
*Created for portfolio demonstration. Data sourced from WID.world.*
