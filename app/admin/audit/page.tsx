"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [boothNumber, setBoothNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [category, setCategory] = useState("");

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

  function clearForm() {
    setEditingId(null);
    setBoothNumber("");
    setProjectName("");
    setParticipantName("");
    setCategory("");
  }

  function handleEdit(p: any) {
    setEditingId(p.id);
    setBoothNumber(p.booth_number || "");
    setProjectName(p.project_name || "");
    setParticipantName(p.name || p.participant_name || "");
    setCategory(p.category || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!boothNumber || !projectName) return;

    setSaving(true);
    const payload = {
      booth_number: boothNumber.trim(),
      project_name: projectName.trim(),
      name: participantName.trim(),
      category: category.trim(),
    };

    if (editingId) {
      await supabase.from("participants").update(payload).eq("id", editingId);
    } else {
      await supabase.from("participants").insert([payload]);
    }

    clearForm();
    await fetchParticipants();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this booth entry? Associated scores will also be removed.")) return;
    
    await supabase.from("participants").delete().eq("id", id);
    fetchParticipants();
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/admin"
              className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline mb-1 inline-block"
            >
              ← Back to Admin Dashboard
            </Link>
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

        {/* Entry & Edit Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">
            {editingId ? "✏️ Edit Participant Entry" : "➕ Register New Booth"}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Booth #
              </label>
              <input
                type="text"
                required
                value={boothNumber}
                onChange={(e) => setBoothNumber(e.target.value)}
                placeholder="e.g. A01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Project Title
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project title..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Leader / Author
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Student / Team name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : editingId ? "Update Entry" : "Add Booth"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase px-4 py-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
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
                          onClick={() => handleEdit(p)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                        >
                          Edit
                        </button>
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