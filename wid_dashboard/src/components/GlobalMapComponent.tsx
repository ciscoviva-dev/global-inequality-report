"use client";

import { useState, useMemo, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { motion } from 'framer-motion';
import countries from 'world-countries';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map numeric TopoJSON IDs (ccn3) to Alpha-2 codes used by WID
const idToAlpha2: Record<string, string> = {};
countries.forEach(c => {
  if (c.ccn3) {
    idToAlpha2[c.ccn3] = c.cca2;
  }
});

export default function GlobalMapComponent({ data }: { data: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [startYear, setStartYear] = useState(1820);
  const [endYear, setEndYear] = useState(2020);
  const [metric, setMetric] = useState('Pre-tax national income');
  const [group, setGroup] = useState('p99p100');
  const [tooltipContent, setTooltipContent] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const availableDecades = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort(), [data]);

  const mapData = useMemo(() => {
    const filtered = data.filter(d =>
      d.year >= startYear &&
      d.year <= endYear &&
      d.category === metric &&
      d.percentile === group
    );

    // Average the data over the selected range
    const lookup: Record<string, number> = {};
    const counts: Record<string, number> = {};

    filtered.forEach(d => {
      lookup[d.country_code] = (lookup[d.country_code] || 0) + d.value;
      counts[d.country_code] = (counts[d.country_code] || 0) + 1;
    });

    let min = 1;
    let max = 0;

    Object.keys(lookup).forEach(code => {
      lookup[code] = lookup[code] / counts[code];
      if (lookup[code] < min) min = lookup[code];
      if (lookup[code] > max) max = lookup[code];
    });

    return { lookup, min, max };
  }, [data, startYear, endYear, metric, group]);

  // Create color scales
  const colorScale = useMemo(() => {
    if (group === 'p0p50') {
      return scaleLinear<string>()
        .domain([0, mapData.max || 0.5])
        .range(["#1a1a2e", "#818cf8"]);
    } else {
      return scaleLinear<string>()
        .domain([0, mapData.max || 0.5])
        .range(["#2a0a12", "#f43f5e"]);
    }
  }, [mapData.max, group]);

  if (!isMounted) return <div className="w-full h-[600px] border border-[#222] bg-[#0c0c0c] rounded-xl animate-pulse" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="w-full flex flex-col mt-12 p-4 md:p-8 border border-[#222] bg-[#0c0c0c] rounded-xl shadow-2xl overflow-hidden relative"
    >
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-[#222] pb-6">
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Metric</span>
            <div className="flex gap-2">
              <button
                onClick={() => setMetric('Pre-tax national income')}
                className={`px-4 py-2 rounded-lg text-xs font-sans transition-colors ${metric === 'Pre-tax national income' ? 'bg-[#222] text-[#fcfcfc] shadow-sm' : 'bg-transparent border border-[#222] text-[#666] hover:text-[#999]'}`}
              >
                Income
              </button>
              <button
                onClick={() => setMetric('Net personal wealth')}
                className={`px-4 py-2 rounded-lg text-xs font-sans transition-colors ${metric === 'Net personal wealth' ? 'bg-[#222] text-[#fcfcfc] shadow-sm' : 'bg-transparent border border-[#222] text-[#666] hover:text-[#999]'}`}
              >
                Wealth
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Population Group</span>
            <div className="flex gap-2">
              <button
                onClick={() => setGroup('p99p100')}
                className={`px-4 py-2 rounded-lg text-xs font-sans transition-colors ${group === 'p99p100' ? 'bg-accent/20 border border-accent/50 text-accent' : 'bg-transparent border border-[#222] text-[#666] hover:text-[#999]'}`}
              >
                Top 1%
              </button>
              <button
                onClick={() => setGroup('p90p100')}
                className={`px-4 py-2 rounded-lg text-xs font-sans transition-colors ${group === 'p90p100' ? 'bg-accent/20 border border-accent/50 text-accent' : 'bg-transparent border border-[#222] text-[#666] hover:text-[#999]'}`}
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
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full aspect-[4/3] bg-[#080808] border border-[#1a1a1a] rounded-lg overflow-hidden">

        {/* Tooltip Float */}
        {tooltipContent && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none bg-[#111]/90 backdrop-blur border border-[#333] px-4 py-3 rounded-lg shadow-2xl max-w-xs transition-opacity duration-200">
            <div dangerouslySetInnerHTML={{ __html: tooltipContent }} />
          </div>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130 }}
          width={900}
          height={600}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup center={[0, 40]} maxZoom={4}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const alpha2 = idToAlpha2[geo.id] || "";
                  const value = mapData.lookup[alpha2];

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        const name = geo.properties.name;
                        if (value !== undefined) {
                          setTooltipContent(`
                            <p class="text-[#ccc] font-bold text-sm border-b border-[#333] pb-1 mb-2">${name}</p>
                            <p class="text-xs text-[#888] font-sans">Avg. Share (${startYear}-${endYear}):</p>
                            <p class="text-2xl font-serif text-[#fcfcfc] mt-1">${(value * 100).toFixed(1)}%</p>
                          `);
                        } else {
                          setTooltipContent(`
                            <p class="text-[#ccc] font-bold text-sm border-b border-[#333] pb-1 mb-2">${name}</p>
                            <p class="text-xs text-[#555] font-sans italic">No data in this range</p>
                          `);
                        }
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                      style={{
                        default: {
                          fill: value ? colorScale(value) : "#111",
                          stroke: "#222",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: value ? (group === 'p0p50' ? "#a5b4fc" : "#fb7185") : "#222",
                          stroke: "#fcfcfc",
                          strokeWidth: 1,
                          outline: "none",
                          cursor: "crosshair"
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-10 pointer-events-none bg-[#111]/80 backdrop-blur border border-[#333] px-4 py-3 rounded-lg shadow-xl flex flex-col gap-2">
          <span className="text-[10px] text-[#888] font-sans uppercase tracking-[0.1em]">Avg. Magnitude</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#555]">0%</span>
            <div className="w-32 h-2 rounded-full" style={{
              background: `linear-gradient(to right, ${group === 'p0p50' ? '#1a1a2e, #818cf8' : '#2a0a12, #f43f5e'})`
            }} />
            <span className="text-xs text-[#ccc]">{mapData.max ? `${(mapData.max * 100).toFixed(0)}%` : 'Max'}</span>
          </div>
        </div>
      </div>

      {/* Decade Slider */}
      <div className="mt-12 px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em]">Historical Window</span>
          <span className="text-2xl font-serif text-accent">{startYear} — {endYear}</span>
        </div>

        <div className="relative h-6 flex items-center mb-4">
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

        <div className="flex justify-between text-[10px] text-[#444] font-sans">
          <span>1820</span>
          <span>1900</span>
          <span>1950</span>
          <span>2000</span>
          <span>2020</span>
        </div>
      </div>
    </motion.div>
  );
}
