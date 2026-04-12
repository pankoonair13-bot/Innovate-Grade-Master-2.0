"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ScoringPanel() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [marks, setMarks] = useState<{ [key: number]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Fetch data from your tables
      const { data: pData } = await supabase.from('participants').select('*').order('booth_number');
      const { data: cData } = await supabase.from('criteria').select('*').order('display_order');
      
      if (pData) setParticipants(pData);
      if (cData) {
        setCriteria(cData);
        // Initialize all marks to 0 for every criteria ID
        const initial: any = {};
        cData.forEach(c => initial[c.id] = 0);
        setMarks(initial);
      }
    }
    loadData();
  }, []);

  const calculateTotal = () => {
    return criteria.reduce((acc, c) => acc + ((marks[c.id] || 0) * c.weight), 0);
  };

  const handleSubmit = async () => {
    if (!selectedId) return alert("Please select a project first!");
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('scores').insert([{
        participant_id: parseInt(selectedId),
        score: calculateTotal(), // Matches 'score' column in database
        breakdown: marks        // Matches 'breakdown' column
      }]);

      if (error) throw error;

      alert("🎉 Score Submitted Successfully!");
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      alert("Submission Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tight">
          EDIAs 2025 <span className="text-blue-600">Scoring</span>
        </h1>

        {/* Project Selector */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-100 mb-8">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Select Project</label>
          <select 
            className="w-full p-4 border rounded-xl bg-blue-50/50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">-- Choose Participant --</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>[{p.booth_number}] {p.project_name}</option>
            ))}
          </select>
        </div>

        {/* Sections A, B, and C */}
        {['A', 'B', 'C'].map(sec => (
          <div key={sec} className="mb-8 bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="bg-slate-800 p-3 text-white text-xs font-bold uppercase tracking-widest px-6 flex justify-between">
              <span>Section {sec}</span>
              <span className="opacity-50">{sec === 'A' ? '80%' : sec === 'B' ? '15%' : '5%'}</span>
            </div>
            <div className="p-6 space-y-8">
              {criteria.filter(c => c.section === sec).map(item => (
                <div key={item.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500">x{item.weight}</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <button
                        key={num}
                        onClick={() => setMarks({...marks, [item.id]: num})}
                        className={`flex-1 h-12 rounded-lg text-xs font-black transition-all ${marks[item.id] === num ? 'bg-blue-600 text-white scale-105 shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom Total Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-6 px-10 flex justify-between items-center shadow-2xl z-50">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Total</p>
            <p className="text-4xl font-black text-blue-600">{calculateTotal().toFixed(2)}%</p>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT SCORE"}
          </button>
        </div>
      </div>
    </div>
  );
}