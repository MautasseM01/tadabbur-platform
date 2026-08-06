import { NextResponse } from 'next/server';
import { generateLinksMarkdown } from '@/lib/generateLinksMd';
import { getDb, AppDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function GET() {
  const db = getDb();
  const merged: AppDatabase = {
    videos: [...db.videos],
    surahSyncs: { ...(db.surahSyncs || {}) },
    surahAudioIds: { ...(db.surahAudioIds || {}) },
  };

  // Overlay Firestore as the durable layer for serverless (ephemeral local file)
  try {
    const { getAllSurahAudioIdsFirestore, getVideosFirestore } = await import('@/lib/firebaseSync');
    const [cloudAudio, cloudVideos] = await withTimeout(
      Promise.all([getAllSurahAudioIdsFirestore(), getVideosFirestore()]),
      8000
    );
    for (const [k, v] of Object.entries(cloudAudio)) {
      if (v) merged.surahAudioIds[Number(k)] = v;
    }
    merged.videos = Array.from(
      new Map([...merged.videos, ...cloudVideos].map((v) => [v.id, v])).values()
    );
  } catch (err) {
    console.warn('Firestore export overlay skipped:', err);
  }

  const md = generateLinksMarkdown(merged);
  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="links.md"',
      'Cache-Control': 'no-store',
    },
  });
}
