'use server';

import { getDb, saveDb } from '@/lib/db';
import { Ayah, AUDIO_YOUTUBE_IDS } from '@/lib/mock-data';
import {
  getSurahAudioIdFirestore,
  saveSurahAudioIdFirestore,
  getSurahSyncsFirestore,
  saveSurahSyncsFirestore,
} from '@/lib/firebaseSync';

const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

// Same glyph-insensitive comparison used by the reader page (alef-wasla,
// farsi yeh, dagger alif, tatweel...) so بسم الله splits reliably on every
// API response, whatever the letter variants are.
function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED\u200c\u200d\u200e\u200f\s]/g, '')
    .replace(/\u0671/g, '\u0627')
    .replace(/\u06CC/g, '\u064A')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u06A9/g, '\u0643')
    .replace(/\u0623|\u0625/g, '\u0627');
}

function splitBismillah(text: string): { bismillahText: string | null; restText: string } {
  const words = text.trim().split(/\s+/);
  if (
    words.length >= 4 &&
    normalizeArabic(words.slice(0, 4).join('')) === normalizeArabic(BISMILLAH)
  ) {
    return { bismillahText: words.slice(0, 4).join(' '), restText: words.slice(4).join(' ').trim() };
  }
  return { bismillahText: null, restText: text };
}

function makeBismillahAyah(surahId: number, text: string, startTime: number): Ayah {
  const endTime = startTime + 5.0;
  const bWordsStr = text.split(' ');
  const totalBChars = bWordsStr.reduce((acc, w) => acc + w.length, 0);
  let currentBTime = startTime;

  const bWords = bWordsStr.map((w, wIdx) => {
    const wd = (w.length / totalBChars) * 5.0;
    const start = currentBTime;
    currentBTime += wd;
    return { id: `0-${wIdx}`, text: w, root: '---', occurrences: 0, startTime: start, endTime: currentBTime };
  });

  return {
    id: 0,
    surahId,
    ayahNumber: 0,
    text,
    words: bWords,
    startTime,
    endTime,
    isBismillah: true,
  };
}

export async function fetchSurahAudioId(surahId: number) {
  const audioId = await getSurahAudioIdFirestore(surahId);
  if (audioId) return audioId;

  const db = getDb();
  if (db.surahAudioIds && db.surahAudioIds[surahId] !== undefined) {
     return db.surahAudioIds[surahId];
  }
  return AUDIO_YOUTUBE_IDS[surahId] || "";
}

export async function saveSurahAudioId(surahId: number, audioId: string) {
  await saveSurahAudioIdFirestore(surahId, audioId);
  return { success: true };
}

export async function runAutoSyncEstimate(surahId: number, ayahs: Ayah[]) {
  // Honest label: this is a rule-based timing ESTIMATE (chars assumed read at
  // ~0.12s), not an AI audio-to-text alignment. It seeds rough timestamps that
  // the admin can fine-tune manually.
  await new Promise(r => setTimeout(r, 800));
  
  let currentTime = 1.0; 
  if (surahId === 21) currentTime = 12.0;

  const newAyahs = ayahs.map(ayah => {
    // Better tartil sync estimation: ~0.12s per character
    const duration = ayah.text.length * 0.12; 
    let startTime = Number(currentTime.toFixed(2));
    let endTime = Number((startTime + duration).toFixed(2));
    
    // Add brief pause between ayahs or bismillah blocks
    currentTime = endTime + 0.8; 
    
    // Special hardcoded fallback correction for Surah 21 Bismillah
    if (surahId === 21 && ayah.isBismillah) {
      startTime = 12.0;
      endTime = 16.5;
      currentTime = 17.5;
    }
    
    // Create words array if empty
    const textWords = ayah.text.split(' ');
    const totalChars = textWords.reduce((acc, w) => acc + w.length, 0);
    let currentWordTime = startTime;
    const aDuration = endTime - startTime;
    
    const words = textWords.map((wordStr: string, wIndex: number) => {
      const wDuration = totalChars > 0 ? (wordStr.length / totalChars) * aDuration : 0;
      const start = currentWordTime;
      currentWordTime += wDuration;
      return {
        id: `${ayah.ayahNumber}-${wIndex}`,
        text: wordStr,
        root: "---",
        occurrences: 0,
        startTime: start,
        endTime: currentWordTime
      };
    });
    
    return { ...ayah, words, startTime, endTime };
  });
  
  return newAyahs;
}

export async function fetchSurahSyncs(surahId: number) {
  let existing: Ayah[] = [];
  existing = await getSurahSyncsFirestore(surahId);
  
  if (existing.length === 0) {
    // If not existing, let's fetch from the external API to seed it!
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.quran-simple`);
      const json = await res.json();
      
      let currentTime = 0.0;
      const result: Ayah[] = [];
      
      json.data.ayahs.forEach((ayah: any, index: number) => {
        // Al-Fatiha: the API ships the Bismillah as its own first ayah → always
        // separate it and renumber real ayahs from 1 (same as the reader page).
        if (surahId === 1 && index === 0) {
          result.push(makeBismillahAyah(surahId, ayah.text.trim() || BISMILLAH, 0.0));
          currentTime = 6.0;
          return;
        }

        let text = ayah.text;
        const ayahNumber = surahId === 1 ? ayah.numberInSurah - 1 : ayah.numberInSurah;

        if (index === 0) {
          const split = splitBismillah(text);
          if (split.bismillahText) {
            result.push(makeBismillahAyah(surahId, split.bismillahText, currentTime));
            text = split.restText;
            currentTime = Number((currentTime + 5.0 + 1.0).toFixed(2));
          }
        }
        
        const endTime = currentTime + (text.length * 0.12);
        result.push({
            id: ayahNumber,
            surahId,
            ayahNumber,
            text,
            words: [],
            startTime: currentTime,
            endTime: endTime
        });
        currentTime = endTime + 1.0;
      });
      return result;
    } catch {
       return [];
    }
  } else {
     // Backward compatibility: if the stored first ayah still contains the
     // Bismillah prefix (glyph variants included), split it out.
     if (
       surahId !== 1 && surahId !== 9 &&
       existing.length > 0 &&
       existing[0].ayahNumber === 1 &&
       existing[0].text.trim().startsWith(BISMILLAH)
     ) {
       const split = splitBismillah(existing[0].text);
       if (split.bismillahText) {
         const bStartTime = existing[0].startTime;
         existing.unshift(makeBismillahAyah(surahId, split.bismillahText, bStartTime));
         existing[1] = { ...existing[1], text: split.restText, startTime: bStartTime + 5 };
       }
     }
  }
  
  return existing;
}

export async function saveSurahSyncs(surahId: number, ayahs: Ayah[]) {
  await saveSurahSyncsFirestore(surahId, ayahs);
  return { success: true };
}
