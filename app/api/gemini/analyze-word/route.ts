import { NextRequest, NextResponse } from 'next/server';
import { analyzeWordAI } from '@/lib/ai';

export const maxDuration = 300;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wordText, root, context, provider, model } = body;

    if (!wordText || !context) {
      return NextResponse.json({ error: 'بيانات الكلمة والسياق غير مكتملة.' }, { status: 400 });
    }

    const result = await analyzeWordAI({ wordText, root, context, provider, model });
    return NextResponse.json({
      text: result.text,
      provider: result.provider,
      model: result.model,
      usedFallback: result.usedFallback,
      cached: result.cached || false,
      wordAnalysis: result.wordAnalysis || null,
    });
  } catch (error: any) {
    console.error('Analyze Word API Error:', error);
    return NextResponse.json(
      { error: 'تعذر تحليل الكلمة في الوقت الحالي. تحقق من إعدادات المفاتيح (API) أو اختر المحلل المحلي.' },
      { status: 500 }
    );
  }
}
