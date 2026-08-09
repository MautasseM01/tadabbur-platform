'use client';

import { Bot } from 'lucide-react';
import SurahCoverageTable from '@/components/admin/SurahCoverageTable';
import { useAdminStore } from '@/lib/adminStore';

export default function OverviewTab({ onOpenAI, onOpenSync }: { onOpenAI: () => void; onOpenSync: (surahId: number) => void }) {
  const { coverage } = useAdminStore();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold font-sans text-natural-900">حالة تغطية سور القرآن</h1>
        <button
          onClick={onOpenAI}
          className="flex items-center gap-2 bg-natural-900 hover:bg-natural-800 text-white px-4 py-2 rounded-xl transition font-sans font-medium text-sm cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>أتمتة جلب الفيديوهات بالذكاء الاصطناعي</span>
        </button>
      </div>

      <div className="bg-natural-100 border border-natural-300 rounded-2xl p-8 max-w-3xl">
        <h3 className="text-[11px] uppercase tracking-widest font-sans font-bold text-natural-600 mb-2 text-right">قائمة المهام</h3>
        <p className="text-natural-800 text-sm leading-relaxed mb-4 text-justify" dir="rtl">
          تابع تقدم المشروع في تغطية جميع سور القرآن الكريم بمقاطع التفسير المرئي لمحمد شحرور وفاضل السامرائي وتزامنها مع التلاوة.
          كل تعديل في التبويبات الأخرى ينعكس هنا فوراً.
        </p>
      </div>

      <div className="bg-white border border-natural-300 rounded-2xl shadow-sm overflow-hidden">
        <SurahCoverageTable rows={coverage} onOpenSync={onOpenSync} />
      </div>
    </div>
  );
}