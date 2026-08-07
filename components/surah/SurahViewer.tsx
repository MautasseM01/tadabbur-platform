'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Ayah, Word, VideoExplanation } from '@/lib/mock-data';
import { SURAH_NAMES } from '@/lib/surahs';
import WordRootModal from './WordRootModal';
import WordComparisonModal from './WordComparisonModal';
import PinnedPlayer from './PinnedPlayer';
import ModelSelector from '@/components/ai/ModelSelector';
import { saveAyahNoteToFirestore, syncSurahProgressToFirestore, fetchUserNotesFromFirestore, syncDashboardProgressToFirestore, getSurahSyncsFirestore, getVideosFirestore, getSurahAudioIdFirestore } from '@/lib/firebaseSync';
import { Play, Video, ArrowRight, ArrowLeft, Sun, Moon, BookOpen, FileText, StickyNote, X, Save, Trash2, CheckCircle2, SkipForward, Eye, EyeOff, Sparkles, ArrowLeftRight, Clock, Pause, RotateCcw, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useRouter } from 'next/navigation';

export type ReadingTheme = 'light' | 'sepia' | 'dark';

const getSurahThemeClasses = (theme: ReadingTheme) => {
  switch (theme) {
    case 'sepia':
      return {
        pageBg: 'bg-[#f5efe4] text-[#3e2e1e]',
        backBtn: 'bg-[#ebdcc4] hover:bg-[#dfcea8] text-[#3e2e1e]',
        headerTitle: 'text-[#2a1b0a]',
        headerSub: 'text-[#7a6042]',
        mainCard: 'bg-[#faf4e8] border-[#dfd0b5] text-[#3e2e1e] shadow-sm',
        ayahActive: 'text-[#231709] bg-[#ebd8b8] rounded-2xl px-2 py-4 shadow-sm',
        ayahInactive: 'opacity-70 text-[#594632]',
        bismillahBorder: 'border-[#dfd0b5]',
        wordSelected: 'bg-[#d8b888] text-[#2a1a08] border-b-2 border-[#8a5a20] font-bold shadow-sm',
        wordActive: 'text-[#4a2e05] bg-[#e6c99c] rounded-md font-bold',
        wordHover: 'hover:bg-[#f0e3cc] hover:text-[#2d2013]',
        ayahNumDefault: 'border-[#cbb898] text-[#785e40]',
        ayahNumActive: 'border-[#8a5a20] text-[#2d2013] bg-[#e8d5b7]',
        suggestedBg: 'bg-[#faf4e8]/95 backdrop-blur-xl border-[#dfd0b5] shadow-xl',
        videoCard: 'bg-[#f4ebd9] border-[#dccbb0] text-[#3e2e1e]',
        themeToggleBg: 'bg-[#ebdcc4] border-[#d8c5a8]',
        themeToggleBtnActive: 'bg-[#faf5eb] text-[#2d2013] shadow-sm font-bold',
        themeToggleBtnInactive: 'text-[#7a6042] hover:text-[#2d2013]',
        noteIconHasNote: 'text-amber-900 bg-[#ebd8b8] border-[#cbb898] shadow-sm',
        noteIconDefault: 'text-[#8a7050] hover:text-[#3e2e1e] hover:bg-[#ebdcc4]',
        modalCard: 'bg-[#faf4e8] border-[#dfd0b5] text-[#3e2e1e]',
        textareaBg: 'bg-[#f4ebd9] border-[#dccbb0] text-[#3e2e1e] placeholder-[#8a7050]',
        primaryBtn: 'bg-[#5c4428] hover:bg-[#46331d] text-[#faf5eb]',
      };
    case 'dark':
      return {
        pageBg: 'bg-[#121214] text-[#e4e4e7]',
        backBtn: 'bg-[#22222b] hover:bg-[#2c2c38] text-[#e4e4e7]',
        headerTitle: 'text-[#f4f4f5]',
        headerSub: 'text-[#a1a1aa]',
        mainCard: 'bg-[#1a1a20] border-[#2e2e38] text-[#e4e4e7] shadow-2xl shadow-black/50',
        ayahActive: 'text-[#ffffff] bg-[#2a2a36] rounded-2xl px-2 py-4 shadow-md',
        ayahInactive: 'opacity-55 text-[#a1a1aa]',
        bismillahBorder: 'border-[#2e2e38]',
        wordSelected: 'bg-[#854d0e] text-[#fef08a] border-b-2 border-[#eab308] font-bold shadow-sm',
        wordActive: 'text-[#fde047] bg-[#423108] rounded-md font-bold',
        wordHover: 'hover:bg-[#282834] hover:text-white',
        ayahNumDefault: 'border-[#3f3f46] text-[#a1a1aa]',
        ayahNumActive: 'border-[#eab308] text-[#fef08a] bg-[#2e2b1c]',
        suggestedBg: 'bg-[#18181f]/95 backdrop-blur-xl border-[#2e2e38] shadow-2xl',
        videoCard: 'bg-[#22222b] border-[#323240] text-[#f4f4f5]',
        themeToggleBg: 'bg-[#1e1e26] border-[#323240]',
        themeToggleBtnActive: 'bg-[#2e2e3a] text-amber-400 shadow-sm font-bold',
        themeToggleBtnInactive: 'text-[#a1a1aa] hover:text-white',
        noteIconHasNote: 'text-amber-300 bg-[#3a2e18] border-[#854d0e] shadow-sm',
        noteIconDefault: 'text-[#71717a] hover:text-white hover:bg-[#282834]',
        modalCard: 'bg-[#1a1a20] border-[#2e2e38] text-[#e4e4e7]',
        textareaBg: 'bg-[#22222b] border-[#323240] text-[#f4f4f5] placeholder-[#71717a]',
        primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      };
    case 'light':
    default:
      return {
        pageBg: 'bg-natural-50 text-natural-900',
        backBtn: 'bg-natural-100 hover:bg-natural-200 text-natural-700',
        headerTitle: 'text-natural-900',
        headerSub: 'text-natural-600',
        mainCard: 'bg-white border-natural-300 text-natural-800 shadow-sm',
        ayahActive: 'text-natural-900 bg-amber-50/90 rounded-2xl px-2 py-4 shadow-sm',
        ayahInactive: 'opacity-50 text-natural-700',
        bismillahBorder: 'border-natural-100',
        wordSelected: 'bg-amber-200 text-amber-950 border-b-2 border-amber-700 font-bold shadow-sm',
        wordActive: 'text-amber-800 bg-amber-100 rounded-md font-bold',
        wordHover: 'hover:bg-natural-100 hover:text-natural-900',
        ayahNumDefault: 'border-natural-300 text-natural-600',
        ayahNumActive: 'border-amber-600 text-amber-900 bg-amber-50',
        suggestedBg: 'bg-white/90 backdrop-blur-xl border-natural-300 shadow-xl',
        videoCard: 'bg-white border-natural-200 text-natural-900',
        themeToggleBg: 'bg-natural-100 border-natural-200',
        themeToggleBtnActive: 'bg-white text-natural-900 shadow-sm font-bold',
        themeToggleBtnInactive: 'text-natural-600 hover:text-natural-900',
        noteIconHasNote: 'text-amber-800 bg-amber-100 border-amber-300 shadow-sm',
        noteIconDefault: 'text-natural-400 hover:text-natural-800 hover:bg-natural-100',
        modalCard: 'bg-white border-natural-300 text-natural-900',
        textareaBg: 'bg-natural-50 border-natural-300 text-natural-900 placeholder-natural-400',
        primaryBtn: 'bg-natural-900 hover:bg-natural-800 text-white',
      };
  }
};

interface SurahViewerProps {
  ayahs: Ayah[];
  videos: VideoExplanation[];
  youtubeAudioId: string;
  surahName: string;
  highlightAyah?: number;
}

export default function SurahViewer({ ayahs, videos, youtubeAudioId, surahName, highlightAyah }: SurahViewerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const surahId = ayahs[0]?.surahId ?? 1;
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWord, setSelectedWord] = useState<{word: Word, ayahText: string} | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoExplanation | null>(null);
  
  const [theme, setTheme] = useState<ReadingTheme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('surah_reading_theme');
        if (saved === 'sepia' || saved === 'dark' || saved === 'light') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'light';
  });

  const [notes, setNotes] = useState<Record<number, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`surah_notes_${surahName}`);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {};
  });

  const [editingNoteAyah, setEditingNoteAyah] = useState<Ayah | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showAllNotesModal, setShowAllNotesModal] = useState(false);

  // Cloud data merged asynchronously (never blocks first paint)
  const [cloudSyncs, setCloudSyncs] = useState<Ayah[] | null>(null);
  const [cloudVideos, setCloudVideos] = useState<VideoExplanation[] | null>(null);
  const [cloudAudioId, setCloudAudioId] = useState<string | null>(null);

  const effectiveAyahs = useMemo(() => {
    if (!cloudSyncs || cloudSyncs.length === 0) return ayahs;
    return ayahs.map((ayah) => {
      if (ayah.isBismillah) return ayah;
      const sync = cloudSyncs.find((s) => s.ayahNumber === ayah.ayahNumber && !s.isBismillah);
      if (!sync) return ayah;
      const words =
        sync.words && sync.words.length === ayah.words.length
          ? sync.words.map((w) => ({ ...w, occurrences: w.occurrences || 0 }))
          : ayah.words;
      return { ...ayah, startTime: sync.startTime, endTime: sync.endTime, words };
    });
  }, [ayahs, cloudSyncs]);

  const allVideos = useMemo(() => {
    if (!cloudVideos || cloudVideos.length === 0) return videos;
    return Array.from(new Map([...videos, ...cloudVideos].map((v) => [v.id, v])).values());
  }, [videos, cloudVideos]);

  const effectiveAudioId = cloudAudioId || youtubeAudioId;

  useEffect(() => {
    let cancelled = false;
    const guard = setTimeout(() => {
      cancelled = true;
    }, 10000);
    (async () => {
      try {
        const [syncs, vids, aud] = await Promise.all([
          getSurahSyncsFirestore(surahId),
          getVideosFirestore(),
          getSurahAudioIdFirestore(surahId),
        ]);
        if (cancelled) return;
        if (syncs && syncs.length > 0) setCloudSyncs(syncs);
        if (vids && vids.length > 0) setCloudVideos(vids);
        if (aud) setCloudAudioId(aud);
      } catch (err) {
        console.warn('Firestore merge skipped:', err);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(guard);
    };
  }, [surahId]);

  // Comparison View state
  const [comparisonAyah, setComparisonAyah] = useState<Ayah | null>(null);
  const [comparisonWord1, setComparisonWord1] = useState<Word | null>(null);
  const [comparisonWord2, setComparisonWord2] = useState<Word | null>(null);

  const handleOpenComparison = (targetAyah?: Ayah | null, initialW1?: Word | null) => {
    const ay = targetAyah || activeAyah || effectiveAyahs[0] || null;
    setComparisonAyah(ay);
    setComparisonWord1(initialW1 || (ay && ay.words.length > 0 ? ay.words[0] : null));
    setComparisonWord2(ay && ay.words.length > 1 ? ay.words[1] : null);
  };

  // Focus Mode state
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Tadabbur Session Timer State
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [initialSurahSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`surah_time_total_${surahName}`);
        if (saved) return parseInt(saved, 10) || 0;
      } catch {
        // ignore
      }
    }
    return 0;
  });

  const totalSurahSeconds = initialSurahSeconds + sessionSeconds;

  // Load notes from local storage (merged with local notes)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const localNotes = await fetchUserNotesFromFirestore(surahName);
        if (!cancelled && Object.keys(localNotes).length > 0) {
          setNotes((prev) => {
            const merged = { ...prev, ...localNotes };
            try {
              localStorage.setItem(`surah_notes_${surahName}`, JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Failed to load notes:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surahName]);

  // Ticking effect for active session timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Sync session time to localStorage & global dashboard stats & Firestore
  useEffect(() => {
    if (sessionSeconds > 0 && sessionSeconds % 10 === 0) {
      try {
        const key = `surah_time_total_${surahName}`;
        const prevTotalSec = parseInt(localStorage.getItem(key) || '0', 10);
        const newTotalSec = prevTotalSec + 10;
        localStorage.setItem(key, newTotalSec.toString());

        // Sync to local progress
        syncSurahProgressToFirestore(surahName, newTotalSec);

        // Update main dashboard stats (tadabbur_progress_data_v1)
        const savedStats = localStorage.getItem('tadabbur_progress_data_v1');
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          parsed.totalMinutesAnalyzed = (parsed.totalMinutesAnalyzed || 0) + (10 / 60);

          if (parsed.dailyInteractionTime && Array.isArray(parsed.dailyInteractionTime)) {
            const todayDay = new Date().getDay();
            const dayMap = [1, 2, 3, 4, 5, 6, 0];
            const idx = dayMap[todayDay];
            if (parsed.dailyInteractionTime[idx]) {
              parsed.dailyInteractionTime[idx].minutes += Math.round((10 / 60) * 10) / 10;
            }
          }
          localStorage.setItem('tadabbur_progress_data_v1', JSON.stringify(parsed));

          // Persist dashboard summary to localStorage
          syncDashboardProgressToFirestore(parsed).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [sessionSeconds, surahName]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-play Next & Auto-scroll state
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('surah_autoplay_next');
        if (saved !== null) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return true;
  });
  const [requestedSeekTime, setRequestedSeekTime] = useState<number | null>(null);

  const handleToggleAutoPlayNext = () => {
    setAutoPlayNext((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem('surah_autoplay_next', JSON.stringify(nextVal));
      } catch {
        // ignore
      }
      return nextVal;
    });
  };

  const handlePlayAyah = (ayah: Ayah) => {
    if (ayah.startTime !== undefined) {
      setRequestedSeekTime(ayah.startTime);
    }
  };

  // Search result highlight handling
  const urlHighlight = searchParams.get('highlight') || searchParams.get('ayah');
  const targetAyahNumber = highlightAyah ?? (urlHighlight ? parseInt(urlHighlight, 10) : null);
  const highlightedAyah = (targetAyahNumber !== null && !isNaN(targetAyahNumber)) ? targetAyahNumber : null;

  const handleOpenNoteModal = (ayah: Ayah) => {
    setEditingNoteAyah(ayah);
    setNoteText(notes[ayah.ayahNumber] || '');
  };

  const handleSaveNote = () => {
    if (!editingNoteAyah) return;
    const ayahNum = editingNoteAyah.ayahNumber;
    const trimmed = noteText.trim();
    
    const updated = { ...notes };
    if (trimmed) {
      updated[ayahNum] = trimmed;
      // Sync note to Firebase
      saveAyahNoteToFirestore(surahName, String(editingNoteAyah.id || ayahNum), ayahNum, trimmed);
    } else {
      delete updated[ayahNum];
      saveAyahNoteToFirestore(surahName, String(editingNoteAyah.id || ayahNum), ayahNum, '');
    }
    
    setNotes(updated);
    try {
      localStorage.setItem(`surah_notes_${surahName}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
    setEditingNoteAyah(null);
  };

  const handleDeleteNote = (ayahNum: number) => {
    const updated = { ...notes };
    delete updated[ayahNum];
    setNotes(updated);
    try {
      localStorage.setItem(`surah_notes_${surahName}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setEditingNoteAyah(null);
  };

  const handleThemeChange = (newTheme: ReadingTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('surah_reading_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const st = getSurahThemeClasses(theme);
  
  // Refs for auto-scrolling
  const ayahRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  // Derive the active ayah based on current time
  const activeAyah = effectiveAyahs.find(a => currentTime >= a.startTime && currentTime <= a.endTime) || null;

  // Derived suggested videos for the active ayah
  const suggestedVideos = activeAyah ? allVideos.filter(v => v.ayahNumber === activeAyah.ayahNumber) : [];

  useEffect(() => {
    if (autoPlayNext && activeAyah && ayahRefs.current[activeAyah.id] && !activeVideo) {
      ayahRefs.current[activeAyah.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeAyah, activeVideo, autoPlayNext]);

  useEffect(() => {
    if (highlightedAyah !== null && highlightedAyah > 0) {
      const timer = setTimeout(() => {
        const el = ayahRefs.current[highlightedAyah];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [highlightedAyah]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${st.pageBg}`}>
      {/* Floating Focus Mode Banner */}
      <AnimatePresence>
        {focusMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-950/90 text-emerald-100 border border-emerald-500/40 backdrop-blur-md shadow-2xl font-sans text-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold">وضع التركيز (الخشوع) مفعّل</span>
            <span className="hidden sm:inline text-emerald-300 opacity-80">| تظليل الشاشة وإبراز الآية الحالية وتحليل كلماتها</span>
            
            {/* Live Session Timer in Focus Banner */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/80 border border-emerald-600/50 text-amber-300 text-xs font-mono font-bold dir-ltr" title="وقت الجلسة الحالية">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{formatTimer(sessionSeconds)}</span>
            </div>

            <button
              onClick={() => setFocusMode(false)}
              className="mr-2 px-3 py-1 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!focusMode && (activeVideo || youtubeAudioId) && (
        <PinnedPlayer 
          videoId={activeVideo ? activeVideo.youtubeId : (effectiveAudioId || '')}
          startTime={activeVideo ? activeVideo.startTime : undefined}
          seekTime={requestedSeekTime}
          title={activeVideo ? activeVideo.title : `تلاوة سورة ${surahName}`}
          subtitle={activeVideo ? activeVideo.scholar : "استمع وتدبر"}
          autoPlay={!!activeVideo}
          autoPlayNext={autoPlayNext}
          onToggleAutoPlayNext={handleToggleAutoPlayNext}
          onTimeUpdate={activeVideo ? undefined : setCurrentTime}
          onClose={activeVideo ? () => setActiveVideo(null) : undefined}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        {/* Navigation & Theme Switcher Bar */}
        <div className="mb-8">
          {/* Breadcrumb + Prev/Next Surah Navigation */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <nav className="flex items-center gap-1.5 text-sm font-sans font-medium text-natural-500" aria-label="مسار التنقل">
              <Link href="/" className="flex items-center gap-1.5 hover:text-natural-900 transition-colors">
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </Link>
              <ChevronLeft className="w-4 h-4 text-natural-300" />
              <Link href="/#fihris" className="hover:text-natural-900 transition-colors">
                فهرس السور
              </Link>
              <ChevronLeft className="w-4 h-4 text-natural-300" />
              <span className="text-natural-900 font-semibold">سورة {surahName}</span>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prev = surahId - 1;
                  if (prev >= 1) router.push(`/surah/${prev}`);
                }}
                disabled={surahId <= 1}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition font-sans font-medium text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${st.backBtn}`}
                title={surahId > 1 ? `السورة السابقة: ${SURAH_NAMES[surahId - 2]}` : 'لا توجد سورة سابقة'}
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابقة</span>
              </button>
              <button
                onClick={() => {
                  const next = surahId + 1;
                  if (next <= 114) router.push(`/surah/${next}`);
                }}
                disabled={surahId >= 114}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition font-sans font-medium text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${st.backBtn}`}
                title={surahId < 114 ? `السورة التالية: ${SURAH_NAMES[surahId]}` : 'لا توجد سورة تالية'}
              >
                <span className="hidden sm:inline">التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">

            {/* Session Timer Widget */}
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-sans font-medium text-sm transition-all shadow-xs ${
                isTimerRunning 
                  ? 'bg-amber-500/10 text-amber-950 border-amber-400/40' 
                  : 'bg-natural-100 text-natural-600 border-natural-200'
              }`}
              title={`وقت جلسة التدبر الحالية لهذه السورة: ${formatTimer(sessionSeconds)} (إجمالي الوقت التراكمي لهذه السورة: ${Math.floor(totalSurahSeconds / 60)} دقيقة)`}
            >
              <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-amber-600 animate-pulse' : 'text-natural-400'}`} />
              <div className="flex items-center gap-1">
                <span className="text-xs text-natural-500 hidden sm:inline">مؤقت التدبر:</span>
                <span className="font-mono font-bold text-sm tracking-wide text-amber-900 dir-ltr">{formatTimer(sessionSeconds)}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded-md hover:bg-amber-200/50 text-amber-800 transition cursor-pointer"
                title={isTimerRunning ? 'إيقاف المؤقت مؤقتاً' : 'استئناف مؤقت الجلسة'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-amber-700" />}
              </button>
              
              <button
                type="button"
                onClick={() => setSessionSeconds(0)}
                className="p-1 rounded-md hover:bg-amber-200/50 text-natural-400 hover:text-amber-900 transition cursor-pointer"
                title="تصفير مؤقت الجلسة الحالية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-sans font-medium text-sm cursor-pointer ${
                focusMode 
                  ? 'bg-emerald-600 text-white shadow-md font-semibold ring-2 ring-emerald-400' 
                  : st.backBtn
              }`}
              title={focusMode ? 'خروج من وضع التركيز' : 'تفعيل وضع التركيز (إخفاء المشتتات والتركيز على الآية الحالية)'}
            >
              {focusMode ? <EyeOff className="w-4 h-4 text-emerald-100" /> : <Eye className="w-4 h-4 text-emerald-600" />}
              <span>وضع التركيز: {focusMode ? 'مفعّل' : 'معطّل'}</span>
            </button>

            {/* Word Comparison Button */}
            <button
              onClick={() => handleOpenComparison()}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-sans font-medium text-sm cursor-pointer ${st.backBtn} hover:bg-amber-100 hover:text-amber-900 border border-amber-200/50`}
              title="مقارنة كلمتين من الآية جانبياً (العرض المقارن)"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-600" />
              <span>مقارنة الكلمات</span>
            </button>

            {/* AI Model Selector (Gemini / Groq / OpenRouter / Local) */}
            <ModelSelector theme={theme} />

            <button
              onClick={handleToggleAutoPlayNext}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-sans font-medium text-sm cursor-pointer ${
                autoPlayNext 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm font-semibold' 
                  : st.backBtn
              }`}
              title={autoPlayNext ? 'التشغيل والتمرير التلقائي للآية التالية مفعّل' : 'تفعيل التشغيل والتمرير التلقائي'}
            >
              <SkipForward className={`w-4 h-4 ${autoPlayNext ? 'text-amber-700' : ''}`} />
              <span>التشغيل والتمرير التلقائي: {autoPlayNext ? 'مفعّل' : 'معطّل'}</span>
            </button>

            {Object.keys(notes).length > 0 && (
              <button
                onClick={() => setShowAllNotesModal(true)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-sans font-medium text-sm ${st.backBtn}`}
                title="عرض جميع الملاحظات والخواطر لهذه السورة"
              >
                <StickyNote className="w-4 h-4 text-amber-600" />
                <span>ملاحظاتي ({Object.keys(notes).length})</span>
              </button>
            )}
          </div>

          {/* Right Action Bar (Theme Selector) */}
          <div className="flex items-center gap-3">
            {/* Theme Selector Pill Controls */}
            <div className={`inline-flex items-center p-1 rounded-2xl border transition-colors duration-300 ${st.themeToggleBg}`}>
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all ${
                theme === 'light' ? st.themeToggleBtnActive : st.themeToggleBtnInactive
              }`}
              title="مظهر فاتح (افتراضي)"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>فاتح</span>
            </button>

            <button
              onClick={() => handleThemeChange('sepia')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all ${
                theme === 'sepia' ? st.themeToggleBtnActive : st.themeToggleBtnInactive
              }`}
              title="مظهر دافئ للتحميل والتدبر الطويل"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>سيبيا (دافئ)</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all ${
                theme === 'dark' ? st.themeToggleBtnActive : st.themeToggleBtnInactive
              }`}
              title="مظهر ليلي للمطالعة الهادئة"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>ليلي (داكن)</span>
            </button>
          </div>
          </div>
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-3xl font-amiri font-bold mb-2 transition-colors duration-300 ${st.headerTitle}`}>
            سورة {surahName}
          </h1>
          <p className={`text-sm uppercase tracking-widest font-sans font-semibold transition-colors duration-300 ${st.headerSub}`}>
            استمع، تدبر، وتعلم
          </p>
        </div>

        {/* Surah Text */}
        <div className={`rounded-3xl p-8 md:p-12 border leading-[2.2] text-center text-4xl md:text-5xl font-amiri mb-12 transition-colors duration-300 ${st.mainCard}`} dir="rtl">
          {effectiveAyahs.map((ayah) => {
            const isActive = activeAyah?.id === ayah.id;
            const isHighlighted = highlightedAyah === ayah.ayahNumber && !ayah.isBismillah;
            
            // Focus Mode styling
            let focusAyahClass = '';
            if (focusMode) {
              if (isActive || isHighlighted) {
                focusAyahClass = 'ring-4 ring-emerald-500/80 bg-emerald-500/15 text-natural-900 dark:text-emerald-100 rounded-3xl p-6 shadow-2xl scale-[1.02] inline-block my-5 font-bold border border-emerald-500/40 backdrop-blur-sm';
              } else {
                focusAyahClass = 'opacity-20 blur-[0.4px] hover:opacity-80 hover:blur-none transition-all duration-500 cursor-pointer';
              }
            }

            return (
              <span 
                key={ayah.id} 
                ref={(el) => {
                  if (el) ayahRefs.current[ayah.id] = el;
                }}
                className={`transition-all duration-700 ${
                  focusMode
                    ? focusAyahClass
                    : isHighlighted 
                      ? 'ring-4 ring-amber-500/80 bg-amber-500/15 text-amber-950 dark:text-amber-100 rounded-3xl p-4 shadow-xl scale-[1.01] inline-block my-3 font-bold' 
                      : isActive 
                        ? st.ayahActive 
                        : st.ayahInactive
                } ${ayah.isBismillah ? `block w-full mb-10 pb-8 border-b ${st.bismillahBorder} leading-normal` : 'ml-4'}`}
              >
                {ayah.words.map((word) => {
                  const isWordSelected = selectedWord?.word.id === word.id;
                  const isWordActive = isActive && word.startTime !== undefined && word.endTime !== undefined && currentTime >= word.startTime && currentTime <= word.endTime;
                  return (
                    <span
                      key={word.id}
                      onClick={() => setSelectedWord({ word, ayahText: ayah.text })}
                      className={`inline-block cursor-pointer px-2 py-1 transition-colors rounded-sm ${isWordSelected ? st.wordSelected : isWordActive ? st.wordActive : st.wordHover}`}
                    >
                      {word.text}
                    </span>
                  )
                })}
                {!ayah.isBismillah && (
                  <span className="inline-flex items-center gap-1.5 align-middle mr-4 my-1">
                    {focusMode && isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-md animate-pulse align-middle">
                        ✨ الآية قيد التدبر
                      </span>
                    )}
                    {isHighlighted && !focusMode && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold bg-amber-600 text-white px-2.5 py-1 rounded-full shadow-md animate-pulse align-middle">
                        📍 الآية المستهدفة
                      </span>
                    )}
                    {ayah.startTime !== undefined && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAyah(ayah);
                        }}
                        title={`استمع للآية ${ayah.ayahNumber}`}
                        className="relative inline-flex items-center justify-center p-2 rounded-xl border border-natural-200 hover:bg-amber-100 hover:text-amber-900 text-natural-600 text-xs transition-all transform hover:scale-105 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenNoteModal(ayah);
                      }}
                      title={notes[ayah.ayahNumber] ? `تعديل ملاحظة الآية (${notes[ayah.ayahNumber].substring(0, 30)}...)` : "إضافة ملاحظة وتدبر لهذه الآية"}
                      className={`relative inline-flex items-center justify-center p-2 rounded-xl border text-xs transition-all transform hover:scale-105 cursor-pointer ${
                        notes[ayah.ayahNumber] ? st.noteIconHasNote : st.noteIconDefault
                      }`}
                    >
                      <StickyNote className="w-4 h-4" />
                      {notes[ayah.ayahNumber] && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ayah.startTime !== undefined) {
                          handlePlayAyah(ayah);
                        }
                      }}
                      title={`الانتقال والاستماع للآية ${ayah.ayahNumber}`}
                      className={`inline-block text-2xl align-middle w-10 h-10 border rounded-full text-center leading-[38px] font-sans font-light transition-colors hover:scale-105 cursor-pointer ${
                        isHighlighted ? 'border-amber-600 bg-amber-500 text-white font-bold shadow-md' : isActive ? st.ayahNumActive : st.ayahNumDefault
                      }`}
                    >
                      {ayah.ayahNumber}
                    </button>
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Suggested Videos - Floating Sidebar */}
        <AnimatePresence>
          {suggestedVideos.length > 0 && !focusMode && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed top-36 right-6 w-72 z-40 hidden lg:block"
            >
              <div className={`border shadow-xl rounded-2xl p-4 transition-colors duration-300 ${st.suggestedBg}`}>
                <h3 className="text-xs uppercase tracking-widest font-sans font-bold opacity-75 mb-4 text-right">
                  تفسير هذه الآية (مرئي)
                </h3>
                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2">
                  {suggestedVideos.map(video => (
                    <button 
                      key={video.id} 
                      onClick={() => setActiveVideo(video)}
                      className={`flex flex-col border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition text-right group ${st.videoCard}`}
                    >
                      <div className="relative w-full aspect-video bg-natural-900 flex items-center justify-center text-white shrink-0">
                        <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition" alt="" />
                        <Video className="w-8 h-8 relative z-10" />
                      </div>
                      <div className="p-3 w-full">
                        <h4 className="text-xs font-bold leading-tight line-clamp-2 font-sans">{video.title}</h4>
                        <p className="text-[10px] opacity-65 mt-1 font-sans font-medium">{video.scholar}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile Suggested Videos Overlay - Bottom */}
        <AnimatePresence>
          {suggestedVideos.length > 0 && !focusMode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-4 right-4 z-40 lg:hidden flex justify-end"
            >
               <div className={`border shadow-2xl rounded-2xl p-3 flex flex-row gap-3 overflow-x-auto w-full max-w-sm ml-auto ${st.suggestedBg}`}>
                  <div className="flex flex-nowrap gap-3 shrink-0">
                    {suggestedVideos.map(video => (
                      <button 
                        key={video.id} 
                        onClick={() => setActiveVideo(video)}
                        className={`flex text-right w-64 border gap-2 rounded-xl overflow-hidden shadow-sm transition shrink-0 ${st.videoCard}`}
                      >
                        <div className="w-20 aspect-square bg-natural-900 shrink-0 relative flex items-center justify-center">
                          <img src={`https://img.youtube.com/vi/${video.youtubeId}/default.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                          <Play className="w-6 h-6 text-white relative z-10 opacity-80" />
                        </div>
                        <div className="p-2 flex flex-col justify-center">
                          <h4 className="text-[11px] font-bold leading-tight line-clamp-2 font-sans">{video.title}</h4>
                          <p className="text-[9px] opacity-65 mt-1 font-sans">{video.scholar}</p>
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <WordRootModal 
          word={selectedWord?.word || null} 
          contextAyah={selectedWord?.ayahText || ""} 
          onClose={() => setSelectedWord(null)}
          onOpenCompare={(wordToCompare) => {
            const currentAyahObj = effectiveAyahs.find(a => a.text === selectedWord?.ayahText) || activeAyah || effectiveAyahs[0];
            setSelectedWord(null);
            handleOpenComparison(currentAyahObj, wordToCompare);
          }}
          surahAyahs={effectiveAyahs}
          surahName={surahName}
          onSelectAyah={(ayahNum) => {
            const target = effectiveAyahs.find(a => a.ayahNumber === ayahNum);
            if (target) {
              handlePlayAyah(target);
              if (ayahRefs.current[target.id]) {
                ayahRefs.current[target.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }}
          theme={theme}
        />

        {/* Word Comparison Modal */}
        {comparisonAyah && (
          <WordComparisonModal
            ayah={comparisonAyah}
            initialWord1={comparisonWord1}
            initialWord2={comparisonWord2}
            onClose={() => setComparisonAyah(null)}
            theme={theme}
          />
        )}

        {/* Ayah Note Modal */}
        <AnimatePresence>
          {editingNoteAyah && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className={`w-full max-w-lg rounded-3xl p-6 md:p-8 border shadow-2xl relative ${st.modalCard}`}
                dir="rtl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-natural-200/50 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <StickyNote className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-sans">
                        خواطر وتدبر الآية ({editingNoteAyah.ayahNumber})
                      </h3>
                      <p className="text-xs opacity-65 font-sans font-medium">
                        سورة {surahName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingNoteAyah(null)}
                    className="p-2 rounded-xl hover:bg-black/10 transition opacity-70 hover:opacity-100"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Ayah Snippet preview */}
                <div className="p-4 rounded-2xl bg-black/5 border border-black/10 text-2xl font-amiri text-center mb-6 leading-relaxed select-text">
                  {editingNoteAyah.text}
                </div>

                {/* Note Editor */}
                <div className="space-y-2 mb-6">
                  <label className="text-xs font-bold font-sans opacity-80 block text-right">
                    اكتب ملاحظاتك وتدبراتك الفردية حول هذه الآية:
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="اكتب هنا ما تدبرته أو تود تذكره عند قراءة هذه الآية..."
                    rows={5}
                    className={`w-full p-4 rounded-2xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none ${st.textareaBg}`}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  {notes[editingNoteAyah.ayahNumber] ? (
                    <button
                      onClick={() => handleDeleteNote(editingNoteAyah.ayahNumber)}
                      className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-sans font-semibold transition flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف الملاحظة</span>
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingNoteAyah(null)}
                      className="px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-sans font-semibold transition"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className={`px-5 py-2.5 rounded-xl font-sans font-semibold text-xs transition flex items-center gap-2 shadow-sm ${st.primaryBtn}`}
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ الملاحظة</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* All Notes Overview Modal */}
        <AnimatePresence>
          {showAllNotesModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className={`w-full max-w-2xl rounded-3xl p-6 md:p-8 border shadow-2xl relative max-h-[85vh] flex flex-col ${st.modalCard}`}
                dir="rtl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-natural-200/50 mb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-sans">
                        ملاحظات وتدبرات سورة {surahName}
                      </h3>
                      <p className="text-xs opacity-65 font-sans font-medium">
                        إجمالي الملاحظات المحفوظة: {Object.keys(notes).length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAllNotesModal(false)}
                    className="p-2 rounded-xl hover:bg-black/10 transition opacity-70 hover:opacity-100"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto space-y-4 pr-1 flex-1 my-2">
                  {Object.entries(notes).map(([ayahNumStr, noteContent]) => {
                    const ayahNum = Number(ayahNumStr);
                    const matchingAyah = effectiveAyahs.find(a => a.ayahNumber === ayahNum);
                    return (
                      <div
                        key={ayahNum}
                        className="p-4 rounded-2xl border border-natural-200/70 bg-black/5 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold font-sans bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-lg">
                            الآية {ayahNum}
                          </span>
                          <button
                            onClick={() => {
                              setShowAllNotesModal(false);
                              if (matchingAyah) handleOpenNoteModal(matchingAyah);
                            }}
                            className="text-xs font-sans text-amber-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        </div>

                        {matchingAyah && (
                          <div className="text-lg font-amiri opacity-80 leading-relaxed border-r-2 border-amber-500/50 pr-3 my-1">
                            {matchingAyah.text}
                          </div>
                        )}

                        <div className="text-sm font-sans whitespace-pre-wrap opacity-95 pt-2 border-t border-black/10">
                          {noteContent}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-natural-200/50 shrink-0 text-left">
                  <button
                    onClick={() => setShowAllNotesModal(false)}
                    className={`px-5 py-2 rounded-xl text-xs font-sans font-semibold ${st.primaryBtn}`}
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Save Toast */}
        <AnimatePresence>
          {showSavedToast && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-emerald-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-700 text-xs font-sans font-bold"
              dir="rtl"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>تم حفظ الملاحظة بنجاح في متصفحك!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
