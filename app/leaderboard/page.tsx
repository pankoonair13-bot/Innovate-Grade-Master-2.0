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
    const { data } = await supabase
      .from('participants')
      .select(`id, booth_number, project_name, team_name, program, theme, scores ( score )`);

    if (data) {
      const processed = data.map(p => ({
        ...p,
        finalScore: p.scores && p.scores.length > 0 
          ? p.scores.reduce((acc: number, s: any) => acc + s.score, 0) / p.scores.length 
          : 0
      })).sort((a, b) => {
        // 1. Sort by high score
        if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
        // 2. Tie-breaker: Alpha-numeric booth number (1A, 1B...)
        return a.booth_number.localeCompare(b.booth_number, undefined, { numeric: true, sensitivity: 'base' });
      });
      setStandings(processed);
    }
    setLoading(false);
  }

  const getMedalStyles = (score: number) => {
    if (score >= 80) return "bg-yellow-400 text-slate-900 border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.4)]";
    if (score >= 70) return "bg-slate-300 text-slate-800 border-slate-400";
    if (score >= 60) return "bg-orange-400 text-white border-orange-500";
    return "bg-white/5 text-slate-500 border-white/10";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 sm:p-6 md:p-8 font-sans">
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
        
        {/* Responsive Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-12 gap-6 no-print text-center md:text-left">
          <div className="border-l-0 md:border-l-4 border-blue-600 md:pl-6">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black italic tracking-tighter text-blue-500 uppercase leading-none">
              Live Standings
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-3">EDIAs 2026 Official Rankings</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 px-6 md:px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">🖨️ Print Report</button>
            <button onClick={fetchLeaderboard} className="bg-white/5 hover:bg-white/10 px-6 md:px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
              {loading ? "..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Adaptive Rankings List */}
        <div className="space-y-5">
          {standings.map((item, index) => (
            <div 
              key={item.id} 
              className={`standings-row flex flex-col md:flex-row items-center gap-4 md:gap-6 p-6 rounded-[2rem] md:rounded-[3rem] border transition-all duration-500 ${
                index === 0 ? 'bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-[#1e293b]/40 border-white/5'
              }`}
            >
              
              {/* Rank Badge */}
              <div className={`w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center font-black italic text-2xl md:text-3xl ${index === 0 ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'bg-white/5 text-slate-500'}`}>
                {index + 1}
              </div>

              {/* Info Section */}
              <div className="flex-grow min-w-0 w-full text-center md:text-left">
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
                
                <h2 className="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-tight leading-tight mb-2 break-words">
                  {item.project_name}
                </h2>
                
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className="hidden md:block h-[2px] w-4 bg-blue-500/40"></div>
                  <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                    Team: <span className="text-blue-400">{item.team_name}</span>
                  </p>
                </div>
              </div>

              {/* Responsive Score Section */}
              <div className="shrink-0 w-full md:w-40 text-center md:text-right md:border-l border-white/10 md:pl-8 pt-4 md:pt-0">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Average</p>
                <div className={`inline-block w-full md:min-w-[120px] px-6 py-3 rounded-2xl md:rounded-3xl border-2 font-black text-xl md:text-2xl tracking-tighter transition-all duration-700 ${getMedalStyles(item.finalScore)}`}>
                  {item.finalScore.toFixed(2)}%
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center py-6 border-t border-white/5 no-print">
          <p className="text-[8px] font-bold tracking-[0.4em] uppercase text-slate-600">
            Real-time synchronization active • Ranking sorted by score & booth number
          </p>
        </div>
      </div>
    </div>
  );
}