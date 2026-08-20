"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function Leaderboard() {
  const router = useRouter();
  const [standings, setStandings] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

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
        
        let award = "SIJIL";
        let awardColor = "text-white border-white/30 bg-white/10 print:bg-slate-100 print:text-black print:border-slate-400";
        
        if (avg >= 80) {
          award = "EMAS";
          awardColor = "text-yellow-400 border-yellow-400/20 bg-yellow-500/5 print:bg-yellow-100 print:text-yellow-700 print:border-yellow-300";
        } else if (avg >= 70) {
          award = "PERAK";
          awardColor = "text-slate-300 border-slate-300/20 bg-slate-300/5 print:bg-slate-200 print:text-slate-800 print:border-slate-400";
        } else if (avg >= 50) {
          award = "GANGSA";
          awardColor = "text-amber-500 border-amber-700/40 bg-amber-950 print:bg-amber-100 print:text-amber-900 print:border-amber-400";
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
    if (standings.length === 0) return alert("No data available to export!");

    const excelData = standings.map((item, index) => ({
      "Rank": index + 1,
      "Project Title": item.project_name || "No Project Title",
      "Leader Name": item.name || item.participant_name || "N/A",
      "Team": item.team_name || "N/A",
      "Program": item.program || "N/A",
      "Theme/Category": item.category || item.theme || "N/A",
      "Award Medal": item.award,
      "Average Score": `${item.finalScore.toFixed(2)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Live Standings");

    const columnWidths = [
      { wch: 6 },
      { wch: 35 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 45 },
      { wch: 14 },
      { wch: 15 }
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `EDIAS_2026_Leaderboard.xlsx`);
  };

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
      <div className="max-w-4xl mx-auto print:max-w-full">
        
        {/* Top Header Interface */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-12 border-b border-white/10 pb-6 print:hidden gap-6">
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
                className="flex-1 sm:flex-none text-xs font-bold bg-blue-600 hover:bg-blue-700 px-4 md:px-5 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                🖨️ Print
              </button>

              <button 
                onClick={exportToExcel}
                className="flex-1 sm:flex-none text-xs font-bold bg-emerald-600 hover:bg-emerald-700 px-4 md:px-5 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                📊 Excel
              </button>

              <button 
                onClick={() => fetchLeaderboard(true)} 
                className="text-xs font-bold bg-slate-800 border border-white/5 hover:bg-slate-700 px-3 md:px-4 py-2 rounded-xl transition-all"
              >
                {loading ? "..." : "🔄"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Standings Standard List */}
        <div className="space-y-4">
          {loading && standings.length === 0 ? (
            <div className="text-center py-20 text-slate-500 uppercase tracking-widest animate-pulse font-bold">
              Loading Leaderboard Data...
            </div>
          ) : (
            standings.map((item, index) => (
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
                    {(item.category || item.theme) && (
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold uppercase mt-1 break-words print:text-slate-600">
                        {item.category || item.theme}
                      </p>
                    )}
                    {item.program && (
                      <span className="inline-block mt-2 text-[10px] font-extrabold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase print:border-blue-300 print:text-blue-700">
                        {item.program}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Right Section: Award Badge + Score Block */}
                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t border-white/5 md:border-t-0 pt-3 md:pt-0 shrink-0">
                  {/* Award Badge Display */}
                  <div className={`px-3 md:px-4 py-1.5 rounded-xl text-xs font-black tracking-widest border font-mono ${item.awardColor} print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]`}>
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
            ))
          )}

          {standings.length === 0 && !loading && (
            <div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-2xl bg-slate-950/20">
              No Participants Found
            </div>
          )}
        </div>

      </div>
    </div>
  );
}