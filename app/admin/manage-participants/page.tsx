"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ManageParticipants() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempSupervisor, setTempSupervisor] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    const { data } = await supabase.from('participants').select('*').order('booth_number');
    if (data) setList(data);
    setLoading(false);
  }

  // --- NEW: Inline Edit Logic ---
  async function saveSupervisor(id: number) {
    const { error } = await supabase
      .from('participants')
      .update({ supervisor_name: tempSupervisor })
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      setEditingId(null);
      fetchParticipants();
    }
  }

  async function deleteParticipant(id: number) {
    if (!confirm("Are you sure you want to delete this participant?")) return;
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (!error) fetchParticipants();
  }

  if (loading) return <div className="p-10 text-center font-bold">Loading List...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin/dashboard" className="text-blue-500 text-sm font-bold uppercase tracking-widest">← Dashboard</Link>
            <h1 className="text-3xl font-black text-slate-800 uppercase italic">Manage <span className="text-blue-600">Participants</span></h1>
          </div>
          <Link href="/admin/participants/create" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-105 transition-all">
            + Add New
          </Link>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-[0.2em]">
              <tr>
                <th className="p-5">Booth</th>
                <th className="p-5">Project Name</th>
                <th className="p-5">Team</th>
                <th className="p-5">Supervisor (SV)</th> {/* NEW COLUMN */}
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-5 font-black text-blue-600">{p.booth_number}</td>
                  <td className="p-5 font-bold text-slate-700">{p.project_name}</td>
                  <td className="p-5 text-slate-500 font-medium">{p.team_name}</td>
                  
                  {/* SUPERVISOR EDITABLE CELL */}
                  <td className="p-5">
                    {editingId === p.id ? (
                      <div className="flex gap-2">
                        <input 
                          className="bg-white border-2 border-blue-500 rounded-lg px-2 py-1 text-sm font-bold outline-none"
                          value={tempSupervisor}
                          onChange={(e) => setTempSupervisor(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => saveSupervisor(p.id)} className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 font-bold text-[10px] uppercase">X</button>
                      </div>
                    ) : (
                      <div 
                        className="group flex items-center gap-2 cursor-pointer hover:text-blue-600"
                        onClick={() => {
                          setEditingId(p.id);
                          setTempSupervisor(p.supervisor_name || '');
                        }}
                      >
                        <span className="text-sm font-bold text-slate-600 italic">
                          {p.supervisor_name || <span className="text-slate-300">No Supervisor</span>}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 text-[9px] bg-slate-100 px-2 py-1 rounded uppercase font-black">Edit</span>
                      </div>
                    )}
                  </td>

                  <td className="p-5 text-right space-x-4">
                    <button 
                      onClick={() => deleteParticipant(p.id)} 
                      className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No participants found.</div>}
        </div>
      </div>
    </div>
  );
}