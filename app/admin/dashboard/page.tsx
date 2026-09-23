"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [enforceAssignment, setEnforceAssignment] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Load user role and assignment mode settings
  useEffect(() => {
    setHasMounted(true);

    async function initDashboard() {
      // 1. Fetch User Role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        setRole(profile?.role || user.user_metadata?.role || 'judge');
      }

      // 2. Fetch Booth Assignment Mode Setting
      const { data: settingData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'enforce_booth_assignment')
        .maybeSingle();

      if (settingData) {
        setEnforceAssignment(settingData.value === 'true');
      }

      setToggleLoading(false);
    }

    initDashboard();
  }, []);

  const isJudge = role === 'judge';

  // Toggle Booth Assignment Mode ON / OFF
  const toggleAssignmentMode = async () => {
    const newValue = !enforceAssignment;
    setEnforceAssignment(newValue);

    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        key: 'enforce_booth_assignment', 
        value: String(newValue) 
      }, { onConflict: 'key' });

    if (error) {
      alert("Failed to update setting: " + error.message);
      setEnforceAssignment(!newValue);
    }
  };

  // Fixed Sequential Deletion Handler
  const runAction = async (type: 'scores' | 'all') => {
    const isConfirmed = confirm(
      type === 'scores' 
      ? "⚠️ RESET SCORES: This will clear all live leaderboard scores but keep participants and judges. Proceed?" 
      : "🚫 FACTORY RESET: This will completely delete ALL participants, judges, booth assignments, and scores. Proceed?"
    );
    
    if (!isConfirmed) return;

    setStatus(type === 'scores' ? 'Resetting Standings...' : 'Wiping Database...');
    setLoading(true);

    try {
      if (type === 'scores') {
        const { error: scoresError } = await supabase
          .from('scores')
          .delete()
          .not('id', 'is', null);

        if (scoresError) throw scoresError;
      } else {
        // Step 1: Clear all scores
        const { error: scoresError } = await supabase
          .from('scores')
          .delete()
          .not('id', 'is', null);

        if (scoresError) throw scoresError;

        // Step 2: Delete all booth assignments
        const { error: assignError } = await supabase
          .from('judge_assignments')
          .delete()
          .not('id', 'is', null);

        if (assignError) throw assignError;

        // Step 3: Delete all participants (Teams/Booths)
        const { error: partError } = await supabase
          .from('participants')
          .delete()
          .not('id', 'is', null);

        if (partError) throw partError;

        // Step 4: Delete all judge profiles
        const { error: judgeError } = await supabase
          .from('profiles')
          .delete()
          .eq('role', 'judge');

        if (judgeError) throw judgeError;
      }

      alert("✅ Operation Successful");
      window.location.reload();
    } catch (err: any) {
      alert("❌ Error executing reset: " + err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const isButtonDisabled = !hasMounted || toggleLoading;

  return (
    <div className="min-h-screen p-4 md:p-12 font-sans bg-slate-50 relative">
      <div className="relative z-10 max-w-6xl mx-auto">
        
        {/* HEADER WITH LOGO */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
              {!imgError ? (
                <Image 
                  src="/logo.png" 
                  alt="Innovate Grade Master Logo" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                  priority
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-2xl">🎓</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic text-slate-900">
                Admin <span className="text-blue-600">Control</span>
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Innovate Grade Master 2.0 Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 w-fit shadow-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest" suppressHydrationWarning>
              Logged in as: <span className="text-blue-600 capitalize">{hasMounted ? (role || 'User') : '...'}</span>
            </span>
          </div>
        </header>

        {/* BOOTH ASSIGNMENT TOGGLE CONTROL */}
        <div className="bg-white rounded-[2rem] p-6 mb-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl text-2xl ${enforceAssignment ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
              {enforceAssignment ? '🔒' : '🔓'}
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">
                Booth Assignment Mode
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {enforceAssignment 
                  ? "ON — Judges can ONLY see and score booths explicitly assigned to them." 
                  : "OFF — Open Mode: Judges can see and score EVERY booth."}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAssignmentMode}
            disabled={isButtonDisabled}
            suppressHydrationWarning
            className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
              enforceAssignment 
                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95" 
                : "bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95"
            }`}
          >
            {isButtonDisabled ? "Loading..." : `Assignment Mode: ${enforceAssignment ? "ON" : "OFF"}`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Monitoring & Audit */}
          <Link href="/admin/audit" className="lg:col-span-3">
            <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl border border-blue-400 flex flex-col md:flex-row items-center justify-between group hover:bg-blue-700 transition-all cursor-pointer">
              <div className="flex items-center gap-6">
                <span className="text-5xl">📊</span>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Judge Readiness Tracker</h2>
                  <p className="text-blue-100 text-sm font-medium mt-1">Check which booths are "Ready" and which are "Pending" marks.</p>
                </div>
              </div>
              <div className="mt-6 md:mt-0 bg-white/20 px-6 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-widest border border-white/10 group-hover:scale-105 transition-transform">
                Open Audit Log →
              </div>
            </div>
          </Link>

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
          {hasMounted && isJudge ? (
            <div className="bg-slate-100 rounded-[2.5rem] p-8 border border-slate-200/50 opacity-60 flex flex-col justify-between">
              <div>
                <div className="bg-slate-200 w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4">
                  🔒
                </div>
                <h2 className="text-xl font-bold text-slate-400 mb-2">Live Leaderboard</h2>
                <p className="text-slate-400 text-sm">
                  This setting is restricted to authorized Admins only.
                </p>
              </div>
            </div>
          ) : (
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
          )}

          {/* MAINTENANCE TOOLS */}
          <div className="md:col-span-2 lg:col-span-3 mt-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 ml-4 text-slate-400">
              Maintenance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Clear Scores Tool */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800">Clear Scores</h4>
                  <p className="text-xs text-slate-500">Keep teams and judges, delete live leaderboard marks.</p>
                </div>
                <button 
                  onClick={() => runAction('scores')}
                  disabled={loading}
                  className="px-6 py-3 bg-orange-100 text-orange-600 rounded-xl font-black text-[10px] uppercase hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading && status.includes('Standings') ? "Busy..." : "Reset"}
                </button>
              </div>

              {/* Factory Reset Tool */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="font-bold text-red-600">Factory Reset</h4>
                  <p className="text-xs text-slate-500">Delete all participants, judges, and scores.</p>
                </div>
                <button 
                  onClick={() => runAction('all')}
                  disabled={loading}
                  className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading && status.includes('Database') ? "Busy..." : "Wipe All"}
                </button>
              </div>

            </div>
          </div>

        </div>

        <footer className="mt-16 text-center pb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
            Developed by Pankoo Nair • Innovate Grade Master 2.0
          </p>
        </footer>
      </div>
    </div>
  );
}