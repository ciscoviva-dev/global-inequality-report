"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Label
} from 'recharts';

export default function ChartComponent({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['World (MER)']);
  const [useLogScale, setUseLogScale] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showTop, setShowTop] = useState(true);
  const [showTop10, setShowTop10] = useState(false);
  const [showBottom, setShowBottom] = useState(true);
  
  const allYears = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort(), [data]);
  const [startYear, setStartYear] = useState(allYears[0]);
  const [endYear, setEndYear] = useState(allYears[allYears.length - 1]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const regions = Array.from(new Set(data.map(d => d.region)));
  const hasMultiplePercentiles = Array.from(new Set(data.map(d => d.percentile))).length > 1;

  const visibleYears = useMemo(() => allYears.filter(y => y >= startYear && y <= endYear), [allYears, startYear, endYear]);

  // Calculate Linear Regression for a series within visible range
  const getTrendPoints = (region: string, suffix: string, forceLog: boolean) => {
    let p = '';
    if (suffix === 'top') p = 'p99p100';
    else if (suffix === 'top10') p = 'p90p100';
    else if (suffix === 'bottom') p = 'p0p50';

    const rawPoints = data
      .filter(d => d.region === region && d.year >= startYear && d.year <= endYear && (suffix ? d.percentile === p : true))
      .map(d => ({ x: d.year, y: parseFloat(d.value) * 100 }))
      .filter(p => p.y > 0)
      .sort((a, b) => a.x - b.x);

    const n = rawPoints.length;
    if (n < 2) return {};

    const points = forceLog 
      ? rawPoints.map(p => ({ x: p.x, y: Math.log(p.y) })) 
      : rawPoints;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trends: any = {};
    visibleYears.forEach(year => {
      const predY = slope * year + intercept;
      trends[`${region}${suffix ? '_' + suffix : ''}_trend`] = forceLog ? Math.exp(predY) : predY;
    });
    return trends;
  };

  const formattedData = useMemo(() => {
    return visibleYears.map(year => {
      const row: any = { year };
      regions.forEach(region => {
        if (hasMultiplePercentiles) {
          const matchTop = data.find(d => d.year === year && d.region === region && d.percentile === 'p99p100');
          const matchTop10 = data.find(d => d.year === year && d.region === region && d.percentile === 'p90p100');
          const matchBottom = data.find(d => d.year === year && d.region === region && d.percentile === 'p0p50');
          if (matchTop && matchTop.value) row[`${region}_top`] = parseFloat(matchTop.value) * 100;
          if (matchTop10 && matchTop10.value) row[`${region}_top10`] = parseFloat(matchTop10.value) * 100;
          if (matchBottom && matchBottom.value) row[`${region}_bottom`] = parseFloat(matchBottom.value) * 100;
        } else {
          const match = data.find(d => d.year === year && d.region === region);
          if (match && match.value) row[region] = parseFloat(match.value) * 100;
        }
      });
      return row;
    });
  }, [visibleYears, data, regions, hasMultiplePercentiles]);

  const chartData = useMemo(() => {
    const dataWithTrends = [...formattedData];
    if (showTrends) {
      const trendDataMap: any = {};
      regions.forEach(region => {
        if (hasMultiplePercentiles) {
          Object.assign(trendDataMap, getTrendPoints(region, 'top', useLogScale));
          Object.assign(trendDataMap, getTrendPoints(region, 'top10', useLogScale));
          Object.assign(trendDataMap, getTrendPoints(region, 'bottom', useLogScale));
        } else {
          Object.assign(trendDataMap, getTrendPoints(region, '', useLogScale));
        }
      });
      
      dataWithTrends.forEach(row => {
        regions.forEach(region => {
          const keyTop = `${region}_top_trend`;
          const keyTop10 = `${region}_top10_trend`;
          const keyBottom = `${region}_bottom_trend`;
          const keyBase = `${region}_trend`;
          if (trendDataMap[keyTop]) row[keyTop] = trendDataMap[keyTop];
          if (trendDataMap[keyTop10]) row[keyTop10] = trendDataMap[keyTop10];
          if (trendDataMap[keyBottom]) row[keyBottom] = trendDataMap[keyBottom];
          if (trendDataMap[keyBase]) row[keyBase] = trendDataMap[keyBase];
        });
      });
    }
    return dataWithTrends;
  }, [formattedData, showTrends, regions, hasMultiplePercentiles, useLogScale, startYear, endYear]);

  const colors = [
    "var(--color-accent)", // World
    "#6366f1", "#14b8a6", "#f43f5e", "#a855f7", "#eab308", "#3b82f6", "#ec4899", "#10b981", "#f97316"
  ];

  const presets = [
    { label: 'All', year: allYears[0] },
    { label: '1910+', year: 1910 },
    { label: '1945+', year: 1945 },
    { label: '1980+', year: 1980 },
    { label: 'Modern (2000+)', year: 2000 }
  ];

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  if (!isMounted) {
    return <div className="w-full h-[600px] mt-12 border border-[#222] bg-[#0c0c0c] rounded-xl animate-pulse" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full min-h-[600px] flex flex-col mt-12 p-4 md:p-8 border border-[#222] bg-[#0c0c0c] rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Top Control Bar */}
      <div className="flex flex-col gap-6 mb-8">
        {/* Regions Toggle */}
        <div className="flex flex-wrap gap-2">
          {regions.map((region, i) => {
            const isSelected = selectedRegions.includes(region);
            return (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                className={`px-3 py-1.5 text-xs md:text-sm font-sans rounded-full border transition-all duration-200 flex items-center ${
                  isSelected 
                    ? 'bg-[#1a1a1a] border-[#444] text-[#fcfcfc] shadow-sm' 
                    : 'bg-transparent border-[#222] text-[#666] hover:border-[#444] hover:text-[#999]'
                }`}
              >
                <span 
                  className="inline-block w-2.5 h-2.5 rounded-full mr-2" 
                  style={{ backgroundColor: isSelected ? colors[i % colors.length] : '#333' }} 
                />
                {region}
              </button>
            );
          })}
        </div>

        {/* Date Filter & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-[#222] pt-6">
          <div className="flex flex-col gap-4 w-full md:w-auto md:min-w-[320px] flex-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Timeline Range</span>
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

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">View</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowTop(!showTop)}
                  className={`px-3 py-1 rounded text-[11px] font-sans border transition-colors ${showTop ? 'bg-accent/10 border-accent text-accent' : 'border-[#222] text-[#555]'}`}
                >
                  Top 1%
                </button>
                <button 
                  onClick={() => setShowTop10(!showTop10)}
                  className={`px-3 py-1 rounded text-[11px] font-sans border transition-colors ${showTop10 ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'border-[#222] text-[#555]'}`}
                >
                  Top 10%
                </button>
                <button 
                  onClick={() => setShowBottom(!showBottom)}
                  className={`px-3 py-1 rounded text-[11px] font-sans border transition-colors ${showBottom ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'border-[#222] text-[#555]'}`}
                >
                  Bottom 50%
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Logic</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowTrends(!showTrends)}
                  className={`px-3 py-1 rounded text-[11px] font-sans border transition-colors ${showTrends ? 'bg-white/5 border-white/40 text-white' : 'border-[#222] text-[#555]'}`}
                >
                  Trends
                </button>
                <button 
                  onClick={() => setUseLogScale(!useLogScale)}
                  className={`px-3 py-1 rounded text-[11px] font-sans border transition-colors ${useLogScale ? 'bg-white/5 border-white/40 text-white' : 'border-[#222] text-[#555]'}`}
                >
                  Log
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Styles Key */}
      <div className="flex items-center gap-6 mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-[#888]"></div>
          <span className="text-xs text-[#888] font-medium">Actual Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-dashed border-[#555]"></div>
          <span className="text-xs text-[#555] font-medium">Calculated Trend</span>
        </div>
      </div>

      <div className="w-full mt-4">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 40, right: 80, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#666" 
              tick={{ fill: '#888', fontSize: 13, fontFamily: 'var(--font-sans)' }} 
              axisLine={false}
              tickLine={false}
              dy={20}
            >
              <Label value="Year" offset={-40} position="insideBottom" fill="#555" fontSize={11} fontFamily="var(--font-sans)" />
            </XAxis>
            <YAxis 
              stroke="#666" 
              scale={useLogScale ? 'log' : 'auto'}
              domain={useLogScale ? [0.1, 'auto'] : [0, 'auto']}
              tick={{ fill: '#888', fontSize: 13, fontFamily: 'var(--font-sans)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value.toFixed(useLogScale ? 1 : 0)}%`}
              dx={-15}
            >
              <Label 
                value="Share of Total (%)" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fill: '#555', fontSize: 11, fontFamily: 'var(--font-sans)' }}
                offset={0}
              />
            </YAxis>
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontFamily: 'var(--font-sans)', padding: '12px' }}
              itemStyle={{ color: '#fcfcfc', fontWeight: 500, fontSize: '12px' }}
              labelStyle={{ color: '#888', marginBottom: '8px' }}
              itemSorter={(item: any) => (item.name.includes('top10') ? 0 : item.name.includes('top') ? -1 : 1)}
              formatter={(value: any, name: any) => {
                if (name.includes('trend')) return null;
                const label = name.includes('_top10') ? 'Top 10%' : name.includes('_top') ? 'Top 1%' : name.includes('_bottom') ? 'Bottom 50%' : name;
                return [`${value.toFixed(1)}%`, label];
              }}
            />
            {regions.map((region, i) => {
              if (!selectedRegions.includes(region)) return null;

              return (
                <g key={region}>
                  {hasMultiplePercentiles ? (
                    <>
                      {showTop && (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey={`${region}_top`} 
                            stroke={colors[i % colors.length]} 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: colors[i % colors.length], stroke: '#0c0c0c', strokeWidth: 2 }}
                          />
                          {showTrends && (
                            <Line 
                              dataKey={`${region}_top_trend`} 
                              stroke={colors[i % colors.length]} 
                              strokeWidth={1.5} 
                              strokeOpacity={0.5} 
                              strokeDasharray="4 4"
                              dot={false} 
                              tooltipType="none"
                              label={(props: any) => {
                                const { x, y, index } = props;
                                if (index === chartData.length - 1) {
                                  return (
                                    <text x={x} y={y - 10} fill={colors[i % colors.length]} fontSize={9} fontFamily="var(--font-sans)" opacity={0.6} textAnchor="middle">
                                      Trend
                                    </text>
                                  );
                                }
                                return null;
                              }}
                            />
                          )}
                        </>
                      )}
                      {showTop10 && (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey={`${region}_top10`} 
                            stroke={colors[i % colors.length]} 
                            strokeWidth={2}
                            strokeOpacity={0.7}
                            dot={false}
                            activeDot={{ r: 5, fill: colors[i % colors.length], stroke: '#0c0c0c', strokeWidth: 2 }}
                          />
                          {showTrends && (
                            <Line 
                              dataKey={`${region}_top10_trend`} 
                              stroke={colors[i % colors.length]} 
                              strokeWidth={1} 
                              strokeOpacity={0.4} 
                              strokeDasharray="3 3"
                              dot={false} 
                              tooltipType="none"
                              label={(props: any) => {
                                const { x, y, index } = props;
                                if (index === chartData.length - 1) {
                                  return (
                                    <text x={x} y={y - 10} fill={colors[i % colors.length]} fontSize={9} fontFamily="var(--font-sans)" opacity={0.5} textAnchor="middle">
                                      Trend
                                    </text>
                                  );
                                }
                                return null;
                              }}
                            />
                          )}
                        </>
                      )}
                      {showBottom && (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey={`${region}_bottom`} 
                            stroke={colors[i % colors.length]} 
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: colors[i % colors.length], stroke: '#0c0c0c', strokeWidth: 2 }}
                          />
                          {showTrends && (
                            <Line 
                              dataKey={`${region}_bottom_trend`} 
                              stroke={colors[i % colors.length]} 
                              strokeWidth={1.5} 
                              strokeOpacity={0.3} 
                              strokeDasharray="2 2" 
                              dot={false} 
                              tooltipType="none"
                              label={(props: any) => {
                                const { x, y, index } = props;
                                if (index === chartData.length - 1) {
                                  return (
                                    <text x={x} y={y - 10} fill={colors[i % colors.length]} fontSize={9} fontFamily="var(--font-sans)" opacity={0.4} textAnchor="middle">
                                      Trend
                                    </text>
                                  );
                                }
                                return null;
                              }}
                            />
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Line 
                        type="monotone" 
                        dataKey={region} 
                        stroke={colors[i % colors.length]} 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: colors[i % colors.length], stroke: '#0c0c0c', strokeWidth: 2 }}
                      />
                      {showTrends && (
                        <Line 
                          dataKey={`${region}_trend`} 
                          stroke={colors[i % colors.length]} 
                          strokeWidth={1.5} 
                          strokeOpacity={0.5} 
                          strokeDasharray="4 4"
                          dot={false} 
                          tooltipType="none"
                          label={(props: any) => {
                            const { x, y, index } = props;
                            if (index === chartData.length - 1) {
                              return (
                                <text x={x} y={y - 10} fill={colors[i % colors.length]} fontSize={9} fontFamily="var(--font-sans)" opacity={0.6} textAnchor="middle">
                                  Trend
                                </text>
                              );
                            }
                            return null;
                          }}
                        />
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
