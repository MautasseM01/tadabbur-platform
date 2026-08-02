'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutFirebase, onAuthChange } from '@/lib/firebaseSync';
import { 
  ArrowRight, 
  Award, 
  User as UserIcon, 
  Flame, 
  Cloud, 
  CloudCheck, 
  LogIn, 
  LogOut, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import TadabburProgressWidget from '@/components/TadabburProgressWidget';
import DataBackup from '@/components/DataBackup';

export default function ProfileDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await loginWithGoogle();
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutFirebase();
  };

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
                <span>شعلة التدبر: 7 أيام متتالية</span>
              </span>

              {user ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>المزامنة السحابية نشطة</span>
                </span>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-natural-100 text-natural-700 hover:bg-natural-200 transition"
                >
                  <Cloud className="w-3.5 h-3.5 text-amber-600" />
                  <span>مزامنة سحابية</span>
                </Link>
              )}
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white border border-natural-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            {authLoading ? (
              <div className="py-6 flex justify-center items-center gap-2 text-natural-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span>جاري تحميل بيانات حساب Firebase...</span>
              </div>
            ) : user ? (
              /* Signed In Profile View */
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'صورة المستخدم'}
                        className="w-16 h-16 rounded-2xl border-2 border-emerald-400 shadow-sm object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md text-2xl font-bold">
                        {user.displayName?.charAt(0) || <UserIcon className="w-8 h-8" />}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white" title="حساب متصل">
                      <CloudCheck className="w-3 h-3" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-natural-900">
                        {user.displayName || 'متدبّر القرآن الكريم'}
                      </h1>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        حساب مزامَن مع Firebase
                      </span>
                    </div>
                    <p className="text-xs text-natural-500 mt-1">
                      {user.email} &bull; جميع ملاحظات وتأملات السور محفوظة بالسحاب تلقائياً
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-natural-200 pt-4 md:pt-0">
                  <div className="text-right ml-4 hidden sm:block">
                    <span className="text-xs font-bold text-natural-500 uppercase tracking-wider block">
                      الحساب الموثق
                    </span>
                    <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Google Auth</span>
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-natural-100 hover:bg-red-50 text-natural-700 hover:text-red-700 border border-natural-200 hover:border-red-200 px-4 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Signed Out Profile Callout */
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-amber-50/70 to-emerald-50/70 border border-amber-200/60 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <Cloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-natural-900">
                      قم بتسجيل الدخول لمزامنة تقدمك وملاحظاتك
                    </h2>
                    <p className="text-xs text-natural-600 mt-0.5">
                      احفظ سجل القراءة والتدبر، والملاحظات المدونة على الآيات تلقائياً في Firebase Cloud.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={handleLogin}
                    disabled={signingIn}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition text-xs cursor-pointer disabled:opacity-70"
                  >
                    {signingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>تسجيل الدخول بـ Google</span>
                  </button>

                  <Link
                    href="/login"
                    className="flex items-center justify-center bg-white hover:bg-natural-100 text-natural-700 border border-natural-300 font-medium px-4 py-2.5 rounded-xl text-xs transition"
                  >
                    تفاصيل الحساب
                  </Link>
                </div>
              </div>
            )}
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

