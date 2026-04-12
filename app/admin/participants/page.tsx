"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageParticipants() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchParticipants(); }, []);

  async function fetchParticipants() {
    setLoading(true);
    const { data } = await supabase.from('participants').select('*').order('booth_number', { ascending: true });
    if (data) setParticipants(data);
    setLoading(false);
  }

  const deleteParticipant = async (id: string, name: string) => {
    if (!confirm(`🚫 REMOVE TEAM: "${name}"?\nThis will also delete all scores associated with this team.`)) return;
    
    setLoading(true);
    // Delete scores first due to database link constraints
    await supabase.from('scores').delete().eq('participant_id', id);
    const { error } = await supabase.from('participants').delete().eq('id', id);
    
    if (error) alert(error.message);
    fetchParticipants();
  };

  const editParticipant = async (p: any) => {
    const newName = prompt("Edit Project Name:", p.project_name);
    const newBooth = prompt("Edit Booth Number:", p.booth_number);
    
    if (newName && newBooth) {
      const { error } = await supabase
        .from('participants')
        .update({ project_name: newName, booth_number: newBooth })
        .eq('id', p.id);

      if (error) alert(error.message);
      fetchParticipants();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-800 uppercase italic">Project Directory</h1>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
            {participants.length} Teams Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400">
                <th className="p-4 border-b">Booth</th>
                <th className="p-4 border-b">Project Details</th>
                <th className="p-4 border-b text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4">
                    <span className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100">
                      {p.booth_number}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 leading-tight">{p.project_name}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wide">{p.team_name}</p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => editParticipant(p)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        ✏️ <span className="text-[10px] font-black ml-1 uppercase">Edit</span>
                      </button>
                      <button 
                        onClick={() => deleteParticipant(p.id, p.project_name)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        title="Remove Team"
                      >
                        🗑️ <span className="text-[10px] font-black ml-1 uppercase">Delete</span>
                      </button>
                    </div>
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