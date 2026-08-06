"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export default function Leaderboard() {
  const [allStandings, setAllStandings] = useState<any[]>([]); 
  const [filteredStandings, setFilteredStandings] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedTheme, setSelectedTheme] = useState('ALL CATEGORIES');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedMedal, setSelectedMedal] = useState('ALL');

  // Print Mode Layout Toggle: 'with-points' or 'without-points'
  const [printLayout, setPrintLayout] = useState<'with-points' | 'without-points'>('with-points');

  // 1. Core Fetch Effect (Runs once on mount + sets up background polling)
  useEffect(() => {
    // Initial load shows the loading spinner
    fetchLeaderboard(true);
    
    // Background updates pool silently every 20 seconds without flickering the UI
    const interval = setInterval(() => {
      fetchLeaderboard(false);
    }, 20000); 

    return () => clearInterval(interval);
  }, []);

  // 2. Filter Trigger Effect
  useEffect(() => {
    let filtered = [...allStandings];

    if (selectedTheme !== 'ALL CATEGORIES') {
      filtered = filtered.filter(item => {
        const itemTheme = (item.category || item.theme || "").toUpperCase();
        return itemTheme.includes(selectedTheme.toUpperCase());
      });
    }

    if (selectedProgram !== 'ALL') {
      filtered = filtered.filter(item => 
        item.program && item.program.toUpperCase() === selectedProgram.toUpperCase()
      );
    }

    if (selectedMedal !== 'ALL') {
      filtered = filtered.filter(item => 
        item.award && item.award.toUpperCase() === selectedMedal.toUpperCase()
      );
    }

    setFilteredStandings(filtered);
  }, [selectedTheme, selectedProgram, selectedMedal, allStandings]);

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

      setAllStandings(processed);
    }
    setLoading(false);
  }

  const handlePrint = () => {
    window.print();
  };

  const exportToExcel = () => {
    if (filteredStandings.length === 0) return alert("No data available to export!");

    // Map fields cleanly to target tabular layout structure
    const excelData = filteredStandings.map((item, index) => ({
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

    // Pre-calculate readable column padding configurations
    const columnWidths = [
      { wch: 6 },  // Rank
      { wch: 35 }, // Project Title
      { wch: 25 }, // Leader Name
      { wch: 15 }, // Team
      { wch: 10 }, // Program
      { wch: 45 }, // Theme/Category
      { wch: 14 }, // Award Medal
      { wch: 15 }  // Average Score
    ];
    worksheet['!cols'] = columnWidths;

    // Trigger local client side storage write context stream downloads
    XLSX.writeFile(workbook, `EDIAS_2026_Leaderboard_${selectedTheme.split(':')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-sans print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto print:max-w-full">
        
        {/* Top Header Interface */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 border-b border-white/10 pb-6 print:hidden gap-6">
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter text-blue-500">
              LIVE <span className="text-white">STANDINGS</span>
            </h1>
            <p className="text-slate-500 font-bold tracking-[0.2em] text-xs mt-2">EDIAS 2026 RANKINGS</p>
          </div>

          {/* Controls Panel Layout Configuration */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setPrintLayout('with-points')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${printLayout === 'with-points' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                With Points
              </button>
              <button 
                onClick={() => setPrintLayout('without-points')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${printLayout === 'without-points' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                No Points
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2"
              >
                🖨️ Print List
              </button>

              {/* EXCEL EXPORT COMPONENT BUTTON INTERFACE */}
              <button 
                onClick={exportToExcel}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-xl uppercase tracking-wider transition-all flex items-center gap-2"
              >
                📊 Export Excel
              </button>

              <button 
                onClick={() => fetchLeaderboard(true)} 
                className="text-xs font-bold bg-slate-800 border border-white/5 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all"
              >
                {loading ? "..." : "🔄"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Selection Panel Container */}
        <div className="bg-slate-900/30 border border-white/5 p-6 rounded-3xl mb-8 space-y-6 print:hidden">
          <div className="grid grid-cols-1 gap-6">
            
            {/* Filter By Theme Selection Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Filter By Theme</label>
              <select 
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-500 text-slate-300"
              >
                <option value="ALL CATEGORIES">ALL CATEGORIES</option>
                <option value="TEMA 1">TEMA 1: PERTANIAN PINTAR ATAU TEKNOLOGI MAKANAN</option>
                <option value="TEMA 3">TEMA 3: KEBUDAYAAN DAN KESENIAN ATAU PELANCONGAN DAN HOSPITALITI</option>
                <option value="TEMA 4">TEMA 4: TEKNOLOGI HIJAU ATAU TENAGA BOLEH DIPERBAHARUI</option>
                <option value="TEMA 5">TEMA 5: PENGURUSAN ATAU PERKHIDMATAN PERNIAGAAN</option>
                <option value="TEMA 6">TEMA 6: PENJAGAAN KESIHATAN ATAU KESELAMATAN</option>
                <option value="TEMA 7">TEMA 7: PENGAJARAN DAN PEMBELAJARAN</option>
                <option value="TEMA 8">TEMA 8: SISTEM KECERDASAN A.I DAN PEMBUATAN PINTAR</option>
                <option value="TEMA 9">TEMA 9: PENGANGKUTAN ATAU APLIKASI SISTEM RENDAH KARBON</option>
              </select>
            </div>

            {/* Program & Medal Button Layout rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Program</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'DEP', 'DET', 'DTK'].map((prog) => (
                    <button
                      key={prog}
                      onClick={() => setSelectedProgram(prog)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                        selectedProgram === prog 
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {prog}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Medal Status</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'EMAS', 'PERAK', 'GANGSA', 'SIJIL'].map((medal) => (
                    <button
                      key={medal}
                      onClick={() => setSelectedMedal(medal)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                        selectedMedal === medal 
                          ? medal === 'EMAS' ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                          : medal === 'PERAK' ? 'bg-slate-300 text-slate-950 border-slate-200'
                          : medal === 'GANGSA' ? 'bg-amber-700 text-white border-amber-600'
                          : medal === 'SIJIL' ? 'bg-white text-slate-950 border-slate-200'
                          : 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {medal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Live Standings List Render Target */}
        <div className="space-y-4">
          {loading && filteredStandings.length === 0 ? (
            <div className="text-center py-20 text-slate-500 uppercase tracking-widest animate-pulse font-bold">
              Loading Leaderboard Data...
            </div>
          ) : (
            filteredStandings.map((item, index) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-6 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all print:border-slate-200 print:bg-white print:text-black print:p-4"
              >
                <div className="flex items-center gap-6">
                  <span className="text-3xl font-black text-slate-700 w-8 print:text-black">{index + 1}</span>
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight text-white print:text-black">
                      {item.project_name || "No Project Title"}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium print:text-slate-600">
                      Leader: {item.name || item.participant_name || "N/A"} {item.team_name ? `• ${item.team_name}` : ''}
                    </p>
                    {(item.category || item.theme) && (
                      <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5 max-w-md truncate print:text-slate-600">
                        {item.category || item.theme}
                      </p>
                    )}
                    {item.program && (
                      <span className="inline-block mt-1 text-[10px] font-extrabold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase print:border-blue-300 print:text-blue-700">
                        {item.program}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-right">
                  {/* Award Badge Display */}
                  <div className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-widest border font-mono ${item.awardColor} print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]`}>
                    {item.award}
                  </div>

                  {/* Conditional Score block */}
                  {printLayout === 'with-points' && (
                    <div className="w-24">
                      <div className="text-3xl font-black text-blue-400 print:text-blue-600">
                        {item.finalScore.toFixed(2)}%
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider print:text-slate-400">Average</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {filteredStandings.length === 0 && !loading && (
            <div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-2xl bg-slate-950/20">
              No Results Found For These Filters
            </div>
          )}
        </div>

      </div>
    </div>
  );
}