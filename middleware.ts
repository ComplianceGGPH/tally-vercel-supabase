import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check for session/auth cookie
  const session = request.cookies.get('session');
  
  if (!session) {
    // Redirect to login if no session
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// Protect specific routes
export const config = {
  matcher: '/kanban/clinfo/:path*',
};