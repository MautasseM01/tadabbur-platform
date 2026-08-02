import { NextRequest, NextResponse } from 'next/server';
import { analyzeWordAI } from '../../../lib/ai';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const started = Date.now();
  const logs: string[] = [];
  try {
    const body = await req.json();
    const word = body?.word || 'نَفَرٌ';
    logs.push(`word: ${word} | provider: ${body?.provider || 'openrouter'} | model: ${body?.model || 'openrouter/free'}`);
    const result = await analyzeWordAI({
      wordText: word,
      context: body?.context || 'قُلْ أُوحِيَ إِلَيَّ أَنَّهُ اسْتَمَعَ نَفَرٌ مِّنَ الْجِنِّ فَقَالُوا إِنَّا سَمِعْنَا قُرْآنًا عَجَبًا',
      provider: body?.provider || 'openrouter',
      model: body?.model || 'openrouter/free',
    });
    logs.push(`provider: ${result.provider} | model: ${result.model} | usedFallback: ${result.usedFallback}`);
    logs.push(`text head: ${result.text.slice(0, 120).replace(/\n/g, ' ')}`);
    logs.push(`has wordAnalysis: ${!!result.wordAnalysis}`);
    if (result.wordAnalysis) {
      logs.push(`root: ${result.wordAnalysis.root}`);
      logs.push(`refs: ${JSON.stringify(result.wordAnalysis.lexiconReferences.map((r: any) => r.lexicon).slice(0, 3))}`);
    }
  } catch (e: any) {
    logs.push(`route error: ${e.message}`);
  }
  logs.push(`total ${Math.round((Date.now() - started) / 1000)}s`);
  return NextResponse.json({ logs });
}