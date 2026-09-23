"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    
    await supabase.from("participants").delete().eq("id", id);
    fetchParticipants();
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-slate-900">
              Participant <span className="text-indigo-600">Directory</span>
            </h1>
          </div>

          <button
            onClick={fetchParticipants}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Directory Listing */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="p-4">Booth</th>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Lead / Team</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Loading directory entries...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No registered participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-black text-indigo-600 shrink-0">
                        [{p.booth_number}]
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {p.project_name}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-500">
                        {p.name || p.participant_name || "—"}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
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