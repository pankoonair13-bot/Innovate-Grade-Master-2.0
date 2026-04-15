"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageParticipants() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for Add/Edit
  const [name, setName] = useState('');
  const [booth, setBooth] = useState('');
  const [team, setTeam] = useState('');
  const [program, setProgram] = useState(''); // 🟢 New
  const [theme, setTheme] = useState('');     // 🟢 New
  
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    setLoading(true);
    const { data } = await supabase
      .from('participants')
      .select('*')
      .order('booth_number', { ascending: true });
    if (data) setParticipants(data);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      project_name: name, 
      booth_number: booth, 
      team_name: team, 
      program, 
      theme 
    };

    if (editingId) {
      // UPDATE EXISTING
      await supabase.from('participants').update(payload).eq('id', editingId);
      setEditingId(null);
    } else {
      // INSERT NEW
      await supabase.from('participants').insert([payload]);
    }

    // Reset Form
    setName(''); setBooth(''); setTeam(''); setProgram(''); setTheme('');
    fetchParticipants();
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setName(p.project_name);
    setBooth(p.booth_number);
    setTeam(p.team_name);
    setProgram(p.program || '');
    setTheme(p.theme || '');
  };

  const deleteParticipant = async (id: string) => {
    if (confirm("Delete this participant?")) {
      await supabase.from('participants').delete().eq('id', id);
      fetchParticipants();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
            Manage <span className="text-blue-600">Participants</span>
          </h1>
        </div>

        {/* 📝 FORM SECTION */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10">
          <h2 className="text-xs font-black uppercase text-blue-600 mb-6 tracking-widest">
            {editingId ? "⚡ Edit Participant" : "➕ Add New Participant"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Project Name" className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
            <input placeholder="Booth Number" className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" value={booth} onChange={(e) => setBooth(e.target.value)} required />
            <input placeholder="Team Name" className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" value={team} onChange={(e) => setTeam(e.target.value)} required />
            
            {/* 🟢 NEW INPUTS */}
            <input placeholder="Program (DEE, DKM, etc.)" className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" value={program} onChange={(e) => setProgram(e.target.value)} />
            <input placeholder="Project Theme" className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm md:col-span-2" value={theme} onChange={(e) => setTheme(e.target.value)} />
            
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
                {editingId ? "Update Participant" : "Register Participant"}
              </button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="px-6 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>}
            </div>
          </form>
        </div>

        {/* 📋 LIST SECTION */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Project / Team</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Booth/Prog/Theme</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="p-6">
                    <p className="font-bold text-slate-800 uppercase text-sm">{p.project_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.team_name}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">{p.booth_number}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase">{p.program || 'N/A'}</span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[9px] font-black uppercase">{p.theme || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={() => startEdit(p)} className="text-blue-600 font-black text-[10px] uppercase mr-4 hover:underline">Edit</button>
                    <button onClick={() => deleteParticipant(p.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}