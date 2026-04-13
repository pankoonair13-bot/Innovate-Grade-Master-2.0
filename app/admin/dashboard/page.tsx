"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
        const { error } = await supabase.from('scores').delete().neq('id', 0);
        if (error) throw error;
      } else {
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
              Admin <span className="text-blue-600">Control</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Innovate Grade Master 2.0 Management</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 w-fit">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Live</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card: Manage Participants */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col group hover:border-blue-200 transition-all">
            <span className="text-3xl mb-4">👥</span>
            <h2 className="text-xl font-bold text-slate-800">Participants</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Register new teams or edit existing booth information.</p>
            <div className="mt-auto flex flex-col gap-2">
              <Link href="/admin/participants/create" className="w-full py-3 bg-blue-600 text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors">
                + Add New Team
              </Link>
              <Link href="/admin/participants" className="w-full py-3 bg-slate-50 text-slate-600 text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors">
                View List
              </Link>
            </div>
          </div>

          {/* Card: Manage Judges */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col group hover:border-purple-200 transition-all">
            <span className="text-3xl mb-4">⚖️</span>
            <h2 className="text-xl font-bold text-slate-800">Judge Access</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Assign evaluation roles to specific email accounts.</p>
            <div className="mt-auto flex flex-col gap-2">
              <Link href="/admin/judges/create" className="w-full py-3 bg-purple-600 text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-purple-700 transition-colors">
                + Assign Judge
              </Link>
              <Link href="/admin/judges" className="w-full py-3 bg-slate-50 text-slate-600 text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors">
                View All Judges
              </Link>
            </div>
          </div>

          {/* Card: Leaderboard & Criteria */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col group hover:border-emerald-200 transition-all">
            <span className="text-3xl mb-4">🏆</span>
            <h2 className="text-xl font-bold text-slate-800">Scoring & Rules</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Manage judging criteria and view live competition results.</p>
            <div className="mt-auto flex flex-col gap-2">
              <Link href="/leaderboard" className="w-full py-3 bg-emerald-600 text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors">
                Live Standings
              </Link>
              <Link href="/admin/criteria" className="w-full py-3 bg-slate-50 text-slate-600 text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors">
                Edit Criteria
              </Link>
            </div>
          </div>

          {/* DANGER ZONE SECTION */}
          <div className="md:col-span-2 lg:col-span-3 mt-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-4">Maintenance Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Reset Scores */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-800">Clear Scores</h4>
                  <p className="text-xs text-slate-500">Keep teams, delete marks.</p>
                </div>
                <button 
                  onClick={() => runAction('scores')}
                  disabled={loading}
                  className="px-6 py-3 bg-orange-100 text-orange-600 rounded-xl font-black text-[10px] uppercase hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {loading && status.includes('Standings') ? "Busy..." : "Reset"}
                </button>
              </div>

              {/* Full Reset */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-red-600">Factory Reset</h4>
                  <p className="text-xs text-slate-500">Delete all data.</p>
                </div>
                <button 
                  onClick={() => runAction('all')}
                  disabled={loading}
                  className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {loading && status.includes('Database') ? "Busy..." : "Wipe"}
                </button>
              </div>
            </div>
          </div>

        </div>

        <footer className="mt-16 text-center pb-10">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
            Developed by Pankoo Nair • Grade Master 2.0
          </p>
        </footer>
      </div>
    </div>
  );
}