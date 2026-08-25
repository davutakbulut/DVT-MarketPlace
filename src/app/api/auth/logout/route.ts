import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('dvt_session', '', {
    httpOnly: false,
    path: '/',
    maxAge: 0,
  });
  return response;
}
