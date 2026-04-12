"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageJudges() {
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJudges(); }, []);

  async function fetchJudges() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'judge');
    if (data) setJudges(data);
    setLoading(false);
  }

  const removeJudge = async (id: string, name: string) => {
    if (!confirm(`⚠️ REVOKE ACCESS: Remove "${name || 'this judge'}" from the system?`)) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert(error.message);
    fetchJudges();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Judge <span className="text-blue-600">Authority</span></h1>
          <p className="text-slate-500 text-sm font-medium">Manage judge accounts and scoring permissions.</p>
        </header>

        <div className="grid gap-4">
          {judges.map((j) => (
            <div key={j.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                  ⚖️
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{j.full_name || "Official Judge"}</h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">ID: {j.id.slice(0, 8)}</p>
                </div>
              </div>
              <button 
                onClick={() => removeJudge(j.id, j.full_name)}
                className="bg-white hover:bg-red-600 text-red-500 hover:text-white border border-red-100 px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm uppercase tracking-widest"
              >
                Revoke Access
              </button>
            </div>
          ))}
          
          {judges.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No Judges Registered</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}