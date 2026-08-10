'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, HardDrive, ShieldCheck, User as UserIcon } from 'lucide-react';
import TadabburProgressWidget from '@/components/TadabburProgressWidget';
import DataBackup from '@/components/DataBackup';

export default function ProfileDashboardPage() {
  const [streakDays, setStreakDays] = useState<number>(0);

  useEffect(() => {
    try {
      const progressKey = 'tadabbur_progress_data_v1';
      const saved = JSON.parse(localStorage.getItem(progressKey) || '{}');
      const streak = typeof saved.studyStreakDays === 'number' ? saved.studyStreakDays : 0;
      setStreakDays(streak);
    } catch {
      // ignore
    }
  }, []);

  return (
    <main className="min-h-screen bg-natural-50 pb-24 font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white border-b border-natural-200 py-8 px-4 mb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-natural-900">تقدمي وملاحظاتي</h1>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>شعلة التدبر: {streakDays} يوم متتالية</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                <span>تخزين محلي ثابت</span>
              </span>
            </div>
          </div>

          {/* Local Profile Card */}
          <div className="bg-white border border-natural-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md text-2xl font-bold">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white" title="بيانات محلية">
                    <HardDrive className="w-3 h-3" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-natural-900">
                      متدبّر القرآن الكريم
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      بدون حساب — بدون تسجيل دخول
                    </span>
                  </div>
                  <p className="text-xs text-natural-500 mt-1">
                    بياناتك محفوظة محليًا: ملاحظات الآيات، ساعات التدبر، والإحصائيات في قاعدة بيانات مدمجة بالمشروع.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-natural-200 pt-4 md:pt-0">
                <div className="text-right ml-4 hidden sm:block">
                  <span className="text-xs font-bold text-natural-500 uppercase tracking-wider block">
                    النظام
                  </span>
                  <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>قاعدة بيانات ثابتة</span>
                  </span>
                </div>

                <Link
                  href="/"
                  className="flex items-center gap-2 bg-natural-100 hover:bg-natural-200 text-natural-700 border border-natural-200 px-4 py-2.5 rounded-xl font-medium text-xs transition"
                >
                  <span>العودة للفهرس</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tadabbur Progress Widget */}
      <div className="max-w-5xl mx-auto px-4">
        <TadabburProgressWidget />
        <div className="mt-4">
          <DataBackup />
        </div>
      </div>
    </main>
  );
}
