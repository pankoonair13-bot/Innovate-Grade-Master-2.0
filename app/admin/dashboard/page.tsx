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

  // Dashboard Overview & Assignment States
  const [participants, setParticipants] = useState<any[]>([]);
  const [judgesList, setJudgesList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  // Multi-Booth Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState('');
  const [selectedBooths, setSelectedBooths] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Load user role, settings, and dashboard metrics
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
      fetchDashboardData();
    }

    initDashboard();
  }, []);

  // Fetch Participants, Judges, and Assignments
  async function fetchDashboardData() {
    const { data: pData } = await supabase
      .from('participants')
      .select('*')
      .order('booth_number', { ascending: true });

    const { data: jData } = await supabase
      .from('profiles')
      .select('*');

    const { data: aData } = await supabase
      .from('judge_assignments')
      .select('*');

    if (pData) setParticipants(pData);
    if (jData) setJudgesList(jData);
    if (aData) setAssignments(aData);
  }

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

  // Toggle Booth Selection for Multi-Assignment Modal
  const toggleBoothSelection = (boothNumber: string) => {
    if (selectedBooths.includes(boothNumber)) {
      setSelectedBooths(selectedBooths.filter((b) => b !== boothNumber));
    } else {
      setSelectedBooths([...selectedBooths, boothNumber]);
    }
  };

  // Select / Deselect All Booths
  const toggleSelectAllBooths = () => {
    if (selectedBooths.length === participants.length) {
      setSelectedBooths([]);
    } else {
      const allBooths = participants
        .map((p) => p.booth_number)
        .filter(Boolean);
      setSelectedBooths(allBooths);
    }
  };

  // Save Bulk Assignments to Supabase
  const handleBulkAssign = async () => {
    if (!selectedJudge) {
      alert("Please select a judge first.");
      return;
    }
    if (selectedBooths.length === 0) {
      alert("Please select at least one booth.");
      return;
    }

    setAssigning(true);

    const payload = selectedBooths.map((boothNumber) => ({
      judge_name: selectedJudge,
      booth_number: boothNumber,
    }));

    const { error } = await supabase.from('judge_assignments').insert(payload);

    if (error) {
      alert("❌ Error assigning judge: " + error.message);
    } else {
      alert(`✅ Successfully assigned ${selectedJudge} to ${selectedBooths.length} booth(s)!`);
      setSelectedJudge('');
      setSelectedBooths([]);
      setIsAssignModalOpen(false);
      fetchDashboardData();
    }

    setAssigning(false);
  };

  // Remove Judge Assignment
  const removeAssignment = async (id: number) => {
    const { error } = await supabase.from('judge_assignments').delete().eq('id', id);
    if (error) alert("Error removing assignment: " + error.message);
    else fetchDashboardData();
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
      const { data: standings, error: fetchErr } = await supabase
        .from('participants')
        .select(`*, scores(score)`);

      if (fetchErr) throw fetchErr;

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

      if (archiveRows.length > 0) {
        const { error: archiveErr } = await supabase.from('archives').insert(archiveRows);
        if (archiveErr) throw archiveErr;
      }

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
        const { error: scoresError } = await supabase
          .from('scores')
          .delete()
          .not('id', 'is', null);

        if (scoresError) throw scoresError;

        const { error: assignError } = await supabase
          .from('judge_assignments')
          .delete()
          .not('id', 'is', null);

        if (assignError) throw assignError;

        const { error: partError } = await supabase
          .from('participants')
          .delete()
          .not('id', 'is', null);

        if (partError) throw partError;

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
        
        {/* HEADER WITH LOGO & QUICK ACTIONS */}
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

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>⚖️</span> Assign Judge to Multiple Booths
            </button>
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest" suppressHydrationWarning>
                Role: <span className="text-indigo-600 capitalize">{hasMounted ? (role || 'User') : '...'}</span>
              </span>
            </div>
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

        {/* CURRENT ASSIGNMENTS TABLE OVERVIEW */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 uppercase italic">
              Current Booth <span className="text-indigo-600">Assignments</span>
            </h2>
            <button
              onClick={fetchDashboardData}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase cursor-pointer"
            >
              🔄 Refresh Table
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <th className="p-4">Booth</th>
                  <th className="p-4">Project Name</th>
                  <th className="p-4">Assigned Judges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 font-bold uppercase">
                      No registered participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => {
                    const boothJudges = assignments.filter(
                      (a) => a.booth_number === p.booth_number
                    );

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-black text-indigo-600">
                          [{p.booth_number || "N/A"}]
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {p.project_name || "N/A"}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {boothJudges.length > 0 ? (
                              boothJudges.map((j) => (
                                <span
                                  key={j.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-black uppercase"
                                >
                                  ⚖️ {j.judge_name}
                                  <button
                                    onClick={() => removeAssignment(j.id)}
                                    className="text-amber-500 hover:text-red-600 font-black ml-1 cursor-pointer"
                                    title="Unassign judge"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AUDIT & DIRECTORY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
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

      {/* MULTI-BOOTH ASSIGN JUDGE MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            
            <div className="mb-4">
              <h3 className="text-base font-black uppercase italic text-slate-900">
                Assign Judge to <span className="text-indigo-600">Multiple Booths</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">
                Select a judge and tick all booth numbers you wish to assign.
              </p>
            </div>

            {/* Step 1: Select Judge */}
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                1. Select Judge
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase text-slate-800 outline-none focus:border-indigo-600 cursor-pointer"
                value={selectedJudge}
                onChange={(e) => setSelectedJudge(e.target.value)}
              >
                <option value="">-- Select Registered Judge --</option>
                {judgesList.length > 0 ? (
                  judgesList.map((j) => {
                    const name = j.full_name || j.name || j.email || `Judge ${j.id}`;
                    return (
                      <option key={j.id} value={name}>
                        {name}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="DEROSHAN">DEROSHAN</option>
                    <option value="JUDGE 1">JUDGE 1</option>
                    <option value="JUDGE 2">JUDGE 2</option>
                  </>
                )}
              </select>
            </div>

            {/* Step 2: Select Booths */}
            <div className="flex-1 overflow-hidden flex flex-col mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase text-slate-400">
                  2. Select Booth Numbers ({selectedBooths.length} Selected)
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAllBooths}
                  className="text-[10px] font-black uppercase text-indigo-600 hover:underline cursor-pointer"
                >
                  {selectedBooths.length === participants.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="overflow-y-auto border border-slate-200/80 rounded-2xl p-3 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60">
                {participants.map((p) => {
                  const booth = p.booth_number;
                  if (!booth) return null;
                  const isChecked = selectedBooths.includes(booth);

                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-black uppercase cursor-pointer transition-all ${
                        isChecked
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isChecked}
                        onChange={() => toggleBoothSelection(booth)}
                      />
                      <span>[{booth}]</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkAssign}
                disabled={assigning || !selectedJudge || selectedBooths.length === 0}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase rounded-xl shadow-md transition-all cursor-pointer"
              >
                {assigning ? "Assigning..." : `Assign (${selectedBooths.length} Booths)`}
              </button>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs uppercase rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}