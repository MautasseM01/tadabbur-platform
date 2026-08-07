import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { MOCK_VIDEOS, VideoExplanation } from '@/lib/mock-data';

export async function GET() {
  const db = getDb();
  const merged = [...MOCK_VIDEOS, ...db.videos];
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete video:', error);
    return NextResponse.json({ error: 'تعذر حذف الفيديو.' }, { status: 500 });
  }
}
