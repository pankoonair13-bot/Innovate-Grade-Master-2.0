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
  const [batchName, setBatchName] = useState('');

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

  // Archive Current Competition & Clear Active Standings
  const handleArchiveCompetition = async () => {
    if (!batchName.trim()) {
      return alert("Please enter a name for this competition batch! (e.g. INNOVATION DAY 2026)");
    }

    const isConfirmed = confirm(
      `📦 ARCHIVE COMPETITION: Save current standings under "${batchName.trim().toUpperCase()}" and clear current active scores/participants for a fresh competition?`
    );

    if (!isConfirmed) return;

    setLoading(true);
    setStatus('Archiving Current Standings...');

    try {
      // 1. Fetch active participants & calculate final scores
      const { data: standings, error: fetchErr } = await supabase
        .from('participants')
        .select(`*, scores(score)`);

      if (fetchErr) throw fetchErr;

      // 2. Transform into archive schema
      const archiveRows = (standings || []).map((item) => {
        const scoresArr = item.scores || [];
        const avg =
          scoresArr.length > 0
            ? scoresArr.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0) / scoresArr.length
            : 0;

        let award = "CERTIFICATE";
        if (avg >= 80) award = "GOLD";
        else if (avg >= 70) award = "SILVER";
        else if (avg >= 50) award = "BRONZE";

        return {
          batch_name: batchName.trim().toUpperCase(),
          project_name: item.project_name || "N/A",
          team_name: item.team_name || item.name || "N/A",
          supervisor_name: item.supervisor_name || item.supervisor || "N/A",
          program: item.program || item.programme || "N/A",
          project_sdg: item.project_sdg || item.project_theme || "N/A",
          final_score: Number(avg.toFixed(2)),
          award: award,
        };
      });

      // 3. Save to Archives table
      if (archiveRows.length > 0) {
        const { error: archiveErr } = await supabase.from('archives').insert(archiveRows);
        if (archiveErr) throw archiveErr;
      }

      // 4. Safely clear active scores & participants
      const { error: clearScoresErr } = await supabase
        .from('scores')
        .delete()
        .not('id', 'is', null);

      if (clearScoresErr) throw clearScoresErr;

      const { error: clearPartErr } = await supabase
        .from('participants')
        .delete()
        .not('id', 'is', null);

      if (clearPartErr) throw clearPartErr;

      alert("✅ Competition successfully archived and live tables cleared!");
      setBatchName('');
      window.location.reload();
    } catch (err: any) {
      alert("❌ Error during archiving: " + err.message);
    } finally {
      setLoading(false);
      setStatus('');
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
    <div className="min-h-screen p-4 md:p-12 font-sans bg-[#f8fafc] text-slate-900 relative">
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        
        {/* HEADER WITH LOGO */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                Admin <span className="text-indigo-600">Control</span>
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Innovate Grade Master 2.0 Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 w-fit shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest" suppressHydrationWarning>
              Logged in as: <span className="text-indigo-600 capitalize">{hasMounted ? (role || 'User') : '...'}</span>
            </span>
          </div>
        </header>

        {/* BOOTH ASSIGNMENT TOGGLE CONTROL */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl text-2xl transition-all ${enforceAssignment ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
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
            className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
              enforceAssignment 
                ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95" 
                : "bg-slate-200 text-slate-700 hover:bg-slate-300 active:scale-95"
            }`}
          >
            {isButtonDisabled ? "Loading..." : `Assignment Mode: ${enforceAssignment ? "ON" : "OFF"}`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Executive Audit Banner */}
          <Link href="/admin/audit" className="lg:col-span-3">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-8 shadow-md border border-slate-800/80 flex flex-col md:flex-row items-center justify-between group hover:border-slate-700 transition-all cursor-pointer">
              <div className="flex items-center gap-6">
                <span className="text-5xl">📊</span>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Judge Readiness Tracker</h2>
                  <p className="text-slate-300 text-sm font-medium mt-1">Check which booths are "Ready" and which are "Pending" marks.</p>
                </div>
              </div>
              <div className="mt-6 md:mt-0 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest border border-white/10 group-hover:scale-105 transition-transform">
                Open Audit Log →
              </div>
            </div>
          </Link>

          {/* Card: Manage Participants */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 flex flex-col group hover:border-indigo-300 transition-all">
            <span className="text-3xl mb-4">👥</span>
            <h2 className="text-xl font-bold text-slate-800">Participants</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Register new teams or edit existing booth information.</p>
            <div className="mt-auto flex flex-col gap-2">
              <Link href="/admin/participants/create" className="w-full py-3 bg-indigo-600 text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-sm">
                + Add New Team
              </Link>
              <Link href="/admin/participants" className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-700 text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors">
                View List
              </Link>
            </div>
          </div>

          {/* Card: Manage Judges */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 flex flex-col group hover:border-indigo-300 transition-all">
            <span className="text-3xl mb-4">⚖️</span>
            <h2 className="text-xl font-bold text-slate-800">Judge Access</h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">Assign evaluation roles to specific email accounts.</p>
            <div className="mt-auto flex flex-col gap-2">
              <Link href="/admin/judges/create" className="w-full py-3 bg-slate-900 text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm">
                + Assign Judge
              </Link>
              <Link href="/admin/judges" className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-700 text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors">
                View All Judges
              </Link>
            </div>
          </div>

          {/* Card: Leaderboard & Archives */}
          {hasMounted && isJudge ? (
            <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200/50 opacity-60 flex flex-col justify-between">
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
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/80 flex flex-col group hover:border-emerald-300 transition-all">
              <span className="text-3xl mb-4">🏆</span>
              <h2 className="text-xl font-bold text-slate-800">Standings & Archives</h2>
              <p className="text-sm text-slate-500 mt-2 mb-6">View live leaderboards or browse historical competition archives.</p>
              <div className="mt-auto flex flex-col gap-2">
                <Link href="/leaderboard" className="w-full py-3 bg-emerald-600 text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
                  Live Standings
                </Link>
                <Link href="/admin/past-results" className="w-full py-3 bg-amber-500 text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-amber-600 transition-colors shadow-sm">
                  Past Competition Archives
                </Link>
              </div>
            </div>
          )}

          {/* MAINTENANCE TOOLS */}
          <div className="md:col-span-2 lg:col-span-3 mt-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 ml-2 text-slate-400">
              Maintenance & Database Archiving
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Archive Competition Tool */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between gap-4 shadow-sm md:col-span-1">
                <div>
                  <h4 className="font-bold text-slate-800">📦 Archive Competition</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Save current standings into read-only archives before starting a new competition event.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Batch Tag (e.g. FIP 2026)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-600"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                  />
                  <button 
                    onClick={handleArchiveCompetition}
                    disabled={loading}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[10px] uppercase transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {loading && status.includes('Archiving') ? "Archiving..." : "Archive & Reset Active"}
                  </button>
                </div>
              </div>

              {/* Clear Scores Tool */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between gap-4 shadow-sm md:col-span-1">
                <div>
                  <h4 className="font-bold text-slate-800">🔄 Clear Live Scores</h4>
                  <p className="text-xs text-slate-500 mt-1">Keep teams and judges, but delete live leaderboard marks to re-evaluate.</p>
                </div>
                <button 
                  onClick={() => runAction('scores')}
                  disabled={loading}
                  className="w-full py-3 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-xl font-black text-[10px] uppercase hover:bg-amber-600 hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm mt-auto"
                >
                  {loading && status.includes('Standings') ? "Busy..." : "Reset Live Scores"}
                </button>
              </div>

              {/* Factory Reset Tool */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between gap-4 shadow-sm md:col-span-1">
                <div>
                  <h4 className="font-bold text-red-600">🚫 Factory Reset</h4>
                  <p className="text-xs text-slate-500 mt-1">Completely delete all current participants, judges, and active scores.</p>
                </div>
                <button 
                  onClick={() => runAction('all')}
                  disabled={loading}
                  className="w-full py-3 bg-red-50 text-red-600 border border-red-200/80 rounded-xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm mt-auto"
                >
                  {loading && status.includes('Database') ? "Busy..." : "Wipe All Active Data"}
                </button>
              </div>

            </div>
          </div>

        </div>

        <footer className="mt-16 text-center pb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">
            Developed by Pankoo Nair • Innovate Grade Master 2.0
          </p>
        </footer>
      </div>
    </div>
  );
}