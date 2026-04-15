"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJudges, setTotalJudges] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    
    // 1. Get total number of judges (assuming they are in your 'judges' table)
    const { count } = await supabase.from('judges').select('*', { count: 'exact', head: true });
    setTotalJudges(count || 0);

    // 2. Fetch logs
    await fetchAuditLogs();
    setLoading(false);
  }

  async function fetchAuditLogs() {
    const { data } = await supabase
      .from('scores')
      .select(`
        id,
        created_at,
        score,
        participants ( project_name, booth_number ),
        judge_id
      `)
      .order('created_at', { ascending: false });

    setLogs(data || []);
  }

  // Calculate how many participants have full marks
  const getSubmissionStats = () => {
    const projectMap: { [key: string]: number } = {};
    logs.forEach(log => {
      const name = log.participants?.project_name;
      projectMap[name] = (projectMap[name] || 0) + 1;
    });
    
    const completed = Object.values(projectMap).filter(count => count >= totalJudges).length;
    return { completed, totalProjects: Object.keys(projectMap).length };
  };

  const { completed, totalProjects } = getSubmissionStats();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Completion Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2rem]">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Total Judges</p>
            <p className="text-4xl font-black">{totalJudges}</p>
          </div>
          <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-[2rem]">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Projects Fully Marked</p>
            <p className="text-4xl font-black">{completed} / {totalProjects || 0}</p>
          </div>
          <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-[2rem]">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">Total Submissions</p>
            <p className="text-4xl font-black">{logs.length}</p>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-[2rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 border-b border-white/5">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Time</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Judge</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Project</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-all">
                  <td className="p-6 text-xs text-slate-400 font-bold">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="p-6">
                    <span className="bg-slate-700 px-3 py-1 rounded-lg font-mono text-[10px]">
                      {log.judge_id.substring(0, 8)}
                    </span>
                  </td>
                  <td className="p-6">
                    <p className="font-black uppercase text-sm">{log.participants?.project_name}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">BOOTH {log.participants?.booth_number}</p>
                  </td>
                  <td className="p-6 text-right">
                    <span className="text-xl font-black text-blue-400">{log.score.toFixed(2)}%</span>
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