"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Leaderboard() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Auto-refresh every 15 seconds to keep results live
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchLeaderboard() {
    // 💡 Fetches all details including the new 'theme' and 'program' columns
    const { data, error } = await supabase
      .from('participants')
      .select(`id, booth_number, project_name, team_name, program, theme, scores ( score )`);

    if (data) {
      const processed = data.map(p => ({
        ...p,
        // Calculate average score from the scores table
        finalScore: p.scores && p.scores.length > 0 
          ? p.scores.reduce((acc: number, s: any) => acc + s.score, 0) / p.scores.length 
          : 0
      })).sort((a, b) => b.finalScore - a.finalScore); // Rank by highest score
      setStandings(processed);
    }
    setLoading(false);
  }

  // 🎨 MEDAL COLORS (80-100: Gold, 70-79: Silver, 60-69: Bronze)
  const getMedalStyles = (score: number) => {
    if (score >= 80) return "bg-yellow-400 text-slate-900 border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.4)]";
    if (score >= 70) return "bg-slate-300 text-slate-800 border-slate-400";
    if (score >= 60) return "bg-orange-400 text-white border-orange-500";
    return "bg-white/5 text-slate-500 border-white/10";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      {/* 🖨️ Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .standings-row { 
            background: white !important; 
            color: black !important; 
            border: 1px solid #eee !important;
            page-break-inside: avoid; 
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 no-print">
          <div className="border-l-4 border-blue-600 pl-6">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-blue-500 uppercase leading-none">
              Live Standings
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-3">EDIAs 2026 Official Rankings</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg">🖨️ Print Report</button>
            <button onClick={fetchLeaderboard} className="bg-white/5 hover:bg-white/10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
              {loading ? "..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Rankings List */}
        <div className="space-y-5">
          {standings.map((item, index) => (
            <div 
              key={item.id} 
              className={`standings-row flex flex-col md:flex-row items-center gap-6 p-6 rounded-[3rem] border transition-all duration-500 ${
                index === 0 ? 'bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-[#1e293b]/40 border-white/5'
              }`}
            >
              
              {/* Rank Badge */}
              <div className={`w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center font-black italic text-3xl ${index === 0 ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'bg-white/5 text-slate-500'}`}>
                {index + 1}
              </div>

              {/* Project & Participant Details */}
              <div className="flex-grow min-w-0 text-center md:text-left">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                  <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-widest">
                    Booth {item.booth_number}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                    {item.program || 'N/A'}
                  </span>
                  <span className="bg-purple-500/20 text-purple-400 text-[9px] font-black px-3 py-1 rounded-lg border border-purple-500/20 uppercase tracking-widest">
                    Theme: {item.theme || 'General'}
                  </span>
                </div>
                
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight leading-tight mb-2 truncate">
                  {item.project_name}
                </h2>
                
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className="h-[2px] w-4 bg-blue-500/40"></div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Team: <span className="text-blue-400">{item.team_name}</span>
                  </p>
                </div>
              </div>

              {/* Final Score Section */}
              <div className="shrink-0 w-full md:w-40 text-center md:text-right md:border-l border-white/10 md:pl-8 pt-4 md:pt-0">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Average</p>
                <div className={`inline-block min-w-[120px] px-6 py-3 rounded-3xl border-2 font-black text-2xl tracking-tighter transition-all duration-700 ${getMedalStyles(item.finalScore)}`}>
                  {item.finalScore.toFixed(2)}%
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Footer info for verification */}
        <div className="mt-12 text-center py-6 border-t border-white/5 no-print">
          <p className="text-[8px] font-bold tracking-[0.4em] uppercase text-slate-600">
            Real-time synchronization active • Medal colors updated automatically
          </p>
        </div>
      </div>
    </div>
  );
}