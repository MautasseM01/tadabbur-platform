'use client';

import { useState, useMemo } from 'react';
import { Word, Ayah } from '@/lib/mock-data';
import { getSelectedAIModel } from '@/lib/aiClient';
import { syncDashboardProgressToFirestore } from '@/lib/firebaseSync';
import { X, Sparkles, Loader2, ArrowLeftRight, BookOpen, Layers, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordAnalyzerProps {
  word: Word | null;
  contextAyah: string;
  onClose: () => void;
  onOpenCompare?: (word: Word) => void;
  surahAyahs?: Ayah[];
  surahName?: string;
  onSelectAyah?: (ayahNumber: number) => void;
  theme?: 'light' | 'sepia' | 'dark';
}

export default function WordAnalyzer({
  word,
  contextAyah,
  onClose,
  onOpenCompare,
  surahAyahs = [],
  surahName = 'السورة',
  onSelectAyah,
  theme = 'light'
}: WordAnalyzerProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getThemeClasses = () => {
    switch (theme) {
      case 'sepia':
        return {
          drawer: 'bg-[#f8f2e6] border-r border-[#dfd0b5] text-[#3e2e1e]',
          title: 'text-[#2d2013]',
          closeBtn: 'hover:bg-[#ebdcc4] text-[#5c4528]',
          mainBox: 'bg-[#eee2ce] border-[#d8c5a8]',
          wordText: 'text-[#2d2013]',
          infoBox: 'bg-[#faf5eb] border-[#d8c5a8]',
          subLabel: 'text-[#785e40]',
          rootText: 'text-[#3e2e1e]',
          sectionHeader: 'text-[#6e5333]',
          aiBtn: 'bg-[#5c4428] hover:bg-[#46331d] text-[#faf5eb]',
          aiText: 'text-[#3e2e1e]',
          divider: 'border-[#dfd0b5]',
          occurrenceCard: 'bg-[#faf5eb] border-[#d8c5a8] hover:border-[#b89c72]',
          badge: 'bg-amber-900/10 text-amber-900 border-amber-900/20',
        };
      case 'dark':
        return {
          drawer: 'bg-[#16161c] border-r border-[#2a2a34] text-[#e4e4e7]',
          title: 'text-[#f4f4f5]',
          closeBtn: 'hover:bg-[#282834] text-[#a1a1aa]',
          mainBox: 'bg-[#22222b] border-[#323240]',
          wordText: 'text-[#f4f4f5]',
          infoBox: 'bg-[#1a1a22] border-[#323240]',
          subLabel: 'text-[#a1a1aa]',
          rootText: 'text-[#f4f4f5]',
          sectionHeader: 'text-[#a1a1aa]',
          aiBtn: 'bg-[#d97706] hover:bg-[#b45309] text-white',
          aiText: 'text-[#d4d4d8]',
          divider: 'border-[#2a2a34]',
          occurrenceCard: 'bg-[#1a1a22] border-[#323240] hover:border-[#4b4b5e]',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'light':
      default:
        return {
          drawer: 'bg-white border-r border-natural-300 text-natural-900',
          title: 'text-natural-900',
          closeBtn: 'hover:bg-natural-100 text-natural-800',
          mainBox: 'bg-natural-50 border-natural-300',
          wordText: 'text-natural-700',
          infoBox: 'bg-white border-natural-300',
          subLabel: 'text-natural-500',
          rootText: 'text-natural-700',
          sectionHeader: 'text-natural-600',
          aiBtn: 'bg-natural-800 hover:bg-natural-900 text-white',
          aiText: 'text-natural-800',
          divider: 'border-natural-300',
          occurrenceCard: 'bg-white border-natural-200 hover:border-amber-300 shadow-xs',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
        };
    }
  };

  const t = getThemeClasses();

  // Calculate occurrences of words sharing the exact same root in this Surah
  const rootOccurrences = useMemo(() => {
    if (!word || !word.root || !surahAyahs || surahAyahs.length === 0) return [];
    const targetRoot = word.root.trim();
    const matches: { ayahNumber: number; wordText: string; ayahText: string }[] = [];

    surahAyahs.forEach((ayah) => {
      ayah.words.forEach((w) => {
        if (w.root && w.root.trim() === targetRoot) {
          matches.push({
            ayahNumber: ayah.ayahNumber,
            wordText: w.text,
            ayahText: ayah.text,
          });
        }
      });
    });

    return matches;
  }, [word, surahAyahs]);

  const handleAskAI = async () => {
    if (!word) return;
    setLoading(true);
    setAiAnalysis(null);
    setAiSource('');
    try {
      const selected = getSelectedAIModel();
      const res = await fetch('/api/gemini/analyze-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordText: word.text,
          root: word.root,
          context: contextAyah,
          provider: selected.provider,
          model: selected.model,
        }),
      });
      const data = await res.json();
      if (data.text) {
        setAiAnalysis(data.text);
        setAiSource(data.model || '');
        try {
          const saved = localStorage.getItem('tadabbur_progress_data_v1');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.totalWordsAnalyzed = (parsed.totalWordsAnalyzed || 0) + 1;
            parsed.totalAyahsAnalyzed = (parsed.totalAyahsAnalyzed || 0) + 1;
            localStorage.setItem('tadabbur_progress_data_v1', JSON.stringify(parsed));
            syncDashboardProgressToFirestore(parsed).catch(() => {});
          }
        } catch {
          // ignore localStorage error
        }
      } else {
        setAiAnalysis("عذراً، حدث خطأ أثناء التحليل.");
      }
    } catch {
      setAiAnalysis("عذراً، حدث خطأ أثناء الاتصال بالمخدم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {word && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className={`fixed left-0 top-0 bottom-0 w-[330px] sm:w-[380px] shadow-2xl z-50 flex flex-col pt-16 sm:pt-0 transition-colors duration-300 ${t.drawer}`}
        >
          <div className="p-6 sm:p-7 flex-1 overflow-y-auto space-y-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className={`text-base font-bold font-sans ${t.title}`}>تحليل الكلمة والجذر</h3>
              </div>
              <button onClick={onClose} className={`p-1.5 rounded-lg transition ${t.closeBtn}`} title="إغلاق النافذة">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Main Word & Root Card */}
            <div className={`p-5 rounded-3xl border transition-colors duration-300 ${t.mainBox}`}>
              <div className={`text-3xl font-amiri font-bold text-center mb-4 ${t.wordText}`} dir="rtl">{word.text}</div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className={`p-3 rounded-2xl border transition-colors duration-300 ${t.infoBox}`}>
                  <p className={`text-[10px] uppercase font-sans font-bold tracking-wider mb-1 ${t.subLabel}`}>الجذر اللغوي</p>
                  <p className={`font-bold text-lg font-amiri ${t.rootText}`}>{word.root}</p>
                </div>

                <div className={`p-3 rounded-2xl border transition-colors duration-300 ${t.infoBox}`}>
                  <p className={`text-[10px] uppercase font-sans font-bold tracking-wider mb-1 ${t.subLabel}`}>مواضع الجذر بالسورة</p>
                  <p className={`font-bold text-lg font-amiri ${t.rootText}`}>
                    {rootOccurrences.length > 0 ? `${rootOccurrences.length} مواضع` : `${word.occurrences || 1} مرات`}
                  </p>
                </div>
              </div>

              {onOpenCompare && (
                <button
                  type="button"
                  onClick={() => onOpenCompare(word)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-sans text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                  <span>مقارنة الكلمة بكلمة أخرى</span>
                </button>
              )}
            </div>

            {/* Same Root Occurrences Section */}
            <div className={`pt-4 border-t ${t.divider}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-[11px] uppercase tracking-wider font-sans font-bold ${t.sectionHeader} flex items-center gap-1.5`}>
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>مواضع جذر ({word.root}) في {surahName}</span>
                </p>
                <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${t.badge}`}>
                  {rootOccurrences.length} آيات
                </span>
              </div>

              {rootOccurrences.length === 0 ? (
                <p className="text-xs text-natural-500 font-sans italic text-center py-2">
                  لا توجد مواضع أخرى لهذا الجذر في هذه السورة.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {rootOccurrences.map((occ, idx) => (
                    <div
                      key={`${occ.ayahNumber}-${idx}`}
                      onClick={() => onSelectAyah && onSelectAyah(occ.ayahNumber)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group text-right ${t.occurrenceCard}`}
                      title={`انتقل إلى الآية ${occ.ayahNumber}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-amber-700 font-sans flex items-center gap-1">
                          <span>الآية {occ.ayahNumber}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-xs font-amiri font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-900 border border-amber-400/30">
                          {occ.wordText}
                        </span>
                      </div>
                      <p className="text-xs font-amiri text-natural-700 leading-relaxed line-clamp-2" dir="rtl">
                        {occ.ayahText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Deep Analysis Section */}
            <div className={`pt-4 border-t ${t.divider}`}>
              <p className={`text-[11px] uppercase tracking-wider font-sans font-bold mb-3 text-right ${t.sectionHeader}`}>التحليل البياني (AI)</p>
              
              <button
                onClick={handleAskAI}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all shadow-xs disabled:opacity-70 mb-3 font-sans text-sm cursor-pointer ${t.aiBtn}`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'جاري التحليل العميق...' : 'اطلب التحليل البياني'}</span>
              </button>

              {aiAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className={`text-xs font-sans text-justify leading-relaxed ${t.aiText}`} dir="rtl">
                    {aiAnalysis}
                  </p>
                  {aiSource && (
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.badge}`} dir="rtl">
                      تم عبر: {aiSource}
                    </span>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
