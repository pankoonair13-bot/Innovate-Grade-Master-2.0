"use client"
import { useEffect, useState } from "react";
import "./globals.css";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // Check for an existing session immediately
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setRole(profile?.role || null);
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
    <html lang="en">
      <body className="antialiased bg-slate-50">
        <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 h-16">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            
            {/* LOGO */}
            <Link 
              href={role === 'admin' ? "/admin/dashboard" : "/"} 
              className="font-bold text-xl text-blue-600 flex items-center gap-2"
            >
              <div className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black">G</div>
              <span className="hidden sm:inline">Grade Master 2.0</span>
            </Link>

            {/* NAV LINKS */}
            <div className="flex items-center gap-2 md:gap-4">
              {loading ? (
                /* 🕒 Loading Placeholder: Stops the "jumping" effect */
                <div className="flex gap-4">
                  <div className="h-4 w-16 bg-slate-100 animate-pulse rounded"></div>
                  <div className="h-4 w-16 bg-slate-100 animate-pulse rounded"></div>
                </div>
              ) : (
                <>
                  {role === 'admin' && (
                    <>
                      <Link href="/admin/criteria" className="text-gray-500 hover:text-blue-600 text-xs md:text-sm font-medium">Criteria</Link>
                      <Link href="/admin/participants" className="text-gray-500 hover:text-blue-600 text-xs md:text-sm font-medium">Participants</Link>
                      <Link href="/admin/dashboard" className="text-orange-600 font-black border border-orange-200 rounded-xl bg-orange-50 px-3 py-1.5 text-[10px]">
                        DASHBOARD
                      </Link>
                      <Link href="/leaderboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold ml-2">
                        Live Standings
                      </Link>
                    </>
                  )}
                  {role && (
                    <button onClick={handleLogout} className="text-red-500 text-[10px] font-black uppercase ml-2">
                      Logout
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>
        
        <main>{children}</main>
      </body>
    </html>
  );
}