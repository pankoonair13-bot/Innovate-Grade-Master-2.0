"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ScoringPanel() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [marks, setMarks] = useState<{ [key: number]: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // 1. Get current Judge session
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // 2. Fetch projects and criteria
      const { data: pData } = await supabase.from('participants').select('*').order('booth_number');
      const { data: cData } = await supabase.from('criteria').select('*').order('display_order');
      
      if (pData) setParticipants(pData);
      if (cData) {
        setCriteria(cData);
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
    if (!user) return alert("Session expired. Please log in again.");

    setSubmitting(true);
    try {
      // 3. Check for existing submission by this judge for this participant
      const { data: existingScore } = await supabase
        .from('scores')
        .select('id')
        .eq('participant_id', parseInt(selectedId))
        .eq('judge_id', user.id)
        .single();

      if (existingScore) {
        alert("❌ You have already submitted marks for this participant!");
        setSubmitting(false);
        return;
      }

      // 4. Insert score with judge tracking
      const { error } = await supabase.from('scores').insert([{
        participant_id: parseInt(selectedId),
        judge_id: user.id, // Identify which judge filled the marks
        score: calculateTotal(),
        breakdown: marks
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-[500px] font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        {/* Header with Judge Info */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-2 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
              EDIAs 2026 <span className="text-blue-600">Scoring</span>
            </h1>
            {user && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Logged in as: <span className="text-blue-500">{user.email?.split('@')[0]}</span>
              </p>
            )}
          </div>
        </div>

        {/* Project Selector Card */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-2 border-blue-100 mb-6 md:mb-8">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Select Project</label>
          <select 
            className="w-full p-3 md:p-4 border rounded-xl bg-blue-50/50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base cursor-pointer"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">-- Choose Participant --</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>[{p.booth_number}] {p.project_name}</option>
            ))}
          </select>
        </div>

        {/* Scoring Sections */}
        {['A', 'B', 'C'].map(sec => (
          <div key={sec} className="mb-6 md:mb-8 bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="bg-slate-800 p-3 text-white text-[10px] font-black uppercase tracking-widest px-6 flex justify-between items-center">
              <span>Section {sec}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded italic">
                {sec === 'A' ? '80%' : sec === 'B' ? '15%' : '5%'}
              </span>
            </div>
            <div className="p-4 md:p-6 space-y-8">
              {criteria.filter(c => c.section === sec).map(item => (
                <div key={item.id} className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-bold text-slate-700 text-sm md:text-base leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 shrink-0">
                      x{item.weight}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-5 md:flex md:justify-between gap-2">
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMarks({...marks, [item.id]: num})}
                        className={`h-11 md:h-12 rounded-xl text-xs font-black transition-all transform active:scale-95 ${
                          marks[item.id] === num 
                            ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 z-10' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                        }`}
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

        {/* Fixed Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-3 md:p-5 flex flex-row justify-between items-center shadow-[0_-15px_50px_rgba(0,0,0,0.1)] z-[100]">
          <div className="flex flex-col items-start pl-2 md:pl-4">
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Total</p>
            <p className="text-2xl md:text-5xl font-black text-blue-600 leading-none">
              {calculateTotal().toFixed(2)}%
            </p>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white px-8 md:px-20 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 md:mr-4"
          >
            {submitting ? "..." : "SUBMIT SCORE"}
          </button>
        </div>

      </div>
    </div>
  );
}