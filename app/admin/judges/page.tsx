"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ManageJudges() {
  const [judges, setJudges] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [assignedMap, setAssignedMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    initData();
  }, []);

  async function initData() {
    setLoading(true);
    await Promise.all([fetchCompetitions(), fetchJudgesAndAssignments()]);
    setLoading(false);
  }

  async function fetchCompetitions() {
    const { data, error } = await supabase
      .from("competitions")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching competitions:", error.message);
    else setCompetitions(data || []);
  }

  async function fetchJudgesAndAssignments() {
    const { data: judgesData, error: judgesError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("role", "judge");

    if (judgesError) {
      console.error("Error fetching judges:", judgesError.message);
      alert("⚠️ Error loading judges: " + judgesError.message);
      return;
    }

    setJudges(judgesData || []);

    const { data: assignData, error: assignError } = await supabase
      .from("competition_judges")
      .select("judge_id, competition_id");

    if (assignError) {
      console.error("Error fetching assignments:", assignError.message);
    } else if (assignData) {
      const map: Record<string, string[]> = {};
      assignData.forEach((row) => {
        if (!map[row.judge_id]) map[row.judge_id] = [];
        map[row.judge_id].push(row.competition_id);
      });
      setAssignedMap(map);
    }
  }

  async function handleToggleCompetition(judgeId: string, competitionId: string) {
    const currentList = assignedMap[judgeId] || [];
    const isAssigned = currentList.includes(competitionId);

    if (isAssigned) {
      const { error } = await supabase
        .from("competition_judges")
        .delete()
        .eq("judge_id", judgeId)
        .eq("competition_id", competitionId);

      if (error) {
        alert("Error removing assignment: " + error.message);
      } else {
        setAssignedMap((prev) => ({
          ...prev,
          [judgeId]: (prev[judgeId] || []).filter((id) => id !== competitionId),
        }));
      }
    } else {
      const { error } = await supabase
        .from("competition_judges")
        .insert([{ judge_id: judgeId, competition_id: competitionId }]);

      if (error) {
        alert("Error assigning competition: " + error.message);
      } else {
        setAssignedMap((prev) => ({
          ...prev,
          [judgeId]: [...(prev[judgeId] || []), competitionId],
        }));
      }
    }
  }

  async function handleToggleAccess(id: string, currentStatus: boolean) {
    const nextStatus = !currentStatus;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: nextStatus })
      .eq("id", id);

    if (error) {
      alert("Error updating access: " + error.message);
    } else {
      setJudges((prev) =>
        prev.map((j) => (j.id === id ? { ...j, is_active: nextStatus } : j))
      );
    }
  }

  function startEditing(judge: any) {
    setEditingId(judge.id);
    setEditName(judge.name || judge.username || "");
  }

  async function handleSaveName(id: string) {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name: trimmedName })
      .eq("id", id);

    if (error) {
      alert("Error updating name: " + error.message);
    } else {
      setJudges((prev) =>
        prev.map((j) => (j.id === id ? { ...j, name: trimmedName } : j))
      );
      setEditingId(null);
    }
  }

  async function handleDeleteJudge(id: string, judgeName: string) {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY DELETE judge "${judgeName}"? This will free up the username.`
      )
    ) {
      return;
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      alert("Error deleting judge: " + error.message);
    } else {
      alert("🗑️ Judge deleted.");
      fetchJudgesAndAssignments();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black italic text-slate-900 uppercase tracking-tight">
              Manage <span className="text-indigo-600">Judges</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm">
              Total: {judges.length}
            </span>
            <Link
              href="/admin/judges/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              + Add Judge
            </Link>
          </div>
        </div>

        {/* Judges List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-500 font-medium">
              Loading judges...
            </div>
          ) : judges.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-500 font-medium">
              No judges found.
            </div>
          ) : (
            judges.map((judge) => {
              const isActive = judge.is_active !== false;
              const displayName = judge.name || judge.username || "Unnamed Judge";
              const isEditing = editingId === judge.id;
              const assignedCompetitions = assignedMap[judge.id] || [];

              return (
                <div
                  key={judge.id}
                  className={`flex flex-col p-6 rounded-2xl border transition-all gap-4 bg-white shadow-sm ${
                    isActive ? "border-slate-200/80" : "border-red-200 bg-red-50/20"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                          @{judge.username || "no-username"}
                        </p>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {isActive ? "Active" : "Disabled"}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-50 border border-indigo-400 p-2 rounded-xl text-sm font-bold text-slate-900 focus:outline-none w-full max-w-xs"
                            placeholder="Full Name"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveName(judge.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-lg text-slate-800">
                          {displayName}
                        </h3>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => startEditing(judge)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAccess(judge.id, isActive)}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                          isActive
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isActive ? "⏸ Disable" : "▶ Enable"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteJudge(judge.id, displayName)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Competition Assignment Section */}
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Assigned Competitions:
                    </p>
                    {competitions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No competitions available
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {competitions.map((comp) => {
                          const isAssigned = assignedCompetitions.includes(comp.id);
                          return (
                            <button
                              key={comp.id}
                              type="button"
                              onClick={() =>
                                handleToggleCompetition(judge.id, comp.id)
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                isAssigned
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              {isAssigned ? "✓ " : "+ "}
                              {comp.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}