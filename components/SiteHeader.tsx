'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthHeader from '@/components/AuthHeader';
import { BookOpenText, LayoutDashboard, UserRound, ScrollText } from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'القرآن الكريم',
    icon: ScrollText,
    match: (path: string) => path === '/' || path.startsWith('/surah'),
  },
  {
    href: '/profile',
    label: 'تقدمي وملاحظاتي',
    icon: UserRound,
    match: (path: string) => path.startsWith('/profile'),
  },
  {
    href: '/admin',
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    match: (path: string) => path.startsWith('/admin'),
  },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-natural-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="w-10 h-10 rounded-xl bg-natural-900 text-amber-400 flex items-center justify-center shadow-sm group-hover:bg-natural-800 transition-colors">
              <BookOpenText className="w-5 h-5" />
            </span>
            <span className="flex flex-col">
              <span className="font-amiri font-bold text-lg text-natural-900 leading-tight">تبيان واستبصار</span>
              <span className="text-[10px] text-natural-500 font-sans font-semibold uppercase tracking-widest leading-tight">
                منصة التدبر التفاعلية
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 font-sans text-sm" dir="rtl">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium transition-colors ${
                    active
                      ? 'bg-natural-900 text-white shadow-sm'
                      : 'text-natural-600 hover:bg-natural-100 hover:text-natural-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-natural-400'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0">
            <AuthHeader />
          </div>
        </div>
      </div>
    </header>
  );
}
