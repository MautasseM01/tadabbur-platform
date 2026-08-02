import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const started = Date.now();
  const logs: string[] = [];
  try {
    const body = await req.json();
    const model = body?.model || 'openai/gpt-oss-20b:free';
    const key = process.env.OPENROUTER_API_KEY || '';
    logs.push(`key present: ${key.length > 0} (len ${key.length})`);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'قل: مرحبا' }], max_tokens: 10 }),
        signal: ctrl.signal,
      });
      logs.push(`openrouter HTTP ${res.status} after ${Math.round((Date.now() - started) / 1000)}s`);
      const text = await res.text();
      logs.push(`body: ${text.slice(0, 200)}`);
    } catch (e: any) {
      logs.push(`fetch error after ${Math.round((Date.now() - started) / 1000)}s: ${e.message}`);
    } finally {
      clearTimeout(t);
    }
  } catch (e: any) {
    logs.push(`route error: ${e.message}`);
  }
  logs.push(`total ${Math.round((Date.now() - started) / 1000)}s`);
  return NextResponse.json({ logs });
}