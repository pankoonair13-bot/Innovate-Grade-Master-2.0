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

    // 💡 CUSTOM ROUTING LOGIC:
    let emailToAuth = "";
    const input = username.trim();

    if (input === 'pankoo') {
      // Automatically maps 'pankoo' to your actual admin email in Auth
      emailToAuth = 'pankoo@event.com';
    } else if (input.includes('@')) {
      // Use full email if provided
      emailToAuth = input;
    } else {
      // Default to judge format for other usernames
      emailToAuth = `${input}@master.com`;
    }

    try {
      // 1. Sign in to Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password: password,
      });

      if (authError) throw new Error("Invalid username or password.");

      if (data.user) {
        // 2. Fetch role from the 'profiles' table using the User UUID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) throw new Error("Database error. Please try again.");

        // 3. Direct users to the correct page based on their role
        if (!profile) {
          setErrorMsg("No role assigned. Check your profiles table in Supabase.");
        } else if (profile.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (profile.role === 'judge') {
          router.push('/scoring');
        } else {
          setErrorMsg(`Role '${profile.role}' not recognized.`);
        }
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
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50"
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