"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    setLoading(true);
    // This query pulls the score, the project details, and the judge's ID
    const { data, error } = await supabase
      .from('scores')
      .select(`
        id,
        created_at,
        score,
        participants ( project_name, booth_number, theme ),
        judge_id
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="border-l-4 border-emerald-500 pl-6">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-emerald-500 uppercase">
              Submission Audit
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">
              EDIAs 2026 Tracking Portal
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchAuditLogs}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {loading ? "..." : "🔄 Refresh Logs"}
            </button>
          </div>
        </div>

        {/* The Tracking Table */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-white/5">
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Timestamp</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Judge (Short ID)</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Project Details</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Final Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <p className="text-xs font-bold text-slate-300">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                      <p className="text-[9px] text-slate-500 uppercase mt-1">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-6">
                      <span className="bg-slate-700/50 text-slate-400 text-[10px] font-mono px-3 py-1 rounded-lg border border-white/5">
                        {log.judge_id ? log.judge_id.substring(0, 8) : 'Unknown'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">
                          Booth {log.participants?.booth_number}
                        </span>
                        <span className="text-sm font-bold text-white uppercase leading-tight">
                          {log.participants?.project_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className={`inline-block px-4 py-2 rounded-xl border font-black text-lg ${
                        log.score >= 80 ? 'text-yellow-400 border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]' : 
                        log.score >= 60 ? 'text-blue-400 border-blue-500/30' : 
                        'text-slate-400 border-white/10'
                      }`}>
                        {log.score.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-slate-500 font-black uppercase tracking-widest opacity-30">
                      No judging entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Total Scores Filed</p>
            <p className="text-4xl font-black text-white">{logs.length}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl text-center">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">System Status</p>
            <p className="text-xl font-black text-white py-2 uppercase italic">Live Monitoring Active</p>
          </div>
        </div>

      </div>
    </div>
  );
}