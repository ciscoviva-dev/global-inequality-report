export const dynamic = 'force-dynamic';
import { getGlobalData, getGapData } from '@/lib/db';
import ChartComponent from '@/components/ChartComponent';
import BarChartComponent from '@/components/BarChartComponent';
import StructuralEvolutionComponent from '@/components/StructuralEvolutionComponent';
import GlobalMapComponent from '@/components/GlobalMapComponent';
import Link from 'next/link';

export default async function Home() {
  const globalData = getGlobalData();
  const gapData = getGapData();

  // Filter down for the legacy line charts
  const majorRegionsList = [
    'World (MER)', 'Europe (MER)', 'North America (MER)',
    'Latin America (MER)', 'East Asia (MER)', 'South & Southeast Asia (MER)',
    'MENA (MER)', 'Sub-Saharan Africa (MER)', 'Russia & Central Asia (MER)'
  ];
  const regionalData = globalData.filter((d: any) => majorRegionsList.includes(d.region));
  const incomeData = regionalData.filter((d: any) => d.category === 'Pre-tax national income' && (d.percentile === 'p99p100' || d.percentile === 'p90p100' || d.percentile === 'p0p50'));

  return (
    <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-24 space-y-32 text-foreground">
      {/* Top Right Metadata Card */}
      <div className="absolute top-8 right-6 z-50">
        <Link 
          href="/summary" 
          className="flex flex-col gap-1 p-4 bg-[#111] border border-[#222] hover:border-accent group transition-all duration-300 rounded-lg shadow-xl max-w-[200px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em] group-hover:text-accent transition-colors">Resources</span>
            <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <span className="text-xs font-serif italic text-[#ccc] group-hover:text-white transition-colors">Metadata & Methodology</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="mb-32 flex flex-col items-center text-center">
        <h1 className="text-6xl md:text-8xl font-serif tracking-tighter leading-[1.1] mb-8 max-w-4xl">
          The Global <span className="text-accent italic">Inequality</span> Report
        </h1>
        <div className="max-w-3xl space-y-6 text-xl text-[#888] font-sans font-light leading-relaxed">
          <p className="text-2xl text-[#ccc] font-medium">
            An interactive deep-dive into two centuries of economic divergence.
          </p>
          <p>
            This dashboard visualises historical data from the World Inequality Database (WID.world), tracking how the distribution of income and wealth between the <strong className="text-[#fcfcfc]">Top 1%</strong> and the <strong className="text-indigo-400">Bottom 50%</strong> has evolved across 200+ nations since 1820.
          </p>
        </div>
      </section>

      {/* Section 1: The Global Map */}
      <section className="space-y-12">
        <header className="w-full">
          <h2 className="text-3xl font-serif mb-6 border-b border-[#222] pb-4 italic text-accent">01. The Global Picture</h2>
          <div className="text-[#888] font-sans font-light leading-relaxed">
            <p className="text-lg">
              This interactive <strong className="text-[#ccc]">Choropleth Map</strong> visualises the geographic distribution of global inequality, mapping how wealth and income are concentrated across 200+ nations. The interface uses a dynamic colour scale to reveal extreme hotspots where the <strong className="text-[#fcfcfc]">Top 1%</strong> holds a disproportionate share of national assets, while the <strong className="text-indigo-400">Bottom 50%</strong> toggle highlights the inverse "asset vacuum" where the poorest half of the population often holds near-zero shares. By adjusting the <strong className="text-[#ccc]">1820 — 2020 timeline slider</strong>, you can observe the longitudinal shift of these geographic clusters over two centuries, tracking the evolution of capital accumulation from the industrial era to the modern global economy.
            </p>
          </div>
        </header>
        <div className="w-full border-b border-[#222] pb-24">
          <GlobalMapComponent data={globalData} />
        </div>
      </section>

      <section className="space-y-12">
        <header className="w-full">
          <h2 className="text-3xl font-serif mb-6 border-b border-[#222] pb-4 italic text-accent">02. Historical Trajectories</h2>
          <div className="text-[#888] font-sans font-light leading-relaxed">
            <p className="text-lg">
              This module provides a longitudinal analysis of how pre-tax national income shares have shifted across the world's major economic blocs over the last two centuries. By tracking the distribution among the <strong className="text-[#fcfcfc]">Top 1%</strong> and the <strong className="text-indigo-400">Bottom 50%</strong> since 1820, these timelines reveal the long-term impact of industrialisation, policy shifts, and global economic integration. The interface allows for direct regional comparisons and provides <strong className="text-[#ccc]">calculated trend lines</strong> to expose the underlying momentum of wealth accumulation and divergence within each macro-region.
            </p>
          </div>
        </header>
        <div className="w-full border-b border-[#222] pb-24">
          <ChartComponent data={incomeData} />
        </div>
      </section>

      <section className="space-y-12">
        <header className="w-full">
          <h2 className="text-3xl font-serif mb-6 border-b border-[#222] pb-4 italic text-accent">03. Regional Benchmarks</h2>
          <div className="text-[#888] font-sans font-light leading-relaxed">
            <p className="text-lg">
              This snapshot uses a <strong className="text-[#ccc]">Dumbbell Chart</strong> to compare the <strong>Ownership Gap</strong> across all macro-regions simultaneously. By visualising the explicit distance between <strong className="text-[#059669]">Income Share</strong> and <strong className="text-[#f43f5e]">Wealth Share</strong> for a given population group, this benchmark reveals the "Rentier" nature of different economies. A wider gap indicates a high degree of capital concentration where wealth accumulation significantly outpaces current earnings, while narrower gaps suggest a more balanced distribution between active income and stored assets.
            </p>
          </div>
        </header>
        <div className="w-full border-b border-[#222] pb-24">
          <BarChartComponent data={regionalData} />
        </div>
      </section>

      <section className="space-y-12">
        <header className="w-full">
          <h2 className="text-3xl font-serif mb-6 border-b border-[#222] pb-4 italic text-accent">04. The Great Divide</h2>
          <div className="text-[#888] font-sans font-light leading-relaxed">
            <p className="text-lg">
              This module focuses on major macro-regions to expose the structural asset deficit of the poorest half of the population. By visualising the shaded area between <strong className="text-[#059669]">Income</strong> and <strong className="text-[#f43f5e]">Wealth</strong> over time, this area chart highlights the "Ownership Void" where earnings are not successfully converted into long-term assets. This longitudinal view demonstrates how structural inequality is not just about annual earnings, but about the multi-generational accumulation of capital—or the lack thereof—among the <strong className="text-indigo-400">Bottom 50%</strong>.
            </p>
          </div>
        </header>
        <div className="w-full">
          <StructuralEvolutionComponent data={regionalData} />
        </div>
      </section>
      
      <footer className="pt-24 pb-12 border-t border-[#222] text-[#444] font-sans text-xs flex justify-between items-center">
        <div className="flex gap-8">
          <p>Data Source: <a href="https://wid.world/data/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">WID.world (1820—2020)</a></p>
          <Link href="/summary" className="hover:text-accent transition-colors">Internal Metadata & Methodology</Link>
        </div>
        <p>Powered by a 6GB DuckDB ELT Pipeline</p>
      </footer>
    </main>
  );
}
