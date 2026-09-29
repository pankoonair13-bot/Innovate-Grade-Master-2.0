"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Defined Programmes List matching CreateParticipant options
const DEFAULT_PROGRAM_OPTIONS = ["DET", "DEP", "DTK"];

// 17 Sustainable Development Goals List (SDG 01, SDG 2, SDG 3, ...)
const SDG_LIST = [
  "SDG 01: No Poverty",
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

export default function PastResultsPage() {
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedAward, setSelectedAward] = useState<string>("ALL");
  const [selectedSdg, setSelectedSdg] = useState<string>("ALL");
  const [selectedProgram, setSelectedProgram] = useState<string>("ALL");

  // Helper functions to safely extract Programme and SDG values
  const getProgramValue = (item: any) => {
    if (!item) return "";
    return item.program || item.programme || item.department || item.dept || item.course || "";
  };

  const getSdgValue = (item: any) => {
    if (!item) return "";
    return (
      item.project_sdg ||
      item.project_theme ||
      item.sdg ||
      item.sdg_goal ||
      item.sdg_category ||
      ""
    );
  };

  // Dynamic Programme list combining default choices with archived records
  const programList = useMemo(() => {
    const fetchedPrograms = records
      .map((item) => String(getProgramValue(item)).trim().toUpperCase())
      .filter((p) => p !== "" && p !== "N/A");

    const combined = Array.from(new Set([...DEFAULT_PROGRAM_OPTIONS, ...fetchedPrograms]));
    return combined.sort();
  }, [records]);

  // Fetch unique competition batch names
  useEffect(() => {
    async function fetchBatches() {
      const { data, error } = await supabase.from("archives").select("batch_name");
      if (error) {
        console.error("Error fetching archives:", error.message);
      } else if (data) {
        const unique = Array.from(new Set(data.map((item) => item.batch_name)));
        setBatches(unique);
        if (unique.length > 0) setSelectedBatch(unique[0]);
      }
      setLoading(false);
    }
    fetchBatches();
  }, []);

  // Fetch read-only records when selected batch changes
  useEffect(() => {
    if (!selectedBatch) return;

    async function fetchBatchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from("archives")
        .select("*")
        .eq("batch_name", selectedBatch)
        .order("final_score", { ascending: false });

      if (error) {
        console.error("Error fetching batch results:", error.message);
      } else if (data) {
        setRecords(data);
      }
      setLoading(false);
    }
    fetchBatchData();
  }, [selectedBatch]);

  // Filtered Records Logic
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Award/Medal Matching
      const matchesAward = selectedAward === "ALL" || item.award === selectedAward;

      // Programme Matching
      const itemProgram = String(getProgramValue(item)).trim().toUpperCase();
      const matchesProgram =
        selectedProgram === "ALL" || itemProgram === selectedProgram.trim().toUpperCase();

      // SDG Category Matching
      const itemSdg = String(getSdgValue(item)).trim();
      let matchesSdg = selectedSdg === "ALL";

      if (!matchesSdg && itemSdg) {
        const selectedPrefix = selectedSdg.split(":")[0].trim().toLowerCase();
        const itemPrefix = itemSdg.split(":")[0].trim().toLowerCase();

        matchesSdg =
          itemSdg.toLowerCase().includes(selectedSdg.toLowerCase()) ||
          itemPrefix === selectedPrefix;
      }

      return matchesAward && matchesProgram && matchesSdg;
    });
  }, [records, selectedAward, selectedProgram, selectedSdg]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 rounded-2xl shadow-md border border-slate-800/80">
          <div>
            <div className="text-[11px] font-extrabold text-amber-400 tracking-widest uppercase mb-1">
              Read-Only Competition Records
            </div>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase">
              PAST COMPETITION <span className="text-slate-300">ARCHIVES</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Event Batch Selection Dropdown */}
            {batches.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80">
                <span className="text-xs font-extrabold text-slate-300 pl-2 uppercase">SELECT BATCH:</span>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="bg-slate-900 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {batches.map((b, idx) => (
                    <option key={idx} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            <Link
              href="/admin/dashboard"
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-xl uppercase tracking-wider transition-all"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          
          {/* Medal Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold uppercase text-slate-400 mr-2 tracking-wider">
              Medal Filter:
            </span>
            {["ALL", "GOLD", "SILVER", "BRONZE", "CERTIFICATE"].map((medal) => (
              <button
                key={medal}
                onClick={() => setSelectedAward(medal)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                  selectedAward === medal
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {medal === "GOLD" && "🥇 "}
                {medal === "SILVER" && "🥈 "}
                {medal === "BRONZE" && "🥉 "}
                {medal === "CERTIFICATE" && "📜 "}
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
                className="bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold w-full focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
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
                className="bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold w-full focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
              >
                <option value="ALL">All 17 SDGs (Show All)</option>
                {SDG_LIST.map((sdg, idx) => {
                  const sdgCode = idx === 0 ? "SDG 01" : `SDG ${idx + 1}`;
                  return (
                    <option key={idx} value={sdgCode}>
                      {sdg}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Reset Filters Option */}
          {(selectedAward !== "ALL" || selectedSdg !== "ALL" || selectedProgram !== "ALL") && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setSelectedAward("ALL");
                  setSelectedSdg("ALL");
                  setSelectedProgram("ALL");
                }}
                className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider underline shrink-0 cursor-pointer pr-1"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Standings List */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-sm space-y-3">
          {loading ? (
            <div className="text-center py-20 text-slate-400 uppercase tracking-widest font-bold animate-pulse">
              Loading Archive Standings...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No archived competition records found matching selected filters.
            </div>
          ) : (
            filteredRecords.map((item, index) => {
              let awardColor = "text-slate-700 border-slate-200 bg-slate-100";
              if (item.award === "GOLD") awardColor = "text-amber-800 border-amber-300 bg-amber-50";
              else if (item.award === "SILVER") awardColor = "text-slate-700 border-slate-300 bg-slate-100";
              else if (item.award === "BRONZE") awardColor = "text-amber-900 border-amber-300 bg-amber-100/60";

              const progName = getProgramValue(item);
              const sdgGoal = getSdgValue(item);

              return (
                <div 
                  key={item.id} 
                  className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start md:items-center gap-4 md:gap-5">
                    <span className="text-2xl md:text-3xl font-black text-slate-400 min-w-[2.25rem]">
                      #{index + 1}
                    </span>
                    <div>
                      <h2 className="text-base md:text-lg font-bold uppercase text-slate-900">
                        {item.project_name}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Team: {item.team_name} | SV: {item.supervisor_name}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {progName && progName !== "N/A" && (
                          <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg uppercase">
                            {progName}
                          </span>
                        )}
                        {sdgGoal && sdgGoal !== "N/A" && (
                          <span className="text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg uppercase">
                            🌐 SDG: {sdgGoal}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t border-slate-200 md:border-t-0 pt-3 md:pt-0">
                    <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-widest border font-mono ${awardColor}`}>
                      {item.award === 'GOLD' && '🥇 '}
                      {item.award === 'SILVER' && '🥈 '}
                      {item.award === 'BRONZE' && '🥉 '}
                      {item.award === 'CERTIFICATE' && '📜 '}
                      {item.award}
                    </span>

                    <div className="text-right min-w-[4.5rem]">
                      <div className="text-xl md:text-2xl font-black text-indigo-600">
                        {Number(item.final_score).toFixed(2)}%
                      </div>
                      <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Final Score
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}