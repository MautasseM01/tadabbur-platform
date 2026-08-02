import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { MOCK_VIDEOS, AUDIO_YOUTUBE_IDS, VideoExplanation, Ayah } from './mock-data';
import { getDb, saveDb } from './db';

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

/**
 * Auth Functions
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      await saveUserProfile(user);
    }
    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    return null;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: user.displayName || 'مستخدم تدبر',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * User Notes Syncing (Firestore)
 */
export async function saveAyahNoteToFirestore(
  surahName: string,
  ayahId: string,
  ayahNumber: number,
  text: string
): Promise<void> {
  const user = auth.currentUser;

  // Always update LocalStorage as well for fast offline UI state
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

  // Firestore Sync if user is signed in
  if (user) {
    const noteDocId = `${surahName}_${ayahId}`.replace(/\s+/g, '_');
    const path = `users/${user.uid}/notes/${noteDocId}`;
    if (!text.trim()) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', noteDocId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      return;
    }

    const payload: NoteDoc = {
      id: noteDocId,
      surahName,
      ayahId,
      ayahNumber,
      text,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid, 'notes', noteDocId), payload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function fetchUserNotesFromFirestore(surahName: string): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    try {
      const key = `surah_notes_${surahName}`;
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  const path = `users/${user.uid}/notes`;
  try {
    const q = query(collection(db, 'users', user.uid, 'notes'), where('surahName', '==', surahName));
    const snap = await getDocs(q);
    const notesMap: Record<string, string> = {};
    snap.forEach((docSnap) => {
      const data = docSnap.data() as NoteDoc;
      if (data.ayahId && data.text) {
        notesMap[data.ayahId] = data.text;
      }
    });
    return notesMap;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return {};
  }
}

/**
 * User Progress Syncing (Firestore)
 */
export async function syncSurahProgressToFirestore(
  surahName: string,
  totalSeconds: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const docId = surahName.replace(/\s+/g, '_');
  const path = `users/${user.uid}/progress/${docId}`;
  const payload: ProgressDoc = {
    surahName,
    totalSeconds,
    userId: user.uid,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid, 'progress', docId), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncDashboardProgressToFirestore(progressData: any): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/progress/dashboard_summary`;
  try {
    await setDoc(
      doc(db, 'users', user.uid, 'progress', 'dashboard_summary'),
      {
        ...progressData,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchDashboardProgressFromFirestore(): Promise<any | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const path = `users/${user.uid}/progress/dashboard_summary`;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'progress', 'dashboard_summary'));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Video Explanations Firestore CRUD & Seeding
 */
export async function getVideosFirestore(): Promise<VideoExplanation[]> {
  const path = 'videos';
  try {
    const snap = await getDocs(collection(db, 'videos'));
    if (snap.empty) {
      // Seed default videos to Firestore from local DB & mock data if empty
      const localDb = getDb();
      const combined = [...MOCK_VIDEOS, ...localDb.videos];
      const unique = Array.from(new Map(combined.map(v => [v.id, v])).values());
      
      for (const v of unique) {
        await setDoc(doc(db, 'videos', v.id), v, { merge: true });
      }
      return unique;
    }

    const videosList: VideoExplanation[] = [];
    snap.forEach((docSnap) => {
      videosList.push(docSnap.data() as VideoExplanation);
    });
    // Always merge with local JSON DB + mock videos (union by id) so nothing
    // disappears even when Firestore is unreachable or only partially seeded.
    const localDb = getDb();
    const merged = [...MOCK_VIDEOS, ...localDb.videos, ...videosList];
    return Array.from(new Map(merged.map(v => [v.id, v])).values());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    // Local-first fallback: include local JSON DB videos so admin additions survive
    const localDb = getDb();
    return [...MOCK_VIDEOS, ...localDb.videos];
  }
}

export async function addVideoFirestore(video: VideoExplanation): Promise<void> {
  const path = `videos/${video.id}`;

  // 1. Save locally FIRST so data is never lost (even without Firebase access)
  try {
    const localDb = getDb();
    const exists = localDb.videos.some(v => v.id === video.id);
    localDb.videos = exists
      ? localDb.videos.map(v => (v.id === video.id ? video : v))
      : [...localDb.videos, video];
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to save video to local DB:', err);
  }

  // 2. Best-effort sync to Firestore
  try {
    await setDoc(doc(db, 'videos', video.id), video, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteVideoFirestore(videoId: string): Promise<void> {
  const path = `videos/${videoId}`;

  // 1. Remove locally FIRST
  try {
    const localDb = getDb();
    localDb.videos = localDb.videos.filter(v => v.id !== videoId);
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to delete video from local DB:', err);
  }

  // 2. Best-effort sync to Firestore
  try {
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Surah Audio ID Firestore CRUD & Seeding
 */
export async function getSurahAudioIdFirestore(surahId: number): Promise<string> {
  const docId = surahId.toString();
  const path = `surahAudios/${docId}`;
  try {
    const snap = await getDoc(doc(db, 'surahAudios', docId));
    if (snap.exists()) {
      const data = snap.data();
      return data.youtubeId || '';
    }
    
    // Check local fallback
    const localDb = getDb();
    if (localDb.surahAudioIds && localDb.surahAudioIds[surahId] !== undefined) {
      return localDb.surahAudioIds[surahId];
    }
    return AUDIO_YOUTUBE_IDS[surahId] || '';
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    const localDb = getDb();
    if (localDb.surahAudioIds && localDb.surahAudioIds[surahId] !== undefined) {
      return localDb.surahAudioIds[surahId];
    }
    return AUDIO_YOUTUBE_IDS[surahId] || '';
  }
}

export async function getAllSurahAudioIdsFirestore(): Promise<Record<number, string>> {
  const path = 'surahAudios';
  try {
    const snap = await getDocs(collection(db, 'surahAudios'));
    const map: Record<number, string> = {};

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.surahId && data.youtubeId !== undefined) {
        map[data.surahId] = data.youtubeId;
      }
    });

    // Seed defaults if missing
    for (const [sId, ytId] of Object.entries(AUDIO_YOUTUBE_IDS)) {
      const numId = Number(sId);
      if (map[numId] === undefined) {
        map[numId] = ytId;
      }
    }

    return map;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return AUDIO_YOUTUBE_IDS;
  }
}

export async function saveSurahAudioIdFirestore(surahId: number, youtubeId: string): Promise<void> {
  const docId = surahId.toString();
  const path = `surahAudios/${docId}`;

  // 1. Save locally FIRST so data is never lost
  try {
    const localDb = getDb();
    if (!localDb.surahAudioIds) localDb.surahAudioIds = {};
    localDb.surahAudioIds[surahId] = youtubeId.trim();
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to save audio ID to local DB:', err);
  }

  // 2. Best-effort sync to Firestore
  try {
    await setDoc(doc(db, 'surahAudios', docId), {
      surahId,
      youtubeId: youtubeId.trim(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Surah Sync Timings Firestore CRUD
 */
export async function getSurahSyncsFirestore(surahId: number): Promise<Ayah[]> {
  const docId = surahId.toString();
  const path = `surahSyncs/${docId}`;
  try {
    const snap = await getDoc(doc(db, 'surahSyncs', docId));
    if (snap.exists()) {
      const data = snap.data();
      if (data.ayahsJson) {
        return JSON.parse(data.ayahsJson) as Ayah[];
      }
    }
    
    // Check local backup DB
    const localDb = getDb();
    return localDb.surahSyncs[surahId] || [];
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    const localDb = getDb();
    return localDb.surahSyncs[surahId] || [];
  }
}

export async function saveSurahSyncsFirestore(surahId: number, ayahs: Ayah[]): Promise<void> {
  const docId = surahId.toString();
  const path = `surahSyncs/${docId}`;

  // 1. Save locally FIRST so sync work is never lost
  try {
    const localDb = getDb();
    localDb.surahSyncs[surahId] = ayahs;
    saveDb(localDb);
  } catch (err) {
    console.warn('Failed to save syncs to local DB:', err);
  }

  // 2. Best-effort sync to Firestore
  try {
    const payload = {
      surahId,
      ayahsJson: JSON.stringify(ayahs),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'surahSyncs', docId), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Seed all initial local DB items to Firestore
 */
export async function seedLocalDbToFirestore(): Promise<void> {
  const localDb = getDb();

  // 1. Seed Videos
  const combinedVideos = [...MOCK_VIDEOS, ...localDb.videos];
  const uniqueVideos = Array.from(new Map(combinedVideos.map(v => [v.id, v])).values());
  for (const v of uniqueVideos) {
    await addVideoFirestore(v);
  }

  // 2. Seed Surah Audio IDs
  const audioMap = { ...AUDIO_YOUTUBE_IDS, ...localDb.surahAudioIds };
  for (const [surahIdStr, ytId] of Object.entries(audioMap)) {
    const surahId = Number(surahIdStr);
    await saveSurahAudioIdFirestore(surahId, ytId);
  }

  // 3. Seed Surah Syncs
  for (const [surahIdStr, ayahs] of Object.entries(localDb.surahSyncs)) {
    const surahId = Number(surahIdStr);
    await saveSurahSyncsFirestore(surahId, ayahs);
  }
}
