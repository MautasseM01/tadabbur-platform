'use client';

import { HardDrive } from 'lucide-react';
import CommandSearch from '@/components/CommandSearch';

export default function AuthHeader() {
  return (
    <div className="flex items-center gap-2.5 font-sans text-xs flex-wrap justify-end">
      <CommandSearch />
      <span
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-natural-100/60 text-natural-600 border border-natural-200"
        title="كل البيانات تُحفظ محليًا في قاعدة البيانات المدمجة بالمشروع"
      >
        <HardDrive className="w-3.5 h-3.5 text-amber-600" />
        <span>قاعدة بيانات محلية</span>
      </span>
    </div>
  );
}
