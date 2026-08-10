import { NextRequest, NextResponse } from 'next/server';
import { SURAH_NAMES } from '@/lib/surahs';
import { getDb } from '@/lib/db';
import { searchCorpusHits, CorpusAyah } from '@/lib/quranSearch';

// The reader renders the Bismillah as a separate block and numbers
// الحمد لله... as ayah 1..6, so search links use the displayed numbering —
// our own corpus already stores displayed numbers for Al-Fatiha (a1 = الحمد).
import corpus from '@/data/quran-corpus.json';
const CORPUS = corpus as unknown as CorpusAyah[];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim();

  if (!query) {
    return NextResponse.json({
      query: '',
      surahMatches: [],
      ayahMatches: [],
      videoMatches: []
    });
  }

  // 1. Search Surahs by Name or Number
  const surahMatches: any[] = [];
  const queryAsNumber = parseInt(query, 10);

  SURAH_NAMES.forEach((name, index) => {
    const surahId = index + 1;
    const cleanName = name.replace(/[َُِّْٰ]/g, ''); // strip diacritics for flexible matching
    const cleanQuery = query.replace(/[َُِّْٰ]/g, '');

    const isNumMatch = !isNaN(queryAsNumber) && queryAsNumber === surahId;
    const isNameMatch = cleanName.includes(cleanQuery) || name.includes(query);

    if (isNumMatch || isNameMatch) {
      surahMatches.push({
        id: surahId,
        name,
        ayahCount: null,
        url: `/surah/${surahId}`
      });
    }
  });

  // 2. Search Ayahs against the local concordance corpus (deterministic,
  //    rasm-aware; no dependency on alquran.cloud's unreliable search API).
  const ayahMatches: any[] = searchCorpusHits(CORPUS, query.replace(/^(سورة|آية|سوره|اية)\s+/i, ''), 20)
    .map((hit) => ({
      id: `${hit.surahId}_${hit.ayahNumber}`,
      surahId: hit.surahId,
      surahName: hit.surahName,
      ayahNumber: hit.ayahNumber,
      text: hit.text,
      url: `/surah/${hit.surahId}?highlight=${hit.ayahNumber}`
    }))
    .sort((a: any, b: any) =>
      a.surahId !== b.surahId ? a.surahId - b.surahId : a.ayahNumber - b.ayahNumber
    );

  // 3. Search local videos from DB
  let videoMatches: any[] = [];
  try {
    const db = getDb();
    if (db && Array.isArray(db.videos)) {
      videoMatches = db.videos
        .filter((v) => 
          v.title.includes(query) || 
          v.scholar.includes(query) ||
          (SURAH_NAMES[v.surahId - 1] && SURAH_NAMES[v.surahId - 1].includes(query))
        )
        .map((v) => ({
          id: v.id,
          title: v.title,
          scholar: v.scholar,
          surahId: v.surahId,
          surahName: SURAH_NAMES[v.surahId - 1] || `سورة ${v.surahId}`,
          ayahNumber: v.ayahNumber,
          url: `/surah/${v.surahId}?highlight=${v.ayahNumber}`
        }))
        // Mushafi order: by surah id, then by ayah number
        .sort((a, b) =>
          a.surahId !== b.surahId ? a.surahId - b.surahId : a.ayahNumber - b.ayahNumber
        );
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    query,
    surahMatches,
    ayahMatches,
    videoMatches
  });
}
