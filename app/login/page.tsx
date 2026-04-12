"use client"
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 💡 The Trick: Turn the clean username into a fake email format for Supabase!
    const fakeEmail = `${username.trim().toLowerCase()}@event.com`;

    try {
      // 1. Log in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      });

      if (authError) {
        setError("Invalid username or password.");
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;

      // 2. Safely read the role from the database profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // 💡 PLAN B: If there's a database error (like a 500 connection error), 
      // let the hardcoded 'pankoo' in as an admin anyway!
      if (profileError || !profile?.role) {
        if (username.trim().toLowerCase() === 'pankoo') {
          router.push('/');
          return;
        }
        
        setError("No role assigned to this user. Contact Admin.");
        setLoading(false);
        return;
      }

      // 3. 🚀 Success! Send everyone straight to the centralized dashboard menu on the homepage
      router.push('/');

    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        
        {/* LOGO & TITLE */}
        <div className="text-center mb-6">
          <div className="text-blue-600 bg-blue-50 w-12 h-12 flex items-center justify-center rounded-xl font-bold text-2xl mx-auto mb-3">🏆</div>
          <h1 className="text-3xl font-bold text-gray-900">Grade Master 2.0</h1>
          <p className="text-sm text-gray-500 mt-1">Please sign in with your username</p>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <input 
              type="text"
              placeholder="e.g., pankoo or judge1"
              className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password"
              placeholder="••••••••"
              className="w-full mt-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full text-white p-3 rounded-lg font-medium transition ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
        </form>
      </div>
    </div>
  );
}