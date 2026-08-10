/* eslint-disable import/no-anonymous-default-export */

/**
 * Quran concordance engine (client-side).
 *
 * Data assets built by scripts/build-quran-index.mjs:
 *   - data/quran-index.json  — counts, top terms, statistics
 *   - data/quran-corpus.json — every ayah {s, a, t}
 *
 * Counting rules (documented in the build script):
 *   - The 113 opening basmalas are NOT counted, matching scholarly counts.
 *   - Al-Fatiha follows the reader's display numbering (الحمد لله... = 1).
 *   - Tokens are glyph-normalized (alef-wasla, farsi yeh, dagger alif,
 *     hamza-alefs, shadda/sukun) so the same word unifies across editions.
 */

export interface CorpusAyah {
  s: number;
  a: number;
  t: string;
}

export interface QuranIndex {
  totalAyahs: number;
  totalWords: number;
  uniqueWords: number;
  totalBismillahCount: number;
  perSurahAyahs: Record<string, number>;
  perSurahWords: Record<string, number>;
  topWords: [string, number][];
  commonBigrams: [string, number][];
  longestAyah: CorpusAyah & { len: number };
}

export type QuranAssets = {
  corpus: CorpusAyah[];
  index: QuranIndex;
};

let cachedAssets: Promise<QuranAssets> | null = null;

/** Lazy-loads the corpus + index exactly once, on first search. */
export function loadQuranAssets(): Promise<QuranAssets> {
  if (!cachedAssets) {
    cachedAssets = Promise.all([
      // @ts-ignore — static JSON chunk, code-split by Next.js
      import('@/data/quran-corpus.json'),
      // @ts-ignore
      import('@/data/quran-index.json'),
    ]).then(([corpus, index]) => ({
      corpus: corpus.default as CorpusAyah[],
      index: index.default as unknown as QuranIndex,
    }));
  }
  return cachedAssets;
}

export function normalizeArabicForSearch(s: string): string {
  return s
    .replace(/[\n\t\r]/g, ' ')
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED\u08E3-\u08FF\u200a\u200b\u200c\u200d\u200e\u200f\u2060]/g, '')
    .replace(/\u0671/g, '\u0627')
    .replace(/\u06CC/g, '\u064A')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u06A9/g, '\u0643')
    .replace(/\u0623|\u0625/g, '\u0627')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export interface ConcordanceResult {
  query: string;
  queryWords: string[];
  totalOccurrences: number;
  distinctAyahs: number;
  hits: {
    surahId: number;
    surahName: string;
    ayahNumber: number;
    text: string;
    occurrencesInAyah: number;
  }[];
  perSurah: { surahId: number; surahName: string; occurrences: number }[];
}

/**
 * Raw (un-normalized) token → its possible plain spellings.
 *
 * Mushaf rasm keeps silent alifs as dagger-alif (U+0670): «مَعْدُودَٰت»,
 * «الرَّحْمَٰن»، «العَلَٰمين»… A user types the full alef («معدودات»,
 * «الرحمن», «العالمين»), so every raw token contributes up to 3 searchable
 * forms built from the ORIGINAL glyph positions (we still have the raw text):
 *   - dropped:   dagger removed   («الرحمن»)
 *   - extended:  dagger → alef    («الرحمان»)         when preceded by a consonant
 *   - wawo-yaa:  وٰ/يٰ → ا        («الصلاة» ← الصلوٰة) when preceded by و/ي
 */
const DAGGER_ALEF = '\u0670';
const ALEF = '\u0627';

function plainDropped(s: string): string {
  return normalizeArabicForSearch(s);
}

function plainWithDaggerAsAlef(token: string): string {
  let out = '';
  let previous = '';
  let i = 0;
  while (i < token.length) {
    const ch = token[i];
    if (ch === DAGGER_ALEF) {
      if (previous === '\u0648' || previous === '\u064A') {
        out = out.slice(0, -1) + ALEF;
      } else {
        out += ALEF;
      }
      previous = ALEF;
      i++;
      continue;
    }
    out += ch;
    previous = ch;
    i++;
  }
  return normalizeArabicForSearch(out);
}

let tokenFormsCache: Map<string, string[]> | null = null;

function tokenFormsMap(corpus: CorpusAyah[]): Map<string, string[]> {
  if (tokenFormsCache) return tokenFormsCache;
  const map = new Map<string, string[]>();
  const seen = new Set<string>();
  for (const ayah of corpus) {
    // Hair-space / word-joiner / ZWSP hide INSIDE words in this edition
    // («مَّعْدُودَ ٰ⁠تࣲ») — drop them before splitting so the token survives whole.
    for (const rawToken of ayah.t.replace(/[\u200a\u200b\u2060]/g, '').split(/\s+/)) {
      if (!rawToken || seen.has(rawToken)) continue;
      seen.add(rawToken);
      const forms = new Set<string>();
      const dropped = plainDropped(rawToken);
      forms.add(dropped);
      if (rawToken.includes(DAGGER_ALEF)) {
        const extended = plainWithDaggerAsAlef(rawToken);
        if (extended && extended !== dropped) forms.add(extended);
      }
      map.set(normalizeArabicForSearch(rawToken), [...forms]);
    }
  }
  tokenFormsCache = map;
  return map;
}

import { SURAH_NAMES } from '@/lib/surahs';

const SURAH_NAMES_CACHE: string[] = SURAH_NAMES;

function surahNameFor(id: number): string {
  return SURAH_NAMES_CACHE[id - 1] || `سورة رقم ${id}`;
}

export function searchConcordance(corpus: CorpusAyah[], rawQuery: string): ConcordanceResult {
  const queryWords = normalizeArabicForSearch(rawQuery)
    .split(' ')
    .filter(Boolean);
  const perSurah = new Map<number, number>();
  const hits: ConcordanceResult['hits'] = [];
  let total = 0;
  let distinct = 0;
  const forms = tokenFormsMap(corpus);

  const tokenMatches = (tok: string, q: string): boolean => {
    const candidates = forms.get(tok);
    if (candidates) {
      if (candidates.includes(q)) return true;
      // Morphological tolerance: «ايام» ≡ «اياما», «الذي» ≡ «الذين»…
      return q.length >= 4 && candidates.some((f) => f.startsWith(q));
    }
    return tok === q || (q.length >= 4 && tok.startsWith(q));
  };

  const phraseMatchesAt = (tokens: string[], startIdx: number): boolean => {
    const slice = tokens.slice(startIdx, startIdx + queryWords.length);
    for (let k = 0; k < queryWords.length; k++) {
      const tok = slice[k];
      if (tok === undefined) return false;
      if (!tokenMatches(tok, queryWords[k])) return false;
    }
    return true;
  };

  for (const ayah of corpus) {
    const normText = normalizeArabicForSearch(ayah.t);
    const tokens = normText.split(' ');
    let count = 0;
    if (queryWords.length === 1) {
      for (const tok of tokens) if (tok && tokenMatches(tok, queryWords[0])) count++;
    } else {
      for (let i = 0; i + queryWords.length <= tokens.length; i++) {
        if (phraseMatchesAt(tokens, i)) count++;
      }
    }
    if (count > 0) {
      total += count;
      distinct++;
      perSurah.set(ayah.s, (perSurah.get(ayah.s) || 0) + count);
      hits.push({
        surahId: ayah.s,
        surahName: surahNameFor(ayah.s),
        ayahNumber: ayah.a,
        text: ayah.t,
        occurrencesInAyah: count,
      });
    }
  }

  hits.sort((a, b) => a.surahId - b.surahId || a.ayahNumber - b.ayahNumber);
  const perSurahList = [...perSurah.entries()]
    .map(([surahId, occurrences]) => ({ surahId, surahName: surahNameFor(surahId), occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences || a.surahId - b.surahId);

  return {
    query: rawQuery.trim(),
    queryWords,
    totalOccurrences: total,
    distinctAyahs: distinct,
    hits,
    perSurah: perSurahList,
  };
}

export function firstHitAyahForSurah(result: ConcordanceResult, surahId: number): number | null {
  const hit = result.hits.find((h) => h.surahId === surahId);
  return hit ? hit.ayahNumber : null;
}