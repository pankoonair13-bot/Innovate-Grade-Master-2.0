"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const runAction = async (type: 'scores' | 'all') => {
    const isConfirmed = confirm(
      type === 'scores' 
      ? "⚠️ RESET SCORES: This will clear the leaderboard but keep participants. Proceed?" 
      : "🚫 FACTORY RESET: This deletes EVERYTHING (Participants & Scores). Proceed?"
    );
    
    if (!isConfirmed) return;

    setStatus(type === 'scores' ? 'Resetting Standings...' : 'Wiping Database...');
    setLoading(true);

    try {
      if (type === 'scores') {
        // Clear scores only
        const { error } = await supabase.from('scores').delete().neq('id', 0);
        if (error) throw error;
      } else {
        // Must delete scores first to avoid foreign key errors
        await supabase.from('scores').delete().neq('id', 0);
        const { error } = await supabase.from('participants').delete().neq('id', 0);
        if (error) throw error;
      }
      alert("✅ Operation Successful");
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
              Admin <span className="text-blue-600">Dashboard</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Competition Management & Database Tools</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Action Card: Reset Scores */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col hover:border-orange-200 transition-colors">
            <div className="mb-6">
              <span className="inline-block p-3 bg-orange-50 rounded-2xl text-2xl mb-4">📊</span>
              <h2 className="text-xl font-bold text-slate-800">Reset Leaderboard</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Clears all submitted marks from judges. Use this to restart a session while keeping your participants list intact.
              </p>
            </div>
            <button 
              onClick={() => runAction('scores')}
              disabled={loading}
              className="mt-auto w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px]"
            >
              {loading && status.includes('Standings') ? status : "Clear Scores Now"}
            </button>
          </div>

          {/* Action Card: Full Reset */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col hover:border-red-200 transition-colors">
            <div className="mb-6">
              <span className="inline-block p-3 bg-red-50 rounded-2xl text-2xl mb-4">🧨</span>
              <h2 className="text-xl font-bold text-red-600">Full System Wipe</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Deletes all scores and all participants. Only use this when starting a brand new event from scratch.
              </p>
            </div>
            <button 
              onClick={() => runAction('all')}
              disabled={loading}
              className="mt-auto w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] shadow-lg shadow-red-100"
            >
              {loading && status.includes('Database') ? status : "Factory Reset"}
            </button>
          </div>

        </div>

        <footer className="mt-16 text-center border-t border-slate-200 pt-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">
            Innovate Grade Master 2.0 • Database Health: Optimal
          </p>
        </footer>
      </div>
    </div>
  );
}