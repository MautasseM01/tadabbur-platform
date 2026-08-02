import Link from 'next/link';
import { LayoutDashboard, Clock, Video as VideoIcon, Globe, Bot } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-natural-50 font-sans text-natural-800" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-natural-100 border-l border-natural-300 hidden md:flex flex-col p-6 space-y-8">
        <div className="flex items-center space-x-3 space-x-reverse mb-4 text-natural-700">
          <div className="w-10 h-10 bg-natural-700 rounded-xl flex items-center justify-center text-white">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">Tadabbur</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Interactive Platform</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-natural-600 font-sans font-semibold mb-3">Admin Dashboard</p>
          <Link href="/admin" className="flex items-center px-3 py-2 text-sm text-natural-700 hover:bg-natural-200 transition-colors rounded-lg font-medium opacity-70">
            <LayoutDashboard className="w-4 h-4 ml-3" />
            <span>نظرة عامة</span>
          </Link>
          <Link href="/admin/sync" className="flex items-center px-3 py-2 text-sm text-natural-700 hover:bg-natural-200 transition-colors rounded-lg font-medium opacity-70">
            <Clock className="w-4 h-4 ml-3" />
            <span>إدارة المزامنة (Surah Sync)</span>
          </Link>
          <Link href="/admin/videos" className="flex items-center px-3 py-2 text-sm text-natural-700 hover:bg-natural-200 transition-colors rounded-lg font-medium opacity-70">
            <VideoIcon className="w-4 h-4 ml-3" />
            <span>التفسير المرئي</span>
          </Link>
          <Link href="/admin/ai-processing" className="flex items-center px-3 py-2 text-sm text-center text-natural-700 hover:bg-natural-200 transition-colors rounded-lg font-medium opacity-70">
            <Bot className="w-4 h-4 ml-3 shrink-0" />
            <span>أتمتة الفيديوهات بالذكاء الاصطناعي</span>
          </Link>
        </div>
        <div className="space-y-2 pt-4 border-t border-natural-300">
          <p className="text-[11px] uppercase tracking-widest text-natural-600 font-sans font-semibold mb-3">Navigation</p>
          <Link href="/" className="flex items-center px-3 py-2 text-sm text-natural-700 hover:bg-natural-200 transition-colors rounded-lg font-medium opacity-70">
            <Globe className="w-4 h-4 ml-3" />
            <span>العودة إلى منصة التدبر</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-natural-50 border-r border-natural-300 p-8">
        {children}
      </main>
    </div>
  );
}
