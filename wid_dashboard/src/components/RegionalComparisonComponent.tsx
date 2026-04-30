"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function RegionalComparisonComponent({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('World (MER)');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const regions = Array.from(new Set(data.map(d => d.region)));
  
  const filteredData = data
    .filter(d => d.region === selectedRegion)
    .reduce((acc: any[], curr) => {
      const existing = acc.find(a => a.year === curr.year);
      const val = parseFloat(curr.value) * 100;
      if (existing) {
        existing[curr.percentile] = val;
      } else {
        acc.push({ year: curr.year, [curr.percentile]: val });
      }
      return acc;
    }, [])
    .sort((a, b) => a.year - b.year);

  if (!isMounted) {
    return <div className="w-full h-[500px] mt-12 border border-[#222] bg-[#0c0c0c] rounded-xl animate-pulse" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full min-h-[600px] flex flex-col mt-12 p-4 md:p-8 border border-[#222] bg-[#0c0c0c] rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h3 className="text-xl font-serif text-[#ccc]">Regional Deep Dive</h3>
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="bg-[#111] border border-[#333] text-[#ccc] px-4 py-2 rounded-lg font-sans focus:outline-none focus:border-accent"
        >
          {regions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
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
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              dx={-15}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontFamily: 'var(--font-sans)', padding: '12px' }}
              itemStyle={{ fontSize: '13px', padding: '2px 0' }}
              labelStyle={{ color: '#888', marginBottom: '8px', fontWeight: 'bold' }}
              formatter={(value: any, name: any) => {
                const label = name === 'p99p100' ? 'Top 1% Share' : 'Bottom 50% Share';
                return [`${value.toFixed(1)}%`, label];
              }}
            />
            <Legend 
              wrapperStyle={{ fontFamily: 'var(--font-sans)', paddingTop: '20px' }} 
              iconType="circle"
              formatter={(value) => (value === 'p99p100' ? 'Top 1% Share' : 'Bottom 50% Share')}
            />
            <Line 
              type="monotone" 
              dataKey="p99p100" 
              stroke="var(--color-accent)" 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, fill: "var(--color-accent)", stroke: '#0c0c0c', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="p0p50" 
              stroke="#6366f1" 
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6, fill: "#6366f1", stroke: '#0c0c0c', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
