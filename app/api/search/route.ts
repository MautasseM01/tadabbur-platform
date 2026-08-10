import { NextRequest, NextResponse } from 'next/server';
import { SURAH_NAMES } from '@/lib/surahs';
import { getDb } from '@/lib/db';

// In the API the Bismillah ships as ayah 1 of Al-Fatiha. The reader renders it
// as a separate block and renumbers الحمد لله... as ayah 1..6, so search links
// must use the displayed numbering (see app/surah/[id]/page.tsx).
function displayAyahNumber(surahId: number, apiNumber: number): number {
  return surahId === 1 ? apiNumber - 1 : apiNumber;
}

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

  const queryLower = query.toLowerCase();

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

  // 2. Search Ayahs via AlQuran Cloud API
  let ayahMatches: any[] = [];
  try {
    const cleanSearchQuery = query.replace(/^(سورة|آية|سوره|اية)\s+/i, '');
    const apiRes = await fetch(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(cleanSearchQuery)}/all/ar.quran-simple`,
      { next: { revalidate: 3600 } }
    );

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.code === 200 && data.data && Array.isArray(data.data.matches)) {
        ayahMatches = data.data.matches
          .slice(0, 20)
          .map((match: any) => {
            const surahId = match.surah.number;
            const surahName = SURAH_NAMES[surahId - 1] || match.surah.name;
            const ayahNumber = displayAyahNumber(surahId, match.numberInSurah);
            return {
              id: `${surahId}_${ayahNumber}`,
              surahId,
              surahName,
              ayahNumber,
              text: match.text,
              url: `/surah/${surahId}?highlight=${ayahNumber}`
            };
          })
          // Exclude the "0" (Bismillah block) rows that never render numbered
          .filter((m: any) => m.ayahNumber >= 1)
          // Mushafi order: by surah id, then by ayah number
          .sort((a: any, b: any) =>
            a.surahId !== b.surahId ? a.surahId - b.surahId : a.ayahNumber - b.ayahNumber
          );
      }
    }
  } catch (err) {
    console.error('Quran search API error:', err);
  }

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
