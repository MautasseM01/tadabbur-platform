import { Clock, Video, Users, Activity, Bot } from 'lucide-react';
import { MOCK_VIDEOS, AUDIO_YOUTUBE_IDS } from '@/lib/mock-data';
import { getDb } from '@/lib/db';
import Link from 'next/link';
import SurahCoverageTable from '@/components/admin/SurahCoverageTable';

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
        <SurahCoverageTable rows={allSurahs.map((id) => ({ id, ...getProgressStatus(id) }))} />
      </div>
    </div>
  );
}
