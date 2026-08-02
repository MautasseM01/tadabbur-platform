'use client';

import { useState, useEffect } from 'react';
import { Word, Ayah } from '@/lib/mock-data';
import { getSelectedAIModel } from '@/lib/aiClient';
import { syncDashboardProgressToFirestore } from '@/lib/firebaseSync';
import { X, Sparkles, Loader2, ArrowLeftRight, Check, BookOpen, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordComparisonModalProps {
  ayah: Ayah | null;
  initialWord1?: Word | null;
  initialWord2?: Word | null;
  onClose: () => void;
  theme?: 'light' | 'sepia' | 'dark';
}

export default function WordComparisonModal({
  ayah,
  initialWord1 = null,
  initialWord2 = null,
  onClose,
  theme = 'light'
}: WordComparisonModalProps) {
  const [word1, setWord1] = useState<Word | null>(() => {
    if (initialWord1) return initialWord1;
    if (ayah && ayah.words.length > 0) return ayah.words[0];
    return null;
  });
  const [word2, setWord2] = useState<Word | null>(() => {
    if (initialWord2) return initialWord2;
    if (ayah && ayah.words.length > 1) {
      const w1Id = initialWord1?.id || ayah.words[0]?.id;
      return ayah.words.find(w => w.id !== w1Id) || ayah.words[1];
    }
    return null;
  });
  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return {
          modalBg: 'bg-[#faf5eb] text-[#3e2e1e] border-[#dfd0b5]',
          card: 'bg-[#eee2ce] border-[#d8c5a8]',
          header: 'border-[#dfd0b5]',
          word1Badge: 'bg-amber-800 text-amber-50 border-amber-900',
          word2Badge: 'bg-emerald-800 text-emerald-50 border-emerald-900',
          wordSelectActive1: 'border-amber-700 bg-amber-100/80 text-amber-950 font-bold',
          wordSelectActive2: 'border-emerald-700 bg-emerald-100/80 text-emerald-950 font-bold',
          wordSelectDefault: 'border-[#dfd0b5] bg-[#f5ebd9] text-[#5c4528] hover:bg-[#ebdcc4]',
          aiBox: 'bg-[#faf0df] border-[#d8c5a8] text-[#3e2e1e]',
          aiBtn: 'bg-[#5c4428] hover:bg-[#46331d] text-[#faf5eb]',
        };
      case 'dark':
        return {
          modalBg: 'bg-[#141419] text-[#e4e4e7] border-[#2a2a34]',
          card: 'bg-[#1e1e26] border-[#323240]',
          header: 'border-[#2a2a34]',
          word1Badge: 'bg-amber-600/30 text-amber-300 border-amber-500/50',
          word2Badge: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50',
          wordSelectActive1: 'border-amber-500 bg-amber-950/60 text-amber-300 font-bold ring-2 ring-amber-500/40',
          wordSelectActive2: 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold ring-2 ring-emerald-500/40',
          wordSelectDefault: 'border-[#2e2e3a] bg-[#181820] text-[#a1a1aa] hover:bg-[#262632]',
          aiBox: 'bg-[#1a1a24] border-[#323240] text-[#d4d4d8]',
          aiBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'light':
      default:
        return {
          modalBg: 'bg-white text-natural-900 border-natural-300',
          card: 'bg-natural-50 border-natural-200',
          header: 'border-natural-200',
          word1Badge: 'bg-amber-100 text-amber-900 border-amber-300',
          word2Badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          wordSelectActive1: 'border-amber-500 bg-amber-100 text-amber-950 font-bold ring-2 ring-amber-400',
          wordSelectActive2: 'border-emerald-500 bg-emerald-100 text-emerald-950 font-bold ring-2 ring-emerald-400',
          wordSelectDefault: 'border-natural-200 bg-white text-natural-700 hover:bg-natural-100',
          aiBox: 'bg-amber-50/40 border-amber-200 text-natural-800',
          aiBtn: 'bg-natural-900 hover:bg-black text-white',
        };
    }
  };

  const t = getThemeClasses();

  const handleWordClick = (word: Word) => {
    if (word1?.id === word.id) {
      // Toggle off word1
      setWord1(null);
    } else if (word2?.id === word.id) {
      // Toggle off word2
      setWord2(null);
    } else if (!word1) {
      setWord1(word);
    } else if (!word2) {
      setWord2(word);
    } else {
      // Both filled, replace word2 with new selection
      setWord2(word);
    }
  };

  const handleCompareAI = async () => {
    if (!word1 || !word2 || !ayah) return;
    setLoading(true);
    setAiComparison(null);
    setAiSource('');
    try {
      const selected = getSelectedAIModel();
      const res = await fetch('/api/gemini/compare-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word1: { text: word1.text, root: word1.root },
          word2: { text: word2.text, root: word2.root },
          contextAyah: ayah.text,
          provider: selected.provider,
          model: selected.model,
        })
      });
      const data = await res.json();
      if (data.text) {
        setAiComparison(data.text);
        setAiSource(data.model || '');
        try {
          const saved = localStorage.getItem('tadabbur_progress_data_v1');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.totalWordsAnalyzed = (parsed.totalWordsAnalyzed || 0) + 2;
            parsed.totalAyahsAnalyzed = (parsed.totalAyahsAnalyzed || 0) + 1;
            localStorage.setItem('tadabbur_progress_data_v1', JSON.stringify(parsed));
            syncDashboardProgressToFirestore(parsed).catch(() => {});
          }
        } catch {
          // ignore
        }
      } else {
        setAiComparison("عذراً، تعذر إجراء التحليل المقارن في الوقت الحالي.");
      }
    } catch {
      setAiComparison("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  };

  if (!ayah) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl p-6 sm:p-8 my-8 transition-colors ${t.modalBg}`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-5 mb-6 border-b ${t.header}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-sans">عرض المقارنة اللغوية بين الكلمات</h2>
                <p className="text-xs text-natural-500 font-sans mt-0.5">
                  اختر كلمتين من الآية {ayah.ayahNumber} لمقارنة المعاني والأصول البلاغية جنباً إلى جنب
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-natural-300 hover:bg-natural-100 text-natural-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Ayah Word Picker */}
          <div className="mb-6 bg-natural-50/70 border border-natural-200 rounded-2xl p-5 text-right">
            <span className="text-xs font-bold font-sans text-natural-500 block mb-3 uppercase tracking-wider">
              انقر على كلمتين من نص الآية الكريمة للمقارنة:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2" dir="rtl">
              {ayah.words.map((w) => {
                const isSelected1 = word1?.id === w.id;
                const isSelected2 = word2?.id === w.id;
                
                let btnClass = t.wordSelectDefault;
                if (isSelected1) btnClass = t.wordSelectActive1;
                if (isSelected2) btnClass = t.wordSelectActive2;

                return (
                  <button
                    key={w.id}
                    onClick={() => handleWordClick(w)}
                    className={`relative px-3.5 py-2 rounded-xl border text-xl font-amiri transition-all cursor-pointer ${btnClass}`}
                  >
                    {w.text}
                    {isSelected1 && (
                      <span className="absolute -top-2 -right-2 text-[10px] bg-amber-600 text-white font-sans font-bold px-1.5 py-0.5 rounded-full shadow">
                        الكلمة 1
                      </span>
                    )}
                    {isSelected2 && (
                      <span className="absolute -top-2 -right-2 text-[10px] bg-emerald-600 text-white font-sans font-bold px-1.5 py-0.5 rounded-full shadow">
                        الكلمة 2
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Word 1 Card */}
            <div className={`rounded-2xl border p-6 flex flex-col justify-between ${t.card}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${t.word1Badge}`}>
                    الكلمة الأولى (A)
                  </span>
                  {word1 && (
                    <span className="text-xs font-sans text-natural-500 font-semibold">
                      تكرار الجذر: {word1.occurrences} مرات
                    </span>
                  )}
                </div>

                {word1 ? (
                  <div>
                    <h3 className="font-amiri text-4xl font-bold text-center mb-6 text-natural-900" dir="rtl">
                      {word1.text}
                    </h3>

                    <div className="space-y-3 font-sans text-xs">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-natural-200">
                        <span className="text-natural-500 font-medium">الجذر اللغوي:</span>
                        <span className="font-amiri text-xl font-bold text-amber-700">{word1.root}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-natural-200">
                        <span className="text-natural-500 font-medium">المعنى المحوري:</span>
                        <span className="font-bold text-natural-800">الأصل والمبنى اللغوي</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-natural-200">
                        <span className="text-natural-500 font-medium">الوظيفية في الآية:</span>
                        <span className="font-medium text-natural-700">مكون إفرادي دلالي</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-natural-400 font-sans text-sm">
                    اختر الكلمة الأولى من الآية
                  </div>
                )}
              </div>
            </div>

            {/* Word 2 Card */}
            <div className={`rounded-2xl border p-6 flex flex-col justify-between ${t.card}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${t.word2Badge}`}>
                    الكلمة الثانية (B)
                  </span>
                  {word2 && (
                    <span className="text-xs font-sans text-natural-500 font-semibold">
                      تكرار الجذر: {word2.occurrences} مرات
                    </span>
                  )}
                </div>

                {word2 ? (
                  <div>
                    <h3 className="font-amiri text-4xl font-bold text-center mb-6 text-natural-900" dir="rtl">
                      {word2.text}
                    </h3>

                    <div className="space-y-3 font-sans text-xs">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-natural-200">
                        <span className="text-natural-500 font-medium">الجذر اللغوي:</span>
                        <span className="font-amiri text-xl font-bold text-emerald-700">{word2.root}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-natural-200">
                        <span className="text-natural-500 font-medium">المعنى المحوري:</span>
                        <span className="font-bold text-natural-800">الأصل والمبنى اللغوي</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-natural-200">
                        <span className="text-natural-500 font-medium">الوظيفية في الآية:</span>
                        <span className="font-medium text-natural-700">مكون إفرادي دلالي</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-natural-400 font-sans text-sm">
                    اختر الكلمة الثانية من الآية
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Comparison Section */}
          <div className={`rounded-2xl border p-5 ${t.aiBox}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold font-sans text-sm text-natural-900">
                  التحليل البياني والمقارنة اللغوية العمقتين (AI)
                </h4>              </div>

              <button
                onClick={handleCompareAI}
                disabled={loading || !word1 || !word2}
                className={`px-4 py-2.5 rounded-xl font-sans text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer ${t.aiBtn}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>{loading ? 'جاري التحليل البياني...' : 'توليد التحليل المقارن'}</span>
              </button>
            </div>

            {aiComparison ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 border border-natural-200 rounded-xl p-4 text-xs font-sans text-justify leading-relaxed text-natural-800 whitespace-pre-line"
                dir="rtl"
              >
                {aiComparison}
                {aiSource && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-2.5 py-0.5">
                    تم عبر: {aiSource}
                  </span>
                )}
              </motion.div>
            ) : (
              <p className="text-xs font-sans text-natural-500 text-right">
                انقر على زر &quot;توليد التحليل المقارن&quot; للحصول على دراسة بلاغية ومعجمية مفصلة توضح الفرق واللمسة البيانية بين الكلمتين في سياق هذه الآية.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
