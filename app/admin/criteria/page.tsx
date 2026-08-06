"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ManageCriteria() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchCriteria();
  }, []);

  async function fetchCriteria() {
    const { data } = await supabase.from('criteria').select('*').order('display_order');
    if (data) setList(data);
    setLoading(false);
  }

  // Updates the local state while typing
  const handleLocalChange = (id: number, field: string, value: any) => {
    setList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (saveSuccess) setSaveSuccess(false); // Reset success indicator if edits are made
  };

  // Bulk saves all items to Supabase
  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Upsert updates all rows present in the list state matching their primary key (`id`)
      const { error } = await supabase.from('criteria').upsert(list);
      
      if (error) {
        alert('Failed to save changes: ' + error.message);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000); // Hide success badge after 3 seconds
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Management Tools...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header & Save Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Setup Criteria</h1>
            <p className="text-slate-500 text-sm mt-1">Edit weights, labels, and reference rubric text for the official scoring panel.</p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold animate-fade-in">
                ✓ Saved successfully!
              </span>
            )}

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-800 text-white text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4 w-32">Section</th>
                <th className="p-4 w-48">Criteria Label</th>
                <th className="p-4 w-28">Weight</th>
                <th className="p-4 text-center bg-slate-700/30">1 - 2 Ref</th>
                <th className="p-4 text-center bg-slate-700/40">3 - 4 Ref</th>
                <th className="p-4 text-center bg-slate-700/50">5 - 6 Ref</th>
                <th className="p-4 text-center bg-slate-700/60">7 - 8 Ref</th>
                <th className="p-4 text-center bg-slate-700/70">9 - 10 Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-blue-600 whitespace-nowrap">Section {item.section}</td>
                  
                  {/* Label input */}
                  <td className="p-4">
                    <textarea 
                      rows={2}
                      className="w-full p-2 border rounded bg-transparent focus:bg-white resize-none text-xs font-semibold"
                      value={item.label || ''} 
                      onChange={(e) => handleLocalChange(item.id, 'label', e.target.value)}
                    />
                  </td>
                  
                  {/* Weight input */}
                  <td className="p-4">
                    <input 
                      type="number" 
                      step="0.25"
                      className="w-full p-2 border rounded font-mono text-center text-xs font-bold"
                      value={item.weight || 0} 
                      onChange={(e) => handleLocalChange(item.id, 'weight', parseFloat(e.target.value) || 0)}
                    />
                  </td>

                  {/* Rubric Descriptions */}
                  <td className="p-2 bg-slate-50/30">
                    <textarea
                      rows={3}
                      className="w-full p-1.5 border rounded text-[11px] bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[60px]"
                      placeholder="Desc 1-2..."
                      value={item.desc_1_2 || ''}
                      onChange={(e) => handleLocalChange(item.id, 'desc_1_2', e.target.value)}
                    />
                  </td>
                  <td className="p-2 bg-slate-50/50">
                    <textarea
                      rows={3}
                      className="w-full p-1.5 border rounded text-[11px] bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[60px]"
                      placeholder="Desc 3-4..."
                      value={item.desc_3_4 || ''}
                      onChange={(e) => handleLocalChange(item.id, 'desc_3_4', e.target.value)}
                    />
                  </td>
                  <td className="p-2 bg-slate-50/70">
                    <textarea
                      rows={3}
                      className="w-full p-1.5 border rounded text-[11px] bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[60px]"
                      placeholder="Desc 5-6..."
                      value={item.desc_5_6 || ''}
                      onChange={(e) => handleLocalChange(item.id, 'desc_5_6', e.target.value)}
                    />
                  </td>
                  <td className="p-2 bg-slate-50/90">
                    <textarea
                      rows={3}
                      className="w-full p-1.5 border rounded text-[11px] bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[60px]"
                      placeholder="Desc 7-8..."
                      value={item.desc_7_8 || ''}
                      onChange={(e) => handleLocalChange(item.id, 'desc_7_8', e.target.value)}
                    />
                  </td>
                  <td className="p-2 bg-slate-100/40">
                    <textarea
                      rows={3}
                      className="w-full p-1.5 border rounded text-[11px] bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[60px]"
                      placeholder="Desc 9-10..."
                      value={item.desc_9_10 || ''}
                      onChange={(e) => handleLocalChange(item.id, 'desc_9_10', e.target.value)}
                    />
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