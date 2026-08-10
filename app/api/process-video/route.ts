import { NextRequest, NextResponse } from 'next/server';

/**
 * AI video processing — DISABLED for real use.
 *
 * The original implementation either returned fully random mock results
 * (when no GEMINI_API_KEY is set) or asked the model to *simulate* a
 * classification without any transcript — which could silently corrupt the
 * videos database. Until a real transcript pipeline is built, we refuse
 * instead of inventing data.
 */
export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    return NextResponse.json(
      {
        error:
          'استخراج الفيديوهات بالذكاء الاصطناعي معطّل مؤقتاً — الميزة قيد التطوير (يتطلب نصوص Transcript حقيقية).',
        results: urls.map((url: string) => ({
          url,
          status: 'not_implemented',
        })),
      },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}