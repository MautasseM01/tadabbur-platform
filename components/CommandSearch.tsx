'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Sparkles, BookOpen, X, Video, Hash, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

export interface SearchResultData {
  query: string;
  surahMatches: Array<{
    id: number;
    name: string;
    url: string;
  }>;
  ayahMatches: Array<{
    id: string;
    surahId: number;
    surahName: string;
    ayahNumber: number;
    text: string;
    url: string;
  }>;
  videoMatches: Array<{
    id: string;
    title: string;
    scholar: string;
    surahId: number;
    surahName: string;
    ayahNumber: number;
    url: string;
  }>;
}

const SAMPLE_QUERIES = [
  'ذو النون',
  'الأنبياء',
  'أولم ير الذين كفروا',
  'أيوب',
  'الحمد لله',
  'الفاتحة',
  '21'
];

export default function CommandSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultData | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data: SearchResultData = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search fetch error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleResultClick = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  const hasResults = searchResults && (
    searchResults.surahMatches.length > 0 ||
    searchResults.ayahMatches.length > 0 ||
    searchResults.videoMatches.length > 0
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-white/95 backdrop-blur-md border border-natural-200 text-natural-700 hover:text-natural-950 px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-2 transition-all hover:shadow-sm hover:border-natural-300 font-sans cursor-pointer group shrink-0"
        title="فتح محرك البحث وتصفح الآيات (⌘K)"
      >
        <Search className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold">بحث عن آية أو سورة</span>
        <kbd className="bg-natural-100 text-natural-500 rounded px-1.5 py-0.5 text-[10px] font-mono border border-natural-200 hidden sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-natural-200 flex flex-col max-h-[80vh]"
            >
              {/* Header Input */}
              <form onSubmit={handleFormSubmit} className="flex items-center px-6 border-b border-natural-100 relative bg-natural-50/50">
                <Search className="w-5 h-5 text-amber-600 absolute right-6 shrink-0" />
                <input 
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث بكلمة من آية، اسم السورة، رقم الآية..."
                  className="w-full bg-transparent py-5 pr-12 pl-12 text-base md:text-lg font-sans text-natural-900 placeholder:text-natural-400 focus:outline-none"
                  dir="rtl"
                />
                {query && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setQuery('');
                      setSearchResults(null);
                    }} 
                    className="absolute left-14 text-natural-400 hover:text-natural-700 p-1 rounded-full hover:bg-natural-200/50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="absolute left-6 text-natural-400 hover:text-natural-700 p-1 rounded-full hover:bg-natural-200/50 transition"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>

              {/* Suggestions chips when search is empty */}
              {!query.trim() && (
                <div className="px-6 py-3 border-b border-natural-100 bg-white flex items-center gap-2 overflow-x-auto" dir="rtl">
                  <span className="text-[11px] font-sans font-bold text-natural-400 shrink-0">اقتراحات البحث:</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {SAMPLE_QUERIES.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setQuery(sample)}
                        className="text-xs font-sans px-2.5 py-1 rounded-xl bg-natural-100 hover:bg-amber-100 hover:text-amber-900 text-natural-700 transition cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto bg-natural-50/60 p-6 min-h-[320px]" dir="rtl">
                {isSearching ? (
                  <div className="h-full flex flex-col items-center justify-center text-natural-500 py-12 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                    <p className="text-sm font-sans font-medium animate-pulse">جاري البحث في الآيات والسور الكريمة...</p>
                  </div>
                ) : hasResults ? (
                  <div className="space-y-6">
                    {/* Surah Matches */}
                    {searchResults.surahMatches.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-natural-500 uppercase tracking-wider font-sans">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span>السور المطابقة ({searchResults.surahMatches.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {searchResults.surahMatches.map((surah) => (
                            <button
                              key={surah.id}
                              onClick={() => handleResultClick(surah.url)}
                              className="bg-white p-3.5 rounded-2xl border border-natural-200 shadow-sm flex items-center justify-between hover:border-amber-500 hover:bg-amber-50/30 transition text-right group cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center font-bold text-xs font-sans">
                                  {surah.id}
                                </div>
                                <span className="font-amiri font-bold text-xl text-natural-900 group-hover:text-amber-900">
                                  سورة {surah.name}
                                </span>
                              </div>
                              <ArrowLeft className="w-4 h-4 text-natural-300 group-hover:text-amber-600 group-hover:-translate-x-1 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ayah Matches */}
                    {searchResults.ayahMatches.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-natural-500 uppercase tracking-wider font-sans">
                          <Hash className="w-3.5 h-3.5 text-emerald-600" />
                          <span>الآيات القرانية المطابقة ({searchResults.ayahMatches.length})</span>
                        </div>
                        <div className="space-y-2.5">
                          {searchResults.ayahMatches.map((ayah) => (
                            <button
                              key={ayah.id}
                              onClick={() => handleResultClick(ayah.url)}
                              className="w-full bg-white p-4 rounded-2xl border border-natural-200 shadow-sm flex flex-col gap-2 hover:border-emerald-500 hover:shadow-md transition text-right cursor-pointer group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold font-sans text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  سورة {ayah.surahName} - آية {ayah.ayahNumber}
                                </span>
                                <span className="text-xs font-sans text-amber-700 font-semibold group-hover:underline flex items-center gap-1">
                                  انتقل للآية بالمصحف 📍
                                </span>
                              </div>
                              <p className="font-amiri text-2xl leading-relaxed text-natural-900 group-hover:text-emerald-950 pt-1">
                                {ayah.text}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Matches */}
                    {searchResults.videoMatches.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-natural-500 uppercase tracking-wider font-sans">
                          <Video className="w-3.5 h-3.5 text-purple-600" />
                          <span>التفاسير والشروحات المرئية ({searchResults.videoMatches.length})</span>
                        </div>
                        <div className="space-y-2">
                          {searchResults.videoMatches.map((video) => (
                            <button
                              key={video.id}
                              onClick={() => handleResultClick(video.url)}
                              className="w-full bg-white p-3.5 rounded-2xl border border-natural-200 shadow-sm flex items-center justify-between hover:border-purple-500 transition text-right cursor-pointer group"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold font-sans text-natural-900 group-hover:text-purple-900">
                                  {video.title}
                                </span>
                                <span className="text-xs font-sans text-natural-500">
                                  {video.scholar} | سورة {video.surahName} (الآية {video.ayahNumber})
                                </span>
                              </div>
                              <ArrowLeft className="w-4 h-4 text-natural-300 group-hover:text-purple-600 group-hover:-translate-x-1 transition-transform" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : query.trim() ? (
                  <div className="h-full flex flex-col items-center justify-center text-natural-400 py-12 space-y-3">
                    <Search className="w-10 h-10 opacity-40 text-natural-300" />
                    <p className="text-sm font-sans font-medium text-center">
                      لم نجد نتائج مطابقة لـ &quot;{query}&quot;.
                    </p>
                    <p className="text-xs font-sans text-natural-400 text-center">
                      جرب البحث بكلمة أعم أو اسم السورة أو الرقم.
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-natural-400 py-10 space-y-3 opacity-75">
                    <Sparkles className="w-10 h-10 text-amber-500/80 mb-1" />
                    <p className="text-sm font-sans font-semibold text-natural-700 text-center">
                      محرك البحث القرآني الشامل
                    </p>
                    <p className="text-xs font-sans text-center max-w-sm leading-relaxed text-natural-500">
                      ابحث في نصوص القرآن الكريم، أسماء السور، أو التفاسير المرئية، وانتقل فوراً للآية المحددة في المصحف التفاعلي.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="bg-white border-t border-natural-100 p-3.5 px-6 flex justify-between items-center text-xs font-sans text-natural-500" dir="rtl">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="bg-natural-100 border border-natural-200 rounded px-1.5 font-mono text-[10px]">↵</kbd> للبحث
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-natural-100 border border-natural-200 rounded px-1.5 font-mono text-[10px]">ESC</kbd> للإغلاق
                  </span>
                </div>
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  تصفح ذكي ومباشر للآيات 📖
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
