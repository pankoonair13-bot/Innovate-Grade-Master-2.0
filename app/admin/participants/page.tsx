"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [judgesList, setJudgesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState({
    project_name: '',
    booth_number: '',
    team_name: '',
    program: '',
    project_theme: '',
    supervisor_name: ''
  });

  // Judge Assignment Modal State
  const [activeBoothForJudge, setActiveBoothForJudge] = useState<string | null>(null);
  const [selectedJudge, setSelectedJudge] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // 1. Fetch Participants
    const { data: pData } = await supabase
      .from('participants')
      .select('*')
      .order('booth_number', { ascending: true });

    // 2. Fetch Judge Assignments
    const { data: aData } = await supabase
      .from('judge_assignments')
      .select('*');

    // 3. Fetch Registered Judges
    const { data: jData } = await supabase
      .from('profiles')
      .select('*');

    if (pData) setParticipants(pData);
    if (aData) setAssignments(aData);
    if (jData) setJudgesList(jData);

    setLoading(false);
  }

  // Assign Selected Judge to Booth
  const assignJudge = async (boothNumber: string) => {
    if (!selectedJudge) return;

    // Only payload columns that exist in judge_assignments (judge_name, booth_number)
    const payload = {
      judge_name: selectedJudge,
      booth_number: boothNumber
    };

    const { error } = await supabase.from('judge_assignments').insert([payload]);

    if (error) {
      alert("❌ Error assigning judge: " + error.message);
    } else {
      setSelectedJudge('');
      fetchData();
    }
  };

  // Remove Judge from Booth
  const removeJudgeAssignment = async (id: number) => {
    await supabase.from('judge_assignments').delete().eq('id', id);
    fetchData();
  };

  // Start Inline Editing for a Row
  const startInlineEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({
      project_name: p.project_name || '',
      booth_number: p.booth_number || '',
      team_name: p.team_name || '',
      program: p.program || '',
      project_theme: p.project_theme || p.theme || '',
      supervisor_name: p.supervisor_name || p.supervisor || ''
    });
  };

  // Save Inline Edit
  const saveInlineEdit = async (id: string | number) => {
    const payload = {
      project_name: editForm.project_name.trim(),
      booth_number: editForm.booth_number.trim(),
      team_name: editForm.team_name.trim(),
      program: editForm.program.trim(),
      project_theme: editForm.project_theme.trim(),
      theme: editForm.project_theme.trim(),
      supervisor_name: editForm.supervisor_name.trim(),
      supervisor: editForm.supervisor_name.trim()
    };

    const { error } = await supabase
      .from('participants')
      .update(payload)
      .eq('id', id);

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
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">
              Manage <span className="text-blue-600">Participants & Judges</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase mt-1">
              Assign judges to specific booths and edit details inline.
            </p>
          </div>
        </div>

        {/* PARTICIPANTS TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Project / Team</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Booth / Prog / Theme</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">Assigned Judges</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map((p) => {
                const isEditing = editingId === p.id;
                const projectTheme = p.project_theme || p.theme || 'N/A';
                
                const boothJudges = assignments.filter(
                  (a) => a.booth_number === p.booth_number
                );

                return (
                  <tr key={p.id} className={isEditing ? "bg-blue-50/40" : "hover:bg-slate-50/50 transition-colors"}>
                    {isEditing ? (
                      /* INLINE EDIT MODE */
                      <>
                        <td className="p-4 space-y-2">
                          <input 
                            type="text" 
                            className="w-full p-2.5 rounded-xl border border-blue-300 bg-white font-bold text-xs uppercase"
                            value={editForm.project_name} 
                            placeholder="Project Name"
                            onChange={(e) => setEditForm({...editForm, project_name: e.target.value})}
                          />
                          <input 
                            type="text" 
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-500 uppercase"
                            value={editForm.team_name} 
                            placeholder="Name / Team Name"
                            onChange={(e) => setEditForm({...editForm, team_name: e.target.value})}
                          />
                        </td>
                        <td className="p-4 space-y-2">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              className="w-20 p-2 rounded-xl border border-blue-300 bg-white text-xs font-bold uppercase"
                              value={editForm.booth_number} 
                              placeholder="Booth"
                              onChange={(e) => setEditForm({...editForm, booth_number: e.target.value})}
                            />
                            <input 
                              type="text" 
                              className="w-24 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase"
                              value={editForm.program} 
                              placeholder="Program"
                              onChange={(e) => setEditForm({...editForm, program: e.target.value})}
                            />
                          </div>
                          <input 
                            type="text" 
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase"
                            value={editForm.project_theme} 
                            placeholder="Project Theme"
                            onChange={(e) => setEditForm({...editForm, project_theme: e.target.value})}
                          />
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-400 italic">
                          Editing details...
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
                          <p className="font-bold text-slate-800 uppercase text-sm">{p.project_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{p.team_name}</p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">{p.booth_number}</span>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">{p.program || 'N/A'}</span>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase">{projectTheme}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {boothJudges.map((j) => (
                              <span key={j.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase">
                                ⚖️ {j.judge_name}
                                <button 
                                  onClick={() => removeJudgeAssignment(j.id)}
                                  className="text-amber-400 hover:text-red-600 ml-1 font-bold cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))}

                            <button 
                              onClick={() => {
                                setActiveBoothForJudge(p.booth_number);
                                setSelectedJudge('');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer"
                            >
                              + Assign Judge
                            </button>
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

      {/* ASSIGN JUDGE DROPDOWN MODAL */}
      {activeBoothForJudge && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="text-sm font-black uppercase text-slate-800 mb-1">
              Assign Judge to Booth <span className="text-blue-600">{activeBoothForJudge}</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase mb-4">
              Select a judge from the list to grant scoring permission.
            </p>

            <select
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-blue-500 mb-4 cursor-pointer text-slate-800"
              value={selectedJudge}
              onChange={(e) => setSelectedJudge(e.target.value)}
            >
              <option value="">-- Choose a Judge --</option>
              {judgesList.length > 0 ? (
                judgesList.map((j) => {
                  const name = j.full_name || j.name || j.email || `Judge ${j.id}`;
                  return (
                    <option key={j.id} value={name}>
                      {name}
                    </option>
                  );
                })
              ) : (
                <>
                  <option value="DEROSHAN">DEROSHAN</option>
                  <option value="JUDGE 1">JUDGE 1</option>
                  <option value="JUDGE 2">JUDGE 2</option>
                  <option value="JUDGE 3">JUDGE 3</option>
                  <option value="DR. LEE">DR. LEE</option>
                  <option value="PROF. AHMAD">PROF. AHMAD</option>
                </>
              )}
            </select>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  assignJudge(activeBoothForJudge);
                  setActiveBoothForJudge(null);
                }}
                disabled={!selectedJudge}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase rounded-xl shadow cursor-pointer transition-all"
              >
                Assign
              </button>
              <button 
                onClick={() => setActiveBoothForJudge(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}