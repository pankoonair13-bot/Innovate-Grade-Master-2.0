"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const rawInput = username.trim();
    const input = rawInput.toLowerCase().replace(/\s+/g, '');

    // Determine target email candidates
    let emailCandidates: string[] = [];
    if (input.includes('@')) {
      emailCandidates = [input];
    } else if (input === 'pankoo') {
      emailCandidates = ['pankoo@event.com', 'pankoo@master.com'];
    } else {
      emailCandidates = [`${input}@master.com`];
    }

    try {
      let activeUser = null;
      let lastAuthError = null;

      // Try candidates
      for (const email of emailCandidates) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (!authError && authData.user) {
          activeUser = authData.user;
          break;
        } else {
          lastAuthError = authError;
        }
      }

      if (!activeUser) {
        console.error("Supabase Auth Detailed Error:", lastAuthError);
        const detailedMsg = lastAuthError?.message || "Invalid username or password.";
        throw new Error(`Auth Error: ${detailedMsg}`);
      }

      // Fetch profile and verify role & active status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile Query Error:", profileError);
        throw new Error("Failed to load user profile permissions.");
      }

      if (!profile) {
        throw new Error("No profile found for this account in the database.");
      }

      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error("Your account has been disabled by the administrator.");
      }

      // Redirect user to target dashboard
      if (profile.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (profile.role === 'judge') {
        router.push('/scoring');
      } else {
        setErrorMsg(`Role '${profile.role}' not recognized.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl text-xl font-black mx-auto mb-4 shadow-lg shadow-blue-100 italic">
            G
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">
            Grade <span className="text-blue-600">Master 2.0</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">
            Official Portal
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-red-600 text-[11px] font-bold text-center leading-tight">
              {errorMsg}
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Username</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. pankoo or judge1"
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all font-bold text-slate-700 outline-none"
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-1 block">Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 transition-all font-bold text-slate-700 outline-none"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-8">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}