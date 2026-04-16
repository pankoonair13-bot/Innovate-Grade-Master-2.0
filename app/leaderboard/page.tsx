"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const THEMES = [
  "TEMA 1: PERTANIAN PINTAR ATAU TEKNOLOGI MAKANAN",
  "TEMA 3: KEBUDAYAAN DAN KESENIAN ATAU PELANCONGAN DAN HOSPITALITI",
  "TEMA 4: TEKNOLOGI HIJAU ATAU TENAGA BOLEH DIPERBAHARUI",
  "TEMA 5: PENGURUSAN ATAU PERKHIDMATAN PERNIAGAAN",
  "TEMA 6: PENJAGAAN KESIHATAN ATAU KESELAMATAN",
  "TEMA 7: PENGAJARAN DAN PEMBELAJARAN",
  "TEMA 8: SISTEM KECERDASAN A.I DAN PEMBUATAN PINTAR",
  "TEMA 9: PENGANGKUTAN ATAU APLIKASI SISTEM RENDAH KARBON"
];

const PROGRAMMES = ['ALL', 'DEP', 'DET','DTK'];

export default function Leaderboard() {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string>("All");
  const [selectedProg, setSelectedProg] = useState<string>("ALL");

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
        if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
        return a.booth_number.localeCompare(b.booth_number, undefined, { numeric: true, sensitivity: 'base' });
      });
      setStandings(processed);
    }
    setLoading(false);
  }

  // Dual Filtering Logic
  const filteredStandings = standings.filter(p => {
    const themeMatch = selectedTheme === "All" || p.theme === selectedTheme;
    const progMatch = selectedProg === "ALL" || p.program === selectedProg;
    return themeMatch && progMatch;
  });

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
            padding: 20px !important;
          }
          .medal-print { border: 2px solid #000 !important; color: black !important; background: none !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 no-print">
          <div className="border-l-0 md:border-l-4 border-blue-600 md:pl-6 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter text-blue-500 uppercase leading-none">
              Live <span className="text-white">Standings</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-3">EDIAs 2026 Rankings</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
              🖨️ Print Report
            </button>
            <button onClick={fetchLeaderboard} className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
              {loading ? "..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {/* 🔘 FILTER BAR (Combined) */}
        <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2.5rem] mb-10 no-print space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Theme Dropdown */}
            <div className="w-full md:w-1/2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-2">Filter by Theme</label>
              <select 
                className="w-full bg-[#0f172a] border border-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-4 rounded-2xl outline-none cursor-pointer hover:border-blue-500/50 transition-all"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
              >
                <option value="All">All Categories</option>
                {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Programme Buttons */}
            <div className="w-full md:w-1/2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-2">Quick Program Filter</label>
              <div className="flex flex-wrap gap-2">
                {PROGRAMMES.map((prog) => (
                  <button
                    key={prog}
                    onClick={() => setSelectedProg(prog)}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black transition-all border ${
                      selectedProg === prog 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-[#0f172a] border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {prog}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Indicator for Print */}
        {(selectedTheme !== "All" || selectedProg !== "ALL") && (
          <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-center">
            <h2 className="text-blue-400 font-black uppercase text-xs tracking-widest">
              Filtering: {selectedTheme} {selectedProg !== "ALL" && ` | ${selectedProg}`}
            </h2>
          </div>
        )}

        {/* Standings List */}
        <div className="space-y-4">
          {filteredStandings.length > 0 ? (
            filteredStandings.map((item, index) => (
              <div 
                key={item.id} 
                className={`standings-row flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2.5rem] border transition-all duration-500 ${
                  index === 0 ? 'bg-blue-600/10 border-blue-500/30' : 'bg-[#1e293b]/40 border-white/5'
                }`}
              >
                <div className={`w-14 h-14 shrink-0 rounded-[1.2rem] flex items-center justify-center font-black italic text-2xl ${index === 0 ? 'bg-blue-600 text-white shadow-xl' : 'bg-white/5 text-slate-500'}`}>
                  {index + 1}
                </div>

                <div className="flex-grow min-w-0 w-full text-center md:text-left">
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                    <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-3 py-1 rounded-lg border border-blue-500/20 uppercase">Booth {item.booth_number}</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-3 py-1 rounded-lg border border-emerald-500/20 uppercase">{item.program || 'N/A'}</span>
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight leading-tight mb-1">{item.project_name}</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Team: <span className="text-blue-400">{item.team_name}</span></p>
                </div>

                <div className="shrink-0 w-full md:w-40 text-center md:text-right md:border-l border-white/10 md:pl-8">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Average</p>
                  <div className={`medal-print inline-block w-full md:min-w-[120px] px-6 py-3 rounded-2xl border-2 font-black text-xl ${getMedalStyles(item.finalScore)}`}>
                    {item.finalScore.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 opacity-30 font-black uppercase tracking-widest">No Projects Found</div>
          )}
        </div>
      </div>
    </div>
  );
}