import type { AIWordAnalysis } from './ai';
import { stripArabicDiacritics } from './arabicLexicon';

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
 * is instant. Generated and verified through the linguistic agent.
 */
const SEED_ENTRIES: Record<string, CachedWordAnalysis> = {
  الدين: {
    word: 'الدِّينِ',
    root: 'دين',
    model: 'openrouter/free',
    cachedAt: 0,
    analysis: {
      root: 'دين',
      rootLetters: ['د', 'ي', 'ن'],
      simpleDefinition: 'الانقياد والطاعة، والجزاء والحساب، والمذهب والشرعة',
      quranicUsageNote:
        'في القرآن يطلق على الطاعة والعبادة (كقوله: {وَمَنْ يَبْتَغِ غَيْرَ الْإِسْلَامِ دِينًا})، وعلى الجزاء والحساب (كقوله: {مَالِكِ يَوْمِ الدِّينِ})، وعلى الشرعة والمنهج (كقوله: {شَرَعَ لَكُم مِّنَ الدِّينِ مَا وَصَّى بِهِ نُوحًا})، وفي يوم الدين يغلب معنى الجزاء والحساب.',
      etymology:
        'اسم على وزن فِعْل (كقِتل ومِلك) من الفعل الثلاثي الأجوف دانَ يَدِينُ دِيناً (أصله دَيْنٌ فقلبت الواو ياء لانكسار ما قبلها وسكنت فالتقت الياءان فأدغمتا)، ويدل على المصدر أو الاسم للمصدر بمعنى الطاعة أو الجزاء، وألحقته اللام للتعريف والجنس.',
      derivatives: ['دَيْن', 'يَدِينُونَ', 'دَانَتْ', 'مَدِين'],
      lexiconReferences: [
        {
          source: 'لسان العرب',
          author: 'ابن منظور',
          quote:
            'الدِّينُ: الطَّاعَةُ، وَالْجَزَاءُ، وَالْعَادَةُ، وَالْمِثْلُ، وَالْمَذْهَبُ... وَيَوْمُ الدِّينِ: يَوْمُ الْجَزَاءِ، وَقِيلَ: يَوْمُ الْحِسَابِ، وَسُمِّيَ بِذَلِكَ لِأَنَّهُمْ يُدَانُونَ فِيهِ بِأَعْمَالِهِمْ، أَيْ يُجَازَوْنَ.',
        },
        {
          source: 'مقاييس اللغة',
          author: 'ابن فارس',
          quote:
            'الدَّالُ وَالْيَاءُ وَالنُّونُ أَصْلَانِ: أَحَدُهُمَا يَدُلُّ عَلَى الِانْقِيَادِ وَالطَّاعَةِ، وَالْآخَرُ عَلَى الْجَزَاءِ. فَالْأَوَّلُ: دَانَ يَدِينُ دِينًا إِذَا انْقَادَ وَأَطَاعَ... وَالْآخَرُ: الدَّيْنُ مَا يُدَانُ بِهِ لِلْإِنْسَانِ مِنْ جَزَاءٍ، وَمِنْهُ يَوْمُ الدِّينِ.',
        },
        {
          source: 'مفردات ألفاظ القرآن',
          author: 'الراغب الأصفهاني',
          quote:
            'الدِّينُ: الطَّاعَةُ... وَيُطْلَقُ الدِّينُ عَلَى الْجَزَاءِ... وَيَوْمُ الدِّينِ: يَوْمُ الْجَزَاءِ، وَسُمِّيَ بِذَلِكَ لِأَنَّ فِيهِ يُدَانُ النَّاسُ بِأَعْمَالِهِمْ، أَيْ يُجَازَوْنَ.',
        },
        {
          source: 'المعجم الوسيط',
          author: 'مجمع اللغة العربية بالقاهرة',
          quote:
            'الدِّينُ: الطَّاعَةُ وَالْخُضُوعُ... وَالْجَزَاءُ وَالْحِسَابُ... وَالشَّرِيعَةُ وَالْمَنْهَجُ الَّذِي يَسِيرُ عَلَيْهِ الْإِنْسَانُ.',
        },
      ],
      analysis:
        'في قوله تعالى: {مَالِكِ يَوْمِ الدِّينِ}، يُنْصَبُ الدِّينِ على أنه مضاف إليه لـ يَوْمِ، والمعنى: مالك يوم الجزاء والحساب. وسمي يوم الدين بذلك لأن الناس يُدَانُونَ فيه (يُحَاسَبُونَ وَيُجَازَوْنَ) بأعمالهم، فيظهر ملك الله المطلق وسلطانه الكامل الذي لا يُنازَع فيه، بخلاف أيام الدنيا حيث يشاركه في الملك الظاهري ملوكٌ وأصحابُ سلطانٍ زائل.',
    },
  },
};

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
