"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

// 17 Sustainable Development Goals List
const SDG_LIST = [
  "SDG 1: No Poverty",
  "SDG 2: Zero Hunger",
  "SDG 3: Good Health and Well-Being",
  "SDG 4: Quality Education",
  "SDG 5: Gender Equality",
  "SDG 6: Clean Water and Sanitation",
  "SDG 7: Affordable and Clean Energy",
  "SDG 8: Decent Work and Economic Growth",
  "SDG 9: Industry, Innovation and Infrastructure",
  "SDG 10: Reduced Inequalities",
  "SDG 11: Sustainable Cities and Communities",
  "SDG 12: Responsible Consumption and Production",
  "SDG 13: Climate Action",
  "SDG 14: Life Below Water",
  "SDG 15: Life on Land",
  "SDG 16: Peace, Justice and Strong Institutions",
  "SDG 17: Partnerships for the Goals"
];

export default function Leaderboard() {
  const router = useRouter();
  const [standings, setStandings] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Filters State
  const [selectedAward, setSelectedAward] = useState<string>('ALL');
  const [selectedSdg, setSelectedSdg] = useState<string>('ALL');

  // Print Mode Layout Toggle: 'with-points' or 'without-points'
  const [printLayout, setPrintLayout] = useState<'with-points' | 'without-points'>('with-points');

  // 1. Core Fetch Effect & Auth Verification
  useEffect(() => {
    checkAuthAndFetch();

    const interval = setInterval(() => {
      fetchLeaderboard(false);
    }, 20000); 

    return () => clearInterval(interval);
  }, []);

  async function checkAuthAndFetch() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    // Retrieve role from user metadata or profile table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;

    // Deny access if user is a judge
    if (role === 'judge') {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    await fetchLeaderboard(false);
  }

  async function fetchLeaderboard(showLoadingIndicator = true) {
    if (showLoadingIndicator) setLoading(true);
    
    const { data, error } = await supabase
      .from('participants') 
      .select(`
        *,
        scores ( score )
      `);

    if (error) {
      console.error("Data error:", error.message);
      setLoading(false);
      return;
    }

    if (data) {
      // Standard calculation & linear sorting by highest score
      const processed = data.map(p => {
        const scoresArray = p.scores || [];
        const avg = scoresArray.length > 0 
          ? scoresArray.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0) / scoresArray.length 
          : 0;
        
        let award = "CERTIFICATE";
        let awardColor = "text-slate-200 border-slate-400/30 bg-slate-800/40 print:bg-slate-100 print:text-black print:border-slate-400";
        
        if (avg >= 80) {
          award = "GOLD";
          awardColor = "text-yellow-400 border-yellow-400/20 bg-yellow-500/5 print:bg-yellow-100 print:text-yellow-700 print:border-yellow-300";
        } else if (avg >= 70) {
          award = "SILVER";
          awardColor = "text-slate-300 border-slate-300/20 bg-slate-300/5 print:bg-slate-200 print:text-slate-800 print:border-slate-400";
        } else if (avg >= 50) {
          award = "BRONZE";
          awardColor = "text-amber-500 border-amber-700/40 bg-amber-950/40 print:bg-amber-100 print:text-amber-900 print:border-amber-400";
        }
        
        return { 
          ...p, 
          finalScore: avg,
          award,
          awardColor
        };
      }).sort((a, b) => b.finalScore - a.finalScore);

      setStandings(processed);
    }
    setLoading(false);
  }

  const handlePrint = () => {
    window.print();
  };

  const exportToExcel = () => {
    if (filteredStandings.length === 0) return alert("No data available to export!");

    const excelData = filteredStandings.map((item, index) => ({
      "Rank": index + 1,
      "Project Title": (item.project_name || "No Project Title").toUpperCase(),
      "Team": (item.team_name || "N/A").toUpperCase(),
      "Supervisor": (item.supervisor_name || item.supervisor || "N/A").toUpperCase(),
      "Program": (item.program || "N/A").toUpperCase(),
      "Theme/Category": (item.category || item.theme || "N/A").toUpperCase(),
      "SDG Goal": item.sdg || item.sdg_goal || "N/A",
      "Award Medal": item.award,
      "Average Score": `${item.finalScore.toFixed(2)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    // Dynamic calculation for column widths
    const max_width = (key: string) => {
      return excelData.reduce((w, r) => Math.max(w, String((r as any)[key] || '').length), key.length) + 4;
    };

    worksheet['!cols'] = [
      { wch: 8 },                          // Rank
      { wch: max_width("Project Title") }, // Project Title
      { wch: max_width("Team") },          // Team
      { wch: max_width("Supervisor") },    // Supervisor
      { wch: max_width("Program") },       // Program
      { wch: max_width("Theme/Category") },// Theme/Category
      { wch: max_width("SDG Goal") },      // SDG
      { wch: 16 },                         // Award Medal
      { wch: 16 }                          // Average Score
    ];

    XLSX.writeFile(workbook, `Results.xlsx`);
  };

  // Filtered Standings Logic
  const filteredStandings = standings.filter(item => {
    const matchesAward = selectedAward === 'ALL' || item.award === selectedAward;
    const itemSdg = item.sdg || item.sdg_goal || '';
    const matchesSdg = selectedSdg === 'ALL' || itemSdg.toLowerCase().includes(selectedSdg.toLowerCase());

    return matchesAward && matchesSdg;
  });

  // Block Screen for Restricted Access
  if (authorized === false) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
          <span className="text-5xl mb-4 block">🔒</span>
          <h1 className="text-2xl font-black mb-2">Access Restricted</h1>
          <p className="text-slate-400 text-sm mb-6">
            Judges are not allowed to view the overall leaderboard standings.
          </p>
          <button 
            onClick={() => router.push('/scoring')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Return to Scoring Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 font-sans print:bg-white print:text-black">
      <div className="max-w-5xl mx-auto print:max-w-full">
        
        {/* Top Header Interface */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b border-white/10 pb-6 print:hidden gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-blue-500">
              LIVE <span className="text-white">STANDINGS</span>
            </h1>
            <p className="text-slate-500 font-bold tracking-[0.2em] text-xs mt-2">EDIAS 2026 RANKINGS</p>
          </div>

          {/* Controls Panel Layout Configuration */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 w-full sm:w-auto justify-center">
              <button 
                onClick={() => setPrintLayout('with-points')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${printLayout === 'with-points' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                With Points
              </button>
              <button 
                onClick={() => setPrintLayout('without-points')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${printLayout === 'without-points' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                No Points
              </button>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={handlePrint}
                className="flex-1 sm:flex-none text-xs font-bold bg-blue-600 hover:bg-blue-700 px-4 md:px-5 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                🖨️ Print
              </button>

              <button 
                onClick={exportToExcel}
                className="flex-1 sm:flex-none text-xs font-bold bg-emerald-600 hover:bg-emerald-700 px-4 md:px-5 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                📊 Excel
              </button>

              <button 
                onClick={() => fetchLeaderboard(true)} 
                className="text-xs font-bold bg-slate-800 border border-white/5 hover:bg-slate-700 px-3 md:px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                {loading ? "..." : "🔄"}
              </button>
            </div>
          </div>
        </div>

        {/* MEDAL & SDG FILTERS BAR */}
        <div className="mb-8 space-y-4 print:hidden">
          
          {/* Medal Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-extrabold uppercase text-slate-500 mr-2 tracking-wider">Medals:</span>
            {['ALL', 'GOLD', 'SILVER', 'BRONZE', 'CERTIFICATE'].map((medal) => (
              <button
                key={medal}
                onClick={() => setSelectedAward(medal)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border ${
                  selectedAward === medal
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-105'
                    : 'bg-slate-900/80 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {medal === 'GOLD' && '🥇 '}
                {medal === 'SILVER' && '🥈 '}
                {medal === 'BRONZE' && '🥉 '}
                {medal === 'CERTIFICATE' && '📜 '}
                {medal}
              </button>
            ))}
          </div>

          {/* SDG Filter Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider shrink-0">
              🌐 SDG Category Filter:
            </span>
            <select
              value={selectedSdg}
              onChange={(e) => setSelectedSdg(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold w-full focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All 17 SDGs (Show All)</option>
              {SDG_LIST.map((sdg, idx) => (
                <option key={idx} value={`SDG ${idx + 1}`}>
                  {sdg}
                </option>
              ))}
            </select>
            {(selectedAward !== 'ALL' || selectedSdg !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedAward('ALL');
                  setSelectedSdg('ALL');
                }}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider underline shrink-0 cursor-pointer ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>

        {/* Live Standings Standard List */}
        <div className="space-y-4">
          {loading && standings.length === 0 ? (
            <div className="text-center py-20 text-slate-500 uppercase tracking-widest animate-pulse font-bold">
              Loading Leaderboard Data...
            </div>
          ) : (
            filteredStandings.map((item, index) => {
              const supervisorName = item.supervisor_name || item.supervisor;
              const sdgGoal = item.sdg || item.sdg_goal;

              return (
                <div 
                  key={item.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all gap-4 print:border-slate-200 print:bg-white print:text-black print:p-4"
                >
                  {/* Left Section: Rank + Title + Info */}
                  <div className="flex items-start md:items-center gap-3 md:gap-6">
                    <span className="text-2xl md:text-3xl font-black text-slate-700 min-w-[2rem] shrink-0 print:text-black">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base md:text-xl font-bold uppercase tracking-tight text-white break-words print:text-black">
                        {item.project_name || "No Project Title"}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-400 font-medium break-words mt-0.5 print:text-slate-600">
                        Leader: {item.name || item.participant_name || "N/A"} {item.team_name ? `• ${item.team_name}` : ''}
                      </p>
                      
                      {/* Supervisor Display */}
                      {supervisorName && (
                        <p className="text-xs font-extrabold text-blue-400 uppercase mt-0.5 print:text-blue-700">
                          SV: <span className="text-slate-300 font-semibold print:text-slate-800">{supervisorName}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {(item.category || item.theme) && (
                          <span className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase print:text-slate-600">
                            {item.category || item.theme}
                          </span>
                        )}

                        {item.program && (
                          <span className="text-[10px] font-extrabold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase print:border-blue-300 print:text-blue-700">
                            {item.program}
                          </span>
                        )}

                        {/* SDG Badge */}
                        {sdgGoal && (
                          <span className="text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase print:border-emerald-300 print:text-emerald-700">
                            🌐 {sdgGoal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Section: Award Badge + Score Block */}
                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t border-white/5 md:border-t-0 pt-3 md:pt-0 shrink-0">
                    {/* Award Badge Display */}
                    <div className={`px-3 md:px-4 py-1.5 rounded-xl text-xs font-black tracking-widest border font-mono ${item.awardColor} print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]`}>
                      {item.award === 'GOLD' && '🥇 '}
                      {item.award === 'SILVER' && '🥈 '}
                      {item.award === 'BRONZE' && '🥉 '}
                      {item.award === 'CERTIFICATE' && '📜 '}
                      {item.award}
                    </div>

                    {/* Conditional Score block */}
                    {printLayout === 'with-points' && (
                      <div className="text-right min-w-[4.5rem]">
                        <div className="text-xl md:text-3xl font-black text-blue-400 print:text-blue-600">
                          {item.finalScore.toFixed(2)}%
                        </div>
                        <div className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase tracking-wider print:text-slate-400">Average</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {filteredStandings.length === 0 && !loading && (
            <div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-2xl bg-slate-950/20">
              No Participants Found Matching Selected Filters
            </div>
          )}
        </div>

      </div>
    </div>
  );
}