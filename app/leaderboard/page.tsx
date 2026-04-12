"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Leaderboard() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchLeaderboard() {
    const { data, error } = await supabase
      .from('participants')
      .select(`id, booth_number, project_name, team_name, scores ( score )`);

    if (data) {
      const processed = data.map(p => ({
        ...p,
        finalScore: p.scores && p.scores.length > 0 
          ? p.scores.reduce((acc: number, s: any) => acc + s.score, 0) / p.scores.length 
          : 0
      })).sort((a, b) => b.finalScore - a.finalScore);
      setStandings(processed);
    }
    setLoading(false);
  }

  // Function to trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      {/* 🟢 Print-Specific Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .standings-row { 
            background: white !important; 
            color: black !important; 
            border: 1px solid #eee !important;
            break-inside: avoid; 
            margin-bottom: 5px !important;
          }
          .project-title { color: black !important; font-size: 10pt !important; }
          .score-text { color: #2563eb !important; font-weight: bold !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto print-container">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 no-print">
          <div className="border-l-4 border-blue-500 pl-5">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none text-blue-500">
              LIVE STANDINGS
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
              EDIAs 2025 • Official Results
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
            >
              🖨️ Print Report
            </button>
            <button 
              onClick={fetchLeaderboard}
              className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
            >
              {loading ? "..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Print-Only Header (Hidden on Screen) */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase">Official Competition Results</h1>
          <p className="text-sm">Innovate Grade Master 2.0 • Date: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Standings List */}
        <div className="grid gap-3">
          {standings.map((item, index) => (
            <div 
              key={item.id} 
              className={`standings-row relative flex items-center p-[1px] rounded-xl transition-all duration-700 ${
                index === 0 ? 'bg-blue-500/50 mb-2' : 'bg-white/10'
              }`}
            >
              <div className={`flex items-center w-full p-4 rounded-[11px] ${index === 0 ? 'bg-[#0f172a] print:bg-white' : 'bg-[#1e293b] print:bg-white'}`}>
                
                {/* Rank Number */}
                <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/5 shrink-0 print:border-black/10">
                  <span className={`text-lg font-black italic ${index === 0 ? 'text-blue-400' : 'text-slate-400'} print:text-black`}>
                    #{index + 1}
                  </span>
                </div>

                {/* Project Info */}
                <div className="ml-5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-tighter border border-blue-500/20 print:border-black/20 print:text-black">
                      {item.booth_number}
                    </span>
                  </div>
                  
                  <h2 className="project-title text-xs md:text-sm font-bold leading-snug text-slate-100 uppercase tracking-tight break-words pr-2">
                    {item.project_name}
                  </h2>
                  
                  <p className="text-slate-500 text-[9px] font-semibold uppercase mt-0.5 truncate print:text-slate-700">
                    {item.team_name}
                  </p>
                </div>

                {/* Score Column */}
                <div className="text-right pl-4 border-l border-white/5 shrink-0 w-24 md:w-28 print:border-black/10">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5 print:text-black">Final Score</p>
                  <p className={`score-text text-xl md:text-2xl font-black tracking-tighter ${index === 0 ? 'text-blue-400' : 'text-white'} print:text-black`}>
                    {item.finalScore.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-40">%</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center py-6 border-t border-white/5 no-print">
          <p className="text-[8px] font-bold tracking-[0.4em] uppercase text-slate-600">
            Real-time synchronization active • Database verified
          </p>
        </div>
      </div>
    </div>
  );
}