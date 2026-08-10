import SurahViewer from '@/components/surah/SurahViewer';
import { AUDIO_YOUTUBE_IDS, MOCK_VIDEOS, Ayah } from '@/lib/mock-data';
import { getDb } from '@/lib/db';
import { deriveArabicRoot } from '@/lib/arabicLexicon';

// Helper to format fetched ayahs
const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

function processSurahData(apiData: any, savedSyncs?: Ayah[]): Ayah[] {
  const surahId = apiData.number;
  
  let currentTime = 0.0;
  let result: Ayah[] = [];
  
  apiData.ayahs.forEach((ayah: any, index: number) => {
    // For Al-Fatiha the API ships the Bismillah as its own first ayah (ayah 1).
    // It must ALWAYS stay outside the numbered text: render it as the special
    // Bismillah entry (id 0) and shift every real ayah down by one.
    if (surahId === 1 && index === 0 && ayah.text.trim() === BISMILLAH) {
      let bStartTime = currentTime;
      let bEndTime = currentTime + 5.0; // Typical Bismillah duration in tartil

      const savedMatch = savedSyncs?.find(s => s.isBismillah);
      if (savedMatch) {
        bStartTime = savedMatch.startTime;
        bEndTime = savedMatch.endTime;
      }

      const bWordsStr = BISMILLAH.split(' ');
      const totalBChars = bWordsStr.reduce((acc, w) => acc + w.length, 0);
      let currentBWordTime = bStartTime;
      const bDuration = bEndTime - bStartTime;

      const bWords = bWordsStr.map((wordStr: string, wIndex: number) => {
        const wDuration = (wordStr.length / totalBChars) * bDuration;
        const start = currentBWordTime;
        currentBWordTime += wDuration;
        return {
          id: `0-${wIndex}`,
          text: wordStr,
          root: deriveArabicRoot(wordStr),
          occurrences: 0,
          startTime: start,
          endTime: currentBWordTime
        };
      });

      currentTime = bEndTime + 1.0; // small pause

      result.push({
        id: 0,
        surahId,
        ayahNumber: 0,
        text: BISMILLAH,
        words: bWords,
        startTime: bStartTime,
        endTime: bEndTime,
        isBismillah: true
      });
      return;
    }

    let text = ayah.text;
    const isFatiha = surahId === 1;
    // The real ayahs of Al-Fatiha are renumbered after extracting the Bismillah
    // (الحمد لله... becomes ayah 1, never 2).
    const ayahNumber = isFatiha ? ayah.numberInSurah - 1 : ayah.numberInSurah;

    // Separate Bismillah out of the first Ayah's text for all surahs except
    // Al-Fatiha (handled above) and At-Tawbah (where it doesn't exist)
     if (!isFatiha && surahId !== 9 && index === 0 && text.startsWith(BISMILLAH)) {
       text = text.substring(BISMILLAH.length).trim();
       
       let bStartTime = currentTime;
       let bEndTime = currentTime + 5.0; // Typical Bismillah duration in tartil
       
       const savedMatch = savedSyncs?.find(s => s.isBismillah);
       if (savedMatch) {
         bStartTime = savedMatch.startTime;
         bEndTime = savedMatch.endTime;
       }
       
       const bWordsStr = BISMILLAH.split(' ');
       const totalBChars = bWordsStr.reduce((acc, w) => acc + w.length, 0);
       let currentBWordTime = bStartTime;
       const bDuration = bEndTime - bStartTime;
       
       const bWords = bWordsStr.map((wordStr: string, wIndex: number) => {
         const wDuration = (wordStr.length / totalBChars) * bDuration;
         const start = currentBWordTime;
         currentBWordTime += wDuration;
         return {
           id: `0-${wIndex}`,
           text: wordStr,
           root: deriveArabicRoot(wordStr),
           occurrences: 0,
           startTime: start,
           endTime: currentBWordTime
         };
       });
       
       currentTime = bEndTime + 1.0; // small pause
       
       result.push({
         id: 0,
         surahId,
         ayahNumber: 0,
         text: BISMILLAH,
         words: bWords,
         startTime: bStartTime,
         endTime: bEndTime,
         isBismillah: true
       });
    }

    const textWords = text.split(' ');
    
    let startTime = currentTime;
    // Better default estimation based on character length for Arabic reading pace
    let endTime = currentTime + (text.length * 0.12); 
    
    // Override with DB synced timings if available
    const savedMatch = savedSyncs?.find(s => s.ayahNumber === ayahNumber && !s.isBismillah);
    if (savedMatch) {
       startTime = savedMatch.startTime;
       endTime = savedMatch.endTime;
    } else if (savedSyncs && savedSyncs[index]) {
       // fallback index match in case ayahNumber matching fails
       startTime = savedSyncs[index].startTime;
       endTime = savedSyncs[index].endTime;
    }
    
    // Check if we have saved words with precise timings
    let words = [];
    if (savedMatch && savedMatch.words && savedMatch.words.length === textWords.length) {
      words = savedMatch.words;
      
      // Still need to make sure root property works or map it if missing in saved
      words = words.map(w => ({
         ...w,
         occurrences: w.occurrences || Math.floor(Math.random() * 50) + 1
      }));
    } else {
      const totalChars = textWords.reduce((acc: number, w: string) => acc + w.length, 0);
      let currentWordTime = startTime;
      const aDuration = endTime - startTime;
      
      words = textWords.map((wordStr: string, wIndex: number) => {
        const wDuration = totalChars > 0 ? (wordStr.length / totalChars) * aDuration : 0;
        const start = currentWordTime;
        currentWordTime += wDuration;
        return {
          id: `${ayahNumber}-${wIndex}`,
          text: wordStr,
          root: deriveArabicRoot(wordStr),
          occurrences: Math.floor(Math.random() * 50) + 1,
          startTime: start,
          endTime: currentWordTime
        };
      });
    }
    
    currentTime = endTime + 0.8; // pause between ayahs
    
    result.push({
      id: ayahNumber,
      surahId: apiData.number,
      ayahNumber,
      text,
      words,
      startTime,
      endTime
    });
  });
  
  return result;
}

export default async function SurahPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ highlight?: string; ayah?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const surahId = parseInt(resolvedParams.id, 10);
  
  const rawHighlight = resolvedSearchParams.highlight || resolvedSearchParams.ayah;
  const highlightAyah = rawHighlight ? parseInt(rawHighlight, 10) : undefined;
  
  if (isNaN(surahId) || surahId < 1 || surahId > 114) {
    return <div className="text-center p-20 text-2xl font-amiri">سورة غير صالحة.</div>;
  }

// Fetch real surah data from API
  let surahData = null;
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.quran-simple`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    // Decode as UTF-8 explicitly to avoid mojibake on some serverless runtimes
    const buffer = await res.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);
    const json = JSON.parse(text);
    surahData = json.data;
  } catch (error) {
    return <div className="text-center p-20 text-xl font-sans">حدث خطأ أثناء جلب السورة.</div>;
  }

  // Render INSTANTLY from embedded/local data — Firestore sync is merged
  // client-side by SurahViewer so network latency never blocks the page.
  const db = getDb();

  const savedSyncs: Ayah[] = db.surahSyncs[surahId] || [];
  const allVideos = [...MOCK_VIDEOS, ...db.videos];
  const dbAudio = (db.surahAudioIds && db.surahAudioIds[surahId] !== undefined)
    ? db.surahAudioIds[surahId] : "";
  const audioId = dbAudio || AUDIO_YOUTUBE_IDS[surahId] || "";

  const ayahs = processSurahData(surahData, savedSyncs);
  const surahVideos = allVideos.filter(v => v.surahId === surahId);

  return (
    <main>
      <SurahViewer 
        ayahs={ayahs} 
        videos={surahVideos} 
        youtubeAudioId={audioId} 
        surahName={surahData.name}
        highlightAyah={highlightAyah}
      />
    </main>
  );
}
