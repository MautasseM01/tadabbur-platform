import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { AUDIO_YOUTUBE_IDS } from '@/lib/mock-data';

function extractYouTubeId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{6,})/,
    /(?:youtu\.be\/)([\w-]{6,})/,
    /(?:youtube\.com\/embed\/)([\w-]{6,})/,
    /(?:youtube\.com\/shorts\/)([\w-]{6,})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return /^[\w-]{6,}$/.test(trimmed) ? trimmed : '';
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function GET() {
  const db = getDb();
  const merged: Record<number, string> = {};
  for (let id = 1; id <= 114; id++) {
    const value = (db.surahAudioIds && db.surahAudioIds[id] !== undefined && db.surahAudioIds[id] !== '')
      ? db.surahAudioIds[id]
      : (AUDIO_YOUTUBE_IDS[id] || '');
    if (value) merged[id] = value;
  }
  // Overlay Firestore as the durable layer for serverless (ephemeral local file)
  try {
    const { getAllSurahAudioIdsFirestore } = await import('@/lib/firebaseSync');
    const cloud = await withTimeout(getAllSurahAudioIdsFirestore(), 8000);
    for (const [k, v] of Object.entries(cloud)) {
      if (v) merged[Number(k)] = v;
    }
  } catch (err) {
    console.warn('Firestore audio GET skipped:', err);
  }
  return NextResponse.json({ surahAudioIds: merged });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify-only mode: check a YouTube ID exists via oEmbed, no save.
    if (body.verifyOnly && body.youtubeId) {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(body.youtubeId)}&format=json`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        return NextResponse.json({ valid: false, error: 'الفيديو غير متاح أو المعرّف غير صحيح.' }, { status: 404 });
      }
      const data = await res.json();
      return NextResponse.json({ valid: true, title: typeof data.title === 'string' ? data.title : '' });
    }

    // Save mode: single {surahId, youtubeId} or bulk {updates: [{surahId, youtubeId}]}
    const updates = body.updates
      ? body.updates as { surahId: number; youtubeId: string }[]
      : [{ surahId: body.surahId, youtubeId: body.youtubeId }];

    const cleaned = updates.map((u) => ({
      surahId: Number(u.surahId),
      youtubeId: extractYouTubeId(String(u.youtubeId || '')),
    }));

    if (cleaned.length === 0 || cleaned.some((u) => isNaN(u.surahId) || u.surahId < 1 || u.surahId > 114)) {
      return NextResponse.json({ error: 'رقم السورة غير صالح (1-114).' }, { status: 400 });
    }
    if (cleaned.some((u) => !u.youtubeId)) {
      return NextResponse.json({ error: 'أحد الروابط غير صالح (رابط يوتيوب أو معرّف قصير فقط).' }, { status: 400 });
    }

    const db = getDb();
    for (const u of cleaned) {
      if (!db.surahAudioIds) db.surahAudioIds = {};
      db.surahAudioIds[u.surahId] = u.youtubeId;
    }
    saveDb(db);

    // Best-effort sync to Firestore (non-blocking, never fails the request)
    try {
      const { saveSurahAudioIdFirestore } = await import('@/lib/firebaseSync');
      for (const u of cleaned) {
        await saveSurahAudioIdFirestore(u.surahId, u.youtubeId);
      }
    } catch (err) {
      console.warn('Firestore audio sync skipped:', err);
    }

    return NextResponse.json({ success: true, saved: cleaned.length });
  } catch (error: any) {
    console.error('Failed to save surah audio:', error);
    return NextResponse.json({ error: 'تعذر حفظ الروابط.' }, { status: 500 });
  }
}
