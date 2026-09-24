"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function PastResultsPage() {
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch read-only records when the selected batch changes
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
                  className="bg-slate-900 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none"
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

        {/* Results Standings List */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-sm space-y-3">
          {loading ? (
            <div className="text-center py-20 text-slate-400 uppercase tracking-widest font-bold animate-pulse">
              Loading Archive Standings...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No archived competition records found in database.
            </div>
          ) : (
            records.map((item, index) => {
              let awardColor = "text-slate-700 border-slate-200 bg-slate-100";
              if (item.award === "GOLD") awardColor = "text-amber-800 border-amber-300 bg-amber-50";
              else if (item.award === "SILVER") awardColor = "text-slate-700 border-slate-300 bg-slate-100";
              else if (item.award === "BRONZE") awardColor = "text-amber-900 border-amber-300 bg-amber-100/60";

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
                        {item.program && item.program !== "N/A" && (
                          <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg uppercase">
                            {item.program}
                          </span>
                        )}
                        {item.project_sdg && item.project_sdg !== "N/A" && (
                          <span className="text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg uppercase">
                            🌐 SDG: {item.project_sdg}
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