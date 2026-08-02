'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutFirebase, onAuthChange } from '@/lib/firebaseSync';
import { 
  Cloud, 
  CloudCheck, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  LogOut, 
  Loader2,
  Bookmark,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        router.push('/profile');
      } else {
        setErrorMsg('لم يتم إكمال تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('حدث خطأ أثناء تسجيل الدخول عبر Google. يرجى التأكد من الاتصال بالإنترنت.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutFirebase();
  };

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
          <span>Firebase Authentication متصل</span>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white border border-natural-200 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-600" />
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Cloud className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-natural-900 mb-2">
              تسجيل الدخول والمزامنة السحابية
            </h1>
            <p className="text-sm text-natural-600 max-w-md mx-auto leading-relaxed">
              قم بربط حسابك في Google لمزامنة ملاحظاتك القرأنية وساعات التدبر وإحصائيات السور عبر جميع أجهزتك بأمان.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-natural-500 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-sm font-medium">جاري التحقق من حالة الحساب...</span>
            </div>
          ) : user ? (
            /* Signed In View */
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-12 h-12 rounded-full border-2 border-emerald-400 shadow-sm" />
                ) : (
                  <div className="w-12 h-12 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center text-lg">
                    {user.displayName?.charAt(0) || 'م'}
                  </div>
                )}
                <div className="text-right">
                  <h3 className="font-bold text-natural-900 text-base">{user.displayName || 'مستخدم تدبر'}</h3>
                  <p className="text-xs text-natural-600">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl w-fit mx-auto">
                <CloudCheck className="w-4 h-4 text-emerald-600" />
                <span>الحساب متصل ومزامَن مع Firebase Cloud</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/profile"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition text-center shadow-sm cursor-pointer"
                >
                  الانتقال للوحة التحكم الشخصية
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-3 px-4 rounded-xl text-sm transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          ) : (
            /* Google Sign In Button & Features */
            <div className="space-y-6">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 text-center">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={signingIn}
                className="w-full flex items-center justify-center gap-3 bg-natural-900 hover:bg-natural-800 text-white font-semibold py-4 px-6 rounded-2xl shadow-md transition transform active:scale-[0.99] disabled:opacity-70 cursor-pointer text-base"
              >
                {signingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    <span>جاري الاتصال بـ Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>الدخول باستخدام Google</span>
                  </>
                )}
              </button>

              <div className="border-t border-natural-200 pt-6">
                <h4 className="text-xs font-bold text-natural-500 uppercase tracking-wider mb-4">
                  مزايا الحساب والمزامنة السحابية:
                </h4>
                <ul className="space-y-3 text-xs text-natural-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>مزامنة فورية ودائمة لملاحظاتك وتأملاتك لكل آية مع Firestore.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>حفظ سجل السور المدروسة والكلمات المحللة دلالياً.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>متابعة شعلة التدبر السنوية وساعات الاستماع والتحليل.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-natural-500 mt-8">
        منصة تدبر القرآن الكريم &bull; جميع البيانات مشفرة ومحفوظة بأمان عبر Firebase Cloud
      </div>
    </main>
  );
}
