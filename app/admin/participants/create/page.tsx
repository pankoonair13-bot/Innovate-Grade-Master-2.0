"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateParticipant() {
  const [project, setProject] = useState('');
  const [team, setTeam] = useState('');
  const [booth, setBooth] = useState('');
  const [supervisor, setSupervisor] = useState(''); // NEW STATE
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // UPDATED INSERT: Added supervisor_name
    const { error } = await supabase.from('participants').insert([
      { 
        project_name: project, 
        team_name: team, 
        booth_number: booth,
        supervisor_name: supervisor // NEW FIELD
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Participant & Supervisor Added!");
      router.push('/admin/participants');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 w-full max-w-md">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic mb-6">
          Add <span className="text-blue-600">Participant</span>
        </h1>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Booth Number</label>
            <input 
              type="text" required placeholder="e.g. A01"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-bold"
              value={booth} onChange={(e) => setBooth(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Project Name</label>
            <input 
              type="text" required placeholder="Project Title"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-bold"
              value={project} onChange={(e) => setProject(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Team Name</label>
            <input 
              type="text" required placeholder="Company/Group Name"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 font-bold"
              value={team} onChange={(e) => setTeam(e.target.value)}
            />
          </div>

          {/* NEW SUPERVISOR INPUT FIELD */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 text-blue-500">Supervisor Name (SV)</label>
            <input 
              type="text" required placeholder="Lecturer Name"
              className="w-full p-4 rounded-2xl bg-blue-50/50 border border-blue-100 focus:ring-2 focus:ring-blue-500 font-bold placeholder:text-blue-300"
              value={supervisor} onChange={(e) => setSupervisor(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all mt-4"
          >
            {loading ? "Registering..." : "Confirm Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}