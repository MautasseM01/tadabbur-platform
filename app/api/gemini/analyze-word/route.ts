import { NextRequest, NextResponse } from 'next/server';
import { analyzeWordAI, streamAnalyzeWordAI } from '@/lib/ai';

export const maxDuration = 300;
export const runtime = 'nodejs';

const encoder = new TextEncoder();

function sse(event: { type: 'token'; text: string } | { type: 'done'; result: any }): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wordText, root, context, provider, model, stream } = body;

    if (!wordText || !context) {
      return NextResponse.json({ error: 'بيانات الكلمة والسياق غير مكتملة.' }, { status: 400 });
    }

    if (!stream) {
      const result = await analyzeWordAI({ wordText, root, context, provider, model });
      return NextResponse.json({
        text: result.text,
        provider: result.provider,
        model: result.model,
        usedFallback: result.usedFallback,
        cached: result.cached || false,
        wordAnalysis: result.wordAnalysis || null,
      });
    }

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          for await (const evt of streamAnalyzeWordAI({ wordText, root, context, provider, model })) {
            controller.enqueue(sse(evt));
          }
        } catch (err) {
          controller.enqueue(sse({ type: 'done', result: null }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Analyze Word API Error:', error);
    return NextResponse.json(
      { error: 'تعذر تحليل الكلمة في الوقت الحالي. تحقق من إعدادات المفاتيح (API) أو اختر المحلل المحلي.' },
      { status: 500 }
    );
  }
}
