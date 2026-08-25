import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('dvt_session');

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, ...session });
  } catch (e) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
