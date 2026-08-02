'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoExplanation } from '@/lib/mock-data';
import { SURAH_NAMES } from '@/lib/surahs';
import { Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, Video } from 'lucide-react';

function extractYouTubeId(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{6,})/,
    /(?:youtu\.be\/)([\w-]{6,})/,
    /(?:youtube\.com\/embed\/)([\w-]{6,})/,
    /(?:youtube\.com\/shorts\/)([\w-]{6,})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return trimmed;
}

export default function VideoManagement() {
  const [videos, setVideos] = useState<VideoExplanation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add form state
  const [url, setUrl] = useState('');
  const [surahId, setSurahId] = useState(72);
  const [ayahNumber, setAyahNumber] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [title, setTitle] = useState('');
  const [scholar, setScholar] = useState('');

  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (err) {
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/videos');
        const data = await res.json();
        if (!cancelled) setVideos(Array.isArray(data.videos) ? data.videos : []);
      } catch (err) {
        console.error('Error loading videos:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async () => {
    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      setMessage({ type: 'error', text: 'الرجاء إدخال رابط يوتيوب صحيح (watch?v= أو youtu.be).' });
      return;
    }
    if (surahId < 1 || surahId > 114 || ayahNumber < 1) {
      setMessage({ type: 'error', text: 'الرجاء إدخال رقم سورة (1-114) ورقم آية صحيح.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    const newVid: VideoExplanation = {
      id: `v_${Date.now()}`,
      surahId,
      ayahNumber,
      youtubeId,
      startTime,
      title: title.trim() || `فيديو سورة ${SURAH_NAMES[surahId - 1]}`,
      scholar: scholar.trim() || 'د. فاضل السامرائي',
    };

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVid),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `تم الحفظ محلياً بنجاح: ${data.video.title}` });
        setUrl('');
        setTitle('');
        setScholar('');
        setAyahNumber(1);
        await loadVideos();
      } else {
        setMessage({ type: 'error', text: data.error || 'تعذر الحفظ.' });
      }
    } catch (err) {
      console.error('Failed to save video:', err);
      setMessage({ type: 'error', text: 'تعذر الاتصال بالخادم لحفظ الفيديو.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    try {
      await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const inputCls = "w-full bg-white border border-natural-300 rounded-xl px-3 py-2 text-sm text-natural-900 focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-natural-900">إدارة التفسير المرئي</h1>
          <p className="text-natural-600 text-sm">ربط مقاطع يوتيوب التحليلية بآيات محددة وحفظها محلياً أولاً ثم بالمزامنة السحابية.</p>
        </div>
      </div>

      {/* Add Video Form */}
      <div className="bg-white border border-natural-300 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-natural-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-600" />
          إضافة فيديو جديد
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="text-xs font-bold text-natural-600 mb-1 block">رابط يوتيوب *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputCls}
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-natural-600 mb-1 block">رقم السورة (1-114) *</label>
            <select value={surahId} onChange={(e) => setSurahId(Number(e.target.value))} className={inputCls}>
              {Array.from({ length: 114 }, (_, i) => i + 1).map((id) => (
                <option key={id} value={id}>{id}. سورة {SURAH_NAMES[id - 1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-natural-600 mb-1 block">رقم الآية *</label>
            <input
              type="number"
              min={1}
              value={ayahNumber}
              onChange={(e) => setAyahNumber(Math.max(1, Number(e.target.value)))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-natural-600 mb-1 block">وقت البداية (ثانية)</label>
            <input
              type="number"
              min={0}
              value={startTime}
              onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-natural-600 mb-1 block">عنوان الفيديو</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان يظهر عند الآية (اختياري)"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-natural-600 mb-1 block">الشيخ/المفسر</label>
            <input
              type="text"
              value={scholar}
              onChange={(e) => setScholar(e.target.value)}
              placeholder="د. فاضل السامرائي"
              className={inputCls}
            />
          </div>
        </div>

        {message && (
          <div className={`mt-4 flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={saving || !url.trim()}
          className="mt-4 flex items-center gap-2 bg-natural-800 hover:bg-natural-900 text-white px-6 py-3 rounded-xl font-medium transition shadow-sm text-sm cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{saving ? 'جاري الحفظ...' : 'حفظ الفيديو محلياً ومزامنته'}</span>
        </button>
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="p-16 flex justify-center items-center text-natural-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span>جاري تحميل الفيديوهات...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {videos.map(video => (
            <div key={video.id} className="bg-white border border-natural-300 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-sm">
              <div className="flex gap-4 items-center flex-1 min-w-0">
                <div className="w-20 h-14 bg-natural-900 rounded-xl overflow-hidden shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-natural-900 truncate">{video.title}</h3>
                  <p className="text-natural-600 text-xs mt-1">{video.scholar}</p>
                  <div className="mt-3 flex gap-2 text-[10px] font-mono text-natural-700 flex-wrap">
                    <span className="bg-natural-100 px-2 py-1 rounded">السورة: {video.surahId} ({SURAH_NAMES[video.surahId - 1]})</span>
                    <span className="bg-natural-100 px-2 py-1 rounded">الآية: {video.ayahNumber}</span>
                    <span className="bg-natural-100 px-2 py-1 rounded">البدء: {video.startTime}s</span>
                    <span className="bg-natural-100 px-2 py-1 rounded">ID: {video.youtubeId}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(video.id)}
                className="p-3 text-red-700 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-200 cursor-pointer"
                title="حذف الفيديو"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {videos.length === 0 && (
            <div className="p-12 text-center text-natural-500 border border-dashed border-natural-300 rounded-2xl bg-natural-50">
              لا توجد فيديوهات مضافة حالياً.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
