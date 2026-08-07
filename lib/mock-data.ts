export type Word = {
  id: string;
  text: string;
  root: string;
  occurrences: number;
  startTime?: number; // in seconds
  endTime?: number; // in seconds
};

export type Ayah = {
  id: number;
  surahId: number;
  ayahNumber: number;
  text: string;
  words: Word[];
  startTime: number; // in seconds
  endTime: number; // in seconds
  isBismillah?: boolean;
};

export type VideoExplanation = {
  id: string;
  surahId: number;
  ayahNumber: number;
  youtubeId: string;
  startTime: number;
  title: string;
  scholar: string;
};

// Real tafsir videos live in data/app-db.json (embedded at build time) and in
// the browser localStorage overlay (runtime additions). No mock placeholders.
export const MOCK_VIDEOS: VideoExplanation[] = [];

export const AUDIO_YOUTUBE_IDS: Record<number, string> = {
  21: "0h7Cuotfbjw", // Surah Al-Anbiya
  1: "MDVTdJRGKOo"   // Surah Al-Fatiha (عبدالرحمن العوسي)
};
