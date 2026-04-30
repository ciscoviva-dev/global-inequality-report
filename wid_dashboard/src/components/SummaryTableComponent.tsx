"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export default function SummaryTableComponent({ data }: { data: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const rowsPerPage = 50;

  // Extract columns from the first row (DBT converts headers to lowercase usually, we'll format them nicely)
  const rawColumns = data.length > 0 ? Object.keys(data[0]) : [];
  
  const formatHeader = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full flex flex-col mt-12 border border-[#222] bg-[#0c0c0c] rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Table Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 border-b border-[#222] bg-[#111]">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#555] font-sans uppercase tracking-[0.2em] mb-2">Search Records</span>
          <input 
            type="text" 
            placeholder="Search by country, indicator, etc..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#1a1a1a] border border-[#333] text-[#fcfcfc] px-4 py-2 rounded-lg font-sans text-sm focus:outline-none focus:border-accent min-w-[300px]"
          />
        </div>
        
        <div className="flex items-center gap-4 text-[#888] font-sans text-sm">
          <span>Showing {filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries</span>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-[#333] hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg border border-[#333] hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#161616] border-b border-[#333]">
              {rawColumns.map(col => (
                <th key={col} className="px-6 py-4 text-[11px] font-sans uppercase tracking-widest text-[#888] whitespace-nowrap font-medium">
                  {formatHeader(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {currentData.length > 0 ? currentData.map((row, i) => (
              <tr key={i} className="hover:bg-[#1a1a1a] transition-colors group">
                {rawColumns.map(col => {
                  const rawVal = row[col] ? String(row[col]) : '';
                  
                  // Helper to parse WID custom URL tags or raw http links
                  const renderCell = (text: string) => {
                    if (!text) return <span className="text-[#444] italic">N/A</span>;
                    
                    const urlRegex = /\[URL\]\[URL_LINK\](.*?)\[\/URL_LINK\]\[URL_TEXT\](.*?)\[\/URL_TEXT\]\[\/URL\]/g;
                    
                    if (text.includes('[URL]')) {
                      const parts = text.split(urlRegex);
                      const result = [];
                      for (let j = 0; j < parts.length; j += 3) {
                        if (parts[j]) result.push(<span key={`text-${j}`}>{parts[j]}</span>);
                        if (j + 1 < parts.length) {
                          result.push(
                            <a key={`link-${j}`} href={parts[j + 1]} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-accent hover:underline font-medium break-all transition-colors" onClick={(e) => e.stopPropagation()}>
                              {parts[j + 2] || parts[j + 1]}
                            </a>
                          );
                        }
                      }
                      return result;
                    }
                    
                    const rawUrlRegex = /(https?:\/\/[^\s]+)/g;
                    if (text.match(rawUrlRegex)) {
                      const parts = text.split(rawUrlRegex);
                      return parts.map((part, j) => {
                        if (part.match(rawUrlRegex)) {
                          return <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-accent hover:underline font-medium break-all transition-colors" onClick={(e) => e.stopPropagation()}>{part}</a>;
                        }
                        return <span key={j}>{part}</span>;
                      });
                    }
                    
                    return text;
                  };

                  const isLongText = ['sources', 'methodology', 'concept', 'specific_assumptions'].includes(col.toLowerCase());

                  return (
                    <td 
                      key={col} 
                      className={`px-6 py-4 text-sm font-sans text-[#ccc] group-hover:text-white transition-colors ${
                        isLongText ? 'min-w-[300px] whitespace-normal' : 'max-w-xs truncate'
                      }`} 
                      title={isLongText ? undefined : rawVal}
                    >
                      {renderCell(rawVal)}
                    </td>
                  );
                })}
              </tr>
            )) : (
              <tr>
                <td colSpan={rawColumns.length} className="px-6 py-12 text-center text-[#555] font-sans italic">
                  No records found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center p-4 border-t border-[#222] bg-[#111]">
          <div className="flex items-center gap-1 font-sans text-sm">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              // Show pages around current page
              let pageNum = currentPage;
              if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              
              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    currentPage === pageNum 
                      ? 'bg-accent text-white font-bold' 
                      : 'text-[#888] hover:bg-[#222] hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
