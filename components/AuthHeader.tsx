'use client';

import { useEffect, useState } from 'react';
import { loginWithGoogle, logoutFirebase, onAuthChange } from '@/lib/firebaseSync';
import { User } from 'firebase/auth';
import { LogIn, LogOut, Cloud, CloudCheck, User as UserIcon, Loader2 } from 'lucide-react';
import CommandSearch from '@/components/CommandSearch';

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 font-sans text-xs flex-wrap justify-end">
        <CommandSearch />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-natural-100/60 text-natural-500 text-xs font-sans">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>جاري التحقق من Firebase...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 font-sans text-xs flex-wrap justify-end">
      <CommandSearch />
      {user ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-950 px-3 py-1.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt={user.displayName || 'صورة الحساب'} className="w-5 h-5 rounded-full border border-emerald-300" />
            ) : (
              <UserIcon className="w-4 h-4 text-emerald-700" />
            )}
            <span className="font-semibold max-w-[120px] truncate">{user.displayName || 'مستخدم'}</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded-md font-medium" title="متصل بالسحاب Firestore">
            <CloudCheck className="w-3 h-3 text-emerald-700" />
            <span>مزامَن</span>
          </span>
          <button
            onClick={handleLogout}
            className="p-1 rounded-lg hover:bg-emerald-200/50 text-emerald-800 transition cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={signingIn}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs transition cursor-pointer disabled:opacity-70"
          title="ربط وتزامن الملاحظات والإحصائيات بالسحاب"
        >
          {signingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
          <Cloud className="w-3.5 h-3.5" />
          <span>تسجيل الدخول (Firebase)</span>
        </button>
      )}
    </div>
  );
}
