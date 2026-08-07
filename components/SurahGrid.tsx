'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, PlayCircle, Clock } from 'lucide-react';
import { SURAH_NAMES, orderSurahIds, SurahSort } from '@/lib/surahs';
import SurahSortSelect from '@/components/SurahSortSelect';

export default function SurahGrid({ preparedIds }: { preparedIds: number[] }) {
  const [sort, setSort] = useState<SurahSort>('mushafi');
  const prepared = useMemo(() => new Set(preparedIds), [preparedIds]);
  const ordered = useMemo(() => orderSurahIds(sort), [sort]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SurahSortSelect value={sort} onChange={setSort} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" dir="rtl">
        {ordered.map((id) => {
          const name = SURAH_NAMES[id - 1];
          const isPrepared = prepared.has(id);

          return (
            <Link
              key={id}
              href={`/surah/${id}`}
              className={`relative bg-white rounded-2xl p-5 border transition-all ${isPrepared ? 'border-natural-400 hover:border-natural-600 shadow-md hover:shadow-lg' : 'border-natural-200 hover:border-natural-300 shadow-sm'} flex gap-4 group overflow-hidden`}
            >
              <div className="w-10 h-10 shrink-0 bg-natural-50 border border-natural-200 rounded-xl flex items-center justify-center font-sans font-bold text-natural-500 text-sm group-hover:bg-natural-900 group-hover:text-white transition-colors">
                {id}
              </div>

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
          );
        })}
      </div>
    </>
  );
}
