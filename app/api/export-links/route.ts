import { NextResponse } from 'next/server';
import { generateLinksMarkdown } from '@/lib/generateLinksMd';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const md = generateLinksMarkdown(db);
  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="links.md"',
      'Cache-Control': 'no-store',
    },
  });
}
