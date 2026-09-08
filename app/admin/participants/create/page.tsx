"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateParticipantPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [booth, setBooth] = useState('');
  const [project, setProject] = useState('');
  const [team, setTeam] = useState('');
  const [program, setProgram] = useState('');
  const [theme, setTheme] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch competitions on load
  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function fetchCompetitions() {
    const { data, error } = await supabase
      .from('competitions')
      .select('id, name, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading competitions:', error.message);
    } else if (data && data.length > 0) {
      setCompetitions(data);
      // Default to the first competition
      setSelectedCompetition(data[0].id);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetition) {
      return alert("Please select a competition!");
    }

    setLoading(true);
    const trimmedSupervisor = supervisor.trim();

    const payload = { 
      competition_id: selectedCompetition,
      booth_number: booth.trim(),
      project_name: project.trim(), 
      team_name: team.trim(),
      name: team.trim(),
      program: program.trim(),
      project_theme: theme.trim(),
      theme: theme.trim(),
      category: theme.trim(),
      supervisor: trimmedSupervisor,
      supervisor_name: trimmedSupervisor
    };

    let { error } = await supabase.from('participants').insert([payload]);

    if (error && error.message.includes("supervisor_name")) {
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).supervisor_name;

      const fallbackResult = await supabase.from('participants').insert([fallbackPayload]);
      error = fallbackResult.error;
    }

    if (error && error.message.includes("supervisor")) {
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).supervisor;

      const fallbackResult = await supabase.from('participants').insert([fallbackPayload]);
      error = fallbackResult.error;
    }

    if (error) {
      alert("❌ Error adding participant: " + error.message);
    } else {
      alert("✅ Participant registered successfully!");
      router.push('/admin/participants');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-md border border-slate-200 w-full max-w-lg">
        
        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-black text-black text-center uppercase tracking-tight mb-8">
          ADD <span className="italic text-blue-600">PARTICIPANT</span>
        </h1>
        
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Competition Selector */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-blue-700 mb-2">
              SELECT COMPETITION
            </label>
            <select
              required
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="w-full p-4 rounded-2xl bg-blue-50 border border-blue-300 text-black font-extrabold text-sm focus:bg-white focus:border-blue-600 outline-none transition-all cursor-pointer"
            >
              {competitions.length === 0 ? (
                <option value="">No competitions found. Create one first!</option>
              ) : (
                competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.status.toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Booth Number */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-900 mb-2">
              BOOTH NUMBER
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. A01"
              className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-300 text-black font-extrabold text-sm focus:bg-white focus:border-black outline-none transition-all placeholder:text-slate-500"
              value={booth} 
              onChange={(e) => setBooth(e.target.value)}
            />
          </div>

          {/* Program */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-900 mb-2">
              PROGRAM (DET, DTK, DEP.)
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. DET, DTK, DEP"
              className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-300 text-black font-extrabold text-sm focus:bg-white focus:border-black outline-none transition-all placeholder:text-slate-500"
              value={program} 
              onChange={(e) => setProgram(e.target.value)}
            />
          </div>

          {/* Project Theme */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-900 mb-2">
              PROJECT THEME
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. IoT / Automation / Renewable Energy"
              className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-300 text-black font-extrabold text-sm focus:bg-white focus:border-black outline-none transition-all placeholder:text-slate-500"
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-900 mb-2">
              PROJECT NAME
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. SOLAR SYSTEM"
              className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-300 text-black font-extrabold text-sm focus:bg-white focus:border-black outline-none transition-all placeholder:text-slate-500"
              value={project} 
              onChange={(e) => setProject(e.target.value)}
            />
          </div>

          {/* Name / Team Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-900 mb-2">
              NAME / TEAM NAME
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. MUHAMMAD ALIF / TEAM ALPHA"
              className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-300 text-black font-extrabold text-sm focus:bg-white focus:border-black outline-none transition-all placeholder:text-slate-500"
              value={team} 
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>

          {/* Supervisor Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-blue-700 mb-2">
              SUPERVISOR NAME 
            </label>
            <input 
              type="text" 
              required 
              placeholder="e.g. KAVILAN"
              className="w-full p-4 rounded-2xl bg-blue-50 border border-blue-300 text-black font-extrabold text-sm focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-500"
              value={supervisor} 
              onChange={(e) => setSupervisor(e.target.value)}
            />
          </div>

          {/* Confirm Button */}
          <button 
            type="submit"
            disabled={loading || competitions.length === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all mt-4 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "REGISTERING..." : "CONFIRM REGISTRATION"}
          </button>
        </form>

      </div>
    </div>
  );
}