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

    const judgeEmail = `${username.trim()}@master.com`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: judgeEmail,
        password: password,
        options: { data: { full_name: name, role: 'judge' } }
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').insert([
        { id: authData.user?.id, full_name: name, email: judgeEmail, role: 'judge' }
      ]);

      if (profileError) throw profileError;

      alert(`✅ Judge "${username}" created!`);
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
        <h1 className="text-2xl font-black text-slate-900 uppercase italic mb-6">Assign <span className="text-purple-600">Judge</span></h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <input 
            type="text" required placeholder="Full Name" 
            className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold"
            value={name} onChange={(e) => setName(e.target.value)} 
          />
          <input 
            type="text" required placeholder="Username" 
            className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold"
            value={username} onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            type="password" required placeholder="Set Password" 
            className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold"
            value={password} onChange={(e) => setPassword(e.target.value)} 
          />
          <button disabled={loading} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">
            {loading ? "Creating..." : "Create Judge Account"}
          </button>
        </form>
      </div>
    </div>
  );
}