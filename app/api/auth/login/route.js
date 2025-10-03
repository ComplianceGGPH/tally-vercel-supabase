import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();
  
  // Simple password check (use env variable in production)
  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    
    // Set httpOnly cookie (can't be accessed by JS)
    response.cookies.set('session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // * 24, // 24 hours
      path: '/',
    });
    
    return response;
  }
  
  return NextResponse.json({ success: false }, { status: 401 });
}