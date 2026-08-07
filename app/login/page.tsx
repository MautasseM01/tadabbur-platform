'use client';

import Link from 'next/link';
import {
  HardDrive,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Bookmark,
} from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-natural-50 font-sans flex flex-col justify-between py-12 px-4" dir="rtl">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-natural-600 hover:text-natural-900 bg-white border border-natural-200 hover:bg-natural-100 px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للمنصة</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-natural-500 bg-white border border-natural-200 px-3 py-1.5 rounded-xl shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>تخزين محلي — لا حاجة لحساب</span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white border border-natural-200 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-600" />

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <HardDrive className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-natural-900 mb-2">
              المنصة تعمل بقاعدة بيانات محلية
            </h1>
            <p className="text-sm text-natural-600 max-w-md mx-auto leading-relaxed">
              أُزيلت مزامنة Firebase. كل بياناتك — الملاحظات، التقدم، روابط التلاوة وفيديوهات
              التفسير — محفوظة في قاعدة بيانات ثابتة مدمجة بالمشروع، وتُحفظ إضافاتك محليًا على جهازك.
            </p>
          </div>

          <div className="border-t border-natural-200 pt-6">
            <h4 className="text-xs font-bold text-natural-500 uppercase tracking-wider mb-4">
              ما الذي يعمل الآن:
            </h4>
            <ul className="space-y-3 text-xs text-natural-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>روابط تلاوة وفيديوهات تفسير لكل سورة — مباشرة بدون تسجيل دخول.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>حفظ ملاحظاتك على كل آية محليًا في متصفحك.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>تتبع سجل السور المدروسة والكلمات المحللة دلالياً.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>شعلة التدبر السنوية وساعات الاستماع والتحليل.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              href="/profile"
              className="w-full flex items-center justify-center gap-2 bg-natural-900 hover:bg-natural-800 text-white font-semibold py-4 px-6 rounded-2xl shadow-md transition text-sm cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>الانتقال للوحة التحكم الشخصية</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-natural-500 mt-8">
        منصة تدبر القرآن الكريم &bull; قاعدة البيانات ثابتة ومدمجة مع المشروع — بدون خدمات سحابية خارجية
      </div>
    </main>
  );
}
