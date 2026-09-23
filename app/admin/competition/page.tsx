"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ManageCompetitions() {
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <Link
            href="/admin"
            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline mb-1 inline-block"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-black italic text-slate-900 uppercase tracking-tight">
            Competition <span className="text-indigo-600">Management</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Create and manage active event instances</p>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreateCompetition} className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Create New Competition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Competition Name</label>
              <input
                type="text"
                placeholder="e.g. EDIAS 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-indigo-600 focus:bg-white outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Unique Code / Slug</label>
              <input
                type="text"
                placeholder="e.g. edias-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-indigo-600 focus:bg-white outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            + Create Competition
          </button>
        </form>

        {/* Competition List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">Existing Competitions</h2>
          {loading ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 text-center text-slate-500 text-sm font-medium">
              Loading competitions...
            </div>
          ) : competitions.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 text-center text-slate-500 text-sm font-medium">
              No competitions created yet.
            </div>
          ) : (
            competitions.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center justify-between p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm"
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{comp.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Code: {comp.code}</p>
                </div>
                <span className="text-xs font-extrabold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-lg uppercase tracking-wider">
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