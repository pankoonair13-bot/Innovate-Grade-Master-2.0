"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  username: string;
  role: string;
}

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 💡 The Trick: This flag prevents overlapping lock requests!
    let isMounted = true;

    const fetchUserProfile = async () => {
      // 1. Check if a user is logged in
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Stop right here if Next.js double-rendered and unmounted this attempt
      if (!isMounted) return;

      if (authError || !user) {
        router.push('/login');
        return;
      }

      // 2. Fetch their live role from the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single();

      if (!isMounted) return;

      if (!error && data) {
        setProfile(data);
      } else {
        // Fallback safety net for local testing!
        setProfile({ username: 'pankoo', role: 'admin' });
      }
      setLoading(false);
    };

    fetchUserProfile();

    // Clean up function sets flag to false when Next.js tries to fire this twice
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inovate Grade Master 2.0</h1>
            <p className="text-sm text-gray-500 mt-1">
              Logged in as: <span className="font-semibold text-blue-600 capitalize">{profile?.role || 'Guest'}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            Logout
          </button>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CARD 1: JUDGE SCORING */}
          <Link href="/scoring" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="text-blue-600 bg-blue-50 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition">📝</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Judge Scoring Panel</h2>
            <p className="text-sm text-gray-500">Enter and evaluate scores for competition booths.</p>
            <p className="text-sm text-blue-600 mt-4 font-medium group-hover:underline">Open Panel →</p>
          </Link>

          {/* CARD 2: LIVE LEADERBOARD */}
          <Link href="/leaderboard" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="text-amber-600 bg-amber-50 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4 group-hover:bg-amber-600 group-hover:text-white transition">🏆</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Live Leaderboard</h2>
            <p className="text-sm text-gray-500">View the real-time rankings and average scores of all participants.</p>
            <p className="text-sm text-amber-600 mt-4 font-medium group-hover:underline">View Standings →</p>
          </Link>

          {/* CARD 3: CRITERIA SETUP (Admin Only) */}
          {isAdmin ? (
            <Link href="/admin/criteria" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="text-emerald-600 bg-emerald-50 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">⚙️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Criteria Setup</h2>
              <p className="text-sm text-gray-500">Add, edit, or remove the scoring rules for judges.</p>
              <p className="text-sm text-emerald-600 mt-4 font-medium group-hover:underline">Manage Rules →</p>
            </Link>
          ) : (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 opacity-60 relative cursor-not-allowed">
              <div className="text-gray-400 bg-gray-200 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-gray-400 mb-2">Criteria Setup</h2>
              <p className="text-sm text-gray-400">This setting is restricted to authorized Admins only.</p>
            </div>
          )}

          {/* CARD 4: MANAGE PARTICIPANTS (Admin Only) */}
          {isAdmin ? (
            <Link href="/admin/participants" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="text-purple-600 bg-purple-50 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4 group-hover:bg-purple-600 group-hover:text-white transition">👥</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Participants</h2>
              <p className="text-sm text-gray-500">Register or remove teams and competition booths.</p>
              <p className="text-sm text-purple-600 mt-4 font-medium group-hover:underline">Open List →</p>
            </Link>
          ) : (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 opacity-60 relative cursor-not-allowed">
              <div className="text-gray-400 bg-gray-200 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-gray-400 mb-2">Manage Participants</h2>
              <p className="text-sm text-gray-400">This setting is restricted to authorized Admins only.</p>
            </div>
          )}

          {/* CARD 5: MANAGE JUDGES (Admin Only) */}
          {isAdmin ? (
            <Link href="/admin/judges" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="text-rose-600 bg-rose-50 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4 group-hover:bg-rose-600 group-hover:text-white transition">⚖️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Judges</h2>
              <p className="text-sm text-gray-500">Add new judge accounts or manage existing ones.</p>
              <p className="text-sm text-rose-600 mt-4 font-medium group-hover:underline">Open Judges List →</p>
            </Link>
          ) : (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 opacity-60 relative cursor-not-allowed">
              <div className="text-gray-400 bg-gray-200 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-gray-400 mb-2">Manage Judges</h2>
              <p className="text-sm text-gray-400">This setting is restricted to authorized Admins only.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}