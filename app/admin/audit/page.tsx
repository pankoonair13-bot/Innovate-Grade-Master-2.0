"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminAudit() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [totalJudges, setTotalJudges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    
    // 1. Fetch Total Judges
    // We try to count from the 'judges' table first
    const { count, error: judgeError } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true });

    // FIX: If count is 0 or table is missing, we manually set to 10 for the event
    if (!count || count === 0) {
      console.warn("No judges found in DB, defaulting to 10 for event logic.");
      setTotalJudges(10); 
    } else {
      setTotalJudges(count);
    }

    // 2. Fetch Participants and their scores using a join
    const { data: pData, error: pError } = await supabase
      .from('participants')
      .select(`
        id, 
        booth_number, 
        project_name, 
        scores ( judge_id, score, created_at )
      `)
      .order('booth_number', { ascending: true });

    if (pError) console.error("Participant fetch error:", pError);
    if (pData) setParticipants(pData);
    
    setLoading(false);
  }

  // Calculate Summary Stats
  const getSubmissionStats = () => {
    const totalProjects = participants.length;
    // Projects are fully marked if scores count matches our totalJudges
    const fullyMarked = participants.filter(p => (p.scores?.length || 0) >= totalJudges && totalJudges > 0).length;
    const totalSubmissions = participants.reduce((acc, p) => acc + (p.scores?.length || 0), 0);
    
    return { fullyMarked, totalProjects, totalSubmissions };
  };

  const { fullyMarked, totalProjects, totalSubmissions } = getSubmissionStats();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 flex justify-between items-end">
          <div className="border-l-4 border-blue-500 pl-6">
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
              Control <span className="text-blue-500">Center</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">
              EDIAs 2026 Admin Portal
            </p>
          </div>
          <button 
            onClick={fetchInitialData}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {loading ? "REFRESHING..." : "🔄 SYNC DATA"}
          </button>
        </div>

        {/* 1. Completion Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2rem] shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Total Judges</p>
            <p className="text-4xl font-black">{totalJudges}</p>
          </div>
          <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-[2rem] shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Fully Marked</p>
            <p className="text-4xl font-black text-emerald-400">{fullyMarked} / {totalProjects}</p>
          </div>
          <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-[2rem] shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">Total Submissions</p>
            <p className="text-4xl font-black">{totalSubmissions}</p>
          </div>
        </div>

        {/* 2. Ready vs Pending List */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 px-2">Booth Readiness Status</h2>
          
          {participants.map((p) => {
            const count = p.scores?.length || 0;
            const isReady = count >= totalJudges && totalJudges > 0;
            const missing = totalJudges - count;

            return (
              <div 
                key={p.id} 
                className={`group flex flex-col md:flex-row items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${
                  isReady 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-slate-800/40 border-white/5'
                }`}
              >
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${
                    isReady ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {p.booth_number}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-sm md:text-base uppercase tracking-tight leading-tight">
                      {p.project_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex -space-x-1.5">
                         {[...Array(totalJudges)].map((_, i) => (
                           <div key={i} className={`w-3 h-3 rounded-full border-2 border-[#0f172a] ${i < count ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700'}`} />
                         ))}
                      </div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                        {count} of {totalJudges} Judges Completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                  {isReady ? (
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-5 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                      ✅ READY FOR RESULT
                    </span>
                  ) : (
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-black px-5 py-2 rounded-xl uppercase tracking-widest">
                      ⏳ PENDING {missing > 0 ? missing : 0} MORE
                    </span>
                  )}
                  
                  <div className="flex gap-1">
                    {p.scores?.map((s: any, idx: number) => (
                      <div key={idx} className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-[8px] font-black text-blue-400">
                        {s.score.toFixed(0)}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}