"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageCriteria() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCriteria();
  }, []);

  async function fetchCriteria() {
    const { data } = await supabase.from('criteria').select('*').order('display_order');
    if (data) setList(data);
    setLoading(false);
  }

  async function updateItem(id: number, field: string, value: any) {
    const { error } = await supabase.from('criteria').update({ [field]: value }).eq('id', id);
    if (!error) fetchCriteria();
  }

  if (loading) return <div className="p-10 text-center">Loading Management Tools...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-2 text-slate-800">Setup Criteria</h1>
        <p className="text-slate-500 mb-8">Edit weights and labels for the official rubric.</p>

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Section</th>
                <th className="p-4">Criteria Label</th>
                <th className="p-4">Weight (Pemberat)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-blue-600">Section {item.section}</td>
                  <td className="p-4">
                    <input 
                      className="w-full p-2 border rounded bg-transparent focus:bg-white"
                      value={item.label} 
                      onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                    />
                  </td>
                  <td className="p-4 w-32">
                    <input 
                      type="number" 
                      step="0.25"
                      className="w-full p-2 border rounded font-mono text-center"
                      value={item.weight} 
                      onChange={(e) => updateItem(item.id, 'weight', parseFloat(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-center text-slate-400 font-medium italic">
          Changes are saved automatically to the database.
        </p>
      </div>
    </div>
  );
}