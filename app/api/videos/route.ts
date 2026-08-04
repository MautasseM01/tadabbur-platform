import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { MOCK_VIDEOS, VideoExplanation } from '@/lib/mock-data';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function GET() {
  const db = getDb();
  const merged = [...MOCK_VIDEOS, ...db.videos];
  // Overlay Firestore as the durable layer for serverless (ephemeral local file)
  try {
    const { getVideosFirestore } = await import('@/lib/firebaseSync');
    const cloud = await withTimeout(getVideosFirestore(), 8000);
    if (Array.isArray(cloud) && cloud.length > 0) {
      merged.push(...cloud);
    }
  } catch (err) {
    console.warn('Firestore videos GET skipped:', err);
  }
  const unique = Array.from(new Map(merged.map(v => [v.id, v])).values());
  return NextResponse.json({ videos: unique });
}

export async function POST(req: NextRequest) {
  try {
    const video: VideoExplanation = await req.json();
    if (!video || typeof video.youtubeId !== 'string' || !video.youtubeId.trim()) {
      return NextResponse.json({ error: 'بيانات الفيديو غير مكتملة.' }, { status: 400 });
    }

    const db = getDb();
    const exists = db.videos.some(v => v.id === video.id);
    db.videos = exists
      ? db.videos.map(v => (v.id === video.id ? video : v))
      : [...db.videos, video];
    saveDb(db);

    // Best-effort sync to Firestore (non-blocking, never fails the request)
    try {
      const { addVideoFirestore } = await import('@/lib/firebaseSync');
      await addVideoFirestore(video);
    } catch (err) {
      console.warn('Firestore video sync skipped:', err);
    }

    return NextResponse.json({ success: true, video });
  } catch (error: any) {
    console.error('Failed to save video:', error);
    return NextResponse.json({ error: 'تعذر حفظ الفيديو.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'معرّف الفيديو مطلوب.' }, { status: 400 });
    }

    const db = getDb();
    db.videos = db.videos.filter(v => v.id !== id);
    saveDb(db);

    try {
      const { deleteVideoFirestore } = await import('@/lib/firebaseSync');
      await deleteVideoFirestore(id);
    } catch (err) {
      console.warn('Firestore video delete skipped:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete video:', error);
    return NextResponse.json({ error: 'تعذر حذف الفيديو.' }, { status: 500 });
  }
}
