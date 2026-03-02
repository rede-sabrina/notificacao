import { NextResponse } from 'next/server';
import { createToken, makeAuthCookie } from '../../../../lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const { user, pass } = body || {};

  const envUser = process.env.AUTH_USER;
  const envPass = process.env.AUTH_PASS;

  if (!envUser || !envPass) {
    return new NextResponse(JSON.stringify({ error: 'Auth not configured on server' }), { status: 500 });
  }

  if (user === envUser && pass === envPass) {
    const token = createToken(user);
    const cookie = makeAuthCookie(token);
    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', cookie);
    return res;
  }

  return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
}
