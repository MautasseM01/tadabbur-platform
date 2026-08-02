'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { 
  fetchDashboardProgressFromFirestore, 
  syncDashboardProgressToFirestore, 
  onAuthChange 
} from '@/lib/firebaseSync';
import { Cloud, CloudCheck, Loader2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  AreaChart, 
  Area, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Award, 
  Flame, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  BarChart2,
  Target,
  Compass,
  Tag,
  Search,
  Layers
} from 'lucide-react';

export interface LinguisticRootItem {
  root: string;
  meaning: string;
  occurrences: number;
  surahsExplored: string[];
  sampleWords: string[];
  color: string;
}

export interface TadabburProgressData {
  totalAyahsAnalyzed: number;
  totalWordsAnalyzed: number;
  averageDailyMinutes: number;
  studyStreakDays: number;
  mostStudiedSurahs: {
    name: string;
    ayahsCount: number;
    readAyahs?: number;
    totalAyahs?: number;
    sessionsCount: number;
    color: string;
  }[];
  dailyInteractionTime: {
    day: string;
    minutes: number;
    ayahs: number;
  }[];
  frequentLinguisticRoots: LinguisticRootItem[];
}

const DEFAULT_ROOTS_DATA: LinguisticRootItem[] = [
  {
    root: 'ن - ب - أ',
    meaning: 'الإخبار والنبأ العظيم والهداية بالوحي',
    occurrences: 24,
    surahsExplored: ['الأنبياء', 'النبأ', 'يس'],
    sampleWords: ['النَّبَأِ', 'يُنَبِّئُكُم', 'أَنبِيَاءَ', 'نَبَّأَنِيَ'],
    color: '#d97706'
  },
  {
    root: 'ح - م - د',
    meaning: 'التحميد وإظهار ثناء الجميل اختياراً ومحبة',
    occurrences: 19,
    surahsExplored: ['الفاتحة', 'الأنبياء', 'الكهف'],
    sampleWords: ['الحَمدُ', 'المَحمُود', 'أَحمَدُ', 'حَمِيداً'],
    color: '#059669'
  },
  {
    root: 'ع - ل - م',
    meaning: 'الإدراك والمعرفة الشاملة وإزالة الجهل',
    occurrences: 16,
    surahsExplored: ['البقرة', 'العلق', 'الأنبياء'],
    sampleWords: ['عَلَّمَ', 'العَالَمِين', 'يَعلَمُونَ', 'مُعَلَّمٌ'],
    color: '#0284c7'
  },
  {
    root: 'ر - ح - م',
    meaning: 'الرأفة والعطف والإحسان الشامل للعباد',
    occurrences: 14,
    surahsExplored: ['الفاتحة', 'يس', 'الأنبياء'],
    sampleWords: ['الرَّحمَن', 'الرَّحِيم', 'مَرحَمَة', 'يَرحَمُكُم'],
    color: '#7c3aed'
  },
  {
    root: 'ص - ب - ر',
    meaning: 'الحبس والتحمل والثبات في مواجهة الشدائد',
    occurrences: 11,
    surahsExplored: ['الأنبياء', 'الكهف', 'البقرة'],
    sampleWords: ['الصَّابِرِين', 'صَبَرُوا', 'اصبِر', 'صَبرًا'],
    color: '#ea580c'
  },
  {
    root: 'غ - ف - ر',
    meaning: 'الستر والمغفرة ووقاية ذنوب العباد',
    occurrences: 9,
    surahsExplored: ['الأنبياء', 'نوح', 'البقرة'],
    sampleWords: ['الغَفُور', 'غُفرَانَك', 'المَغفِرَة', 'استَغفِرُوا'],
    color: '#2563eb'
  }
];

const DEFAULT_PROGRESS_DATA: TadabburProgressData = {
  totalAyahsAnalyzed: 142,
  totalWordsAnalyzed: 428,
  averageDailyMinutes: 34,
  studyStreakDays: 7,
  mostStudiedSurahs: [
    { name: 'سورة الأنبياء', ayahsCount: 48, readAyahs: 84, totalAyahs: 112, sessionsCount: 14, color: '#d97706' },
    { name: 'سورة الفاتحة', ayahsCount: 7, readAyahs: 7, totalAyahs: 7, sessionsCount: 10, color: '#059669' },
    { name: 'سورة البقرة', ayahsCount: 24, readAyahs: 143, totalAyahs: 286, sessionsCount: 8, color: '#0284c7' },
    { name: 'سورة الكهف', ayahsCount: 22, readAyahs: 66, totalAyahs: 110, sessionsCount: 7, color: '#7c3aed' },
    { name: 'سورة يس', ayahsCount: 20, readAyahs: 50, totalAyahs: 83, sessionsCount: 6, color: '#ea580c' },
  ],
  dailyInteractionTime: [
    { day: 'السبت', minutes: 25, ayahs: 18 },
    { day: 'الأحد', minutes: 40, ayahs: 24 },
    { day: 'الإثنين', minutes: 30, ayahs: 20 },
    { day: 'الثلاثاء', minutes: 45, ayahs: 28 },
    { day: 'الأربعاء', minutes: 20, ayahs: 12 },
    { day: 'الخميس', minutes: 38, ayahs: 22 },
    { day: 'الجمعة', minutes: 52, ayahs: 32 },
  ],
  frequentLinguisticRoots: DEFAULT_ROOTS_DATA
};

const STORAGE_KEY = 'tadabbur_progress_data_v1';

const emptySubscribe = () => () => {};

export default function TadabburProgressWidget() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [data, setData] = useState<TadabburProgressData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.totalAyahsAnalyzed === 'number') {
            return {
              ...DEFAULT_PROGRESS_DATA,
              ...parsed,
              frequentLinguisticRoots: parsed.frequentLinguisticRoots || DEFAULT_ROOTS_DATA
            };
          }
        }
      } catch (err) {
        console.error('Failed to load Tadabbur progress from localStorage', err);
      }
    }
    return DEFAULT_PROGRESS_DATA;
  });

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [showLogSuccess, setShowLogSuccess] = useState(false);
  const [rootSearchQuery, setRootSearchQuery] = useState('');
  const [weeklyGoalSessions, setWeeklyGoalSessions] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tadabbur_weekly_goal_sessions');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return 7;
  });

  const handleWeeklyGoalChange = (newGoal: number) => {
    setWeeklyGoalSessions(newGoal);
    try {
      localStorage.setItem('tadabbur_weekly_goal_sessions', newGoal.toString());
    } catch {
      // ignore
    }
  };

  const [isCloudSynced, setIsCloudSynced] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const cloudData = await fetchDashboardProgressFromFirestore();
          if (cloudData && typeof cloudData.totalAyahsAnalyzed === 'number') {
            setData((prev) => ({
              ...prev,
              ...cloudData,
              frequentLinguisticRoots: cloudData.frequentLinguisticRoots || prev.frequentLinguisticRoots
            }));
          } else {
            // Initial sync to Firestore if user has no cloud summary yet
            await syncDashboardProgressToFirestore(data);
          }
          setIsCloudSynced(true);
        } catch (err) {
          console.warn('Failed to sync progress with Firestore:', err);
        }
      } else {
        setIsCloudSynced(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const saveProgressData = (newData: TadabburProgressData) => {
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (err) {
      console.error('Failed to save Tadabbur progress to localStorage', err);
    }
    // Async sync to Firebase Firestore
    syncDashboardProgressToFirestore(newData).catch((err) => {
      console.warn('Firestore progress sync background warning:', err);
    });
  };

  const handleLogSession = () => {
    const addedAyahs = 3;
    const addedMinutes = 15;
    const addedWords = 9;

    const updatedDaily = data.dailyInteractionTime.map((item, index) => {
      // Add to Friday (last day in array) for current session
      if (index === data.dailyInteractionTime.length - 1) {
        return {
          ...item,
          minutes: item.minutes + addedMinutes,
          ayahs: item.ayahs + addedAyahs,
        };
      }
      return item;
    });

    const totalMinutes = updatedDaily.reduce((sum, item) => sum + item.minutes, 0);
    const newAverage = Math.round(totalMinutes / updatedDaily.length);

    const updatedSurahs = data.mostStudiedSurahs.map((surah, idx) => {
      if (idx === 0) {
        return {
          ...surah,
          ayahsCount: surah.ayahsCount + addedAyahs,
          sessionsCount: surah.sessionsCount + 1,
        };
      }
      return surah;
    });

    const currentRoots = data.frequentLinguisticRoots || DEFAULT_ROOTS_DATA;
    const updatedRoots = currentRoots.map((r, i) => {
      if (i === 0) {
        return { ...r, occurrences: r.occurrences + 1 };
      }
      return r;
    });

    const newData: TadabburProgressData = {
      ...data,
      totalAyahsAnalyzed: data.totalAyahsAnalyzed + addedAyahs,
      totalWordsAnalyzed: data.totalWordsAnalyzed + addedWords,
      averageDailyMinutes: newAverage,
      mostStudiedSurahs: updatedSurahs,
      dailyInteractionTime: updatedDaily,
      frequentLinguisticRoots: updatedRoots,
    };

    saveProgressData(newData);
    setShowLogSuccess(true);
    setTimeout(() => setShowLogSuccess(false), 3000);
  };

  const handleResetData = () => {
    saveProgressData(DEFAULT_PROGRESS_DATA);
  };

  // Adjust display multiplier based on timeframe tab
  const getMultiplier = () => {
    if (timeframe === 'month') return 4;
    if (timeframe === 'all') return 18;
    return 1;
  };

  const multiplier = getMultiplier();
  const displayTotalAyahs = data.totalAyahsAnalyzed * (timeframe === 'week' ? 1 : timeframe === 'month' ? 3.8 : 12.5);
  const displayTotalWords = data.totalWordsAnalyzed * (timeframe === 'week' ? 1 : timeframe === 'month' ? 3.8 : 12.5);

  const formattedSurahData = data.mostStudiedSurahs.map((item) => {
    const total = item.totalAyahs || (item.name.includes('الفاتحة') ? 7 : item.name.includes('الأنبياء') ? 112 : item.name.includes('البقرة') ? 286 : item.name.includes('الكهف') ? 110 : 83);
    const analyzedCount = Math.min(total, item.ayahsCount);
    const readCount = item.readAyahs || Math.min(total, Math.round(analyzedCount * 1.5));
    
    const analyzedPct = Math.min(100, Math.round((analyzedCount / total) * 100));
    const readPct = Math.min(100, Math.round((readCount / total) * 100));

    return {
      ...item,
      total,
      analyzedCount,
      readCount,
      analyzedPct,
      readPct,
      displayAyahs: Math.round(item.ayahsCount * multiplier),
    };
  });

  const formattedDailyData = data.dailyInteractionTime.map((item) => ({
    ...item,
    displayMinutes: timeframe === 'week' ? item.minutes : Math.round(item.minutes * 1.15),
  }));

  const rootsList = data.frequentLinguisticRoots || DEFAULT_ROOTS_DATA;
  const filteredRoots = rootsList.filter((item) => {
    if (!rootSearchQuery.trim()) return true;
    const q = rootSearchQuery.toLowerCase().trim();
    return (
      item.root.includes(q) ||
      item.meaning.includes(q) ||
      item.sampleWords.some((w) => w.includes(q)) ||
      item.surahsExplored.some((s) => s.includes(q))
    );
  });

  const maxRootOccurrences = Math.max(1, ...rootsList.map((r) => r.occurrences));

  const completedWeeklySessions = data.dailyInteractionTime.filter(d => d.minutes > 0).length;
  const weeklyGoalRatio = Math.min(1, completedWeeklySessions / Math.max(1, weeklyGoalSessions));
  const weeklyGoalPercentage = Math.round(weeklyGoalRatio * 100);
  const circleRadius = 22;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleDashoffset = circleCircumference - (weeklyGoalRatio * circleCircumference);

  if (!isMounted) {
    return (
      <div className="bg-white border border-natural-200 rounded-3xl p-8 animate-pulse text-center">
        <div className="h-6 w-48 bg-natural-100 rounded mx-auto mb-4" />
        <div className="h-32 bg-natural-50 rounded-2xl" />
      </div>
    );
  }

  return (
    <section 
      aria-label="Tadabbur Progress Widget"
      className="bg-white border border-natural-300 rounded-3xl p-6 sm:p-8 shadow-sm"
      dir="rtl"
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-natural-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold font-sans text-natural-900">
                لوحة تقدم التدبر التفاعلي
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3" /> إحصائيات حية
              </span>
              {isCloudSynced ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" /> مزامَن بالسحاب
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-natural-100 text-natural-600 border border-natural-200">
                  <Cloud className="w-3.5 h-3.5 text-amber-500" /> تخزين محلي
                </span>
              )}
            </div>
            <p className="text-sm text-natural-600 font-sans mt-0.5">
              متابعة الآيات المتدبرة، السور الأكثر دراسةً، ومتوسط وقت التفاعل اليومي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="inline-flex bg-natural-100 p-1 rounded-xl border border-natural-200">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-lg transition-all ${
                timeframe === 'week'
                  ? 'bg-white text-natural-900 shadow-sm font-bold'
                  : 'text-natural-600 hover:text-natural-900'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-lg transition-all ${
                timeframe === 'month'
                  ? 'bg-white text-natural-900 shadow-sm font-bold'
                  : 'text-natural-600 hover:text-natural-900'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-lg transition-all ${
                timeframe === 'all'
                  ? 'bg-white text-natural-900 shadow-sm font-bold'
                  : 'text-natural-600 hover:text-natural-900'
              }`}
            >
              إجمالي التدبر
            </button>
          </div>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: Total Ayahs Analyzed */}
        <div className="bg-natural-50 border border-natural-200 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-natural-600 font-sans">
              إجمالي الآيات المتدبرة
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-sans text-natural-900 mb-1">
              {Math.round(displayTotalAyahs).toLocaleString('ar-EG')} <span className="text-base font-normal text-natural-600">آية</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-sans font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18% نمو في تدبر الآيات</span>
              <span className="text-natural-400">|</span>
              <span>{Math.round(displayTotalWords).toLocaleString('ar-EG')} كلمة</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Most Studied Surah */}
        <div className="bg-natural-50 border border-natural-200 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-natural-600 font-sans">
              السورة الأكثر دراسةً
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-amiri text-natural-900 mb-1">
              {data.mostStudiedSurahs[0]?.name || 'سورة الأنبياء'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-natural-600 font-sans font-medium">
              <span>{data.mostStudiedSurahs[0]?.ayahsCount || 48} آية متدبرة</span>
              <span className="text-natural-400">|</span>
              <span>{data.mostStudiedSurahs[0]?.sessionsCount || 14} جلسة تدبر</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Average Daily Interaction Time */}
        <div className="bg-natural-50 border border-natural-200 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-natural-600 font-sans">
              متوسط التفاعل اليومي
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-sans text-natural-900 mb-1">
              {data.averageDailyMinutes} <span className="text-base font-normal text-natural-600">دقيقة/يوم</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-sans font-medium">
              <Flame className="w-3.5 h-3.5" />
              <span>تواتر يومي: {data.studyStreakDays} أيام متتالية</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Weekly Reading Goal */}
        <div className="bg-natural-50 border border-natural-200 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-natural-600 font-sans">
              الهدف الأسبوعي
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-800 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-3 my-auto">
            {/* Circular Progress Bar */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  className="stroke-natural-200"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  className={`transition-all duration-700 ease-out ${
                    weeklyGoalPercentage >= 100 ? 'stroke-emerald-600' : 'stroke-amber-600'
                  }`}
                  strokeWidth="4"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={circleDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[11px] font-bold font-sans text-natural-900">
                {weeklyGoalPercentage}%
              </span>
            </div>

            {/* Selector & Details */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <select
                aria-label="اختر هدف الجلسات الأسبوعية"
                value={weeklyGoalSessions}
                onChange={(e) => handleWeeklyGoalChange(Number(e.target.value))}
                className="text-[11px] font-bold bg-white border border-natural-300 rounded-lg px-2 py-1 text-natural-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm w-full"
              >
                <option value={3}>3 جلسات / أسبوع</option>
                <option value={5}>5 جلسات / أسبوع</option>
                <option value={7}>7 جلسات / أسبوع</option>
                <option value={10}>10 جلسات / أسبوع</option>
                <option value={14}>14 جلسة / أسبوع</option>
                <option value={21}>21 جلسة / أسبوع</option>
              </select>

              <div className="text-[11px] font-sans font-medium text-natural-600">
                مكتمل: <span className="font-bold text-natural-900">{completedWeeklySessions}</span> من <span className="font-bold text-natural-900">{weeklyGoalSessions}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-natural-200/60">
            {weeklyGoalPercentage >= 100 ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-200">
                🎉 تم تحقيق هدف الأسبوع!
              </span>
            ) : (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200">
                متبقي {Math.max(0, weeklyGoalSessions - completedWeeklySessions)} جلسة للهدف
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recharts Visualizations - Two Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Chart 1: Most Studied Surahs Progress (BarChart: Analyzed % vs Fully Read %) */}
        <div className="bg-natural-50/60 border border-natural-200 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-natural-900 font-sans text-base flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-600" />
                نسب الإنجاز للسور الأكثر دراسةً (%)
              </h3>
              <p className="text-xs text-natural-500 font-sans mt-0.5">
                مقارنة نسبة الآيات المحللة والمفصلة مقابل نسبة القراءة الكاملة لكل سورة
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] font-sans font-semibold">
              <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                مُحَلَّل ومُتَدَبَّر
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                مَقْرُوء بالكامل
              </span>
            </div>
          </div>

          <div className="h-[270px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedSurahData}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 700 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-natural-300 rounded-xl shadow-xl p-3.5 text-right min-w-[210px]" dir="rtl">
                          <p className="font-amiri font-bold text-base text-natural-900 mb-2 pb-1 border-b border-natural-200">
                            {item.name} <span className="text-xs font-sans font-normal text-natural-500">({item.total} آية)</span>
                          </p>
                          
                          <div className="space-y-1.5 text-xs font-sans">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-amber-800 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                                المحللة والمتدبرة:
                              </span>
                              <span className="font-bold text-natural-900">
                                {item.analyzedPct}% <span className="text-[11px] font-normal text-natural-500">({item.analyzedCount} آية)</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                                المقروءة بالكامل:
                              </span>
                              <span className="font-bold text-natural-900">
                                {item.readPct}% <span className="text-[11px] font-normal text-natural-500">({item.readCount} آية)</span>
                              </span>
                            </div>

                            <div className="pt-1.5 border-t border-natural-100 flex items-center justify-between text-natural-500 text-[11px]">
                              <span>إجمالي جلسات التدبر:</span>
                              <span className="font-bold text-natural-700">{item.sessionsCount} جلسات</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="analyzedPct" 
                  name="نسبة التحليل والتدبر"
                  fill="#d97706" 
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Bar 
                  dataKey="readPct" 
                  name="نسبة القراءة الكاملة"
                  fill="#059669" 
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Average Daily Interaction Time (AreaChart) */}
        <div className="bg-natural-50/60 border border-natural-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-natural-900 font-sans text-base">
                متوسط وقت التفاعل اليومي (دقيقة)
              </h3>
              <p className="text-xs text-natural-500 font-sans mt-0.5">
                تتبع دقائق الاستماع للتلاوة ومشاهدة التفاسير المرئية
              </p>
            </div>
            <span className="text-xs font-semibold bg-white border border-natural-300 px-2.5 py-1 rounded-lg text-natural-700">
              الدقائق اليومية
            </span>
          </div>

          <div className="h-[260px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedDailyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  unit=" د"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-natural-300 rounded-xl shadow-lg p-3 text-right" dir="rtl">
                          <p className="font-bold font-sans text-sm text-natural-900 mb-1">
                            يوم {item.day}
                          </p>
                          <p className="text-xs font-sans text-natural-700">
                            وقت التفاعل: <span className="font-bold text-amber-700">{item.displayMinutes} دقيقة</span>
                          </p>
                          <p className="text-xs font-sans text-natural-500 mt-0.5">
                            الآيات المدروسة: <span className="font-semibold">{item.ayahs} آية</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="displayMinutes" 
                  stroke="#d97706" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMinutes)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Linguistic Roots Section */}
      <div className="bg-gradient-to-br from-amber-50/40 via-white to-natural-50 border border-natural-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-natural-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-sans text-natural-900">
                  الأصول والجذور اللغوية الأكثر استكشافاً
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {rootsList.length} جذور معجمية
                </span>
              </div>
              <p className="text-xs text-natural-600 font-sans mt-0.5">
                تتبع واستكشاف مفردات القرآن والأصول اللغوية التي تدبرت كلماتها ومعانيها في جلساتك
              </p>
            </div>
          </div>

          {/* Root Search & Filter Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-natural-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={rootSearchQuery}
              onChange={(e) => setRootSearchQuery(e.target.value)}
              placeholder="ابحث عن جذر، كلمة، أو معنى..."
              className="w-full bg-white border border-natural-300 rounded-xl pr-9 pl-4 py-2 text-xs font-sans text-natural-900 placeholder:text-natural-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Root Analytics Summary Bar Chart */}
        <div className="mb-8 bg-white border border-natural-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold font-sans text-natural-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              مقارنة تكرار استكشاف الجذور اللغوية
            </span>
            <span className="text-[11px] text-natural-500 font-sans font-medium">
              مرتبة حسب التكرار في الجلسات
            </span>
          </div>

          <div className="h-[180px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rootsList} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="root" 
                  tick={{ fontSize: 13, fill: '#1e293b', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item: LinguisticRootItem = payload[0].payload;
                      return (
                        <div className="bg-white border border-natural-300 rounded-xl shadow-xl p-3 text-right" dir="rtl">
                          <p className="font-amiri font-bold text-lg text-natural-900">
                            جذر ({item.root})
                          </p>
                          <p className="text-xs font-sans text-amber-700 font-semibold mb-1">
                            {item.meaning}
                          </p>
                          <p className="text-xs font-sans text-natural-600">
                            تكرار الاستكشاف: <span className="font-bold text-natural-900">{item.occurrences} مرّة</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="occurrences" radius={[8, 8, 0, 0]} barSize={28}>
                  {rootsList.map((entry, index) => (
                    <Cell key={`root-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Root Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoots.map((item) => {
            const pct = Math.round((item.occurrences / maxRootOccurrences) * 100);
            return (
              <div 
                key={item.root}
                className="bg-white border border-natural-200 hover:border-amber-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Root Badge & Occurrences */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="font-amiri font-bold text-2xl text-natural-900 tracking-wider">
                        ({item.root})
                      </span>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-natural-100 text-natural-800 border border-natural-200 group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
                      {item.occurrences} استكشافات
                    </span>
                  </div>

                  {/* Semantic Meaning */}
                  <p className="text-xs font-sans font-medium text-natural-700 leading-relaxed mb-4 min-h-[36px]">
                    {item.meaning}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-natural-100 h-2 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>

                  {/* Sample Explored Words */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] font-bold text-natural-400 uppercase tracking-wider block font-sans">
                      الكلمات الكريمة المتدبرة:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.sampleWords.map((word) => (
                        <span 
                          key={word}
                          className="font-amiri text-base bg-natural-50 hover:bg-natural-100 text-natural-800 px-2.5 py-0.5 rounded-lg border border-natural-200 transition"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Studied Surahs Footer */}
                <div className="pt-3 border-t border-natural-100 flex items-center justify-between text-[11px] text-natural-500 font-sans">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-600" />
                    السور: {item.surahsExplored.join('، ')}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredRoots.length === 0 && (
            <div className="col-span-full bg-white p-8 rounded-2xl text-center border border-natural-200 text-natural-500 font-sans">
              لا توجد جذور لغوية مطابقة لـ &quot;{rootSearchQuery}&quot;
            </div>
          )}
        </div>
      </div>

      {/* Interactive Footer & Logging Action */}
      <div className="bg-natural-50 border border-natural-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-natural-900 font-sans">
              هل أكملت جلسة تدبر جديدة اليوم؟
            </h4>
            <p className="text-xs text-natural-600 font-sans mt-0.5">
              سجل تفاعلك لتحديث الإحصائيات الحية والمتوسط اليومي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {showLogSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-2 rounded-xl animate-fade-in">
              ✓ تم تسجيل الجلسة وتحديث الرسم البياني!
            </span>
          )}
          <button
            onClick={handleLogSession}
            className="flex items-center justify-center gap-2 bg-natural-900 hover:bg-natural-800 text-white px-4 py-2.5 rounded-xl font-sans font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل جلسة تدبر (+15 دقيقة / 3 آيات)</span>
          </button>
          <button
            onClick={handleResetData}
            title="إعادة ضبط البيانات الافتراضية"
            className="p-2.5 rounded-xl border border-natural-300 hover:bg-natural-100 text-natural-500 hover:text-natural-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
