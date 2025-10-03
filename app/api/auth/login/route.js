import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();
  
  // Simple password check (use env variable in production)
  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    
    // Set httpOnly cookie (can't be accessed by JS)
    response.cookies.set('session', 'authenticated', {
        httpOnly: true,
        secure: true, // Always true in production
        sameSite: 'strict', // Changed from 'strict' or 'lax'
        maxAge: 60 * 60,
        path: '/',
    });
    
    return response;
  }
  
  return NextResponse.json({ success: false }, { status: 401 });
}