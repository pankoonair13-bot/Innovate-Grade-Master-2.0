"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      // Create an isolated Supabase client to prevent auth session overriding the admin
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );

      // 1. Create the Auth User
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: judgeEmail,
        password: password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to initialize user session.");
      }

      // 2. Insert profile using main admin client
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
    <div className="min-h-screen bg-[#0f172a] text-white p-4 flex items-center justify-center font-sans">
      <div className="bg-slate-900/80 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md">
        
        {/* Navigation Link */}
        <Link
          href="/admin/judges"
          className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline mb-2 inline-block"
        >
          ← Back to Judges List
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-black text-white uppercase italic mb-6">
          Assign <span className="text-blue-500">Judge</span>
        </h1>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. judge1"
              className="w-full p-4 rounded-2xl bg-[#0f172a] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Spaces and special characters will be stripped automatically for system registration.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Thaya"
              className="w-full p-4 rounded-2xl bg-[#0f172a] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full p-4 rounded-2xl bg-[#0f172a] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20 cursor-pointer transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Creating Account..." : "Confirm & Create Account"}
          </button>
        </form>

      </div>
    </div>
  );
}