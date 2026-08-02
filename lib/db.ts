import { Ayah } from './mock-data';

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

const defaultData: AppDatabase = {
  videos: [],
  surahSyncs: {},
  surahAudioIds: {}
};

export function getDb(): AppDatabase {
  if (typeof window !== 'undefined') {
    return defaultData;
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
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as AppDatabase;
  } catch {
    return defaultData;
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

