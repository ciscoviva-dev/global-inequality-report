"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isDeficit = data.gap < 0;
    
    return (
      <div className="bg-[#0c0c0c] border border-[#222] p-4 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[#ccc] font-serif mb-3 border-b border-[#222] pb-2">{data.region}</p>
        
        <div className="flex justify-between items-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#059669]"></div>
            <span className="text-[#888]">Income Share:</span>
          </div>
          <span className="text-[#fcfcfc] font-medium">{(data.income_share * 100).toFixed(1)}%</span>
        </div>

        <div className="flex justify-between items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
            <span className="text-[#888]">Wealth Share:</span>
          </div>
          <span className="text-[#fcfcfc] font-medium">{(data.wealth_share * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-[#1a1a1a] -mx-4 -mb-4 p-3 rounded-b-xl border-t border-[#333] flex justify-between items-center">
          <span className="text-[#777] text-[10px] uppercase tracking-widest font-semibold">
            {isDeficit ? 'Asset Deficit' : 'Asset Gap'}
          </span>
          <span className={`${isDeficit ? 'text-indigo-400' : 'text-accent'} font-bold`}>
            {isDeficit ? '' : '+'}{(data.gap * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const DumbbellBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  const cy = y + height / 2;
  
  // For Top 1%, Wealth is almost universally > Income.
  // We use this boolean just in case there's an anomaly in the data where Income > Wealth.
  const isReversed = payload.income_share > payload.wealth_share;
  
  const incomeX = isReversed ? x + width : x;
  const wealthX = isReversed ? x : x + width;

  return (
    <g className="transition-all duration-300 hover:opacity-80 cursor-pointer">
      {/* The connecting Gap line */}
      <line 
        x1={incomeX} y1={cy} 
        x2={wealthX} y2={cy} 
        stroke="#444" 
        strokeWidth={3} 
        strokeDasharray="4 4" 
      />
      {/* Income Dot */}
      <circle 
        cx={incomeX} 
        cy={cy} 
        r={6} 
        fill="#059669" 
      />
      {/* Wealth Dot */}
      <circle 
        cx={wealthX} 
        cy={cy} 
        r={8} 
        fill="#f43f5e" 
        stroke="#0c0c0c" 
        strokeWidth={2} 
      />
    </g>
  );
};

export default function BarChartComponent({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  
  const allYears = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort(), [data]);
  const [startYear, setStartYear] = useState(2014);
  const [endYear, setEndYear] = useState(2020);

  const [group, setGroup] = useState('p99p100');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const regions = Array.from(new Set(data.map(d => d.region)));

  const averagedData = useMemo(() => {
    return regions.map(region => {
      const regionData = data.filter(d => 
        d.region === region && 
        d.year >= startYear && 
        d.year <= endYear &&
        d.percentile === group
      );

      const incomeRows = regionData.filter(d => d.category === 'Pre-tax national income');
      const wealthRows = regionData.filter(d => d.category === 'Net personal wealth');

      if (incomeRows.length === 0 || wealthRows.length === 0) return null;

      const avgIncome = incomeRows.reduce((sum, d) => sum + d.value, 0) / incomeRows.length;
      const avgWealth = wealthRows.reduce((sum, d) => sum + d.value, 0) / wealthRows.length;
      
      // The "Gap" is Wealth Share - Income Share. 
      // For Top 1%, this is usually positive (they own more than they earn).
      // For Bottom 50%, this is usually negative (they earn more than they own).
      const gap = avgWealth - avgIncome;
      
      return {
        region,
        income_share: avgIncome,
        wealth_share: avgWealth,
        range: [avgIncome, avgWealth].sort((a, b) => a - b), // Sort for Recharts bar rendering
        gap: gap
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => Math.abs(b.gap) - Math.abs(a.gap)); // Sort by magnitude of gap
  }, [data, regions, startYear, endYear, group]);

  const presets = [
    { label: 'All', year: allYears[0] },
    { label: '1910+', year: 1910 },
    { label: '1945+', year: 1945 },
    { label: '1980+', year: 1980 },
    { label: 'Modern (2014+)', year: 2014 }
  ];

  if (!isMounted) {
    return <div className="w-full h-[600px] mt-12 border border-[#222] bg-[#0c0c0c] rounded-xl animate-pulse" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full min-h-[700px] mt-12 p-4 md:p-8 border border-[#222] bg-[#0c0c0c] rounded-xl shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#222] pb-8 mb-8">
        {/* Population Group Toggles */}
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
            <button 
              onClick={() => setGroup('p0p50')}
              className={`px-4 py-2 rounded-lg text-xs font-sans transition-colors ${group === 'p0p50' ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-400' : 'bg-transparent border border-[#222] text-[#666] hover:text-[#999]'}`}
            >
              Bottom 50%
            </button>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="flex flex-col gap-4 w-full md:w-[400px]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Historical Averaging Range</span>
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

      {/* Custom Legend */}
      <div className="flex items-center gap-6 mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#059669]"></div>
          <span className="text-[11px] text-[#ccc] font-sans">
            {group === 'p0p50' ? 'Bottom 50%' : group === 'p99p100' ? 'Top 1%' : 'Top 10%'} Income
          </span>
        </div>
        <div className="h-px w-8 border-t border-dashed border-[#555]"></div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#f43f5e] border-2 border-[#0c0c0c]"></div>
          <span className="text-[11px] text-[#ccc] font-sans">
            {group === 'p0p50' ? 'Bottom 50%' : group === 'p99p100' ? 'Top 1%' : 'Top 10%'} Wealth
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[500px]">
        {averagedData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-[#444] font-sans italic border border-dashed border-[#222] rounded-lg">
            No data available for the selected period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={450}>
            <BarChart 
              data={averagedData as any} 
              layout="vertical" 
              margin={{ top: 10, right: 40, left: 20, bottom: 20 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} opacity={0.5} />
              <XAxis 
                type="number"
                stroke="#666" 
                tick={{ fill: '#888', fontSize: 12, fontFamily: 'var(--font-sans)' }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                domain={[0, 'dataMax + 0.1']}
              />
              <YAxis 
                type="category"
                dataKey="region" 
                stroke="#666" 
                tick={{ fill: '#ccc', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={200}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff03' }} />
              <Bar 
                dataKey="range" 
                shape={<DumbbellBar />} 
                isAnimationActive={false} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
