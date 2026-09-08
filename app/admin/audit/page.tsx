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
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/admin"
              className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline mb-1 inline-block"
            >
              ← Back to Admin Control
            </Link>
            <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
              Participant <span className="text-blue-500">Directory</span>
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchParticipants}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Entry & Edit Form */}
        <div className="bg-slate-800/40 border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-sm">
          <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">
            {editingId ? "✏️ Edit Participant Entry" : "➕ Register New Booth"}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Booth #</label>
              <input
                type="text"
                required
                value={boothNumber}
                onChange={(e) => setBoothNumber(e.target.value)}
                placeholder="e.g. A01"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Project Title</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project title..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Leader / Author</label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Student / Team name"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Entry" : "Add Booth"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs uppercase px-4 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Directory Listing */}
        <div className="bg-slate-800/20 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  <th className="p-4">Booth</th>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Lead / Team</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 animate-pulse uppercase tracking-widest text-xs">
                      Loading directory entries...
                    </td>
                  </tr>
                ) : participants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                      No registered participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-black text-blue-400 shrink-0">
                        [{p.booth_number}]
                      </td>
                      <td className="p-4 font-bold text-white">
                        {p.project_name}
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-400">
                        {p.name || p.participant_name || "—"}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-white/5 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-red-500/20 transition-all"
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