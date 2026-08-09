'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { SURAH_NAMES, orderSurahIds, SurahSort } from '@/lib/surahs';
import SurahSortSelect from '@/components/SurahSortSelect';

export interface SurahCoverage {
  id: number;
  done: boolean;
  sh: boolean;
  sa: boolean;
  videoCount: number;
}

export default function SurahCoverageTable({ rows }: { rows: SurahCoverage[] }) {
  const [sort, setSort] = useState<SurahSort>('mushafi');
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const ordered = useMemo(() => orderSurahIds(sort), [sort]);

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <SurahSortSelect value={sort} onChange={setSort} />
      </div>

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
          {ordered.map((surahId) => {
            const status = byId.get(surahId) || { id: surahId, done: false, sh: false, sa: false, videoCount: 0 };
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
                  <Link href={`/admin?tab=sync&surahId=${surahId}`} className="text-[11px] font-bold text-natural-600 hover:text-natural-900 underline">
                    إدارة
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
