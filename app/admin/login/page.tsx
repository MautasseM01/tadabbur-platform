'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace('/admin');
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'فشل تسجيل الدخول.');
      }
    } catch {
      setError('تعذر الاتصال بالخادم.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-natural-50 flex items-center justify-center p-4" dir="rtl">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white border border-natural-300 rounded-3xl shadow-sm p-8 space-y-5"
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-natural-900 text-white flex items-center justify-center mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-sans text-natural-900">لوحة التحكم الإدارية</h1>
          <p className="text-sm text-natural-500 font-sans mt-1">هذه المنطقة محمية — أدخل كلمة المرور</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="كلمة المرور"
          className="w-full border border-natural-300 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500"
          autoFocus
        />

        {error && (
          <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-sans">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className="w-full flex items-center justify-center gap-2 bg-natural-900 hover:bg-natural-800 disabled:opacity-50 text-white rounded-xl px-4 py-3 text-sm font-bold font-sans transition cursor-pointer"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          <span>دخول</span>
        </button>
      </form>
    </div>
  );
}