'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Word, Ayah } from '@/lib/mock-data';
import { getWordLexiconEntry } from '@/lib/arabicLexicon';
import { getSelectedAIModel } from '@/lib/aiClient';
import { AIWordAnalysis } from '@/lib/ai';
import { syncDashboardProgressToFirestore } from '@/lib/firebaseSync';
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Loader2, 
  ArrowLeftRight, 
  Layers, 
  Bookmark, 
  Quote, 
  CheckCircle2, 
  ExternalLink,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordRootModalProps {
  word: Word | null;
  contextAyah: string;
  onClose: () => void;
  onOpenCompare?: (word: Word) => void;
  surahAyahs?: Ayah[];
  surahName?: string;
  onSelectAyah?: (ayahNumber: number) => void;
  theme?: 'light' | 'sepia' | 'dark';
}

export default function WordRootModal({
  word,
  contextAyah,
  onClose,
  onOpenCompare,
  surahAyahs = [],
  surahName = 'السورة',
  onSelectAyah,
  theme = 'light'
}: WordRootModalProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string>('');
  const [aiWordAnalysis, setAiWordAnalysis] = useState<AIWordAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [streamPreview, setStreamPreview] = useState('');
  const [showOccurrences, setShowOccurrences] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const askedFor = useRef<string | null>(null);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      setTimeout(() => setCopiedLabel((c) => (c === label ? null : c)), 1600);
    } catch {
      // clipboard unavailable
    }
  };

  const lexiconEntry = useMemo(() => {
    if (!word) return null;
    return getWordLexiconEntry(word.text, word.root);
  }, [word]);

  // The linguistic AI agent is the authoritative source once it responds
  const displayRoot = aiWordAnalysis?.root || lexiconEntry?.root || '---';
  const displayRootLetters = aiWordAnalysis?.rootLetters || lexiconEntry?.rootLetters || [];
  const displayReferences = aiWordAnalysis?.lexiconReferences && aiWordAnalysis.lexiconReferences.length > 0
    ? aiWordAnalysis.lexiconReferences
    : (lexiconEntry?.lexiconReferences || []);
  const displayDerivatives = aiWordAnalysis?.derivatives || [];

  // Calculate occurrences of words sharing the same root in this Surah
  const rootOccurrences = useMemo(() => {
    if (!word || !lexiconEntry || !surahAyahs || surahAyahs.length === 0) return [];
    const targetRoot = displayRoot.trim();
    const matches: { ayahNumber: number; wordText: string; ayahText: string }[] = [];

    surahAyahs.forEach((ayah) => {
      ayah.words.forEach((w) => {
        const wRoot = w.root ? w.root.trim() : '';
        if (wRoot === targetRoot) {
          matches.push({
            ayahNumber: ayah.ayahNumber,
            wordText: w.text,
            ayahText: ayah.text,
          });
        }
      });
    });

    return matches;
  }, [word, lexiconEntry, displayRoot, surahAyahs]);

  const handleAskAI = async () => {
    if (!word || !lexiconEntry) return;
    setLoadingAi(true);
    setAiAnalysis(null);
    setStreamPreview('');
    setAiSource('');
    try {
      const selected = getSelectedAIModel();
      const res = await fetch('/api/gemini/analyze-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wordText: word.text, 
          root: lexiconEntry.root, 
          context: contextAyah,
          provider: selected.provider,
          model: selected.model,
          stream: true,
        }),
      });
      if (!res.ok) {
        setAiAnalysis("عذراً، حدث خطأ أثناء التحليل بالذكاء الاصطناعي.");
        return;
      }
      if (!res.body) {
        setAiAnalysis("عذراً، حدث خطأ أثناء الاتصال بالخادم.");
        return;
      }

      // Read the SSE stream: tokens appear live, a final 'done' event carries
      // the structured analysis.
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalData: any = null;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;
            let evt: any;
            try {
              evt = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (evt.type === 'token' && typeof evt.text === 'string') {
              setStreamPreview((prev) => (prev + evt.text).slice(-12000));
            } else if (evt.type === 'done') {
              finalData = evt.result;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (finalData && finalData.text) {
        setAiWordAnalysis(finalData.wordAnalysis || null);
        setAiAnalysis(finalData.wordAnalysis?.analysis || finalData.text);
        setAiSource(`${finalData.model || ''}${finalData.cached ? ' • تحليل محفوظ' : ''}`);
        try {
          const saved = localStorage.getItem('tadabbur_progress_data_v1');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.totalWordsAnalyzed = (parsed.totalWordsAnalyzed || 0) + 1;
            localStorage.setItem('tadabbur_progress_data_v1', JSON.stringify(parsed));
            syncDashboardProgressToFirestore(parsed).catch(() => {});
          }
        } catch {
          // ignore localStorage error
        }
      } else {
        setAiAnalysis("عذراً، حدث خطأ أثناء التحليل بالذكاء الاصطناعي.");
      }
    } catch {
      setAiAnalysis("عذراً، حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Auto-run the linguistic agent (root verification + web search) the moment
  // the modal opens for a word, and inject the results into the UI.
  useEffect(() => {
    if (!word || !lexiconEntry) return;
    if (askedFor.current === word.id) return;
    askedFor.current = word.id;
    handleAskAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.id]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return {
          modalBox: 'bg-[#f8f2e6] border-[#dfd0b5] text-[#3e2e1e]',
          header: 'border-b border-[#dfd0b5] bg-[#eee2ce]',
          wordBox: 'bg-[#eee2ce] border-[#d8c5a8]',
          defCard: 'bg-[#faf5eb] border-[#d8c5a8]',
          lexiconCard: 'bg-[#fffcf5] border-[#d8c5a8]',
          badge: 'bg-[#ebdcc4] text-[#5c4528] border-[#d8c5a8]',
          buttonPrimary: 'bg-[#5c4428] hover:bg-[#46331d] text-[#faf5eb]',
          buttonSecondary: 'bg-[#faf5eb] hover:bg-[#eee2ce] text-[#5c4528] border-[#d8c5a8]'
        };
      case 'dark':
        return {
          modalBox: 'bg-[#1c1c24] border-[#323240] text-[#e4e4e7]',
          header: 'border-b border-[#2a2a34] bg-[#22222b]',
          wordBox: 'bg-[#282834] border-[#3a3a4a]',
          defCard: 'bg-[#22222b] border-[#323240]',
          lexiconCard: 'bg-[#181820] border-[#323240]',
          badge: 'bg-[#323240] text-[#d4d4d8] border-[#444456]',
          buttonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
          buttonSecondary: 'bg-[#282834] hover:bg-[#323240] text-[#e4e4e7] border-[#3e3e50]'
        };
      case 'light':
      default:
        return {
          modalBox: 'bg-white border-natural-200 text-natural-900',
          header: 'border-b border-natural-200 bg-natural-50/80',
          wordBox: 'bg-amber-50/60 border-amber-200',
          defCard: 'bg-natural-50 border-natural-200',
          lexiconCard: 'bg-white border-natural-200 shadow-xs',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          buttonPrimary: 'bg-natural-900 hover:bg-natural-800 text-white',
          buttonSecondary: 'bg-white hover:bg-natural-100 text-natural-800 border-natural-300'
        };
    }
  };

  const t = getThemeClasses();

  if (!word || !lexiconEntry) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-auto ${t.modalBox}`}
          dir="rtl"
        >
          {/* Header */}
          <div className={`p-5 sm:px-7 flex items-center justify-between ${t.header}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-sans">
                  بطاقة الجذر والمعجم اللغوي
                </h3>
                <p className="text-xs text-natural-500 font-sans">
                  تحليل المفردة القرآنية من المعاجم المعتمدة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-natural-200/50 text-natural-500 hover:text-natural-900 transition cursor-pointer"
              title="إغلاق النافذة (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* 1. Quranic Word & Root Showcase */}
            <div className={`p-6 rounded-3xl border text-center relative overflow-hidden ${t.wordBox}`}>
              <span className="text-xs font-bold font-sans text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
                الكلمة القرآنية في سورة {surahName}
              </span>
              <h2 className="text-4xl sm:text-5xl font-amiri font-bold mb-4 tracking-wide text-natural-900">
                {word.text}
              </h2>

              {contextAyah && (
                <p className="text-sm font-amiri text-natural-600 bg-white/70 px-4 py-2 rounded-xl inline-block max-w-lg mx-auto mb-4 border border-amber-100">
                  &ldquo; {contextAyah} &rdquo;
                </p>
              )}

              {/* Root Letters Breakdown */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-amber-200/60">
                <span className="text-xs font-bold font-sans text-natural-500">
                  الجذر اللغوي:
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white text-amber-900 border border-amber-300 font-amiri text-xl font-bold shadow-xs">
                  {displayRoot}
                </span>
                <div className="flex items-center gap-1.5">
                  {displayRootLetters.map((char, index) => (
                    <span
                      key={index}
                      className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-300/60 font-amiri text-lg font-bold flex items-center justify-center"
                    >
                      {char}
                    </span>
                  ))}
                </div>
                {aiWordAnalysis && (
                  <span className="w-full text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    الجذر مُحقَّق بواسطة الوكيل اللغوي (بحث حقيقي)
                  </span>
                )}
              </div>
            </div>

            {/* 2. Simplified Definition (تعريف مبسط) */}
            <div className={`p-5 rounded-2xl border ${t.defCard}`}>
              <div className="flex items-center gap-2 mb-2 text-amber-700 font-sans font-bold text-sm">
                <Info className="w-4 h-4" />
                <span>التعريف اللغوي</span>
                {aiWordAnalysis && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mr-auto">
                    بيانات حقيقية من الوكيل اللغوي
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-sans text-natural-800 leading-relaxed">
                {aiWordAnalysis?.simpleDefinition || lexiconEntry.simpleDefinition}
              </p>
              {aiWordAnalysis?.etymology ? (
                <div className="mt-3 pt-3 border-t border-natural-200 text-xs sm:text-sm font-sans text-natural-600 leading-relaxed">
                  <span className="font-bold text-natural-800">أصل الاشتقاق: </span>
                  {aiWordAnalysis.etymology}
                </div>
              ) : null}
              {(aiWordAnalysis?.quranicUsageNote || lexiconEntry.quranicUsageNote) && (
                <div className="mt-3 pt-3 border-t border-natural-200 text-xs sm:text-sm font-sans text-natural-600 leading-relaxed">
                  <span className="font-bold text-natural-800">في الاستعمال القرآني: </span>
                  {aiWordAnalysis?.quranicUsageNote || lexiconEntry.quranicUsageNote}
                </div>
              )}
            </div>

            {/* 3. Authentic Lexicon References (مراجع من معجم لغوي) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-sans font-bold text-sm text-natural-900">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>مراجع من المعاجم اللغوية المعتمدة</span>
                </div>
                <span className="text-xs text-natural-500 font-sans">
                  {displayReferences.length} معجم
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {displayReferences.map((ref, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${t.lexiconCard}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold font-sans text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        📖 {ref.source}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-sans text-natural-500">
                          {ref.author} {ref.volume ? `• ${ref.volume}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(ref.quote, `ref-${idx}`)}
                          className="p-1.5 rounded-lg border border-natural-200 text-natural-500 hover:text-amber-800 hover:border-amber-300 hover:bg-amber-50 transition cursor-pointer"
                          title="نسخ نص الشاهد من المعجم"
                        >
                          {copiedLabel === `ref-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    </div>
                    <p
                      onClick={() => copyText(ref.quote, `ref-${idx}`)}
                      className="text-sm font-amiri text-natural-800 leading-relaxed pl-2 border-r-2 border-amber-400 cursor-pointer hover:bg-amber-50/50 rounded-lg transition select-text"
                      title="انقر لنسخ نص الشاهد"
                    >
                      &ldquo; {ref.quote} &rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3b. Derivatives from the same root (AI agent) */}
            {displayDerivatives.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 font-sans font-bold text-sm text-natural-900">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>مشتقات من الجذر ({displayRoot}) في القرآن</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayDerivatives.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => copyText(d, `deriv-${idx}`)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-amiri text-sm font-bold hover:bg-amber-100 hover:border-amber-400 transition cursor-pointer"
                      title="انقر لنسخ المشتقة"
                    >
                      {copiedLabel === `deriv-${idx}` ? (
                        <Check className="w-3 h-3 inline ml-1 text-emerald-600" />
                      ) : null}
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Occurrences in Current Surah */}
            <div>
              <button
                type="button"
                onClick={() => setShowOccurrences(!showOccurrences)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition text-xs font-bold font-sans cursor-pointer ${t.buttonSecondary}`}
              >
                <span>
                  مواضع الجذر ({displayRoot}) في {surahName} ({rootOccurrences.length} آيات)
                </span>
                <span className="text-amber-600 font-sans">
                  {showOccurrences ? 'إخفاء ▲' : 'عرض المواضع ▼'}
                </span>
              </button>

              {showOccurrences && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {rootOccurrences.length === 0 ? (
                    <p className="text-xs text-natural-500 text-center py-3">
                      لا توجد مواضع أخرى لهذا الجذر في هذه السورة.
                    </p>
                  ) : (
                    rootOccurrences.map((occ, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (onSelectAyah) {
                            onSelectAyah(occ.ayahNumber);
                            onClose();
                          }
                        }}
                        className="p-3 rounded-xl border border-natural-200 hover:border-amber-300 bg-natural-50/50 hover:bg-amber-50/40 transition cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-amber-800 font-sans">
                          الآية {occ.ayahNumber} • ({occ.wordText})
                        </span>
                        <span className="font-amiri text-natural-700 line-clamp-1 max-w-[65%]" dir="rtl">
                          {occ.ayahText}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 5. AI Deep Analysis Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAskAI}
                disabled={loadingAi}
                className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-sans font-semibold text-sm transition shadow-sm cursor-pointer disabled:opacity-70 ${t.buttonPrimary}`}
              >
                {loadingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>جاري البحث في الإنترنت والتحليل البياني العميق...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{aiAnalysis ? 'إعادة البحث في الويب والتحليل' : 'تحليل الوكيل اللغوي (تأصيل الجذر + بحث في المصادر)'}</span>
                  </>
                )}
              </button>

              {loadingAi && (
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-sans text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>الوكيل اللغوي يبحث الآن في معاجم (لسان العرب، مقاييس اللغة، المفردات، الوسيط) عبر الإنترنت...</span>
                </div>
              )}

              {loadingAi && streamPreview && (
                <div className="mt-3 p-4 rounded-2xl bg-white/80 border border-amber-200 text-natural-700 text-xs sm:text-sm font-sans leading-relaxed text-justify whitespace-pre-wrap max-h-56 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>الوكيل اللغوي يكتب التحليل الآن...</span>
                  </div>
                  {streamPreview}
                  <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse rounded-sm ml-0.5" />
                </div>
              )}

              {aiAnalysis && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-natural-800 text-xs sm:text-sm font-sans leading-relaxed text-justify">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>تحليل البيان القرآني للكلمة:</span>
                  </div>
                  {aiAnalysis}
                  {aiSource && (
                    <div className="mt-2 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-2.5 py-0.5 inline-block">
                      تم عبر: {aiSource}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className={`p-4 sm:px-7 border-t border-natural-200 flex flex-col sm:flex-row items-center justify-between gap-3 ${t.header}`}>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenCompare && (
                <button
                  type="button"
                  onClick={() => onOpenCompare(word)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-sans text-xs font-bold transition cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-700" />
                  <span>مقارنة الكلمة بكلمة أخرى</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-natural-800 hover:bg-natural-900 text-white font-sans text-xs font-semibold transition cursor-pointer text-center"
            >
              إغلاق النافذة
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
