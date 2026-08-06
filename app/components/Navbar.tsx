"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        let determinedRole = profile?.role;

        if (!determinedRole && session.user.email?.toLowerCase().includes('admin')) {
          determinedRole = 'admin';
        }

        setRole(determinedRole || 'judge');
      } else {
        setRole(null);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUser();
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* LOGO */}
        <Link 
          href={role === 'admin' ? "/admin/dashboard" : "/"} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black shadow-sm">G</div>
          <span className="font-bold text-lg hidden xs:block">Grade Master 2.0</span>
        </Link>

        {/* RESPONSIVE NAV LINKS */}
        <div className="flex items-center gap-1 md:gap-4">
          {loading ? (
            <div className="flex gap-2">
              <div className="h-4 w-12 bg-slate-100 animate-pulse rounded"></div>
            </div>
          ) : (
            <>
              {role === 'admin' && (
                <>
                  <Link href="/admin/criteria" className="hidden md:block text-gray-500 hover:text-blue-600 text-sm font-medium">Criteria</Link>
                  <Link href="/admin/participants" className="hidden md:block text-gray-500 hover:text-blue-600 text-sm font-medium">Participants</Link>
                  
                  <Link href="/admin/dashboard" className="text-orange-600 font-black border border-orange-200 rounded-xl bg-orange-50 px-2 py-1 text-[9px] md:text-[10px] whitespace-nowrap">
                    DASHBOARD
                  </Link>
                  
                  <Link href="/leaderboard" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold md:text-xs">
                    LIVE
                  </Link>
                </>
              )}
              {role && (
                <button onClick={handleLogout} className="text-red-500 text-[9px] md:text-[10px] font-black uppercase px-2 cursor-pointer">
                  Logout
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}