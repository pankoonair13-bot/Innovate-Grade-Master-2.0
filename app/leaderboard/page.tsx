"use client";
import React, { useEffect, useState, useMemo } from 'react';
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
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');

  // Print Mode Layout Toggle
  const [printLayout, setPrintLayout] = useState<'with-points' | 'without-points'>('with-points');

  // Helper function to extract Program regardless of column naming
  const getProgramValue = (item: any) => {
    if (!item) return "";
    return (
      item.program ||
      item.programme ||
      item.department ||
      item.dept ||
      item.course ||
      ""
    );
  };

  // Comprehensive helper function to extract SDG value
  const getSdgValue = (item: any) => {
    if (!item) return "";
    return (
      item.project_sdg ||
      item.project_theme ||
      item.sdg ||
      item.sdg_goal ||
      item.sdg_category ||
      item.sdg_id ||
      item.sdg_number ||
      item.sdg_target ||
      item.sdgs ||
      item.sdg_code ||
      item.sdg_name ||
      ""
    );
  };

  // Extract unique programmes dynamically from loaded dataset
  const programList = useMemo(() => {
    const programs = standings
      .map((item) => String(getProgramValue(item)).trim().toUpperCase())
      .filter((p) => p !== '');
    return Array.from(new Set(programs)).sort();
  }, [standings]);

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;

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
    
    // Extended query limit to 1000 so DEP and DET aren't truncated by Supabase
    const { data, error } = await supabase
      .from('participants') 
      .select(`
        *,
        scores ( score )
      `)
      .limit(1000);

    if (error) {
      console.error("Data error:", error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const processed = data.map(p => {
        const scoresArray = p.scores || [];
        const avg = scoresArray.length > 0 
          ? scoresArray.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0) / scoresArray.length 
          : 0;
        
        let award = "CERTIFICATE";
        let awardColor = "text-slate-700 border-slate-200 bg-slate-100";
        
        if (avg >= 80) {
          award = "GOLD";
          awardColor = "text-amber-800 border-amber-300 bg-amber-50";
        } else if (avg >= 70) {
          award = "SILVER";
          awardColor = "text-slate-700 border-slate-300 bg-slate-100";
        } else if (avg >= 50) {
          award = "BRONZE";
          awardColor = "text-amber-900 border-amber-300 bg-amber-100/60";
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

    const excelData = filteredStandings.map((item, index) => {
      const sdgVal = getSdgValue(item);
      const progVal = getProgramValue(item);
      return {
        "Rank": index + 1,
        "Project Title": (item.project_name || "No Project Title").toUpperCase(),
        "Team": (item.team_name || "N/A").toUpperCase(),
        "Supervisor": (item.supervisor_name || item.supervisor || "N/A").toUpperCase(),
        "Program": progVal ? String(progVal).toUpperCase() : "N/A",
        "SDG": sdgVal ? String(sdgVal).toUpperCase() : "N/A",
        "Award Medal": item.award,
        "Average Score": `${item.finalScore.toFixed(2)}%`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    const max_width = (key: string) => {
      return excelData.reduce((w, r) => Math.max(w, String((r as any)[key] || '').length), key.length) + 4;
    };

    worksheet['!cols'] = [
      { wch: 8 },                          // Rank
      { wch: max_width("Project Title") }, // Project Title
      { wch: max_width("Team") },          // Team
      { wch: max_width("Supervisor") },    // Supervisor
      { wch: max_width("Program") },       // Program
      { wch: max_width("SDG") },           // SDG
      { wch: 16 },                         // Award Medal
      { wch: 16 }                          // Average Score
    ];

    XLSX.writeFile(workbook, `Results.xlsx`);
  };

  // Filtered Standings Logic
  const filteredStandings = standings.filter(item => {
    const matchesAward = selectedAward === 'ALL' || item.award === selectedAward;
    
    // Programme Matching
    const itemProgram = String(getProgramValue(item)).trim().toLowerCase();
    const matchesProgram = selectedProgram === 'ALL' || itemProgram === selectedProgram.trim().toLowerCase();

    // SDG Matching
    const itemSdg = String(getSdgValue(item)).trim();
    let matchesSdg = selectedSdg === 'ALL';

    if (!matchesSdg && itemSdg) {
      const selectedPrefix = selectedSdg.split(':')[0].trim().toLowerCase();
      const itemPrefix = itemSdg.split(':')[0].trim().toLowerCase();

      matchesSdg = itemSdg.toLowerCase().includes(selectedSdg.toLowerCase()) || 
                   itemPrefix === selectedPrefix;
    }

    return matchesAward && matchesProgram && matchesSdg;
  });

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200/80 p-8 rounded-3xl max-w-md w-full shadow-md">
          <span className="text-5xl mb-4 block">🔒</span>
          <h1 className="text-2xl font-black mb-2 text-slate-900">Access Restricted</h1>
          <p className="text-slate-500 text-sm mb-6">
            Judges are not allowed to view the overall leaderboard standings.
          </p>
          <button 
            onClick={() => router.push('/scoring')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-sm"
          >
            Return to Scoring Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-8 font-sans print:bg-white print:text-black">
      <div className="max-w-6xl mx-auto print:max-w-full space-y-6">
        
        {/* EXECUTIVE BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-800/80 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="text-[11px] font-extrabold text-indigo-400 tracking-widest uppercase mb-1">Live Competition Rankings</div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white italic">
                LIVE <span className="text-slate-300">LEADERBOARD</span>
              </h1>
            </div>

            {/* Top Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
                <button 
                  onClick={() => setPrintLayout('with-points')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${printLayout === 'with-points' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  With Points
                </button>
                <button 
                  onClick={() => setPrintLayout('without-points')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${printLayout === 'without-points' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  No Points
                </button>
              </div>
              
              <button 
                onClick={handlePrint}
                className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                🖨️ Print
              </button>

              <button 
                onClick={exportToExcel}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                📊 Excel
              </button>

              <button 
                onClick={() => fetchLeaderboard(true)} 
                className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {loading ? "..." : "🔄"}
              </button>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 print:hidden">
          
          {/* Medal Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold uppercase text-slate-400 mr-2 tracking-wider">Medal Filter:</span>
            {['ALL', 'GOLD', 'SILVER', 'BRONZE', 'CERTIFICATE'].map((medal) => (
              <button
                key={medal}
                onClick={() => setSelectedAward(medal)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                  selectedAward === medal
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
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

          {/* Dropdown Filters Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Programme Filter Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider shrink-0 pl-1">
                🎓 Programme:
              </span>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold w-full focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value="ALL">All Programmes (Show All)</option>
                {programList.map((prog, idx) => (
                  <option key={idx} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>

            {/* SDG Filter Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider shrink-0 pl-1">
                🌐 SDG Category:
              </span>
              <select
                value={selectedSdg}
                onChange={(e) => setSelectedSdg(e.target.value)}
                className="bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold w-full focus:outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value="ALL">All 17 SDGs (Show All)</option>
                {SDG_LIST.map((sdg, idx) => (
                  <option key={idx} value={`SDG ${idx + 1}`}>
                    {sdg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters Option */}
          {(selectedAward !== 'ALL' || selectedSdg !== 'ALL' || selectedProgram !== 'ALL') && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setSelectedAward('ALL');
                  setSelectedSdg('ALL');
                  setSelectedProgram('ALL');
                }}
                className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider underline shrink-0 cursor-pointer pr-1"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* RESULTS STANDINGS BOARD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="space-y-3">
            {loading && standings.length === 0 ? (
              <div className="text-center py-20 text-slate-400 uppercase tracking-widest animate-pulse font-bold">
                Loading Leaderboard Data...
              </div>
            ) : (
              filteredStandings.map((item, index) => {
                const supervisorName = item.supervisor_name || item.supervisor;
                const sdgGoal = getSdgValue(item);
                const progName = getProgramValue(item);

                return (
                  <div 
                    key={item.id} 
                    className="bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-4 md:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-slate-200 print:bg-white print:text-black print:p-4"
                  >
                    {/* Left Section: Rank + Title + Info */}
                    <div className="flex items-start md:items-center gap-4 md:gap-5">
                      <span className="text-2xl md:text-3xl font-black text-slate-400 min-w-[2.25rem] shrink-0 print:text-black">
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base md:text-lg font-bold uppercase tracking-tight text-slate-900 break-words print:text-black">
                          {item.project_name || "No Project Title"}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium break-words mt-0.5">
                          Leader: {item.name || item.participant_name || "N/A"} {item.team_name ? `• ${item.team_name}` : ''}
                        </p>
                        
                        {/* Supervisor Display */}
                        {supervisorName && (
                          <p className="text-xs font-bold text-indigo-600 uppercase mt-0.5">
                            SV: <span className="text-slate-700 font-semibold">{supervisorName}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {progName && (
                            <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg uppercase">
                              {progName}
                            </span>
                          )}

                          {/* SDG Badge */}
                          {sdgGoal && (
                            <span className="text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg uppercase">
                              🌐 SDG: {sdgGoal}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Section: Award Badge + Score Block */}
                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t border-slate-200 md:border-t-0 pt-3 md:pt-0 shrink-0">
                      {/* Award Badge Display */}
                      <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-widest border font-mono ${item.awardColor} print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]`}>
                        {item.award === 'GOLD' && '🥇 '}
                        {item.award === 'SILVER' && '🥈 '}
                        {item.award === 'BRONZE' && '🥉 '}
                        {item.award === 'CERTIFICATE' && '📜 '}
                        {item.award}
                      </div>

                      {/* Conditional Score block */}
                      {printLayout === 'with-points' && (
                        <div className="text-right min-w-[4.5rem]">
                          <div className="text-xl md:text-2xl font-black text-indigo-600">
                            {item.finalScore.toFixed(2)}%
                          </div>
                          <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {filteredStandings.length === 0 && !loading && (
              <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No participants found matching selected filters
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}