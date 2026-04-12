"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ManageParticipants() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    const { data } = await supabase.from('participants').select('*').order('booth_number');
    if (data) setList(data);
    setLoading(false);
  }

  async function deleteParticipant(id: number) {
    if (!confirm("Are you sure you want to delete this participant?")) return;
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (!error) fetchParticipants();
  }

  if (loading) return <div className="p-10 text-center font-bold">Loading List...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin" className="text-blue-500 text-sm">← Dashboard</Link>
            <h1 className="text-3xl font-black text-slate-800">Manage Participants</h1>
          </div>
          <Link href="/admin/participants" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm">+ Add New</Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Booth</th>
                <th className="p-4">Project Name</th>
                <th className="p-4">Team</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-blue-600">{p.booth_number}</td>
                  <td className="p-4 font-medium text-slate-700">{p.project_name}</td>
                  <td className="p-4 text-slate-500 text-sm">{p.team_name}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteParticipant(p.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <div className="p-10 text-center text-slate-400">No participants found.</div>}
        </div>
      </div>
    </div>
  );
}