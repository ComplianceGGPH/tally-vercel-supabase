import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check for session/auth cookie
  const session = request.cookies.get('session');
  
  if (!session) {
    // Redirect to login if no session
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Protect specific routes
export const config = {
  matcher: '/kanban/grp/:path*',
};