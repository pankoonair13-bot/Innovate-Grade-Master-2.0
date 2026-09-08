"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ManageCompetitions() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function fetchCompetitions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error.message);
    else setCompetitions(data || []);
    setLoading(false);
  }

  async function handleCreateCompetition(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code) return alert('Please fill in all fields');

    const formattedCode = code.toLowerCase().trim().replace(/\s+/g, '-');

    const { error } = await supabase
      .from('competitions')
      .insert([{ name, code: formattedCode, status: 'active' }]);

    if (error) {
      alert(`Error creating competition: ${error.message}`);
    } else {
      setName('');
      setCode('');
      fetchCompetitions();
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black italic text-blue-500">COMPETITION MANAGEMENT</h1>
          <p className="text-slate-400 text-sm">Create and manage active event instances</p>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreateCompetition} className="bg-slate-900 border border-white/10 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white">Create New Competition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Competition Name</label>
              <input
                type="text"
                placeholder="e.g. EDIAS 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Unique Code / Slug</label>
              <input
                type="text"
                placeholder="e.g. edias-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all"
          >
            + Create Competition
          </button>
        </form>

        {/* Competition List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Existing Competitions</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading competitions...</p>
          ) : competitions.length === 0 ? (
            <p className="text-slate-500 text-sm">No competitions created yet.</p>
          ) : (
            competitions.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 border border-white/5 rounded-xl"
              >
                <div>
                  <h3 className="font-bold text-white text-base">{comp.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Code: {comp.code}</p>
                </div>
                <span className="text-xs font-extrabold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full uppercase">
                  {comp.status}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}