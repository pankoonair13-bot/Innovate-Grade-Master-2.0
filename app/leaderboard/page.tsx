"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Leaderboard() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchLeaderboard() {
    setLoading(true);
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

  // 🎨 UPGRADED MEDAL COLOR LOGIC
  const getMedalStyles = (score: number) => {
    if (score >= 80 && score <= 100) {
      return "bg-yellow-400 text-slate-900 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.4)]"; // Gold
    } else if (score >= 70 && score <= 79) {
      return "bg-slate-300 text-slate-800 border-slate-400"; // Silver
    } else if (score >= 60 && score <= 69) {
      return "bg-orange-400 text-white border-orange-500"; // Bronze
    } else {
      return "bg-white/5 text-slate-400 border-white/10"; // No Medal
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
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
          }
          .medal-box { background: #eee !important; color: black !important; border: 1px solid black !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto print-container">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 no-print">
          <div className="border-l-4 border-blue-500 pl-5">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none text-blue-500 uppercase">
              Live Standings
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
              Official Competition Leaderboard
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
              🖨️ Print Report
            </button>
            <button onClick={fetchLeaderboard} className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
              {loading ? "..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* Standings List */}
        <div className="grid gap-3">
          {standings.map((item, index) => (
            <div 
              key={item.id} 
              className={`standings-row relative flex items-center p-[1px] rounded-xl transition-all duration-700 ${
                index === 0 ? 'bg-blue-500/30 mb-2' : 'bg-white/5'
              }`}
            >
              <div className={`flex items-center w-full p-4 rounded-[11px] ${index === 0 ? 'bg-[#1e293b]' : 'bg-[#0f172a]'}`}>
                
                {/* Rank Number */}
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-white/5 border border-white/5 shrink-0">
                  <span className={`text-lg font-black italic ${index === 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                    #{index + 1}
                  </span>
                </div>

                {/* Project Info */}
                <div className="ml-5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase border border-blue-500/30">
                      Booth {item.booth_number}
                    </span>
                  </div>
                  <h2 className="text-sm md:text-base font-bold leading-tight text-slate-100 uppercase tracking-tight truncate pr-4">
                    {item.project_name}
                  </h2>
                  <p className="text-slate-500 text-[10px] font-semibold uppercase mt-0.5 truncate">
                    {item.team_name}
                  </p>
                </div>

                {/* 🏆 UPGRADED Medal & Score Column */}
                <div className="text-right pl-4 border-l border-white/5 shrink-0">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Final Score</p>
                  <div className={`medal-box inline-block px-4 py-1.5 rounded-xl border-2 font-black text-sm md:text-lg tracking-tighter transition-all duration-500 ${getMedalStyles(item.finalScore)}`}>
                    {item.finalScore.toFixed(2)}%
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center py-6 border-t border-white/5 no-print">
          <p className="text-[8px] font-bold tracking-[0.4em] uppercase text-slate-600">
            Real-time synchronization active • Medal colors updated automatically
          </p>
        </div>
      </div>
    </div>
  );
}