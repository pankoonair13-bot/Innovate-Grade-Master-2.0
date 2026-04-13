"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateJudge() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 💡 TRICK: We create a dummy email using the username
    const judgeEmail = `${username.trim()}@master.com`;

    try {
      // 1. Create the Judge in Supabase Auth
      // Note: This works best if you have "Confirm Email" DISABLED in Supabase settings
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: judgeEmail,
        password: password,
        options: {
          data: {
            full_name: name,
            role: 'judge'
          }
        }
      });

      if (authError) throw authError;

      // 2. Add to your profiles table
      const { error: profileError } = await supabase.from('profiles').insert([
        { 
          id: authData.user?.id,
          full_name: name, 
          email: judgeEmail, 
          role: 'judge' 
        }
      ]);

      if (profileError) throw profileError;

      alert(`✅ Judge "${username}" created successfully!`);
      router.push('/admin/dashboard');
      
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 w-full max-w-md">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic mb-6">
          New <span className="text-purple-600">Judge Account</span>
        </h1>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Display Name</label>
            <input 
              type="text" required placeholder="e.g. Mr. Smith"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-purple-500 font-bold"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Username</label>
            <input 
              type="text" required placeholder="e.g. judge1"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-purple-500 font-bold"
              value={username} onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Set Password</label>
            <input 
              type="password" required placeholder="Minimum 6 characters"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-purple-500 font-bold"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-100 active:scale-95 transition-all mt-4"
          >
            {loading ? "Creating..." : "Create Judge"}
          </button>
        </form>
      </div>
    </div>
  );
}