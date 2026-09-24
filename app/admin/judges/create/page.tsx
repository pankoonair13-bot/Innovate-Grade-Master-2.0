"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function CreateJudge() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    if (!cleanUsername) {
      alert("❌ Please enter a valid username containing letters or numbers.");
      setLoading(false);
      return;
    }

    const cleanFullName = fullName.trim();
    const judgeEmail = `${cleanUsername}@master.com`;

    try {
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: judgeEmail,
        password: password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to initialize user session.");
      }

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          role: "judge",
          username: cleanUsername,
          name: cleanFullName || username.trim(),
          is_active: true,
        },
      ]);

      if (profileError) throw profileError;

      alert(`✅ Judge "@${cleanUsername}" created successfully!`);
      router.push("/admin/judges");
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-12 font-sans flex items-center justify-center">
      <div className="bg-white border border-slate-200/80 p-8 md:p-10 rounded-2xl shadow-sm w-full max-w-md space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
            Assign <span className="text-indigo-600">Judge</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create system credentials for a new judge.
          </p>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. judge1"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Spaces and special characters will be stripped automatically.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Thaya"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-sm cursor-pointer transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Creating Account..." : "Confirm & Create Account"}
          </button>
        </form>

      </div>
    </div>
  );
}