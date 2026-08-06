"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateParticipantPage() {
  const [booth, setBooth] = useState('');
  const [project, setProject] = useState('');
  const [team, setTeam] = useState('');
  const [program, setProgram] = useState('');
  const [theme, setTheme] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
      booth_number: booth.trim(),
      project_name: project.trim(), 
      team_name: team.trim(), 
      program: program.trim(),
      project_theme: theme.trim(),
      supervisor_name: supervisor.trim()
    };

    // Try inserting with 'supervisor_name' first
    let { error } = await supabase.from('participants').insert([payload]);

    // Fallback if supervisor column is named 'supervisor' in database
    if (error && error.message.includes("supervisor_name")) {
      const fallbackPayload = {
        ...payload,
        supervisor: supervisor.trim()
      };
      delete (fallbackPayload as any).supervisor_name;

      const fallbackResult = await supabase.from('participants').insert([fallbackPayload]);
      error = fallbackResult.error;
    }

    if (error) {
      alert("❌ Error adding participant: " + error.message);
    } else {
      alert("✅ Participant registered successfully!");
      router.push('/admin/manage-participants');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 w-full max-w-lg">
        
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 text-center uppercase tracking-tight mb-8">
          ADD <span className="italic text-blue-600">PARTICIPANT</span>
        </h1>
        
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Booth Number */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              BOOTH NUMBER
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. A01"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent text-slate-700 font-bold text-sm focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              value={booth} 
              onChange={(e) => setBooth(e.target.value)}
            />
          </div>

          {/* Program (DEE, DKM, etc.) */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              PROGRAM (DET, DTK, ETC.)
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. DET, DTK, DEP"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent text-slate-700 font-bold text-sm focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              value={program} 
              onChange={(e) => setProgram(e.target.value)}
            />
          </div>

          {/* Project Theme */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              PROJECT THEME
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. IoT / Automation / Renewable Energy"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent text-slate-700 font-bold text-sm focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              PROJECT NAME
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. SOLAR SYSTEM"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent text-slate-700 font-bold text-sm focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              value={project} 
              onChange={(e) => setProject(e.target.value)}
            />
          </div>

          {/* Name / Team Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              NAME / TEAM NAME
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. MUHAMMAD ALIF / TEAM ALPHA"
              className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent text-slate-700 font-bold text-sm focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
              value={team} 
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>

          {/* Supervisor Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-blue-600 mb-2">
              SUPERVISOR NAME (SV)
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. KAVILAN"
              className="w-full p-4 rounded-2xl bg-blue-50/40 border border-blue-200 text-blue-600 font-bold text-sm focus:bg-white focus:border-blue-500 outline-none transition-all placeholder:text-blue-300"
              value={supervisor} 
              onChange={(e) => setSupervisor(e.target.value)}
            />
          </div>

          {/* Confirm Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all mt-4 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "REGISTERING..." : "CONFIRM REGISTRATION"}
          </button>
        </form>

      </div>
    </div>
  );
}