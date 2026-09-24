"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SDG_OPTIONS = [
  "SDG 1: No Poverty",
  "SDG 2: Zero Hunger",
  "SDG 3: Good Health and Well-being",
  "SDG 4: Quality Education",
  "SDG 5: Gender Equality",
  "SDG 6: Clean Water and Sanitation",
  "SDG 7: Affordable and Clean Energy",
  "SDG 8: Decent Work and Economic Growth",
  "SDG 9: Industry, Innovation and Infrastructure",
  "SDG 10: Reduced Inequalities",
  "SDG 11: Sustainable Cities and Communities",
  "SDG 12: Responsible Consumption and Production",
  "SDG 13: Climate Action",
  "SDG 14: Life Below Water",
  "SDG 15: Life on Land",
  "SDG 16: Peace, Justice and Strong Institutions",
  "SDG 17: Partnerships for the Goals"
];

export default function CreateParticipantPage() {
  const [booth, setBooth] = useState("");
  const [project, setProject] = useState("");
  const [team, setTeam] = useState("");
  const [program, setProgram] = useState("");
  const [sdg, setSdg] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedSupervisor = supervisor.trim();
    const trimmedSdg = sdg.trim();

    // Primary payload using standard schema fields
    let payload: Record<string, any> = {
      booth_number: booth.trim(),
      project_name: project.trim(),
      team_name: team.trim(),
      program: program.trim(),
      project_sdg: trimmedSdg,
      supervisor_name: trimmedSupervisor,
    };

    let { error } = await supabase.from("participants").insert([payload]);

    // Fallback 1: If project_sdg column doesn't exist, try project_theme
    if (error && error.message.includes("project_sdg")) {
      delete payload.project_sdg;
      payload.project_theme = trimmedSdg;

      const retry = await supabase.from("participants").insert([payload]);
      error = retry.error;
    }

    // Fallback 2: If supervisor_name column doesn't exist, try supervisor
    if (error && error.message.includes("supervisor_name")) {
      delete payload.supervisor_name;
      payload.supervisor = trimmedSupervisor;

      const retry = await supabase.from("participants").insert([payload]);
      error = retry.error;
    }

    // Fallback 3: If team_name column doesn't exist, try name
    if (error && error.message.includes("team_name")) {
      delete payload.team_name;
      payload.name = team.trim();

      const retry = await supabase.from("participants").insert([payload]);
      error = retry.error;
    }

    if (error) {
      alert("❌ Error adding participant: " + error.message);
    } else {
      alert("✅ Participant registered successfully!");
      router.push("/admin/participants");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 md:p-12 font-sans">
      <div className="bg-white border border-slate-200/80 p-8 md:p-10 rounded-2xl shadow-sm w-full max-w-lg space-y-6">
        
        {/* Navigation Link */}
        <Link
          href="/admin/participants"
          className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline inline-flex items-center gap-1"
        >
          ← Back to Participants List
        </Link>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tight">
            ADD <span className="text-indigo-600">PARTICIPANT</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Register a new booth entry into the directory.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Booth Number */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              BOOTH NUMBER
            </label>
            <input
              type="text"
              required
              placeholder="e.g. A01"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={booth}
              onChange={(e) => setBooth(e.target.value)}
            />
          </div>

          {/* Program */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              PROGRAM (DET, DTK, DEP.)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DET, DTK, DEP"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
            />
          </div>

          {/* Project SDG */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              PROJECT SDG
            </label>
            <select
              required
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
              value={sdg}
              onChange={(e) => setSdg(e.target.value)}
            >
              <option value="" disabled>Select Sustainable Development Goal</option>
              {SDG_OPTIONS.map((item, idx) => (
                <option key={idx} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              PROJECT NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SOLAR SYSTEM"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
          </div>

          {/* Name / Team Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              NAME / TEAM NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MUHAMMAD ALIF / TEAM ALPHA"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>

          {/* Supervisor Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              SUPERVISOR NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KAVILAN"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
            />
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-sm active:scale-[0.98] transition-all mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "REGISTERING..." : "CONFIRM REGISTRATION"}
          </button>
        </form>

      </div>
    </div>
  );
}