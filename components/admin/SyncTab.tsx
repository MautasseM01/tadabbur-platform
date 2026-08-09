'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { Ayah } from '@/lib/mock-data';
import { Save, CheckCircle, Clock, Wand2, Youtube } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchSurahSyncs, saveSurahSyncs, fetchSurahAudioId, saveSurahAudioId, runAIAutoSync } from '@/app/admin/sync/actions';
import { useAdminStore } from '@/lib/adminStore';
import { SURAH_NAMES } from '@/lib/surahs';
import PinnedPlayer from '@/components/surah/PinnedPlayer';

export default function SyncTab({ initialSurahId = 21 }: { initialSurahId?: number }) {
  const router = useRouter();
  const store = useAdminStore();
  const [surahId, setSurahId] = useState(initialSurahId);

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [surahName, setSurahName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioId, setAudioId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedAyahId, setExpandedAyahId] = useState<number | null>(null);

  // Keep the surah being synced inside the surah selector below
  const handleSurahChange = useCallback(
    (id: number) => {
      setSurahId(id);
      router.replace(`/admin?tab=sync&surahId=${id}`);
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      setSurahName(SURAH_NAMES[surahId - 1] || 'غير معروفة');
      // Base data from the server/API seeding, overlaid by the unified store
      try {
        const [syncData, idData] = await Promise.all([
          fetchSurahSyncs(surahId),
          fetchSurahAudioId(surahId),
        ]);
        if (cancelled) return;
        const storedSyncs = store.syncs[surahId];
        setAyahs(storedSyncs && storedSyncs.length > 0 ? storedSyncs : syncData);
        setAudioId(store.audioIds[surahId] || idData);
        setExpandedAyahId(null);
      } catch {
        if (!cancelled) setAyahs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahId]);

  const handleTimeChange = (id: number, field: 'startTime' | 'endTime', value: number) => {
    setAyahs(prev => prev.map(a => {
      if (a.id === id) {
        const updatedAyah = { ...a, [field]: value };

        // Scale inner word timings to fit new ayah boundaries
        if (updatedAyah.words && updatedAyah.words.length > 0) {
           const duration = updatedAyah.endTime - updatedAyah.startTime;
           if (duration > 0) {
             const wordsTextLength = updatedAyah.words.reduce((acc, w) => acc + w.text.length, 0);
             let currentWordTime = updatedAyah.startTime;
             updatedAyah.words = updatedAyah.words.map(w => {
               const wDuration = wordsTextLength > 0 ? (w.text.length / wordsTextLength) * duration : 0;
               const start = currentWordTime;
               currentWordTime += wDuration;
               return { ...w, startTime: start, endTime: currentWordTime };
             });
           }
        }
        return updatedAyah;
      }
      return a;
    }));
  };

  const setTimeToCurrent = (id: number, field: 'startTime' | 'endTime') => {
    handleTimeChange(id, field, Number(currentTime.toFixed(2)));
  };

  const handleWordTimeChange = (ayahId: number, wordId: string, field: 'startTime' | 'endTime', value: number) => {
    setAyahs(prev => prev.map(a => {
      if (a.id === ayahId && a.words) {
         return {
           ...a,
           words: a.words.map(w => w.id === wordId ? { ...w, [field]: value } : w)
         };
      }
      return a;
    }));
  };

  const setWordTimeToCurrent = (ayahId: number, wordId: string, field: 'startTime' | 'endTime') => {
    handleWordTimeChange(ayahId, wordId, field, Number(currentTime.toFixed(2)));
  };

  const handleAudioIdChange = (value: string) => {
    setAudioId(value);
  };

  const handleSave = () => {
    startTransition(async () => {
      // Unified store first (durable, reflected everywhere)
      await store.saveAudioId(surahId, audioId);
      await store.saveSyncs(surahId, ayahs);
      // Best-effort server file write (dev only)
      try {
        await saveSurahAudioId(surahId, audioId);
        await saveSurahSyncs(surahId, ayahs);
      } catch {
        // read-only serverless filesystem — the store already saved it
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleAISync = async () => {
    setIsSyncing(true);
    try {
      const newAyahs = await runAIAutoSync(surahId, ayahs);
      setAyahs(newAyahs);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-sans">جاري تحميل بيانات المزامنة...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-32">
      <PinnedPlayer
        videoId={audioId}
        title={`سورة ${surahName}`}
        subtitle="مشغل المزامنة"
        onTimeUpdate={setCurrentTime}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-natural-200 gap-6">
        <div>
          <h1 className="text-2xl font-bold font-sans text-natural-900 mb-2">إدارة المزامنة الدقيقة</h1>
          <p className="text-natural-600 text-sm mb-4">أدخل معرف يوتيوب للمقطع الصوتي، ويمكنك استخدام الذكاء الاصطناعي للمزامنة التلقائية.</p>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Youtube className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-natural-400" />
              <input
                type="text"
                value={audioId}
                onChange={(e) => handleAudioIdChange(e.target.value)}
                placeholder="YouTube Video ID"
                className="pl-3 pr-10 py-2 border border-natural-300 rounded-xl focus:ring-2 focus:ring-natural-400 outline-none text-left font-mono text-sm bg-natural-50 w-48"
              />
            </div>

            <button
              onClick={handleAISync}
              disabled={isSyncing}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-medium transition shadow-sm text-sm flex items-center gap-2 border border-amber-300 disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة ذكية (AI)'}</span>
            </button>

            <div className="inline-flex items-center gap-2 bg-natural-100 text-natural-800 px-3 py-2 rounded-xl font-mono text-sm border border-natural-300">
              <Clock className="w-4 h-4 text-natural-500" />
              <span>{currentTime.toFixed(2)} ثانية</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={surahId}
            onChange={(e) => handleSurahChange(Number(e.target.value))}
            className="px-3 py-2 border border-natural-300 rounded-xl bg-white font-sans text-sm text-natural-900 focus:outline-none"
            title="اختيار سورة للمزامنة"
          >
            {Array.from({ length: 114 }, (_, i) => i + 1).map((id) => (
              <option key={id} value={id}>{id}. سورة {SURAH_NAMES[id - 1]}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-natural-700 hover:bg-natural-800 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition shadow-sm text-sm whitespace-nowrap cursor-pointer"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isPending ? 'جاري الحفظ...' : saved ? 'تم الحفظ بنجاح!' : 'حفظ التعديلات'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-natural-300 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-right h-full">
          <thead>
            <tr className="bg-natural-100 border-b border-natural-300">
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600 w-16">الآية</th>
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600 min-w-[300px]">النص</th>
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600 text-center w-48">بداية (ثواني)</th>
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600 text-center w-48">نهاية (ثواني)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-natural-200">
            {ayahs.map(ayah => (
              <React.Fragment key={ayah.id}>
                <tr className={`transition ${currentTime >= ayah.startTime && currentTime <= ayah.endTime ? 'bg-amber-50' : 'hover:bg-natural-50'}`}>
                  <td className="p-4 font-sans text-natural-800 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-bold">{ayah.ayahNumber}</span>
                      <button
                        onClick={() => setExpandedAyahId(expandedAyahId === ayah.id ? null : ayah.id)}
                        className={`text-[10px] px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${expandedAyahId === ayah.id ? 'bg-amber-200 text-amber-800' : 'bg-natural-200 text-natural-700 hover:bg-natural-300'}`}
                      >
                        {expandedAyahId === ayah.id ? 'إخفاء الكلمات' : 'تفاصيل الكلمات'}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 font-amiri text-xl text-natural-900 leading-[1.8] text-right" dir="rtl">
                    {ayah.words && ayah.words.length > 0 ? (
                      ayah.words.map((word, wIdx) => {
                        const isActive = word.startTime !== undefined && word.endTime !== undefined && currentTime >= word.startTime && currentTime <= word.endTime;
                        return (
                          <span key={wIdx} className={`inline-block mx-1 px-1 rounded transition-colors ${isActive ? 'bg-amber-100 text-amber-900 font-bold' : ''}`}>
                            {word.text}
                          </span>
                        );
                      })
                    ) : (
                       ayah.text
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={ayah.startTime}
                        onChange={(e) => handleTimeChange(ayah.id, 'startTime', parseFloat(e.target.value))}
                        className="w-24 px-3 py-1.5 text-center bg-white border border-natural-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-natural-400 text-natural-900 font-mono text-sm"
                      />
                      <button
                        onClick={() => setTimeToCurrent(ayah.id, 'startTime')}
                        className="text-[10px] bg-natural-200 hover:bg-natural-300 text-natural-800 px-2 py-1 rounded transition w-24 cursor-pointer"
                      >
                        تحديد وقت المشغل
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={ayah.endTime}
                        onChange={(e) => handleTimeChange(ayah.id, 'endTime', parseFloat(e.target.value))}
                        className="w-24 px-3 py-1.5 text-center bg-white border border-natural-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-natural-400 text-natural-900 font-mono text-sm"
                      />
                      <button
                        onClick={() => setTimeToCurrent(ayah.id, 'endTime')}
                        className="text-[10px] bg-natural-200 hover:bg-natural-300 text-natural-800 px-2 py-1 rounded transition w-24 cursor-pointer"
                      >
                        تحديد وقت المشغل
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedAyahId === ayah.id && ayah.words && ayah.words.length > 0 && (
                  <tr className="bg-natural-50 border-t border-natural-200">
                    <td colSpan={4} className="p-4">
                      <div className="flex flex-wrap gap-4 justify-end items-start" dir="rtl">
                        {ayah.words.map((word, wIdx) => {
                           const isWActive = word.startTime !== undefined && word.endTime !== undefined && currentTime >= word.startTime && currentTime <= word.endTime;
                           return (
                             <div key={wIdx} className={`flex flex-col items-center p-2 rounded-xl border ${isWActive ? 'bg-amber-100 border-amber-300' : 'bg-white border-natural-200'} shadow-sm min-w-[100px]`}>
                               <span className="font-amiri text-lg mb-2 text-natural-900">{word.text}</span>
                               <div className="flex flex-col gap-1.5 w-full">
                                  <div className="flex flex-col gap-1 items-center">
                                    <span className="text-[9px] text-natural-500 font-sans tracking-wide">بداية</span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={word.startTime?.toFixed(2) || 0}
                                      onChange={(e) => handleWordTimeChange(ayah.id, word.id, 'startTime', parseFloat(e.target.value))}
                                      className="w-full text-center py-1 bg-natural-50 border border-natural-200 rounded text-xs outline-none focus:border-amber-400"
                                    />
                                    <button
                                      onClick={() => setWordTimeToCurrent(ayah.id, word.id, 'startTime')}
                                      className="w-full text-[9px] bg-natural-200 hover:bg-natural-300 rounded py-0.5 cursor-pointer"
                                    >الحالي</button>
                                  </div>
                                  <div className="w-full h-px bg-natural-200 my-0.5"></div>
                                  <div className="flex flex-col gap-1 items-center">
                                    <span className="text-[9px] text-natural-500 font-sans tracking-wide">نهاية</span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={word.endTime?.toFixed(2) || 0}
                                      onChange={(e) => handleWordTimeChange(ayah.id, word.id, 'endTime', parseFloat(e.target.value))}
                                      className="w-full text-center py-1 bg-natural-50 border border-natural-200 rounded text-xs outline-none focus:border-amber-400"
                                    />
                                    <button
                                      onClick={() => setWordTimeToCurrent(ayah.id, word.id, 'endTime')}
                                      className="w-full text-[9px] bg-natural-200 hover:bg-natural-300 rounded py-0.5 cursor-pointer"
                                    >الحالي</button>
                                  </div>
                               </div>
                             </div>
                           );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}