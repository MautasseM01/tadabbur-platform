import { AUDIO_YOUTUBE_IDS, VideoExplanation, Ayah } from './mock-data';
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
 * Runtime overlay (browser localStorage).
 *
 * The static file data/app-db.json cannot be written at runtime on serverless
 * deployments (read-only filesystem), so all admin saves are persisted here in
 * the browser and merged on top of the embedded data everywhere the app reads.
 */
const LOCAL_OVERLAY_KEY = 'tadabbur_db_overlay_v1';

export interface LocalOverlay {
  videos: VideoExplanation[];
  surahAudioIds: Record<number, string>;
  surahSyncs: Record<number, Ayah[]>;
}

const EMPTY_OVERLAY: LocalOverlay = { videos: [], surahAudioIds: {}, surahSyncs: {} };

export function readLocalOverlay(): LocalOverlay | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_OVERLAY_KEY);
    return raw ? (JSON.parse(raw) as LocalOverlay) : null;
  } catch {
    return null;
  }
}

export function writeLocalOverlay(data: LocalOverlay): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_OVERLAY_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (private mode, full quota, ...)
  }
}

function mergeOverlay(base: LocalOverlay, overlay: LocalOverlay | null): LocalOverlay {
  if (!overlay) return base;
  return {
    videos: Array.from(
      new Map([...base.videos, ...(overlay.videos || [])].map((v) => [v.id, v])).values()
    ),
    surahAudioIds: { ...base.surahAudioIds, ...(overlay.surahAudioIds || {}) },
    surahSyncs: { ...base.surahSyncs, ...(overlay.surahSyncs || {}) },
  };
}

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
 * Video Explanations (local JSON DB + runtime overlay)
 */
export async function getVideosFirestore(): Promise<VideoExplanation[]> {
  const localDb = getDb();
  return mergeOverlay({ ...EMPTY_OVERLAY, videos: localDb.videos }, readLocalOverlay()).videos;
}

export async function addVideoFirestore(video: VideoExplanation): Promise<void> {
  // 1) Browser overlay — the durable runtime memory on any deployment
  const overlay = readLocalOverlay() || { ...EMPTY_OVERLAY };
  const exists = overlay.videos.some((v) => v.id === video.id);
  overlay.videos = exists
    ? overlay.videos.map((v) => (v.id === video.id ? video : v))
    : [...overlay.videos, video];
  writeLocalOverlay(overlay);
  // 2) Server file (dev only — read-only on serverless)
  if (typeof window === 'undefined') {
    try {
      const localDb = getDb();
      const fileExists = localDb.videos.some((v) => v.id === video.id);
      localDb.videos = fileExists
        ? localDb.videos.map((v) => (v.id === video.id ? video : v))
        : [...localDb.videos, video];
      saveDb(localDb);
    } catch (err) {
      console.warn('Failed to save video to local DB:', err);
    }
  }
}

export async function deleteVideoFirestore(videoId: string): Promise<void> {
  // 1) Browser overlay
  const overlay = readLocalOverlay() || { ...EMPTY_OVERLAY };
  overlay.videos = overlay.videos.filter((v) => v.id !== videoId);
  writeLocalOverlay(overlay);
  // 2) Server file (dev only)
  if (typeof window === 'undefined') {
    try {
      const localDb = getDb();
      localDb.videos = localDb.videos.filter((v) => v.id !== videoId);
      saveDb(localDb);
    } catch (err) {
      console.warn('Failed to delete video from local DB:', err);
    }
  }
}

/**
 * Surah Audio IDs (local JSON DB + runtime overlay)
 */
export async function getSurahAudioIdFirestore(surahId: number): Promise<string> {
  const overlay = readLocalOverlay();
  if (overlay && overlay.surahAudioIds && overlay.surahAudioIds[surahId] !== undefined) {
    return overlay.surahAudioIds[surahId];
  }
  const localDb = getDb();
  if (localDb.surahAudioIds && localDb.surahAudioIds[surahId] !== undefined) {
    return localDb.surahAudioIds[surahId];
  }
  return AUDIO_YOUTUBE_IDS[surahId] || '';
}

export async function getAllSurahAudioIdsFirestore(): Promise<Record<number, string>> {
  const localDb = getDb();
  const merged: Record<number, string> = { ...AUDIO_YOUTUBE_IDS };
  for (const [k, v] of Object.entries(localDb.surahAudioIds || {})) {
    if (v) merged[Number(k)] = v;
  }
  const overlay = readLocalOverlay();
  for (const [k, v] of Object.entries(overlay?.surahAudioIds || {})) {
    if (v) merged[Number(k)] = v;
  }
  return merged;
}

export async function saveSurahAudioIdFirestore(surahId: number, youtubeId: string): Promise<void> {
  // 1) Browser overlay — the durable runtime memory on any deployment
  const overlay = readLocalOverlay() || { ...EMPTY_OVERLAY };
  if (!overlay.surahAudioIds) overlay.surahAudioIds = {};
  overlay.surahAudioIds[surahId] = youtubeId.trim();
  writeLocalOverlay(overlay);
  // 2) Server file (dev only)
  if (typeof window === 'undefined') {
    try {
      const localDb = getDb();
      if (!localDb.surahAudioIds) localDb.surahAudioIds = {};
      localDb.surahAudioIds[surahId] = youtubeId.trim();
      saveDb(localDb);
    } catch (err) {
      console.warn('Failed to save audio ID to local DB:', err);
    }
  }
}

/**
 * Surah Syncs (local JSON DB + runtime overlay)
 */
export async function getSurahSyncsFirestore(surahId: number): Promise<Ayah[]> {
  const overlay = readLocalOverlay();
  if (overlay && overlay.surahSyncs && overlay.surahSyncs[surahId] && overlay.surahSyncs[surahId].length > 0) {
    return overlay.surahSyncs[surahId];
  }
  const localDb = getDb();
  return localDb.surahSyncs?.[surahId] || [];
}

export async function saveSurahSyncsFirestore(surahId: number, ayahs: Ayah[]): Promise<void> {
  // 1) Browser overlay — the durable runtime memory on any deployment
  const overlay = readLocalOverlay() || { ...EMPTY_OVERLAY };
  if (!overlay.surahSyncs) overlay.surahSyncs = {};
  overlay.surahSyncs[surahId] = ayahs;
  writeLocalOverlay(overlay);
  // 2) Server file (dev only)
  if (typeof window === 'undefined') {
    try {
      const localDb = getDb();
      if (!localDb.surahSyncs) localDb.surahSyncs = {};
      localDb.surahSyncs[surahId] = ayahs;
      saveDb(localDb);
    } catch (err) {
      console.warn('Failed to save surah syncs to local DB:', err);
    }
  }
}

export async function seedLocalDbToFirestore(): Promise<void> {
  // no-op (local DB is the single source of truth)
}
