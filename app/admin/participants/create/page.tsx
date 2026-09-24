"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

    const payload = {
      booth_number: booth.trim(),
      project_name: project.trim(),
      team_name: team.trim(),
      name: team.trim(),
      program: program.trim(),
      project_sdg: sdg.trim(),
      project_theme: sdg.trim(),
      theme: sdg.trim(),
      category: sdg.trim(),
      supervisor: trimmedSupervisor,
      supervisor_name: trimmedSupervisor,
    };

    let { error } = await supabase.from("participants").insert([payload]);

    if (error && error.message.includes("supervisor_name")) {
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).supervisor_name;

      const fallbackResult = await supabase
        .from("participants")
        .insert([fallbackPayload]);
      error = fallbackResult.error;
    }

    if (error && error.message.includes("supervisor")) {
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as any).supervisor;

      const fallbackResult = await supabase
        .from("participants")
        .insert([fallbackPayload]);
      error = fallbackResult.error;
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
            <input
              type="text"
              required
              placeholder="e.g. SDG 7 / SDG 9 / SDG 13"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={sdg}
              onChange={(e) => setSdg(e.target.value)}
            />
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