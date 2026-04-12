import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Import your own custom supabase client instead of the broken package!
import { supabase } from '@/lib/supabase' 

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // 1. Check if the user is logged in
  const { data: { session } } = await supabase.auth.getSession()

  const url = req.nextUrl.clone()

  // 2. If they are NOT logged in and trying to access app pages, bounce to login
  if (!session && url.pathname !== '/login') {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 3. If they ARE logged in, fetch their role from profiles
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = profile?.role

    // RULE 1: Judges cannot go to Admin pages
    if (url.pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/judge'
      return NextResponse.redirect(url)
    }

    // RULE 2: Admins cannot go to the Judge panel
    if (url.pathname.startsWith('/judge') && role !== 'judge') {
      url.pathname = '/admin/criteria'
      return NextResponse.redirect(url)
    }
    
    // RULE 3: Stop logged-in users from going back to the login page
    if (url.pathname === '/login') {
      url.pathname = role === 'admin' ? '/admin/criteria' : '/judge'
      return NextResponse.redirect(url)
    }
  }

  return res
}

// 🛡️ Safe Matcher: Only run on the actual pages that need protection!
export const config = {
  matcher: [
    '/login',
    '/judge/:path*',
    '/admin/:path*',
    '/leaderboard/:path*'
  ],
}