"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateJudge() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // In a real app, you would use an Edge Function to create the Auth user.
    // For now, we manually insert into profiles and you add the user in Supabase Auth.
    const { error } = await supabase.from('profiles').insert([
      { full_name: name, email: email, role: 'judge' }
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Judge Profile Created! Please ensure the user exists in Supabase Auth.");
      router.push('/admin/judges');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 w-full max-w-md">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic mb-6">Assign <span className="text-purple-600">Judge</span></h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Judge Full Name</label>
            <input 
              type="text" required placeholder="Name"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-purple-500 font-bold"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Address</label>
            <input 
              type="email" required placeholder="judge@email.com"
              className="w-full p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-purple-500 font-bold"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-100 active:scale-95 transition-all"
          >
            {loading ? "Saving..." : "Create Judge Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}