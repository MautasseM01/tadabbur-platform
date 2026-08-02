import type { AIWordAnalysis } from './ai';
import { stripArabicDiacritics } from './arabicLexicon';
import { SEED_ENTRIES } from './wordAnalysisSeeds';

/**
 * Server-side cache for linguistic-agent word analyses. Generating an analysis
 * takes 30-90s through the free OpenRouter models, so results are persisted to
 * disk (data/word-analysis-cache.json) and reused instantly on later requests.
 */

export interface CachedWordAnalysis {
  word: string;
  root: string;
  analysis: AIWordAnalysis;
  model: string;
  cachedAt: number;
}

type WordAnalysisCache = Record<string, CachedWordAnalysis>;

const MAX_ENTRIES = 500;
const CACHE_FILE = 'word-analysis-cache.json';

/**
 * Curated analyses seeded into the cache so the first request for these words
 * is instant. Generated and verified through the linguistic agent
 * (see lib/wordAnalysisSeeds.ts).
 */

export function cacheKeyFor(wordText: string): string {
  return stripArabicDiacritics(wordText).trim();
}

function cachePath(): string {
  const path = eval("require")('path');
  return path.join(process.cwd(), 'data', CACHE_FILE);
}

function readCache(): WordAnalysisCache {
  if (typeof window !== 'undefined') return {};
  try {
    const fs = eval("require")('fs');
    if (!fs.existsSync(cachePath())) {
      writeCache(SEED_ENTRIES);
      return { ...SEED_ENTRIES };
    }
    const raw = JSON.parse(fs.readFileSync(cachePath(), 'utf-8')) as WordAnalysisCache;
    return { ...SEED_ENTRIES, ...raw };
  } catch {
    return { ...SEED_ENTRIES };
  }
}

function writeCache(cache: WordAnalysisCache) {
  if (typeof window !== 'undefined') return;
  try {
    const fs = eval("require")('fs');
    const path = eval("require")('path');
    const file = cachePath();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(file, JSON.stringify(cache, null, 1), 'utf-8');
  } catch (err) {
    console.error('wordAnalysisCache write error:', err);
  }
}

export function getCachedWordAnalysis(key: string): CachedWordAnalysis | null {
  const cached = readCache()[key];
  if (!cached) return null;
  if (typeof cached.analysis?.root !== 'string') return null;
  return cached;
}

export function setCachedWordAnalysis(
  key: string,
  entry: { word: string; root: string; analysis: AIWordAnalysis; model: string }
) {
  try {
    const cache = readCache();
    cache[key] = {
      word: entry.word,
      root: entry.root,
      analysis: entry.analysis,
      model: entry.model,
      cachedAt: Date.now(),
    };
    const keys = Object.keys(cache);
    if (keys.length > MAX_ENTRIES) {
      const sorted = keys.sort(
        (a, b) => (cache[a].cachedAt || 0) - (cache[b].cachedAt || 0)
      );
      for (const oldKey of sorted.slice(0, keys.length - MAX_ENTRIES)) {
        delete cache[oldKey];
      }
    }
    writeCache(cache);
  } catch (err) {
    console.error('wordAnalysisCache set error:', err);
  }
}
