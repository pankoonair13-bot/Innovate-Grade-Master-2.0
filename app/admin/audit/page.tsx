"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    setLoading(true);
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("booth_number", { ascending: true });

    if (error) console.error("Error fetching participants:", error);
    else setParticipants(data || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this booth entry? Associated scores will also be removed.")) return;
    
    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      fetchParticipants();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-slate-900">
              Participant <span className="text-indigo-600">Directory</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Manage booth allocations, student leads, supervisors, and project SDGs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchParticipants}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              🔄 Refresh
            </button>
            <Link
              href="/admin/participants/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              + Add Team
            </Link>
            <Link
              href="/admin/dashboard"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Directory Listing */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4">Booth</th>
                  <th className="p-4">Project Name & Info</th>
                  <th className="p-4">Student / Team Name</th>
                  <th className="p-4">Supervisor</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Loading directory entries...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No registered participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-black text-indigo-600 shrink-0">
                        [{p.booth_number || p.no_booth || "N/A"}]
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {p.project_name || p.tajuk_projek || "N/A"}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {p.programme && (
                            <span className="text-[9px] font-black uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                              {p.programme}
                            </span>
                          )}
                          {p.project_sdg && (
                            <span className="text-[9px] font-black uppercase bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                              SDG: {p.project_sdg}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-700">
                        {p.name_or_team_name || p.team_name || p.nama_pelajar || p.name || "—"}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-500">
                        {p.supervisor_name || p.nama_penyelia || "—"}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-red-200 transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}