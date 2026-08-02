import { NextRequest, NextResponse } from 'next/server';
import { compareWordsAI } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word1, word2, contextAyah, provider, model } = body;

    if (!word1 || !word2 || !contextAyah) {
      return NextResponse.json({ error: 'بيانات الكلمات والآية غير مكتملة.' }, { status: 400 });
    }

    const result = await compareWordsAI({
      word1: { text: word1.text, root: word1.root },
      word2: { text: word2.text, root: word2.root },
      contextAyah,
      provider,
      model,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Compare Words API Error:', error);
    return NextResponse.json(
      { error: 'تعذر إجراء المقارنة اللغوية حالياً. تحقق من إعدادات المفاتيح (API) أو اختر المحلل المحلي.' },
      { status: 500 }
    );
  }
}
