'use server';

import { getDb } from '@/lib/db';
import { Ayah, AUDIO_YOUTUBE_IDS } from '@/lib/mock-data';
import {
  getSurahAudioIdFirestore,
  saveSurahAudioIdFirestore,
  getSurahSyncsFirestore,
  saveSurahSyncsFirestore,
} from '@/lib/firebaseSync';

export async function fetchSurahAudioId(surahId: number) {
  try {
    const audioId = await getSurahAudioIdFirestore(surahId);
    if (audioId) return audioId;
  } catch (err) {
    console.warn('Firestore fetch audio error, falling back to local DB:', err);
  }

  const db = getDb();
  if (db.surahAudioIds && db.surahAudioIds[surahId] !== undefined) {
     return db.surahAudioIds[surahId];
  }
  return AUDIO_YOUTUBE_IDS[surahId] || "";
}

export async function saveSurahAudioId(surahId: number, audioId: string) {
  try {
    await saveSurahAudioIdFirestore(surahId, audioId);
  } catch (err) {
    console.error('Failed to save audio ID to Firestore:', err);
  }
  return { success: true };
}

export async function runAIAutoSync(surahId: number, ayahs: Ayah[]) {
  // Simulate AI Audio-to-Text alignment using a more accurate character-based formula
  await new Promise(r => setTimeout(r, 2000));
  
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
        occurrences: 1,
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
  try {
    existing = await getSurahSyncsFirestore(surahId);
  } catch (err) {
    console.warn('Firestore fetch syncs error, fallback to local DB:', err);
    const db = getDb();
    existing = db.surahSyncs[surahId] || [];
  }
  
  const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  
  if (existing.length === 0) {
    // If not existing, let's fetch from the external API to seed it!
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/ar.quran-simple`);
      const json = await res.json();
      
      let currentTime = 0.0;
      let result: Ayah[] = [];
      
      json.data.ayahs.forEach((ayah: any, index: number) => {
         let text = ayah.text;
         if (surahId !== 1 && surahId !== 9 && index === 0 && text.startsWith(BISMILLAH)) {
           text = text.substring(BISMILLAH.length).trim();
           
           const bStartTime = currentTime;
           const bEndTime = currentTime + 5.0;
           const bDuration = 5.0;
           const bWordsStr = BISMILLAH.split(' ');
           const totalBChars = bWordsStr.reduce((acc, w) => acc + w.length, 0);
           let currentBTime = bStartTime;
           
           const bWords = bWordsStr.map((w, wIdx) => {
             const wd = (w.length / totalBChars) * bDuration;
             const start = currentBTime;
             currentBTime += wd;
             return { id: `0-${wIdx}`, text: w, root: '---', occurrences: 1, startTime: start, endTime: currentBTime };
           });
           
           result.push({
             id: 0,
             surahId,
             ayahNumber: 0, // 0 for Bismillah
             text: BISMILLAH,
             words: bWords,
             startTime: bStartTime,
             endTime: bEndTime,
             isBismillah: true
           });
           currentTime += 6.0;
         }
         
         let endTime = currentTime + (text.length * 0.12);
         result.push({
             id: ayah.numberInSurah,
             surahId,
             ayahNumber: ayah.numberInSurah,
             text: text,
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
     // If we read from DB, check if we need to split Bismillah for backward compatibility
     if (surahId !== 1 && surahId !== 9 && existing.length > 0 && existing[0].ayahNumber === 1 && existing[0].text.startsWith(BISMILLAH)) {
        const text = existing[0].text.substring(BISMILLAH.length).trim();
        
        const bStartTime = existing[0].startTime;
        const bEndTime = existing[0].startTime + 5;
        const bDuration = 5.0;
        const bWordsStr = BISMILLAH.split(' ');
        const totalBChars = bWordsStr.reduce((acc, w) => acc + w.length, 0);
        let currentBTime = bStartTime;
        
        const bWords = bWordsStr.map((w, wIdx) => {
          const wd = (w.length / totalBChars) * bDuration;
          const start = currentBTime;
          currentBTime += wd;
          return { id: `0-${wIdx}`, text: w, root: '---', occurrences: 1, startTime: start, endTime: currentBTime };
        });

        const bAyah: Ayah = {
           id: 0,
           surahId,
           ayahNumber: 0,
           text: BISMILLAH,
           words: bWords,
           startTime: bStartTime,
           endTime: bEndTime,
           isBismillah: true
        };
        existing[0].text = text;
        existing[0].startTime += 5;
        existing.unshift(bAyah);
     }
  }
  
  return existing;
}

export async function saveSurahSyncs(surahId: number, ayahs: Ayah[]) {
  try {
    await saveSurahSyncsFirestore(surahId, ayahs);
  } catch (err) {
    console.error('Failed to save surah syncs to Firestore:', err);
  }
  return { success: true };
}
