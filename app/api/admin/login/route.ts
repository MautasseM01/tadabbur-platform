import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: 'الحماية غير مفعّلة على هذا النشر.' }, { status: 403 });
  }
  if (typeof password !== 'string' || password !== expected) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_auth', '1', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 12, // 12 hours
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('admin_auth', '', { maxAge: 0, path: '/' });
  return res;
}