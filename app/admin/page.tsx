import { Suspense } from 'react';
import { AdminStoreProvider } from '@/lib/adminStore';
import AdminDashboard, { AdminTabKey } from '@/components/admin/AdminDashboard';

function parseTab(value: string | null): AdminTabKey {
  return value === 'overview' || value === 'audio' || value === 'videos' || value === 'sync' || value === 'ai'
    ? value
    : 'overview';
}

function parseSurahId(value: string | null): number {
  const n = parseInt(value || '', 10);
  if (isNaN(n)) return 21;
  return Math.min(114, Math.max(1, n));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; surahId?: string }>;
}) {
  const sp = await searchParams;

  return (
    <AdminStoreProvider>
      <Suspense fallback={<div className="p-16 text-center font-sans text-natural-500">جاري التحميل...</div>}>
        <AdminDashboard initialTab={parseTab(sp.tab ?? null)} initialSurahId={parseSurahId(sp.surahId ?? null)} />
      </Suspense>
    </AdminStoreProvider>
  );
}