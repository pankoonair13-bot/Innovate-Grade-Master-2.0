"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminAudit() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [totalJudges, setTotalJudges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBooth, setSelectedBooth] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);

    try {
      // 1. Fetch Judges map (id -> judge object)
      // Try fetching from 'profiles' first; fall back to 'judges' table if empty
      let { data: judgesData } = await supabase
        .from('profiles')
        .select('id, name, username');

      if (!judgesData || judgesData.length === 0) {
        const { data: fallbackJudges } = await supabase
          .from('judges')
          .select('id, name, username');
        judgesData = fallbackJudges || [];
      }

      // Build a fast lookup object: { "judge_id_uuid": { name: "...", username: "..." } }
      const judgeMap: Record<string, any> = {};
      judgesData.forEach((j) => {
        judgeMap[j.id] = j;
      });

      setTotalJudges(judgesData.length > 0 ? judgesData.length : 10);

      // 2. Fetch Participants and basic scores (no complex join needed)
      const { data: pData, error: pError } = await supabase
        .from('participants')
        .select(`
          id, 
          booth_number, 
          project_name, 
          scores (
            judge_id, 
            score, 
            created_at
          )
        `)
        .order('booth_number', { ascending: true });

      if (pError) {
        console.error("Participant fetch error:", pError);
      } else if (pData) {
        // Manually attach judge details using the lookup map
        const formattedParticipants = pData.map((p: any) => ({
          ...p,
          scores: (p.scores || []).map((s: any) => ({
            ...s,
            judge_info: judgeMap[s.judge_id] || null,
          })),
        }));

        setParticipants(formattedParticipants);
      }
    } catch (err) {
      console.error("Unexpected error loading audit data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate Summary Metrics
  const getSubmissionStats = () => {
    const totalProjects = participants.length;
    const fullyMarked = participants.filter(
      (p) => (p.scores?.length || 0) >= totalJudges && totalJudges > 0
    ).length;
    const totalSubmissions = participants.reduce((acc, p) => acc + (p.scores?.length || 0), 0);

    return { fullyMarked, totalProjects, totalSubmissions };
  };

  const { fullyMarked, totalProjects, totalSubmissions } = getSubmissionStats();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation & Control Header */}
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
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
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> 
            {loading ? "Refreshing Data..." : "Sync Data"}
          </button>
        </div>

        {/* 1. Completion KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2rem] shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Total Active Judges</p>
            <p className="text-4xl font-black">{totalJudges}</p>
          </div>
          <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-[2rem] shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Fully Evaluated</p>
            <p className="text-4xl font-black text-emerald-400">{fullyMarked} <span className="text-xl text-slate-500 font-medium">/ {totalProjects}</span></p>
          </div>
          <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-[2rem] shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">Total Recorded Scores</p>
            <p className="text-4xl font-black text-purple-300">{totalSubmissions}</p>
          </div>
        </div>

        {/* 2. Booth Status Grid / List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2 mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Booth Readiness Status</h2>
            <span className="text-[10px] font-semibold text-slate-500">Click row for score details</span>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 bg-slate-800/30 border border-white/5 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : participants.length === 0 ? (
            <div className="p-12 text-center bg-slate-800/20 border border-white/5 rounded-3xl text-slate-500 text-sm">
              No participants or booth entries found.
            </div>
          ) : (
            participants.map((p) => {
              const scores = p.scores || [];
              const count = scores.length;
              const isReady = count >= totalJudges && totalJudges > 0;
              const missing = totalJudges - count;

              return (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedBooth(p)}
                  className={`group flex flex-col md:flex-row items-center justify-between p-5 rounded-3xl border transition-all duration-300 cursor-pointer ${
                    isReady 
                      ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' 
                      : 'bg-slate-800/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-transform group-hover:scale-105 ${
                      isReady ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {p.booth_number}
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-sm md:text-base uppercase tracking-tight leading-tight text-white group-hover:text-blue-400 transition-colors">
                        {p.project_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex -space-x-1">
                          {[...Array(totalJudges)].map((_, i) => {
                            const judge = scores[i]?.judge_info;
                            const judgeLabel = judge?.name || judge?.username || scores[i]?.judge_id;

                            return (
                              <div 
                                key={i} 
                                title={i < count ? `Judge: ${judgeLabel}` : 'Pending Evaluation'}
                                className={`w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] transition-all ${
                                  i < count ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-700/60'
                                }`} 
                              />
                            );
                          })}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {count} of {totalJudges} Judges Completed
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col items-center md:items-end gap-2 shrink-0">
                    {isReady ? (
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                        ✅ READY FOR RESULT
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest">
                        ⏳ PENDING {missing > 0 ? missing : 0} MORE
                      </span>
                    )}
                    
                    <div className="flex flex-wrap gap-1 max-w-[240px] justify-center md:justify-end">
                      {scores.map((s: any, idx: number) => {
                        const numScore = Number(s.score) || 0;
                        return (
                          <div 
                            key={idx} 
                            className="bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-blue-300"
                          >
                            {numScore.toFixed(0)}%
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 3. Detailed Inspection Modal */}
        {selectedBooth && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    Booth {selectedBooth.booth_number}
                  </span>
                  <h3 className="text-xl font-black uppercase text-white mt-1">
                    {selectedBooth.project_name}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedBooth(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Evaluations Received:
                </h4>
                {selectedBooth.scores?.length === 0 ? (
                  <p className="text-sm text-slate-500 italic py-4 text-center">
                    No scores submitted yet for this booth.
                  </p>
                ) : (
                  selectedBooth.scores?.map((s: any, idx: number) => {
                    const judge = s.judge_info;
                    const judgeDisplayName = judge?.name || judge?.username || s.judge_id;

                    return (
                      <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            Judge: <span className="font-semibold text-blue-400">{judgeDisplayName}</span>
                          </p>
                          {s.created_at && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <div className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-xl text-sm font-mono font-bold">
                          {(Number(s.score) || 0).toFixed(1)}%
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button 
                onClick={() => setSelectedBooth(null)}
                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl transition-colors cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}