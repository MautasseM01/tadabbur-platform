'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, BookOpen, Hash, Layers, BarChart3, ExternalLink, Sparkles } from 'lucide-react';
import {
  loadQuranAssets,
  searchConcordance,
  firstHitAyahForSurah,
  QuranAssets,
  ConcordanceResult,
} from '@/lib/quranSearch';

export default function QuranSearch() {
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState<QuranAssets | null>(null);
  const [result, setResult] = useState<ConcordanceResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setError('');
    try {
      const loaded = assets || (await loadQuranAssets());
      setAssets(loaded);
      setResult(searchConcordance(loaded.corpus, q));
    } catch (err) {
      console.error(err);
      setError('تعذر تحميل نصوص القرآن — تحقق من الاتصال وحاول مجدداً.');
    } finally {
      setBusy(false);
    }
  };

  const idx = assets?.index;

  return (
    <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 border border-amber-300 px-4 py-1.5 rounded-full text-xs font-bold font-sans mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          المعجم الموسوعي للقرآن الكريم
        </div>
        <h1 className="text-3xl md:text-4xl font-amiri font-bold text-natural-900 mb-2">
          بحث المعاني والتكرار
        </h1>
        <p className="text-natural-600 text-sm font-sans max-w-2xl mx-auto leading-relaxed">
          ابحث عن كلمة أو عبارة من عدة كلمات لتعرف كم مرة وردت في القرآن كله، في أي
          السور تتركز، واقفز مباشرة إلى مواضعها آيةً آية.
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={runSearch} className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثال: الرحمن  أو: بسم الله  أو: لا إله إلا الله"
          className="flex-1 bg-white border border-natural-300 rounded-2xl px-5 py-4 text-lg font-amiri focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          dir="rtl"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="flex items-center justify-center gap-2 bg-natural-900 hover:bg-natural-800 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-sans font-bold text-sm transition shadow-sm cursor-pointer"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span>{busy ? 'جاري البحث...' : 'ابحث في القرآن كله'}</span>
        </button>
      </form>

      {error && (
        <p className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 font-sans">
          {error}
        </p>
      )}

      {/* Quran-wide statistics */}
      {idx && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الآيات', value: idx.totalAyahs, icon: <Hash className="w-4 h-4" /> },
            { label: 'إجمالي الكلمات', value: idx.totalWords.toLocaleString('en'), icon: <Layers className="w-4 h-4" /> },
            { label: 'الكلمات المميزة', value: idx.uniqueWords.toLocaleString('en'), icon: <BookOpen className="w-4 h-4" /> },
            { label: 'البسملات غير المحتسبة', value: `+${idx.totalBismillahCount}`, icon: <BarChart3 className="w-4 h-4" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-natural-300 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-natural-500 mb-2">
                {s.icon}
                <span className="text-[11px] font-bold font-sans">{s.label}</span>
              </div>
              <div className="text-2xl font-amiri font-bold text-natural-900">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-l from-amber-50 to-white border border-amber-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-sans text-natural-900 mb-1">
                «{result.query}»
              </h2>
              <p className="text-sm text-natural-600 font-sans">
                {result.queryWords.length > 1
                  ? `وُجدت العبارة كاملة ${result.totalOccurrences} مرة`
                  : `وردت الكلمة ${result.totalOccurrences} مرة`}{' '}
                في {result.distinctAyahs} آية موزعة على {result.perSurah.length} سورة.
              </p>
            </div>
            <span className="text-xs font-sans text-natural-500 bg-natural-100 border border-natural-200 px-3 py-1.5 rounded-full">
              العدد لا يشمل البسملات الافتتاحية الـ {idx?.totalBismillahCount}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Per-surah distribution */}
            <div className="lg:col-span-1 bg-white border border-natural-300 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-natural-200">
                <h3 className="text-sm font-bold font-sans text-natural-900">التوزيع على السور</h3>
                <p className="text-[11px] text-natural-500 font-sans mt-0.5">
                  اضغط على سورة للانتقال لأول موضع
                </p>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {result.perSurah.map((row, i) => {
                  const first = firstHitAyahForSurah(result, row.surahId);
                  const max = result.perSurah[0]?.occurrences || 1;
                  return (
                    <Link
                      key={row.surahId}
                      href={`/surah/${row.surahId}${first ? `?highlight=${first}` : ''}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition border-b border-natural-100 last:border-0"
                    >
                      <span className="text-[11px] font-mono font-bold text-natural-400 w-6 shrink-0 text-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-natural-800 truncate font-sans">
                            سورة {row.surahName}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-800 shrink-0">
                            {row.occurrences} ×
                          </span>
                        </div>
                        <div className="h-1.5 bg-natural-100 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.max(4, Math.round((row.occurrences / max) * 100))}%` }}
                          />
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-natural-300 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Ayah hits */}
            <div className="lg:col-span-2 bg-white border border-natural-300 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-natural-200">
                <h3 className="text-sm font-bold font-sans text-natural-900">
                  المواضع ({result.hits.length} آية)
                </h3>
              </div>
              <div className="divide-y divide-natural-100 max-h-[420px] overflow-y-auto">
                {result.hits.slice(0, 60).map((h) => (
                  <Link
                    key={`${h.surahId}-${h.ayahNumber}`}
                    href={`/surah/${h.surahId}?highlight=${h.ayahNumber}`}
                    className="block px-4 py-3 hover:bg-amber-50 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold font-sans bg-natural-100 text-natural-700 border border-natural-200 px-2 py-0.5 rounded-lg">
                        سورة {h.surahName} — الآية {h.ayahNumber}
                      </span>
                      {h.occurrencesInAyah > 1 && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-sans">
                          {h.occurrencesInAyah} مواضع في هذه الآية
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-amiri text-natural-900 leading-relaxed">{h.text}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top words */}
      {idx && !result && (
        <div className="bg-white border border-natural-300 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-bold font-sans text-natural-900 mb-4">
            الكلمات الأكثر وروداً في القرآن
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
            {idx.topWords.slice(0, 24).map(([word, count]) => {
              const max = idx.topWords[0][1];
              return (
                <button
                  key={word}
                  onClick={() => {
                    setQuery(word);
                    setResult(null);
                    setTimeout(() => runSearch(), 0);
                  }}
                  className="flex items-center gap-3 cursor-pointer group"
                  title="اضغط لعرض توزيع هذه الكلمة"
                >
                  <span className="font-amiri text-lg text-natural-900 w-24 text-right group-hover:text-amber-800 transition">
                    {word}
                  </span>
                  <div className="flex-1 h-2 bg-natural-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full group-hover:bg-amber-600 transition"
                      style={{ width: `${Math.max(3, Math.round((count / max) * 100))}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-natural-500 w-10 text-left">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-natural-500 font-sans mt-4 leading-relaxed">
            الكلمات معروضة برسم المصحف كما في النص (الألف اللفظية تكتب على شكلها
            الأصلي كـ«ذلك» و«الصلوة»)، ويُتسامح عند البحث في صيغها مع الألف
            التامة («الصلاة»، «العالمين»)، والأعداد لا تشمل البسملات الافتتاحية.
          </p>
        </div>
      )}
    </div>
  );
}