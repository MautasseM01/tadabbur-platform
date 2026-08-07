'use client';

import { ArrowDownWideNarrow } from 'lucide-react';
import { SURAH_SORT_OPTIONS, SurahSort } from '@/lib/surahs';

interface Props {
  value: SurahSort;
  onChange: (value: SurahSort) => void;
  className?: string;
}

export default function SurahSortSelect({ value, onChange, className = '' }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2 bg-white border border-natural-200 rounded-xl px-3 py-2 shadow-sm ${className}`}
    >
      <ArrowDownWideNarrow className="w-4 h-4 text-natural-500 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SurahSort)}
        className="bg-transparent text-sm font-sans font-semibold text-natural-700 focus:outline-none cursor-pointer"
        aria-label="ترتيب السور"
      >
        {SURAH_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
