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
  const [loading, setLoading] = useState(true);
  const [isEnforced, setIsEnforced] = useState(false);

  const loadData = async () => {
    setLoading(true);
    
    // 1. Get current logged-in user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    // 2. Fetch Assignment Enforcement Mode from system_settings
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'enforce_booth_assignment')
      .maybeSingle();

    const modeActive = setting?.value === 'true';
    setIsEnforced(modeActive);

    if (currentUser) {
      if (modeActive) {
        // --- ASSIGNMENT MODE: ON ---
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        const userId = currentUser.id.toLowerCase();
        const email = (currentUser.email || '').toLowerCase();
        const emailPrefix = email.split('@')[0].toLowerCase();
        const emailPrefixNoSpace = emailPrefix.replace(/\s+/g, '');
        
        const fullName = (profile?.full_name || profile?.name || profile?.username || '').toLowerCase();
        const fullNameNoSpace = fullName.replace(/\s+/g, '');

        const { data: assignments, error: aErr } = await supabase
          .from('judge_assignments')
          .select('*');

        if (aErr) console.error("Error fetching assignments:", aErr);

        let assignedBooths: string[] = [];

        if (assignments && assignments.length > 0) {
          assignedBooths = assignments
            .filter((a: any) => {
              const dbVal = String(a.judge_name || a.judge_id || '').toLowerCase().trim();
              const dbValNoSpace = dbVal.replace(/\s+/g, '');
              if (!dbVal) return false;

              return (
                dbVal === userId ||
                dbVal === email ||
                dbVal === emailPrefix ||
                dbValNoSpace === emailPrefixNoSpace ||
                (fullName && dbVal === fullName) ||
                (fullNameNoSpace && dbValNoSpace === fullNameNoSpace) ||
                dbValNoSpace.includes(emailPrefixNoSpace) ||
                emailPrefixNoSpace.includes(dbValNoSpace)
              );
            })
            .map((a: any) => a.booth_number);
        }

        if (assignedBooths.length > 0) {
          const { data: pData } = await supabase
            .from('participants')
            .select('*')
            .in('booth_number', assignedBooths)
            .order('booth_number');

          setParticipants(pData || []);
        } else {
          setParticipants([]);
        }
      } else {
        // --- ASSIGNMENT MODE: OFF ---
        const { data: allPData } = await supabase
          .from('participants')
          .select('*')
          .order('booth_number');
        
        setParticipants(allPData || []);
      }
    }

    // 3. Fetch scoring criteria
    const { data: cData } = await supabase
      .from('criteria')
      .select('*')
      .order('display_order');
    
    if (cData) {
      setCriteria(cData);
      const initial: any = {};
      cData.forEach(c => initial[c.id] = 0);
      setMarks(initial);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // 4. Realtime listener to sync when Admin changes mode switch
    const channel = supabase
      .channel('realtime_mode_toggle')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateTotal = () => {
    return criteria.reduce((acc, c) => acc + ((marks[c.id] || 0) * (c.weight || 1)), 0);
  };

  const handleSubmit = async () => {
    if (!selectedId) return alert("Please select a project first!");
    if (!user) return alert("Session expired. Please log in again.");

    setSubmitting(true);
    try {
      // 1. Check for duplicate score
      const { data: existingScore, error: checkError } = await supabase
        .from('scores')
        .select('id')
        .eq('participant_id', parseInt(selectedId))
        .eq('judge_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingScore) {
        alert("❌ You have already submitted marks for this participant!");
        setSubmitting(false);
        return;
      }

      // 2. Insert new score record
      const payload = {
        participant_id: parseInt(selectedId),
        judge_id: user.id,
        score: calculateTotal(),
        breakdown: marks
      };

      const { error: insertError } = await supabase
        .from('scores')
        .insert([payload]);

      if (insertError) throw insertError;

      alert("🎉 Score Submitted Successfully!");
      window.location.reload(); 
    } catch (err: any) {
      console.error("Detailed Submission Error Object:", err);
      const message = err?.message || err?.details || err?.hint || JSON.stringify(err);
      alert("Submission Failed: " + message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-[500px] font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-2 text-center md:text-left">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
              EDIAS 2026 <span className="text-blue-600">Scoring</span>
            </h1>
            {user && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Logged in as: <span className="text-blue-500">{user.email?.split('@')[0]}</span>
              </p>
            )}
          </div>
        </div>

        {/* Project Dropdown */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-2 border-blue-100 mb-6 md:mb-8">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
            {isEnforced 
              ? `Select Assigned Project (${participants.length} Available)` 
              : `Select Project (${participants.length} Available)`}
          </label>
          <select 
            className="w-full p-3 md:p-4 border rounded-xl bg-blue-50/50 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base cursor-pointer"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">
              {loading 
                ? "-- Loading Projects... --" 
                : participants.length > 0 
                ? "-- Choose Participant --" 
                : "-- No Projects Found --"}
            </option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>[{p.booth_number}] {p.project_name}</option>
            ))}
          </select>
        </div>

        {/* Sections */}
        {['A', 'B', 'C'].map(sec => (
          <div key={sec} className="mb-6 md:mb-8 bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="bg-slate-800 p-3 text-white text-[10px] font-black uppercase tracking-widest px-6 flex justify-between items-center">
              <span>Section {sec}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded italic">
                {sec === 'A' ? '80%' : sec === 'B' ? '15%' : '5%'}
              </span>
            </div>
            <div className="p-4 md:p-6 space-y-12">
              {criteria.filter(c => c.section === sec).map(item => (
                <div key={item.id} className="space-y-4 border-b border-slate-100 pb-8 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 shrink-0">
                      x{item.weight}
                    </span>
                  </div>
                  
                  {/* Score Buttons */}
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMarks({...marks, [item.id]: num})}
                        className={`h-11 md:h-12 rounded-xl text-xs font-black transition-all transform active:scale-95 ${
                          marks[item.id] === num 
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 z-10' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Rubric Descriptions */}
                  <div className="grid grid-cols-5 border border-slate-200 rounded-xl overflow-hidden text-slate-600 text-[10px] font-medium bg-slate-50/50 mt-2">
                    <div className="p-2 border-r border-slate-200 flex flex-col justify-between">
                      <span className="font-black text-slate-400 block mb-1">Mark 1 - 2</span>
                      <p className="leading-tight">{item.desc_1_2 || "N/A"}</p>
                    </div>
                    <div className="p-2 border-r border-slate-200 flex flex-col justify-between">
                      <span className="font-black text-slate-400 block mb-1">Mark 3 - 4</span>
                      <p className="leading-tight">{item.desc_3_4 || "N/A"}</p>
                    </div>
                    <div className="p-2 border-r border-slate-200 flex flex-col justify-between">
                      <span className="font-black text-slate-400 block mb-1">Mark 5 - 6</span>
                      <p className="leading-tight">{item.desc_5_6 || "N/A"}</p>
                    </div>
                    <div className="p-2 border-r border-slate-200 flex flex-col justify-between">
                      <span className="font-black text-slate-400 block mb-1">Mark 7 - 8</span>
                      <p className="leading-tight">{item.desc_7_8 || "N/A"}</p>
                    </div>
                    <div className="p-2 flex flex-col justify-between">
                      <span className="font-black text-slate-400 block mb-1">Mark 9 - 10</span>
                      <p className="leading-tight">{item.desc_9_10 || "N/A"}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
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
            className="bg-blue-600 text-white px-8 md:px-20 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 md:mr-4 cursor-pointer"
          >
            {submitting ? "..." : "SUBMIT SCORE"}
          </button>
        </div>

      </div>
    </div>
  );
}