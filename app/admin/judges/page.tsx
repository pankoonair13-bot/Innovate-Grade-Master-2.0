"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageJudges() {
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    setLoading(true);
    
    // Fetch profiles matching 'judge' (case-insensitive)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('role', 'judge');

    if (error) {
      console.error("Error fetching judges:", error.message);
      alert("⚠️ Error loading judges: " + error.message);
    } else {
      setJudges(data || []);
    }
    setLoading(false);
  }

  // Toggle judge active state ON / OFF
  async function handleToggleAccess(id: string, currentStatus: boolean) {
    const nextStatus = !currentStatus;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: nextStatus })
      .eq('id', id);

    if (error) {
      alert("Error updating access: " + error.message);
    } else {
      setJudges((prev) =>
        prev.map((j) => (j.id === id ? { ...j, is_active: nextStatus } : j))
      );
    }
  }

  // Start editing name
  function startEditing(judge: any) {
    setEditingId(judge.id);
    setEditName(judge.name || judge.username || '');
  }

  // Save updated name
  async function handleSaveName(id: string) {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmedName })
      .eq('id', id);

    if (error) {
      alert("Error updating name: " + error.message);
    } else {
      setJudges((prev) =>
        prev.map((j) => (j.id === id ? { ...j, name: trimmedName } : j))
      );
      setEditingId(null);
    }
  }

  // Permanent Delete to release username
  async function handleDeleteJudge(id: string, judgeName: string) {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE judge "${judgeName}"? This will free up the username.`)) {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting judge: " + error.message);
    } else {
      alert("🗑️ Judge deleted.");
      fetchJudges();
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black italic text-blue-500 uppercase">
            Manage <span className="text-white">Judges</span>
          </h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-4 py-2 rounded-xl border border-white/5">
            Total Judges: {judges.length}
          </span>
        </div>

        {/* Judges List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading judges...</p>
          ) : judges.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No judges found.</p>
          ) : (
            judges.map((judge) => {
              const isActive = judge.is_active !== false;
              const displayName = judge.name || judge.username || 'Unnamed Judge';
              const isEditing = editingId === judge.id;

              return (
                <div 
                  key={judge.id} 
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border transition-all gap-4 ${
                    isActive 
                      ? 'bg-[#1e293b]/40 border-white/5' 
                      : 'bg-slate-950/60 border-red-500/20 opacity-75'
                  }`}
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                        @{judge.username || 'no-username'}
                      </p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-[#0f172a] border border-blue-500/50 p-2 rounded-xl text-sm font-bold text-white focus:outline-none w-full max-w-xs"
                          placeholder="Full Name"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveName(judge.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-bold text-lg uppercase text-white">
                        {displayName}
                      </h3>
                    )}
                  </div>

                  {/* Actions: Edit + Enable/Disable + Delete */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button 
                      type="button"
                      onClick={() => startEditing(judge)}
                      className="bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      ✏️ Edit
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleToggleAccess(judge.id, isActive)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border-amber-500/30' 
                          : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border-emerald-500/30'
                      }`}
                    >
                      {isActive ? '⏸ Disable' : '▶ Enable'}
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleDeleteJudge(judge.id, displayName)} 
                      className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-500/20 transition-all cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
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