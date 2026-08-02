import { GoogleGenAI } from '@google/genai';
import { getKnownRoot, getWordLexiconEntry, stripArabicDiacritics, WordLexiconEntry } from './arabicLexicon';
import { searchWeb } from './webSearch';
import { cacheKeyFor, getCachedWordAnalysis, setCachedWordAnalysis } from './wordAnalysisCache';

export type AIProviderId = 'local' | 'gemini' | 'groq' | 'openrouter';

export interface AIModelOption {
  id: string;
  label: string;
  description: string;
}

export interface AIProviderOption {
  id: AIProviderId;
  label: string;
  description: string;
  envKey: string;
  signupUrl: string;
  models: AIModelOption[];
}

export interface AIResult {
  text: string;
  provider: AIProviderId;
  model: string;
  usedFallback: boolean;
  wordAnalysis?: AIWordAnalysis;
  cached?: boolean;
}

export interface LexiconReferenceAI {
  source: string;
  author: string;
  quote: string;
  volume?: string;
}

export interface AIWordAnalysis {
  root: string;
  rootLetters: string[];
  simpleDefinition: string;
  quranicUsageNote: string;
  etymology: string;
  derivatives: string[];
  lexiconReferences: LexiconReferenceAI[];
  analysis: string;
}

export const AI_MODEL_STORAGE_KEY = 'tadabbur_ai_model_v1';

export const AI_PROVIDERS: AIProviderOption[] = [
  {
    id: 'local',
    label: 'المحلل المحلي (مجاني - بدون مفتاح)',
    description:
      'تحليل معجمي فوري من قاعدة المعاجم المدمجة (مفردات الراغب، لسان العرب، مقاييس اللغة) مع قوالب بلاغية جاهزة. يعمل دون إنترنت وبدون أي مفتاح وبخصوصية تامة.',
    envKey: '',
    signupUrl: '',
    models: [
      {
        id: 'local-lexicon',
        label: 'المحلل المعجمي المحلي',
        description: 'من المعجم المدمج + النماذج البلاغية',
      },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter (نماذج مجانية)',
    description:
      'بوابة موحدة لنماذج مفتوحة المصدر المجانية (:free). بدون بطاقة ائتمان — سجّل في openrouter.ai وانسخ المفتاح.',
    envKey: 'OPENROUTER_API_KEY',
    signupUrl: 'https://openrouter.ai',
    models: [
      {
        id: 'openai/gpt-oss-20b:free',
        label: 'GPT-OSS 20B (مجاني)',
        description: 'الأكثر استقراراً لتحليل الكلمات (موصى به)',
      },
      {
        id: 'google/gemma-4-31b-it:free',
        label: 'Gemma 4 31B (مجاني)',
        description: 'متعدد اللغات (140+ لغة) من جوجل',
      },
      {
        id: 'nvidia/nemotron-3-nano-30b-a3b:free',
        label: 'Nemotron 3 Nano 30B (مجاني)',
        description: 'من NVIDIA بسياق 256K',
      },
      {
        id: 'openrouter/free',
        label: 'الموجه المجاني (openrouter/free)',
        description: 'يختار تلقائياً نموذجاً متاحاً — قد يكون أقل استقراراً للتحليل',
      },
    ],
  },
];

export function getProviderById(id: string): AIProviderOption | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}

export function isProviderConfigured(id: AIProviderId): boolean {
  const provider = getProviderById(id);
  if (!provider) return false;
  if (provider.envKey === '') return true;
  const key = process.env[provider.envKey];
  const PLACEHOLDERS = ['MY_GEMINI_API_KEY', 'MY_GROQ_API_KEY', 'MY_OPENROUTER_API_KEY', 'MY_APP_URL'];
  return typeof key === 'string' && key.trim().length > 0 && !PLACEHOLDERS.includes(key.trim());
}

/**
 * Returns the providers the server can actually use right now (local is always available).
 */
export function getConfiguredProviders(): AIProviderOption[] {
  return AI_PROVIDERS.filter((p) => isProviderConfigured(p.id));
}

/**
 * Resolves the requested provider to a usable one. Falls back to the local analyzer
 * when the requested provider has no API key configured.
 */
function resolveProvider(providerId?: string): { provider: AIProviderOption; usedFallback: boolean } {
  if (providerId && isProviderConfigured(providerId as AIProviderId)) {
    return { provider: getProviderById(providerId)!, usedFallback: false };
  }
  return { provider: getProviderById('local')!, usedFallback: true };
}

const WORD_PROMPT = (
  wordText: string,
  rootGuess: string,
  context: string,
  searchResults: { title: string; snippet: string; url: string }[]
) => `
أنت «الوكيل اللغوي» — عالم لغويات متخصص في أصول الكلمات (علم الاشتقاق والجذور العربية) وعلوم القرآن الكريم، موثوق ودقيق ومتحرر من الحفظ الخاطئ.

الكلمة القرآنية المطلوب تحليلها: «${wordText}»
سياقها في الآية الكريمة: «${context}»

نفّذ المهمة بالترتيب التالي:
1. استخرج الجذر الحقيقي للكلمة (ثلاثي أو رباعي عادةً) بمنهجية علماء الاشتقاق، وتعامَل بكفاءة مع الجذور المعتلة والناقصة والثنائية الظاهرة (مثل: الدِّينِ ← دين، مالك ← ملك، الصراط ← صرط، المستقيم ← قوم). لا تثق بأي جذر تقديري وارد إليك، بل حقق منه بنفسك.
2. حدد حروف الجذر بحسب ترتيبها الصحيح.
3. بيّن المعنى اللغوي المحوري للجذر.
4. اشرح أصل الاشتقاق ودلالة صيغة الكلمة (وزنها).
5. اذكر مشتقات أخرى من الجذر نفسه وردت في القرآن الكريم.
6. اذكر 2-4 شواهد من المعاجم العربية المعتمدة (لسان العرب لابن منظور، مقاييس اللغة لابن فارس، مفردات ألفاظ القرآن للراغب الأصفهاني، المعجم الوسيط لمجمع اللغة العربية، الصحاح للجوهري...). انقل الشاهد نصًا أو لخّصه بأمانة دون تحريف، وانسُب كل شاهد لمؤلفه الصحيح بالضبط (ابن منظور لسان العرب، ابن فارس المقاييس، الراغب المفردات، مجمع اللغة العربية المعجم الوسيط). إن لم تتيقن من نص معجمي بعينه فلا تخترعه أبدًا — ما تعرفه بأمانة خير من نص مُلفّق.
7. اكتب تحليلًا بيانيًا وجيزًا (3-5 جمل) لدلالة الكلمة في موقعها من الآية.

نتائج بحث واقعي من الإنترنت أُجري للتو لتأصيل الجذر (قد تكون دقيقة أو لا، فراجعها وتثبت منها قبل الاعتماد عليها):
${searchResults.length > 0
  ? searchResults.map((r, i) => `${i + 1}. «${r.title}» — ${r.snippet.slice(0, 300)} (${r.url})`).join('\n')
  : 'لم تُرجع نتائج لهذا البحث.'}

أجب حصريًا بترميز JSON واحد صالح (دون أي نص آخر قبله أو بعده، دون إشارات ترميز markdown) بالبنية التالية حرفيًا:
{
  "root": "الجذر الحقيقي",
  "rootLetters": ["حرف1", "حرف2", "حرف3"],
  "simpleDefinition": "تعريف لغوي مبسط للجذر",
  "quranicUsageNote": "دلالة الكلمة في الاستعمال القرآني",
  "etymology": "أصل الاشتقاق وصيغة الكلمة",
  "derivatives": ["مشتق1", "مشتق2"],
  "lexiconReferences": [{ "source": "اسم المعجم", "author": "المؤلف", "quote": "النص الشاهد" }],
  "analysis": "التحليل البياني للكلمة في الآية"
}
القاعدة الذهبية: بيانات حقيقية موثوقة فقط — لا كذب ولا اختلاق ولا تعميم وهمي.
`;

const CORRECT_ROOT_PROMPT = (wordText: string, knownRoot: string) => `
في إجابتك السابقة عن الكلمة القرآنية «${wordText}» حددت جذرًا غير دقيق.
المعاجم العربية المعتمدة متفق عليها على أن الجذر الصحيح لهذه الكلمة هو: «${knownRoot}».

أعد إخراج نفس بنية JSON السابقة حرفيًا (نفس الحقول الخمسة تمامًا: root، rootLetters، simpleDefinition، quranicUsageNote، etymology، derivatives، lexiconReferences، analysis) مع:
- وضع root = «${knownRoot}» و rootLetters مطابقة لحروفه بالترتيب.
- الإبقاء على بقية المحتوى كما هو (لا تُعد كتابة المعاني والشواهد من الصفر، وإنما أصلح الحقول المتعلقة بالجذر فقط).
- لا تُخرج أي نص خارج الترميز JSON.
`;

const COMPARE_PROMPT = (word1: { text: string; root: string }, word2: { text: string; root: string }, contextAyah: string) => `
أنت عالم لغوي وبلاغي متخصص في علوم القرآن الكريم والبيان القرآني. يرجى تقديم تحليل مقارن دقيق ومبسط بين الكلمتين القرآنيتين التاليتين من نفس الآية:

الكلمة الأولى: "${word1.text}" (الجذر: ${word1.root || 'غير محدد'})
الكلمة الثانية: "${word2.text}" (الجذر: ${word2.root || 'غير محدد'})
سياق الآية الكريمة: "${contextAyah}"

يرجى الإجابة بنقاط مقتضبة وواضحة تركز على:
1. الفروق المعجمية والدلالية بين الكلمتين والجذرين.
2. اللمسة البيانية والبلاغية لاستخدام كل كلمة في موقعها.
3. الدلالة السياقية التي توضح الرابط البياني بين الكلمتين في هذه الآية.
`;

function formatLexiconEntry(entry: WordLexiconEntry): string {
  const refs = entry.lexiconReferences
    .map((r) => `• ${r.source} (${r.author}${r.volume ? `، ${r.volume}` : ''}): ${r.quote}`)
    .join('\n');
  return refs;
}

function localWordAnalysis(wordText: string, root: string, context: string): string {
  const entry = getWordLexiconEntry(wordText, root);
  const meaning = entry.simpleDefinition || `يدل الجذر ( ${entry.root} ) في اللغة العربية على أصل اشتقاق هذه الكلمة القرآنية.`;
  const usage = entry.quranicUsageNote || '';
  const refs = formatLexiconEntry(entry);

  return [
    `تحليل لفظي وبلاغي للكلمة الكريمة (المحلل المحلي)`,
    ``,
    `الكلمة: ${entry.word} — الجذر: ( ${entry.root} )`,
    ``,
    `المعنى المحوري: ${meaning}`,
    ...(usage ? [`دلالتها القرآنية: ${usage}`, ``] : ['']),
    `شواهد المعاجم:`,
    refs,
    ``,
    `وقد ورد هذا الجذر في سياق الآية: «${context}» في موضع يبرز دلالته البيانية على الوجه الذي فسره المفسرون.`,
  ].join('\n');
}

function localWordComparison(
  word1: { text: string; root: string },
  word2: { text: string; root: string },
  contextAyah: string
): string {
  const e1 = getWordLexiconEntry(word1.text, word1.root);
  const e2 = getWordLexiconEntry(word2.text, word2.root);

  return [
    `مقارنة لغوية وبلاغية بين الكلمتين (المحلل المحلي)`,
    ``,
    `الكلمة الأولى: ${e1.word} — الجذر: ( ${e1.root} )`,
    `المعنى: ${e1.simpleDefinition}`,
    ...(e1.quranicUsageNote ? [`دلالتها القرآنية: ${e1.quranicUsageNote}`] : []),
    ``,
    `الكلمة الثانية: ${e2.word} — الجذر: ( ${e2.root} )`,
    `المعنى: ${e2.simpleDefinition}`,
    ...(e2.quranicUsageNote ? [`دلالتها القرآنية: ${e2.quranicUsageNote}`] : []),
    ``,
    `نقاط الفروق واللمسات البيانية:`,
    `1. المعنى المحوري لكل كلمة مستقل بذاته: الأولى تدور حول ( ${e1.root} ) والثانية حول ( ${e2.root} ).`,
    `2. في الآية: «${contextAyah}» يقع كل لفظ في موضع يدل على معنى خاص لا يؤديه الآخر، وهذا من أسرار النظم القرآني.`,
    `3. شواهد المعاجم للأولى:`,
    formatLexiconEntry(e1),
    ``,
    `4. شواهد المعاجم للثانية:`,
    formatLexiconEntry(e2),
  ].join('\n');
}

/**
 * Extracts a clean triliteral/quadriliteral Arabic root from arbitrary text.
 */
export function sanitizeRoot(value: string): string {
  if (!value) return '';
  const letters = stripArabicDiacritics(value).replace(/[^\u0621-\u064A]/g, '');
  return letters.length >= 2 && letters.length <= 4 ? letters : '';
}

/**
 * Parses the linguistic agent's JSON reply into a validated AIWordAnalysis.
 * Throws on invalid output so callers can fall back to the local analyzer.
 */
function parseWordAnalysis(raw: string): AIWordAnalysis {
  let jsonText = raw.trim();
  const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) jsonText = fence[1].trim();

  const start = jsonText.indexOf('{');
  const end = jsonText.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('Linguistic agent did not return a JSON object.');
  }

  const parsed = JSON.parse(jsonText.slice(start, end + 1));

  const root = sanitizeRoot(typeof parsed.root === 'string' ? parsed.root : '');
  if (!root) throw new Error('Linguistic agent returned an invalid root.');

  const asString = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

  const rootLetters = Array.isArray(parsed.rootLetters)
    ? parsed.rootLetters.map((s: unknown) => asString(s)).filter((s: string) => /^[\u0621-\u064A]$/.test(s))
    : root.split('');

  const derivatives = Array.isArray(parsed.derivatives)
    ? parsed.derivatives.map(asString).filter(Boolean).slice(0, 10)
    : [];

  const refs = Array.isArray(parsed.lexiconReferences)
    ? parsed.lexiconReferences
        .map((r: unknown) => {
          const obj = (r || {}) as Record<string, unknown>;
          return {
            source: asString(obj.source),
            author: asString(obj.author),
            quote: asString(obj.quote),
            volume: asString(obj.volume) || undefined,
          };
        })
        .filter((r: { source: string; author: string; quote: string; volume?: string }) => r.source || r.quote)
        .slice(0, 5)
    : [];

  return {
    root,
    rootLetters: rootLetters.length > 0 ? rootLetters : root.split(''),
    simpleDefinition: asString(parsed.simpleDefinition),
    quranicUsageNote: asString(parsed.quranicUsageNote),
    etymology: asString(parsed.etymology),
    derivatives,
    lexiconReferences: refs,
    analysis: asString(parsed.analysis),
  };
}

function formatWordAnalysisText(a: AIWordAnalysis): string {
  const lines = [
    `تحليل الوكيل اللغوي للكلمة الكريمة`,
    ``,
    `الجذر اللغوي: ( ${a.root} ) — الحروف: ${a.rootLetters.join(' - ')}`,
    ``,
    `المعنى المحوري: ${a.simpleDefinition}`,
    ...(a.etymology ? [`أصل الاشتقاق: ${a.etymology}`] : []),
    ...(a.quranicUsageNote ? [`دلالتها القرآنية: ${a.quranicUsageNote}`] : []),
    ...(a.derivatives.length > 0
      ? [`مشتقات من الجذر في القرآن: ${a.derivatives.join('، ')}`]
      : []),
    ...(a.lexiconReferences.length > 0
      ? [
          ``,
          `شواهد المعاجم المعتمدة:`,
          ...a.lexiconReferences.map(
            (r) => `• ${r.source} (${r.author}${r.volume ? `، ${r.volume}` : ''}): ${r.quote}`
          ),
        ]
      : []),
    ...(a.analysis ? [``, a.analysis] : []),
  ];
  return lines.join('\n');
}

async function callGemini(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: model.includes('pro') || model.includes('thinking') ? { thinkingConfig: { thinkingBudget: 1024 } } : undefined,
  });
  return response.text || '';
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens = 1200,
  timeoutMs = 45000
): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI provider error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('AI provider returned an empty response.');
  }
  return text.trim();
}

async function runRemote(
  providerId: string,
  model: string,
  prompt: string,
  maxTokens = 1200,
  timeoutMs = 45000
): Promise<string> {
  switch (providerId) {
    case 'gemini':
      return callGemini(prompt, model);
    case 'groq':
      return callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        process.env.GROQ_API_KEY || '',
        model,
        prompt,
        maxTokens,
        timeoutMs
      );
    case 'openrouter':
      return callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        process.env.OPENROUTER_API_KEY || '',
        model,
        prompt,
        maxTokens,
        timeoutMs
      );
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

/**
 * Verified-stable instruct models tried automatically when the user-selected
 * model fails to produce a valid structured analysis (rate limits, reasoning
 * models that leak chain-of-thought, temporarily unavailable slugs).
 */
const WORD_ANALYSIS_FALLBACK_MODELS = [
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
];

function buildAttemptModels(provider: AIProviderOption, requestedModel: string): string[] {
  const ids: string[] = [];
  if (requestedModel && provider.models.some((m) => m.id === requestedModel)) ids.push(requestedModel);
  for (const fb of WORD_ANALYSIS_FALLBACK_MODELS) {
    if (!ids.includes(fb) && provider.models.some((m) => m.id === fb)) ids.push(fb);
  }
  return ids;
}

/**
 * Analyzes a single Quranic word using the linguistic AI agent: it verifies the
 * true root, grounds itself with a real internet search, and returns structured
 * verified data. Tries stable fallback models automatically, then the local
 * offline analyzer when all remote attempts fail.
 */
export async function analyzeWordAI(params: {
  wordText: string;
  root?: string;
  context: string;
  provider?: string;
  model?: string;
}): Promise<AIResult> {
  const { provider: requestedProvider, model: requestedModel } = params;
  const { provider, usedFallback } = resolveProvider(requestedProvider);
  const model = requestedModel && provider.models.some((m) => m.id === requestedModel)
    ? requestedModel
    : provider.models[0].id;

  if (provider.id === 'local') {
    return localAnalyzeWordResult(params, model, usedFallback);
  }

  const cacheKey = cacheKeyFor(params.wordText);
  const cached = getCachedWordAnalysis(cacheKey);
  if (cached) {
    return {
      text: formatWordAnalysisText(cached.analysis),
      provider: provider.id,
      model: cached.model,
      usedFallback: false,
      cached: true,
      wordAnalysis: cached.analysis,
    };
  }

  try {
    // 1. Real internet search to ground the agent's analysis
    const query = `${params.wordText} ${params.root && params.root !== '---' ? params.root : ''} جذر الكلمة معجم لسان العرب مقاييس اللغة`;
    const searchResults = await searchWeb(query, 5);

    // 2. Ask the linguistic agent, trying stable models in order
    let wordAnalysis: AIWordAnalysis | null = null;
    let lastError: unknown = null;
    let usedModel = model;
    const attempts = buildAttemptModels(provider, model);

    for (let i = 0; i < attempts.length && !wordAnalysis; i++) {
      const attemptModel = attempts[i];
      // The primary (user-selected) model gets one automatic retry, since free
      // providers intermittently return empty responses or leak chain-of-thought.
      const maxTries = i === 0 ? 2 : 1;

      for (let attempt = 0; attempt < maxTries; attempt++) {
        try {
          const raw = await runRemote(
            provider.id,
            attemptModel,
            WORD_PROMPT(params.wordText, params.root || '', params.context, searchResults),
            4500,
            100000
          );
          let parsed = parseWordAnalysis(raw);

          // 3. Verify against curated known roots; correct the agent if it erred
          //    (e.g. letter order on weak roots) with a single corrective retry.
          const knownRoot = getKnownRoot(params.wordText);
          if (knownRoot && sanitizeRoot(parsed.root) !== knownRoot) {
            try {
              const retryRaw = await runRemote(
                provider.id,
                attemptModel,
                CORRECT_ROOT_PROMPT(params.wordText, knownRoot),
                2500,
                60000
              );
              const corrected = parseWordAnalysis(retryRaw);
              parsed = sanitizeRoot(corrected.root) === knownRoot
                ? corrected
                : { ...parsed, root: knownRoot, rootLetters: knownRoot.split('') };
            } catch {
              parsed = { ...parsed, root: knownRoot, rootLetters: knownRoot.split('') };
            }
          }

          // 4. Quality gate: refuse thin responses (no meaning + no references
          //    + no analysis) so the next model gets a chance.
          if (
            !parsed.simpleDefinition ||
            (parsed.lexiconReferences.length === 0 && !parsed.analysis)
          ) {
            throw new Error('Linguistic agent response too thin.');
          }

          wordAnalysis = parsed;
          usedModel = attemptModel;
          break;
        } catch (err) {
          lastError = err;
          console.error(
            `[ai] ${provider.id}/${attemptModel} attempt ${attempt + 1}/${maxTries} failed:`,
            (err as Error).message
          );
        }
      }
    }

    if (!wordAnalysis) throw lastError || new Error('All linguistic agent models failed.');

    setCachedWordAnalysis(cacheKey, {
      word: params.wordText,
      root: wordAnalysis.root,
      analysis: wordAnalysis,
      model: usedModel,
    });

    return {
      text: formatWordAnalysisText(wordAnalysis),
      provider: provider.id,
      model: usedModel,
      usedFallback,
      wordAnalysis,
    };
  } catch (err) {
    console.error(`[ai] ${provider.id}/${model} failed, falling back to local analyzer:`, (err as Error).message);
    return localAnalyzeWordResult(params, model, true);
  }
}

async function localAnalyzeWordResult(params: { wordText: string; root?: string; context: string }, model: string, usedFallback: boolean): Promise<AIResult> {
  return {
    text: localWordAnalysis(params.wordText, params.root || '---', params.context),
    provider: 'local',
    model,
    usedFallback,
  };
}

async function localCompareWordsResult(
  params: { word1: { text: string; root?: string }; word2: { text: string; root?: string }; contextAyah: string },
  model: string,
  usedFallback: boolean
): Promise<AIResult> {
  return {
    text: localWordComparison(
      { text: params.word1.text, root: params.word1.root || '' },
      { text: params.word2.text, root: params.word2.root || '' },
      params.contextAyah
    ),
    provider: 'local',
    model,
    usedFallback,
  };
}

/**
 * Compares two Quranic words from the same ayah using the selected provider,
 * falling back to the local offline analyzer when the provider is unavailable.
 */
export async function compareWordsAI(params: {
  word1: { text: string; root?: string };
  word2: { text: string; root?: string };
  contextAyah: string;
  provider?: string;
  model?: string;
}): Promise<AIResult> {
  const { provider: requestedProvider, model: requestedModel } = params;
  const { provider, usedFallback } = resolveProvider(requestedProvider);
  const model = requestedModel && provider.models.some((m) => m.id === requestedModel)
    ? requestedModel
    : provider.models[0].id;

  if (provider.id === 'local') {
    return localCompareWordsResult(params, model, usedFallback);
  }

  try {
    const text = await runRemote(
      provider.id,
      model,
      COMPARE_PROMPT(
        { text: params.word1.text, root: params.word1.root || '' },
        { text: params.word2.text, root: params.word2.root || '' },
        params.contextAyah
      )
    );
    return { text, provider: provider.id, model, usedFallback };
  } catch (err) {
    console.error(`[ai] ${provider.id}/${model} failed, falling back to local analyzer:`, (err as Error).message);
    return localCompareWordsResult(params, model, true);
  }
}

export function cleanArabic(text: string): string {
  return stripArabicDiacritics(text);
}
