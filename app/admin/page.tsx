'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminStoreProvider } from '@/lib/adminStore';
import OverviewTab from '@/components/admin/OverviewTab';
import AudioTab from '@/components/admin/AudioTab';
import VideosTab from '@/components/admin/VideosTab';
import SyncTab from '@/components/admin/SyncTab';
import AITab from '@/components/admin/AITab';

// Server-render per request so the tab bar and active tab (from ?tab=) render
// in the HTML instead of only after client hydration.
export const dynamic = 'force-dynamic';
import { LayoutDashboard, Music, Video as VideoIcon, Clock, Bot } from 'lucide-react';

type TabKey = 'overview' | 'audio' | 'videos' | 'sync' | 'ai';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'نظرة عامة', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'audio', label: 'روابط التلاوة', icon: <Music className="w-4 h-4" /> },
  { key: 'videos', label: 'فيديوهات التفسير', icon: <VideoIcon className="w-4 h-4" /> },
  { key: 'sync', label: 'المزامنة الدقيقة', icon: <Clock className="w-4 h-4" /> },
  { key: 'ai', label: 'أتمتة بالذكاء الاصطناعي', icon: <Bot className="w-4 h-4" /> },
];

function isTabKey(value: string | null): value is TabKey {
  return value === 'overview' || value === 'audio' || value === 'videos' || value === 'sync' || value === 'ai';
}

function AdminTabs() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlSurahId = searchParams.get('surahId');

  const [tab, setTab] = useState<TabKey>(() => (isTabKey(urlTab) ? urlTab : 'overview'));

  const goTo = (key: TabKey) => {
    setTab(key);
    const params = new URLSearchParams();
    if (key !== 'overview') params.set('tab', key);
    const { pathname, origin } = window.location;
    window.history.replaceState(null, '', `${origin}${pathname}${params.size ? `?${params.toString()}` : ''}`);
  };

  const surahIdForSync = urlSurahId && !isNaN(parseInt(urlSurahId, 10))
    ? Math.min(114, Math.max(1, parseInt(urlSurahId, 10)))
    : 21;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Tab Bar */}
      <div className="sticky top-0 z-30 bg-natural-50/95 backdrop-blur-xl border border-natural-300 rounded-2xl p-2 shadow-sm flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => goTo(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans font-semibold transition whitespace-nowrap cursor-pointer ${
              tab === t.key
                ? 'bg-natural-900 text-white shadow-md'
                : 'text-natural-600 hover:bg-natural-100 hover:text-natural-900'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <Suspense fallback={<div className="p-16 text-center font-sans text-natural-500">جاري التحميل...</div>}>
        {tab === 'overview' && <OverviewTab onOpenAI={() => goTo('ai')} />}
        {tab === 'audio' && <AudioTab />}
        {tab === 'videos' && <VideosTab />}
        {tab === 'sync' && <SyncTab key={surahIdForSync} initialSurahId={surahIdForSync} />}
        {tab === 'ai' && <AITab />}
      </Suspense>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminStoreProvider>
      <Suspense fallback={<div className="p-16 text-center font-sans text-natural-500">جاري التحميل...</div>}>
        <AdminTabs />
      </Suspense>
    </AdminStoreProvider>
  );
}