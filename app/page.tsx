import Link from 'next/link';
import { BookOpen, Sparkles, Clock, PlayCircle, BarChart2 } from 'lucide-react';
import { SURAH_NAMES } from '@/lib/surahs';
import { AUDIO_YOUTUBE_IDS } from '@/lib/mock-data';
import TadabburProgressWidget from '@/components/TadabburProgressWidget';

import { getDb } from '@/lib/db';

export default function Home() {
  const db = getDb();
  
  const PREPARED_SURAHS: number[] = [];
  
  // A Surah is prepared if it has an Audio ID
  Array.from({ length: 114 }, (_, i) => i + 1).forEach(id => {
    const hasAudioId = (db.surahAudioIds && db.surahAudioIds[id] !== undefined)
      ? db.surahAudioIds[id] !== ""
      : !!AUDIO_YOUTUBE_IDS[id];
      
    if (hasAudioId) {
      PREPARED_SURAHS.push(id);
    }
  });

  return (
    <main className="min-h-screen bg-natural-50 pb-24">
      {/* Hero Section */}
      <div className="bg-white border-b border-natural-200 py-12 px-4 mb-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-sans font-bold text-natural-500 bg-natural-100 px-3 py-1 rounded-full">
              تبيان واستبصار • الإصدار التفاعلي 2026
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6 text-right w-full">
              <h1 className="text-4xl md:text-5xl font-amiri font-bold text-natural-900 leading-tight">
                منصة التدبر التفاعلية
              </h1>
            <p className="text-lg text-natural-600 font-sans leading-relaxed max-w-xl ml-auto">
              تصفح سور القرآن الكريم بتقنية المزامنة الذكية التي تربط المقروء بالمسموع، مع عرض التفاسير المرئية السياقية والتحليل الدلالي للكلمات.
            </p>
            <div className="pt-4 flex flex-wrap gap-4 justify-end">
              <Link href="/profile" className="px-6 py-3 bg-natural-900 hover:bg-natural-800 text-white rounded-xl font-sans font-semibold transition text-sm flex items-center gap-2 shadow-sm">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>تقدم التدبر والإحصائيات</span>
              </Link>
              <Link href="/admin" className="px-6 py-3 bg-natural-100 hover:bg-natural-200 text-natural-800 rounded-xl font-sans font-semibold transition text-sm flex items-center gap-2">
                لوحة التحكم الإدارية
              </Link>
            </div>
          </div>
          <div className="hidden md:flex flex-1 justify-center">
             <div className="w-64 h-64 bg-natural-100 rounded-full flex items-center justify-center relative shadow-inner">
               <BookOpen className="w-24 h-24 text-natural-300 absolute" />
               <Sparkles className="w-8 h-8 text-natural-400 absolute top-10 right-10 animate-pulse" />
             </div>
          </div>
        </div>
      </div>
    </div>

      {/* Tadabbur Progress Visual Widget Section */}
      <div className="max-w-5xl mx-auto px-4 mb-14">
        <TadabburProgressWidget />
      </div>

      {/* Surahs Grid */}
      <div id="fihris" className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-end mb-6 font-sans">
          <h2 className="text-xl font-bold text-natural-900">فهرس السور</h2>
          <span className="text-xs text-natural-500">{SURAH_NAMES.length} سورة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" dir="rtl">
          {SURAH_NAMES.map((name, index) => {
            const id = index + 1;
            const isPrepared = PREPARED_SURAHS.includes(id);

            return (
              <Link 
                key={id} 
                href={`/surah/${id}`}
                className={`relative bg-white rounded-2xl p-5 border transition-all ${isPrepared ? 'border-natural-400 hover:border-natural-600 shadow-md hover:shadow-lg' : 'border-natural-200 hover:border-natural-300 shadow-sm'} flex gap-4 group overflow-hidden`}
              >
                {/* Number Badge */}
                <div className="w-10 h-10 shrink-0 bg-natural-50 border border-natural-200 rounded-xl flex items-center justify-center font-sans font-bold text-natural-500 text-sm group-hover:bg-natural-900 group-hover:text-white transition-colors">
                  {id}
                </div>
                
                {/* Surah Details */}
                <div className="flex flex-col flex-1 justify-center">
                  <h3 className="font-amiri font-bold text-xl text-natural-900 flex items-center gap-2">
                    سورة {name}
                    {isPrepared && <Sparkles className="w-3 h-3 text-amber-500" />}
                  </h3>
                  
                  {isPrepared ? (
                    <span className="font-sans text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <PlayCircle className="w-3 h-3" /> مجهزة للتدبر التفاعلي
                    </span>
                  ) : (
                    <span className="font-sans text-[10px] text-natural-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> قيد التحضير والتزامُن
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  );
}
