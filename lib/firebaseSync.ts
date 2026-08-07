import { MOCK_VIDEOS, AUDIO_YOUTUBE_IDS, VideoExplanation, Ayah } from './mock-data';
import { getDb, saveDb } from './db';

/**
 * Local-only persistence layer (no Firebase).
 * Keeps the same function names as the former Firestore sync module so all
 * callers work unchanged: data is saved to localStorage (browser) and to
 * data/app-db.json (server), which is embedded at build time as the static DB.
 */

export interface NoteDoc {
  id: string;
  surahName: string;
  ayahId: string;
  ayahNumber: number;
  text: string;
  userId: string;
  updatedAt: string;
}

export interface ProgressDoc {
  surahName: string;
  totalSeconds: number;
  readPercent?: number;
  analyzedWordsCount?: number;
  userId: string;
  updatedAt: string;
}

const PROGRESS_STORAGE_KEY = 'tadabbur_progress_data_v1';

/**
 * Auth Functions (local mode: no account system, always signed out)
 */
export async function loginWithGoogle(): Promise<null> {
  return null;
}

export async function logoutFirebase(): Promise<void> {
  // no-op
}

export function onAuthChange(callback: (user: null) => void) {
  callback(null);
  return () => {};
}

export async function saveUserProfile(): Promise<void> {
  // no-op
}

/**
 * User Notes (localStorage)
 */
export async function saveAyahNoteToFirestore(
  surahName: string,
  ayahId: string,
  _ayahNumber: number,
  text: string
): Promise<void> {
  try {
    const key = `surah_notes_${surahName}`;
    const localSaved = localStorage.getItem(key) || '{}';
    const parsed = JSON.parse(localSaved);
    if (text.trim()) {
      parsed[ayahId] = text;
    } else {
      delete parsed[ayahId];
    }
    localStorage.setItem(key, JSON.stringify(parsed));
  } catch {
    // ignore local storage errors
  }
}

export async function fetchUserNotesFromFirestore(surahName: string): Promise<Record<string, string>> {
  try {
    const key = `surah_notes_${surahName}`;
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

/**
 * User Progress (localStorage — same key used by TadabburProgressWidget)
 */
export async function syncSurahProgressToFirestore(
  _surahName?: string,
  _totalSeconds?: number
): Promise<void> {
  // no-op (progress is already persisted to localStorage by the callers)
}

export async function syncDashboardProgressToFirestore(_progressData?: any): Promise<void> {
  // no-op (progress is already persisted to localStorage by the callers)
}

export async function fetchDashboardProgressFromFirestore(): Promise<any | null> {
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Video Explanations (local JSON DB)
 */
export async function getVideosFirestore(): Promise<VideoExplanation[]> {
  const localDb = getDb();
  const merged = [...MOCK_VIDEOS, ...localDb.videos];
  return Array.from(new Map(merged.map((v) => [v.id, v])).values());
}

export async function addVideoFirestore(video: VideoExplanation): Promise<void> {
  try {
    const localDb = getDb();
    const exists = localDb.videos.some((v) => v.id === video.id);
    localDb.videos = exists
      ? localDb.videos.map((v) => (v.id === video.id ? video : v))
      : [...localDb.videos, video];
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to save video to local DB:', err);
  }
}

export async function deleteVideoFirestore(videoId: string): Promise<void> {
  try {
    const localDb = getDb();
    localDb.videos = localDb.videos.filter((v) => v.id !== videoId);
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to delete video from local DB:', err);
  }
}

/**
 * Surah Audio IDs (local JSON DB)
 */
export async function getSurahAudioIdFirestore(surahId: number): Promise<string> {
  const localDb = getDb();
  if (localDb.surahAudioIds && localDb.surahAudioIds[surahId] !== undefined) {
    return localDb.surahAudioIds[surahId];
  }
  return AUDIO_YOUTUBE_IDS[surahId] || '';
}

export async function getAllSurahAudioIdsFirestore(): Promise<Record<number, string>> {
  const localDb = getDb();
  const map: Record<number, string> = { ...AUDIO_YOUTUBE_IDS };
  for (const [k, v] of Object.entries(localDb.surahAudioIds || {})) {
    if (v) map[Number(k)] = v;
  }
  return map;
}

export async function saveSurahAudioIdFirestore(surahId: number, youtubeId: string): Promise<void> {
  try {
    const localDb = getDb();
    if (!localDb.surahAudioIds) localDb.surahAudioIds = {};
    localDb.surahAudioIds[surahId] = youtubeId.trim();
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to save audio ID to local DB:', err);
  }
}

/**
 * Surah Syncs (local JSON DB)
 */
export async function getSurahSyncsFirestore(surahId: number): Promise<Ayah[]> {
  const localDb = getDb();
  return localDb.surahSyncs?.[surahId] || [];
}

export async function saveSurahSyncsFirestore(surahId: number, ayahs: Ayah[]): Promise<void> {
  try {
    const localDb = getDb();
    if (!localDb.surahSyncs) localDb.surahSyncs = {};
    localDb.surahSyncs[surahId] = ayahs;
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to save surah syncs to local DB:', err);
  }
}

export async function seedLocalDbToFirestore(): Promise<void> {
  // no-op (local DB is the single source of truth)
}
