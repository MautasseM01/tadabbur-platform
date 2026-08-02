import { GoogleGenAI } from '@google/genai';
import { getWordLexiconEntry, stripArabicDiacritics, WordLexiconEntry } from './arabicLexicon';

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
        id: 'openrouter/free',
        label: 'الموجه المجاني (openrouter/free)',
        description: 'يختار تلقائياً أفضل نموذج مجاني متاح حالياً',
      },
      {
        id: 'google/gemma-4-31b-it:free',
        label: 'Gemma 4 31B (مجاني)',
        description: 'متعدد اللغات (140+ لغة) من جوجل',
      },
      {
        id: 'openai/gpt-oss-20b:free',
        label: 'GPT-OSS 20B (مجاني)',
        description: 'سريع وقوي من OpenAI',
      },
      {
        id: 'nvidia/nemotron-3-nano-30b-a3b:free',
        label: 'Nemotron 3 Nano 30B (مجاني)',
        description: 'من NVIDIA بسياق 256K',
      },
      {
        id: 'qwen/qwen3-next-80b-a3b-instruct:free',
        label: 'Qwen3 Next 80B (مجاني)',
        description: 'متعدد اللغات بسياق 262K',
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

const WORD_PROMPT = (wordText: string, root: string, context: string) => `
أنت عالم لغوي متخصص في القرآن الكريم. يرجى تقديم تحليل مختصر (3-5 جمل) للكلمة القرآنية "${wordText}" والتي جذرها "${root}" في سياق الآية "${context}". اشرح المعنى الدقيق واللمسة البيانية لاستخدام هذه الكلمة بحسب ما ورد من المفسرين المعاصرين المهتمين بالبيان القرآني.
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
  prompt: string
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
      temperature: 0.5,
      max_tokens: 1200,
    }),
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

async function runRemote(providerId: string, model: string, prompt: string): Promise<string> {
  switch (providerId) {
    case 'gemini':
      return callGemini(prompt, model);
    case 'groq':
      return callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        process.env.GROQ_API_KEY || '',
        model,
        prompt
      );
    case 'openrouter':
      return callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        process.env.OPENROUTER_API_KEY || '',
        model,
        prompt
      );
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

/**
 * Analyzes a single Quranic word using the selected provider, falling back to the
 * local offline analyzer when the provider is unavailable.
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

  try {
    const text = await runRemote(provider.id, model, WORD_PROMPT(params.wordText, params.root || '---', params.context));
    return { text, provider: provider.id, model, usedFallback };
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
