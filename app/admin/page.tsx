'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminStoreProvider } from '@/lib/adminStore';
import OverviewTab from '@/components/admin/OverviewTab';
import AudioTab from '@/components/admin/AudioTab';
import VideosTab from '@/components/admin/VideosTab';
import SyncTab from '@/components/admin/SyncTab';
import AITab from '@/components/admin/AITab';
import { LayoutDashboard, Music, Video as VideoIcon, Clock, Bot } from 'lucide-react';

type TabKey = 'overview' | 'audio' | 'videos' | 'sync' | 'ai';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'نظرة عامة', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'audio', label: 'روابط التلاوة', icon: <Music className="w-4 h-4" /> },
  { key: 'videos', label: 'فيديوهات التفسير', icon: <VideoIcon className="w-4 h-4" /> },
  { key: 'sync', label: 'المزامنة الدقيقة', icon: <Clock className="w-4 h-4" /> },
  { key: 'ai', label: 'أتمتة بالذكاء الاصطناعي', icon: <Bot className="w-4 h-4" /> },
];

const isValidTab = (value: string | null): value is TabKey =>
  value === 'overview' || value === 'audio' || value === 'videos' || value === 'sync' || value === 'ai';

// Read the URL query directly (browser-only) instead of useSearchParams so the
// whole dashboard renders in the server HTML with no client-only boundary.
function readUrlTab(): TabKey {
  if (typeof window === 'undefined') return 'overview';
  const tab = new URLSearchParams(window.location.search).get('tab');
  return isValidTab(tab) ? tab : 'overview';
}

function readUrlSurahId(): number {
  if (typeof window === 'undefined') return 21;
  const raw = new URLSearchParams(window.location.search).get('surahId');
  const parsed = parseInt(raw || '', 10);
  if (isNaN(parsed)) return 21;
  return Math.min(114, Math.max(1, parsed));
}

function AdminTabs() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(readUrlTab);
  const [surahIdForSync, setSurahIdForSync] = useState<number>(readUrlSurahId);

  const goTo = (key: TabKey) => {
    setTab(key);
    const params = new URLSearchParams();
    if (key !== 'overview') params.set('tab', key);
    router.replace(`/admin${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const openSyncFor = (surahId: number) => {
    setSurahIdForSync(surahId);
    setTab('sync');
    router.replace(`/admin?tab=sync&surahId=${surahId}`, { scroll: false });
  };

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

      {tab === 'overview' && <OverviewTab onOpenAI={() => goTo('ai')} onOpenSync={openSyncFor} />}
      {tab === 'audio' && <AudioTab />}
      {tab === 'videos' && <VideosTab />}
      {tab === 'sync' && <SyncTab key={surahIdForSync} initialSurahId={surahIdForSync} />}
      {tab === 'ai' && <AITab />}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminStoreProvider>
      <AdminTabs />
    </AdminStoreProvider>
  );
}