import { Ayah } from './mock-data';
import { TRACKED_DB } from './trackedDb';

export interface VideoExplanation {
  id: string;
  surahId: number;
  ayahNumber: number;
  youtubeId: string;
  startTime: number;
  title: string;
  scholar: string;
}

export interface AppDatabase {
  videos: VideoExplanation[];
  surahSyncs: Record<number, Ayah[]>; // SurahID -> Ayah sync info
  surahAudioIds: Record<number, string>; // SurahID -> YouTube Video ID
}

export function getDb(): AppDatabase {
  if (typeof window !== 'undefined') {
    return TRACKED_DB;
  }
  try {
    const fs = eval("require")('fs');
    const path = eval("require")('path');
    const DB_PATH = path.join(process.cwd(), 'data', 'app-db.json');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(TRACKED_DB, null, 2), 'utf-8');
      return { ...TRACKED_DB };
    }
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as AppDatabase;
    // Merge embedded data as a base so nothing is lost even if the runtime
    // file is stale or partially missing (e.g. serverless deployments).
    return {
      videos: Array.from(new Map([...TRACKED_DB.videos, ...(raw.videos || [])].map(v => [v.id, v])).values()),
      surahAudioIds: { ...TRACKED_DB.surahAudioIds, ...(raw.surahAudioIds || {}) },
      surahSyncs: { ...TRACKED_DB.surahSyncs, ...(raw.surahSyncs || {}) },
    };
  } catch {
    return { ...TRACKED_DB };
  }
}

export function saveDb(data: AppDatabase) {
  if (typeof window !== 'undefined') return;
  try {
    const fs = eval("require")('fs');
    const path = eval("require")('path');
    const DB_PATH = path.join(process.cwd(), 'data', 'app-db.json');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('saveDb error:', err);
  }
}

