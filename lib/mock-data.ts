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

export const MOCK_VIDEOS: VideoExplanation[] = [
  {
    id: "v1",
    surahId: 21,
    ayahNumber: 1,
    youtubeId: "V_xyz_dummy1", 
    startTime: 20,
    title: "اقتراب الحساب وغفلة الناس - رؤية قرآنية معاصرة",
    scholar: "د. محمد شحرور",
  },
  {
    id: "v2",
    surahId: 21,
    ayahNumber: 1,
    youtubeId: "V_xyz_dummy2", 
    startTime: 120,
    title: "بلاغة (اقترب للناس حسابهم) - من قائمة التشغيل المنقحة",
    scholar: "د. فاضل السامرائي",
  },
  {
    id: "v3",
    surahId: 21,
    ayahNumber: 4,
    youtubeId: "V_xyz_dummy3", 
    startTime: 345,
    title: "منهجية التفكير في (قال ربي يعلم القول)",
    scholar: "د. محمد شحرور",
  },
  {
    id: "v4",
    surahId: 21,
    ayahNumber: 30,
    youtubeId: "V_xyz_dummy4", 
    startTime: 820,
    title: "أولم ير الذين كفروا أن السماوات والأرض كانتا رتقا ففتقناهما",
    scholar: "د. فاضل السامرائي",
  },
  {
    id: "v5",
    surahId: 21,
    ayahNumber: 83,
    youtubeId: "XQx8n4kR-g8", 
    startTime: 0,
    title: "لمسات بيانية في قصة أيوب عليه السلام - قائمة التشغيل",
    scholar: "د. فاضل السامرائي",
  },
  {
    id: "v6",
    surahId: 21,
    ayahNumber: 87,
    youtubeId: "aU-k2Z8j0nI", 
    startTime: 15,
    title: "دعاء ذي النون (لا إله إلا أنت سبحانك) - قائمة التشغيل",
    scholar: "د. فاضل السامرائي",
  }
];

export const AUDIO_YOUTUBE_IDS: Record<number, string> = {
  21: "0h7Cuotfbjw", // Surah Al-Anbiya
  1: "b0V-x7e0m18"   // Surah Al-Fatiha placeholder
};
