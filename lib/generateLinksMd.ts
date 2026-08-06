import { SURAH_NAMES, getNuzulRank } from './surahs';
import { AUDIO_YOUTUBE_IDS } from './mock-data';
import { getDb, AppDatabase } from './db';

export function youtubeLink(id: string, startTime?: number): string {
  const base = `https://www.youtube.com/watch?v=${id}`;
  return startTime && startTime > 0 ? `${base}&t=${startTime}` : base;
}

// Generates a full markdown document listing, for every surah (mushafi order),
// its recitation link and its tafsir video links. Serves as a durable
// text-memory layer on top of localStorage/Firebase.
export function generateLinksMarkdown(db?: AppDatabase): string {
  const data = db || getDb();

  const lines: string[] = [];
  lines.push('# فهرس روابط السور — منصة التدبر التفاعلية');
  lines.push('');
  lines.push(
    `> ملف ذاكرة يُولَّد تلقائيًا. آخر تحديث: ${new Date().toISOString()}`
  );
  lines.push('');
  lines.push(`يحتوي الفهرس روابط التلاوة وفيديوهات التفسير لسور القرآن الكريم (114 سورة).`);
  lines.push('');

  for (let id = 1; id <= 114; id++) {
    const name = SURAH_NAMES[id - 1];
    lines.push(`## ${id}. سورة ${name}`);
    lines.push('');

    const audioId = data.surahAudioIds?.[id] ?? AUDIO_YOUTUBE_IDS[id];
    if (audioId) {
      lines.push(`- **التلاوة:** [مشاهدة](https://www.youtube.com/watch?v=${audioId})`);
    } else {
      lines.push(`- **التلاوة:** غير متوفرة بعد`);
    }

    const videos = (data.videos || []).filter((v) => v.surahId === id);
    if (videos.length === 0) {
      lines.push(`- **التفسير:** غير متوفر بعد`);
    } else {
      lines.push(`- **التفسير:**`);
      for (const v of videos) {
        const ayahLabel = v.ayahNumber ? ` — الآية ${v.ayahNumber}` : '';
        const scholarLabel = v.scholar ? ` — ${v.scholar}` : '';
        lines.push(
          `  - [${v.title}](${youtubeLink(v.youtubeId, v.startTime)})${ayahLabel}${scholarLabel}`
        );
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
