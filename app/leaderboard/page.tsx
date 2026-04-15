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

  // 🎨 MEDAL COLORS (80+ Gold, 70+ Silver, 60+ Bronze)
  const getMedalStyles = (score: number) => {
    if (score >= 80) return "bg-yellow-400 text-slate-900 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]";
    if (score >= 70) return "bg-slate-300 text-slate-800 border-slate-400";
    if (score >= 60) return "bg-orange-400 text-white border-orange-500";
    return "bg-white/5 text-slate-400 border-white/10";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .standings-row { page-break-inside: avoid; border: 1px solid #eee !important; margin-bottom: 10px !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 no-print">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-blue-500 uppercase leading-none">
              Live Standings
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">Official Competition Leaderboard</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">🖨️ Print</button>
            <button onClick={fetchLeaderboard} className="bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">🔄 Refresh</button>
          </div>
        </div>

        {/* Standings List */}
        <div className="space-y-4">
          {standings.map((item, index) => (
            <div key={item.id} className={`standings-row group flex flex-col md:flex-row items-center gap-4 p-4 rounded-[2rem] border transition-all duration-500 ${index === 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#1e293b]/50 border-white/5'}`}>
              
              {/* Rank & Booth Section */}
              <div className="flex items-center gap-4 shrink-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-2xl ${index === 0 ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}>
                  #{index + 1}
                </div>
                <div className="md:hidden flex flex-col">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Booth</span>
                  <span className="text-lg font-bold text-white leading-none">{item.booth_number}</span>
                </div>
              </div>

              {/* Info Section - Now uses flex-grow to take up space without pushing score off screen */}
              <div className="flex-grow min-w-0 text-center md:text-left px-2">
                <div className="hidden md:block mb-1">
                  <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded border border-blue-500/20 uppercase">Booth {item.booth_number}</span>
                </div>
                <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-tight leading-tight mb-1 line-clamp-2 md:line-clamp-none">
                  {item.project_name}
                </h2>
                <p className="text-slate-500 text-[10px] font-semibold uppercase truncate tracking-wide">{item.team_name}</p>
              </div>

              {/* Score Badge - Fixed width to ensure it never gets squashed */}
              <div className="shrink-0 w-full md:w-32 text-center md:text-right pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Score</p>
                <div className={`inline-block min-w-[100px] px-4 py-2 rounded-2xl border-2 font-black text-lg tracking-tighter transition-all duration-700 ${getMedalStyles(item.finalScore)}`}>
                  {item.finalScore.toFixed(2)}%
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}