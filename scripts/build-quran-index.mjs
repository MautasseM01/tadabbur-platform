/**
 * Builds the Quran concordance assets:
 *   data/quran-corpus.json — all 6236 ayahs [{s, a, t}] (normalized count logic skips the 113 opening basmalas, matching scholarly counts)
 *   data/quran-index.json  — totals, word frequencies, common bigrams, top terms
 *
 * Run: node scripts/build-quran-index.mjs   (needs network)
 */
import fs from 'fs';
import path from 'path';

const API = 'https://api.alquran.cloud/v1/surah';
const OUT_DIR = new URL('../data/', import.meta.url);

function normalizeArabic(s) {
  return s
    .replace(/[\n\t\r]/g, ' ')
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED\u08E3-\u08FF\u200a\u200b\u200c\u200d\u200e\u200f\u2060]/g, '')
    .replace(/\u0671/g, '\u0627')
    .replace(/\u06CC/g, '\u064A')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u06A9/g, '\u0643')
    .replace(/\u0623|\u0625/g, '\u0627')
    .replace(/\s+/g, ' ')
    .trim();
}

// For بسم الله comparisons only (word order is significant, whitespace is not).
function compactArabic(s) {
  return normalizeArabic(s).replace(/\s+/g, '');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSurah(id) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${API}/${id}/ar.quran-simple`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.code !== 200 || !json.data) throw new Error('bad payload');
      return json.data;
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
}

async function main() {
  const corpus = [];
  const wordFreq = new Map();
  const bigramFreq = new Map();
  const perSurahWords = {};
  const perSurahAyahs = {};
  const ayahCharLengths = [];

  for (let id = 1; id <= 114; id++) {
    const surah = await fetchSurah(id);
    const rows = [];
    surah.ayahs.forEach((ayah, index) => {
      // Faithfully replicate the reader's display numbering: Al-Fatiha's first
      // API ayah IS the basmala → skip it and renumber (الحمد لله... = 1).
      if (id === 1 && index === 0) return;
      const a = id === 1 ? ayah.numberInSurah - 1 : ayah.numberInSurah;
      rows.push({ s: id, a, t: ayah.text.trim() });
    });
    // Skip the opening basmala (embedded at the head of ayah 1 of surahs ≠ 1,9):
    // strip the first 4 words when they are exactly بسم الله الرحمن الرحيم.
    const first = rows[0];
    if (id !== 9 && first) {
      const words = first.t.split(/\s+/);
      if (words.length >= 4 && compactArabic(words.slice(0, 4).join('')) === compactArabic('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')) {
        first.t = words.slice(4).join(' ').trim();
      }
    }
    for (const row of rows) {
      // Hair-space/word-joiner/ZWSP are inside words here («ذَ ٰ⁠لِكَ»,
      // «مَّعْدُودَ ٰ⁠تࣲ») — REMOVE them (never space) so the token survives whole.
      const cleanText = row.t.replace(/[\u200a\u200b\u2060]/g, '');
      const n = normalizeArabic(cleanText);
      ayahCharLengths.push({ s: row.s, a: row.a, len: n.length, t: row.t });
      const words = n.split(' ').filter(Boolean);
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
        if (i > 0) {
          const bg = `${words[i - 1]} ${w}`;
          bigramFreq.set(bg, (bigramFreq.get(bg) || 0) + 1);
        }
      }
      perSurahWords[id] = (perSurahWords[id] || 0) + words.length;
      corpus.push({ s: row.s, a: row.a, t: row.t });
    }
    perSurahAyahs[id] = rows.length;
    process.stdout.write(`.${id}`);
  }
  console.log('\ncorpus ayahs:', corpus.length);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const index = {
    totalAyahs: corpus.length,
    totalWords: [...wordFreq.values()].reduce((a, b) => a + b, 0),
    uniqueWords: wordFreq.size,
    totalBismillahCount: 113,
    perSurahAyahs,
    perSurahWords,
    topWords: [...wordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60),
    commonBigrams: [...bigramFreq.entries()].filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]).slice(0, 300),
    longestAyah: [...ayahCharLengths].sort((a, b) => b.len - a.len)[0],
  };

  fs.writeFileSync(new URL('quran-index.json', OUT_DIR), JSON.stringify(index));
  fs.writeFileSync(new URL('quran-corpus.json', OUT_DIR), JSON.stringify(corpus));
  console.log('written: quran-index.json + quran-corpus.json  (',
    (fs.statSync(new URL('quran-index.json', OUT_DIR)).size / 1024 / 1024).toFixed(2),
    'MB +',
    (fs.statSync(new URL('quran-corpus.json', OUT_DIR)).size / 1024 / 1024).toFixed(2),
    'MB)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});