"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageJudges() {
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    setLoading(true);
    const { data, error } = await supabase
      .from('judges')
      .select('*')
      .order('username', { ascending: true });
    
    if (!error) setJudges(data || []);
    setLoading(false);
  }

  async function handleCreateJudge(e: React.FormEvent) {
    e.preventDefault();
    
    const { data, error } = await supabase
      .from('judges')
      .insert([{ 
        username: username.trim(), 
        name: fullName, 
        password: password 
      }]);

    if (error) {
      alert("Error creating judge: " + error.message);
    } else {
      alert("Judge created successfully!");
      setUsername('');
      setFullName('');
      setPassword('');
      fetchJudges(); // Refresh list
    }
  }

  async function handleDeleteJudge(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete Judge ${name}?`)) return;

    const { error } = await supabase
      .from('judges')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      fetchJudges(); // Refresh list
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black italic text-blue-500 uppercase mb-8">
          Manage <span className="text-white">Judges</span>
        </h1>

        {/* Create Judge Form */}
        <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] mb-10">
          <h2 className="text-sm font-black uppercase tracking-widest mb-4 text-slate-400">Add New Judge</h2>
          <form onSubmit={handleCreateJudge} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              type="text" placeholder="Username" required
              className="bg-[#0f172a] border border-white/10 p-3 rounded-xl text-sm"
              value={username} onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="text" placeholder="Full Name" required
              className="bg-[#0f172a] border border-white/10 p-3 rounded-xl text-sm"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
            />
            <input 
              type="password" placeholder="Password" required
              className="bg-[#0f172a] border border-white/10 p-3 rounded-xl text-sm"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="md:col-span-3 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all">
              Create Judge Account
            </button>
          </form>
        </div>

        {/* Judges List */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest mb-2 text-slate-400">Existing Judges</h2>
          {loading ? (
            <p className="text-slate-500 italic">Loading judges...</p>
          ) : (
            judges.map((judge) => (
              <div key={judge.id} className="flex items-center justify-between p-5 bg-[#1e293b]/40 border border-white/5 rounded-2xl">
                <div>
                  <p className="text-xs font-black text-blue-400 uppercase tracking-tighter">{judge.username}</p>
                  <h3 className="font-bold text-lg uppercase">{judge.name}</h3>
                </div>
                <button 
                  onClick={() => handleDeleteJudge(judge.id, judge.name)}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border border-red-500/20"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}