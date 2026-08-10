import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for expensive AI/API routes.
// (Per-instance on serverless — a deterrent, not a fortress.)
const AI_PATHS = ['/api/gemini', '/api/process-video'];
const LIMIT_PER_MINUTE = 30;
const buckets = new Map<string, { count: number; reset: number }>();

export function middleware(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const { pathname } = req.nextUrl;

  if (AI_PATHS.some((p) => pathname.startsWith(p)) && req.method === 'POST') {
    const now = Date.now();
    const bucket = buckets.get(ip);
    if (!bucket || now > bucket.reset) {
      buckets.set(ip, { count: 1, reset: now + 60_000 });
    } else {
      bucket.count += 1;
      if (bucket.count > LIMIT_PER_MINUTE) {
        return NextResponse.json(
          { error: 'طلبات كثيرة جداً — حاول بعد دقيقة.' },
          { status: 429 }
        );
      }
    }
  }

  // Optional admin gate: only active when ADMIN_PASSWORD is configured.
  if (pathname.startsWith('/admin') && process.env.ADMIN_PASSWORD) {
    if (req.cookies.get('admin_auth')?.value === '1') {
      return NextResponse.next();
    }
    if (pathname.startsWith('/api/admin') || pathname === '/admin/login') {
      return NextResponse.next(); // login endpoints themselves stay open
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
