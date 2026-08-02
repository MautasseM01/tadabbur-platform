import { Clock, Video, Users, Activity, CheckCircle2, Circle, Bot } from 'lucide-react';
import { MOCK_VIDEOS, AUDIO_YOUTUBE_IDS } from '@/lib/mock-data';
import { getDb } from '@/lib/db';
import { SURAH_NAMES } from '@/lib/surahs';
import Link from 'next/link';

export default function AdminDashboard() {
  const allSurahs = Array.from({ length: 114 }, (_, i) => i + 1);
  
  const db = getDb();
  
  const getProgressStatus = (surahId: number) => {
    const allVideos = [...MOCK_VIDEOS, ...db.videos];
    const videosForSurah = allVideos.filter(v => v.surahId === surahId);
    const hasShahrur = videosForSurah.some(v => v.scholar.includes('شحرور'));
    const hasSamarrai = videosForSurah.some(v => v.scholar.includes('السامرائي'));
    
    const hasAudioId = (db.surahAudioIds && db.surahAudioIds[surahId] !== undefined)
      ? db.surahAudioIds[surahId] !== ""
      : !!AUDIO_YOUTUBE_IDS[surahId];
      
    // It's done if it has a custom sync array AND an active audio ID
    const hasCustomSync = !!db.surahSyncs[surahId] && db.surahSyncs[surahId].length > 0;
    
    // We consider it generally done if it has an Audio ID (so user can see it in main page). The sync might be perfect or AI-generated.
    const isDone = hasAudioId;
    
    return { done: isDone, sh: hasShahrur, sa: hasSamarrai, videoCount: videosForSurah.length };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-sans text-natural-900">حالة تغطية سور القرآن</h1>
        <Link 
          href="/admin/ai-processing" 
          className="flex items-center gap-2 bg-natural-900 hover:bg-natural-800 text-white px-4 py-2 rounded-xl transition font-sans font-medium text-sm"
        >
          <Bot className="w-4 h-4" />
          <span>أتمتة جلب الفيديوهات بالذكاء الاصطناعي</span>
        </Link>
      </div>
      
      <div className="bg-natural-100 border border-natural-300 rounded-2xl p-8 max-w-3xl">
        <h3 className="text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600 mb-2 text-right">قائمة المهام</h3>
        <p className="text-natural-800 text-sm leading-relaxed mb-4 text-justify" dir="rtl">
          تابع تقدم المشروع في تغطية جميع سور القرآن الكريم بمقاطع التفسير المرئي لمحمد شحرور وفاضل السامرائي وتزامنها مع التلاوة.
        </p>
      </div>

      <div className="bg-white border border-natural-300 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-right h-full">
          <thead>
            <tr className="bg-natural-100 border-b border-natural-300">
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600">السورة</th>
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600">الحالة</th>
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600">فيديوهات محمد شحرور</th>
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600">فيديوهات فاضل السامرائي</th>
              <th className="p-4 text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-natural-200">
            {allSurahs.map(surahId => {
              const status = getProgressStatus(surahId);
              const surahName = SURAH_NAMES[surahId - 1];
              return (
                <tr key={surahId} className="hover:bg-natural-50 transition">
                  <td className="p-4 font-sans text-natural-800 font-bold">
                    {surahId}. سورة {surahName}
                  </td>
                  <td className="p-4">
                    {status.done ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle2 className="w-4 h-4" /> مكتمل جزئياً
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-natural-500 text-xs font-bold bg-natural-100 px-2 py-1 rounded">
                        <Circle className="w-4 h-4" /> قيد الانتظار
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {status.sh ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-natural-300" />}
                  </td>
                  <td className="p-4">
                    {status.sa ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-natural-300" />}
                  </td>
                  <td className="p-4">
                    <a href={`/admin/sync?surahId=${surahId}`} className="text-[11px] font-bold text-natural-600 hover:text-natural-900 underline">
                      إدارة
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
