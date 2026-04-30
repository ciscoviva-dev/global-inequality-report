"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function StructuralEvolutionComponent({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('World (MER)');

  const allYears = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);
  }, [data]);

  const [startYear, setStartYear] = useState(1820);
  const [endYear, setEndYear] = useState(2020);
  const [group, setGroup] = useState('p99p100');

  useEffect(() => {
    if (allYears.length > 0) {
      setStartYear(allYears[0]);
      setEndYear(allYears[allYears.length - 1]);
    }
  }, [allYears]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const regions = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map(d => d.region))).sort();
  }, [data]);

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const regionData = data.filter(d => 
      d.region === selectedRegion && 
      d.year >= startYear && 
      d.year <= endYear
    );
    const years = Array.from(new Set(regionData.map(d => d.year))).sort((a, b) => a - b);

    if (years.length === 0) return [];

    return years.map(year => {
      const match = (p: string, c: string) => 
        regionData.find(d => d.year === year && d.percentile === p && d.category === c);
      
      const topInc = match(group, 'Pre-tax national income')?.value ?? 0;
      const topWth = match(group, 'Net personal wealth')?.value ?? 0;
      const botInc = match('p0p50', 'Pre-tax national income')?.value ?? 0;
      const botWth = match('p0p50', 'Net personal wealth')?.value ?? 0;

      return {
        year,
        top_income: parseFloat(topInc as any) * 100,
        top_wealth: parseFloat(topWth as any) * 100,
        bottom_income: parseFloat(botInc as any) * 100,
        bottom_wealth: parseFloat(botWth as any) * 100,
      };
    });
  }, [data, selectedRegion, startYear, endYear, group]);

  if (!isMounted) {
    return <div className="w-full h-[600px] mt-12 border border-[#222] bg-[#0c0c0c] rounded-xl animate-pulse" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full min-h-[700px] flex flex-col mt-12 p-4 md:p-8 border border-[#222] bg-[#0c0c0c] rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Top Control Bar */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Regions Toggle */}
        <div>
          <span className="block text-[10px] text-[#555] font-sans uppercase tracking-[0.2em] mb-3">Select Region</span>
          <div className="flex flex-wrap gap-2">
            {regions.length > 0 ? regions.map((r) => {
              const isSelected = r === selectedRegion;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`px-3 py-1.5 text-xs md:text-sm font-sans rounded-full border transition-all duration-200 flex items-center ${
                    isSelected 
                      ? 'bg-[#1a1a1a] border-[#444] text-[#fcfcfc] shadow-sm' 
                      : 'bg-transparent border-[#222] text-[#666] hover:border-[#444] hover:text-[#999]'
                  }`}
                >
                  <span 
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${isSelected ? 'bg-accent' : 'bg-[#333]'}`} 
                  />
                  {r}
                </button>
              );
            }) : <div className="text-[#666] text-sm">Loading regions...</div>}
          </div>
        </div>

        {/* Secondary Controls (Group & Timeline) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-[#222] pt-8 mt-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Select Population Group</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setGroup('p99p100')}
                className={`px-4 py-2 rounded-lg text-xs font-sans transition-colors ${group === 'p99p100' ? 'bg-[#222] text-[#fcfcfc] shadow-sm' : 'bg-transparent border border-[#222] text-[#666] hover:text-[#999]'}`}
              >
                Top 1%
              </button>
              <button 
                onClick={() => setGroup('p90p100')}
                className={`px-4 py-2 rounded-lg text-xs font-sans transition-colors ${group === 'p90p100' ? 'bg-[#222] text-[#fcfcfc] shadow-sm' : 'bg-transparent border border-[#222] text-[#666] hover:text-[#999]'}`}
              >
                Top 10%
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-[400px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Historical Timeline Range</span>
              <span className="text-sm font-serif text-accent">{startYear} — {endYear}</span>
            </div>
            <div className="relative h-6 flex items-center">
              <style>{`
                .range-input::-webkit-slider-thumb {
                  pointer-events: auto;
                  position: relative;
                  z-index: 100;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #ccc;
                  border: 2px solid #111;
                  cursor: pointer;
                }
                .range-input::-moz-range-thumb {
                  pointer-events: auto;
                  position: relative;
                  z-index: 100;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #ccc;
                  border: 2px solid #111;
                  cursor: pointer;
                }
              `}</style>
              <input 
                type="range" 
                min={1820} 
                max={2020} 
                step={10} 
                value={startYear}
                onChange={(e) => setStartYear(Math.min(parseInt(e.target.value), endYear - 10))}
                className="range-input absolute w-full accent-white bg-transparent h-1 appearance-none cursor-pointer z-20"
                style={{ pointerEvents: 'none' }}
              />
              <input 
                type="range" 
                min={1820} 
                max={2020} 
                step={10} 
                value={endYear}
                onChange={(e) => setEndYear(Math.max(parseInt(e.target.value), startYear + 10))}
                className="range-input absolute w-full accent-white bg-transparent h-1 appearance-none cursor-pointer z-10"
                style={{ pointerEvents: 'none' }}
              />
              <div className="absolute w-full h-1 bg-[#1a1a1a] rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Legend / Key */}
      <div className="flex flex-col md:flex-row md:flex-wrap gap-8 mb-8 px-2 border border-[#222] bg-[#111] p-4 rounded-lg">
        {/* Top Group Key */}
        <div className="flex flex-col gap-3 pr-8 md:border-r border-[#333]">
          <span className="text-xs text-[#ccc] font-medium uppercase tracking-widest">{group === 'p99p100' ? 'Top 1%' : 'Top 10%'} (Rentiers)</span>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-3 bg-[#f43f5e] opacity-50 rounded-sm border border-[#f43f5e]"></div>
              <span className="text-[11px] text-[#888]">Wealth Share (Asset base)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-0 border-t-2 border-dashed border-[#fb7185]"></div>
              <span className="text-[11px] text-[#888]">Income Share (Earnings)</span>
            </div>
          </div>
        </div>

        {/* Bottom 50% Key */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-[#ccc] font-medium uppercase tracking-widest">Bottom 50% (Asset-Poor)</span>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-3 bg-[#6366f1] opacity-50 rounded-sm border border-[#6366f1]"></div>
              <span className="text-[11px] text-[#888]">Income Share (Earnings)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-0 border-t-2 border-dashed border-[#818cf8]"></div>
              <span className="text-[11px] text-[#888]">Wealth Share (Asset base)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] relative">
        {formattedData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[#444] font-sans italic border border-dashed border-[#222] rounded-lg">
            No comparative data found for {selectedRegion} in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
              <defs>
                <linearGradient id="colorTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorBot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis 
                dataKey="year" 
                stroke="#666" 
                tick={{ fill: '#888', fontSize: 13, fontFamily: 'var(--font-sans)' }} 
                axisLine={false}
                tickLine={false}
                dy={20}
              />
              <YAxis 
                stroke="#666" 
                tick={{ fill: '#888', fontSize: 13, fontFamily: 'var(--font-sans)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                dx={-15}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontFamily: 'var(--font-sans)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                labelStyle={{ color: '#888', marginBottom: '8px', fontWeight: 'bold' }}
                formatter={(value: any, name: any) => {
                  const labels: any = {
                    top_income: 'Top 1% Income',
                    top_wealth: 'Top 1% Wealth',
                    bottom_income: 'Bottom 50% Income',
                    bottom_wealth: 'Bottom 50% Wealth'
                  };
                  const val = typeof value === 'number' ? value.toFixed(1) : value;
                  return [`${val}%`, labels[name] || name];
                }}
              />
              
              <Area 
                type="monotone" 
                dataKey="top_wealth" 
                stroke="#f43f5e" 
                fillOpacity={0.5} 
                fill="url(#colorTop)" 
                strokeWidth={2}
                name="top_wealth"
              />
              <Area 
                type="monotone" 
                dataKey="top_income" 
                stroke="#fb7185" 
                fill="transparent" 
                strokeWidth={1} 
                strokeDasharray="3 3"
                name="top_income"
              />

              <Area 
                type="monotone" 
                dataKey="bottom_income" 
                stroke="#6366f1" 
                fillOpacity={0.5} 
                fill="url(#colorBot)" 
                strokeWidth={3}
                name="bottom_income"
              />
              <Area 
                type="monotone" 
                dataKey="bottom_wealth" 
                stroke="#818cf8" 
                fill="transparent" 
                strokeWidth={1.5}
                strokeDasharray="3 3"
                name="bottom_wealth"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
