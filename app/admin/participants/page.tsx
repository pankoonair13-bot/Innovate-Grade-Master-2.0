"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState({
    project_name: '',
    booth_number: '',
    team_name: '',
    program: '',
    project_sdg: '',
    supervisor_name: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch Participants
    const { data: pData } = await supabase
      .from('participants')
      .select('*')
      .order('booth_number', { ascending: true });

    if (pData) setParticipants(pData);
    setLoading(false);
  }

  // Start Inline Editing for a Row
  const startInlineEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({
      project_name: p.project_name || '',
      booth_number: p.booth_number || '',
      team_name: p.team_name || p.name || '',
      program: p.program || p.programme || '',
      project_sdg: p.project_sdg || p.project_theme || p.theme || '',
      supervisor_name: p.supervisor_name || p.supervisor || ''
    });
  };

  // Save Inline Edit
  const saveInlineEdit = async (id: string | number) => {
    const payload: Record<string, any> = {
      project_name: editForm.project_name.trim(),
      booth_number: editForm.booth_number.trim(),
      team_name: editForm.team_name.trim(),
      program: editForm.program.trim(),
      programme: editForm.program.trim(),
      project_sdg: editForm.project_sdg.trim(),
      project_theme: editForm.project_sdg.trim(),
      supervisor_name: editForm.supervisor_name.trim()
    };

    let { error } = await supabase
      .from('participants')
      .update(payload)
      .eq('id', id);

    if (error && error.message.includes("supervisor_name")) {
      payload.supervisor = editForm.supervisor_name.trim();
      delete payload.supervisor_name;

      const fallbackResult = await supabase
        .from('participants')
        .update(payload)
        .eq('id', id);

      error = fallbackResult.error;
    }

    if (error) {
      alert("❌ Error updating: " + error.message);
    } else {
      setEditingId(null);
      fetchData();
    }
  };

  // Delete Participant
  const deleteParticipant = async (id: string | number) => {
    if (confirm("Delete this participant?")) {
      await supabase.from('participants').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">
              Manage <span className="text-blue-600">Participants Directory</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase mt-1">
              View and edit project details, booth numbers, and team leads inline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm transition-all cursor-pointer"
            >
              🔄 Refresh
            </button>
            <Link
              href="/admin/dashboard"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* PARTICIPANTS TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Project / Team / Supervisor</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Booth / Prog / SDG</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map((p) => {
                const isEditing = editingId === p.id;
                const projectSDG = p.project_sdg || p.project_theme || p.theme || 'N/A';
                const supervisorName = p.supervisor_name || p.supervisor || 'N/A';
                const programName = p.program || p.programme || 'N/A';

                return (
                  <tr key={p.id} className={isEditing ? "bg-blue-50/40" : "hover:bg-slate-50/50 transition-colors"}>
                    {isEditing ? (
                      /* INLINE EDIT MODE */
                      <>
                        <td className="p-4 space-y-2">
                          <input 
                            type="text" 
                            className="w-full p-2.5 rounded-xl border border-blue-300 bg-white font-bold text-xs text-black uppercase"
                            value={editForm.project_name} 
                            placeholder="Project Name"
                            onChange={(e) => setEditForm({...editForm, project_name: e.target.value})}
                          />
                          <input 
                            type="text" 
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-black uppercase"
                            value={editForm.team_name} 
                            placeholder="Name / Team Name"
                            onChange={(e) => setEditForm({...editForm, team_name: e.target.value})}
                          />
                          <input 
                            type="text" 
                            className="w-full p-2.5 rounded-xl border border-blue-300 bg-blue-50/50 text-[11px] font-extrabold text-blue-700 uppercase"
                            value={editForm.supervisor_name} 
                            placeholder="Supervisor Name (SV)"
                            onChange={(e) => setEditForm({...editForm, supervisor_name: e.target.value})}
                          />
                        </td>
                        <td className="p-4 space-y-2">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              className="w-20 p-2 rounded-xl border border-blue-300 bg-white text-xs font-bold text-black uppercase"
                              value={editForm.booth_number} 
                              placeholder="Booth"
                              onChange={(e) => setEditForm({...editForm, booth_number: e.target.value})}
                            />
                            <input 
                              type="text" 
                              className="w-24 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-black uppercase"
                              value={editForm.program} 
                              placeholder="Program"
                              onChange={(e) => setEditForm({...editForm, program: e.target.value})}
                            />
                          </div>
                          <input 
                            type="text" 
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-black uppercase"
                            value={editForm.project_sdg} 
                            placeholder="Project SDG"
                            onChange={(e) => setEditForm({...editForm, project_sdg: e.target.value})}
                          />
                        </td>
                        <td className="p-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => saveInlineEdit(p.id)} 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-3 py-2 rounded-xl shadow transition-all cursor-pointer"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingId(null)} 
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-[10px] uppercase px-3 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      /* DISPLAY MODE */
                      <>
                        <td className="p-6">
                          <p className="font-extrabold text-black uppercase text-sm">{p.project_name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{p.team_name || p.name}</p>
                          <p className="text-[11px] font-black text-blue-600 uppercase mt-1">
                            SV: <span className="text-slate-800">{supervisorName}</span>
                          </p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[9px] font-black uppercase">
                              [{p.booth_number}]
                            </span>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black uppercase">
                              {programName}
                            </span>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[9px] font-black uppercase">
                              SDG: {projectSDG}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <button onClick={() => startInlineEdit(p)} className="text-blue-600 font-black text-[10px] uppercase mr-4 hover:underline cursor-pointer">Edit</button>
                          <button onClick={() => deleteParticipant(p.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline cursor-pointer">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {participants.length === 0 && !loading && (
            <div className="p-16 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
              No participants registered yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}