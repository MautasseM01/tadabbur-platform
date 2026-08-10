import type { Metadata } from 'next';
import QuranSearch from '@/components/quran/QuranSearch';

export const metadata: Metadata = {
  title: 'المعجم الموسوعي — تكرار الكلمات والمصطلحات في القرآن الكريم',
  description:
    'ابحث عن أي كلمة أو عبارة لتعرف كم مرة وردت في القرآن الكريم، توزيعها على السور، والانتقال المباشر إلى مواضعها آيةً آية.',
};

export default function QuranSearchPage() {
  return (
    <main className="min-h-screen bg-natural-50 py-10 px-4 pb-24 font-sans">
      <QuranSearch />
    </main>
  );
}