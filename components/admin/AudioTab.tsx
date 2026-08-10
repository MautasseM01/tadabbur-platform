'use client';

import { useState, useEffect, useMemo } from 'react';
import { SURAH_NAMES, orderSurahIds, SurahSort } from '@/lib/surahs';
import SurahSortSelect from '@/components/SurahSortSelect';
import CollapsibleSection from '@/components/CollapsibleSection';
import { useAdminStore } from '@/lib/adminStore';
import { CheckCircle2, AlertTriangle, Loader2, Save, Search, Music, ExternalLink, RefreshCw, FileDown } from 'lucide-react';

function extractYouTubeId(value: string): string {
  const trimmed = value.trim();
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
  return /^[\w-]{6,}$/.test(trimmed) ? trimmed : '';
}

type RowState = { dirty?: boolean; saved?: boolean; verifying?: boolean; error?: string | null };

export default function AudioTab() {
  const store = useAdminStore();
  const [entries, setEntries] = useState<Record<number, string>>({});
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'filled' | 'missing'>('all');
  const [sort, setSort] = useState<SurahSort>('mushafi');

  // Sync the local table state whenever the central store's audio map changes
  useEffect(() => {
    setEntries(store.audioIds);
    setInputs((prev) => {
      const next: Record<number, string> = {};
      for (let id = 1; id <= 114; id++) {
        next[id] = prev[id] !== undefined ? prev[id] : (store.audioIds[id] || '');
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.audioIds]);

  const dirtyIds = useMemo(
    () => Object.keys(rowState).filter((id) => rowState[Number(id)]?.dirty).map(Number),
    [rowState]
  );

  const handleChange = (surahId: number, value: string) => {
    setInputs((prev) => ({ ...prev, [surahId]: value }));
    setRowState((prev) => ({
      ...prev,
      [surahId]: { ...(prev[surahId] || {}), dirty: true, saved: false, error: null },
    }));
  };

  const verifyRow = async (surahId: number) => {
    const youtubeId = extractYouTubeId(inputs[surahId] || '');
    if (!youtubeId) {
      setRowState((prev) => ({ ...prev, [surahId]: { ...(prev[surahId] || {}), dirty: true, error: 'أدخل رابطًا أو معرّفًا أولًا' } }));
      return;
    }
    setRowState((prev) => ({ ...prev, [surahId]: { ...(prev[surahId] || {}), verifying: true, error: null } }));
    try {
      const res = await fetch('/api/surah-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifyOnly: true, youtubeId }),
      });
      const data = await res.json();
      setRowState((prev) => ({
        ...prev,
        [surahId]: {
          ...(prev[surahId] || {}),
          verifying: false,
          saved: res.ok ? true : false,
          error: res.ok ? null : (data.error || 'المعرّف غير صالح'),
        },
      }));
    } catch {
      setRowState((prev) => ({ ...prev, [surahId]: { ...(prev[surahId] || {}), verifying: false, error: 'تعذر التحقق (شبكة)' } }));
    }
  };

  const handleSave = async () => {
    if (dirtyIds.length === 0) {
      setMessage({ type: 'error', text: 'لا توجد تغييرات لحفظها.' });
      return;
    }
    const updates = dirtyIds
      .map((id) => ({ surahId: id, youtubeId: extractYouTubeId(inputs[id] || '') }))
      .filter((u) => u.youtubeId);

    if (updates.length === 0) {
      setMessage({ type: 'error', text: 'لا توجد روابط صحيحة لحفظها.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      // One call into the unified store — reflected everywhere instantly
      await store.saveAudioIds(updates);
      setMessage({ type: 'success', text: `تم حفظ ${updates.length} روابط بنجاح.` });
      setRowState({});
    } catch (err) {
      console.error('Failed to save audio ids:', err);
      setMessage({ type: 'error', text: 'تعذر حفظ الروابط.' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim();
    const list = orderSurahIds(sort);
    return list.filter((id) => {
      const name = SURAH_NAMES[id - 1];
      const value = extractYouTubeId(inputs[id] || '');
      const filled = !!value;
      if (filter === 'filled' && !filled) return false;
      if (filter === 'missing' && filled) return false;
      if (q && !name.includes(q) && !String(id).includes(q)) return false;
      return true;
    });
  }, [query, filter, inputs, sort]);

  const inputCls =
    'w-full bg-white border border-natural-300 rounded-xl px-3 py-2 text-sm text-natural-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono dir-ltr text-left';

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-natural-900 flex items-center gap-2">
            <Music className="w-7 h-7 text-amber-600" />
            روابط تلاوة السور (YouTube)
          </h1>
          <p className="text-natural-600 text-sm mt-1">
            الصق رابط يوتيوب أو المعرّف المختصر (ID) لكل سورة — يتم الحفظ في الذاكرة الموحدة ويظهر فوراً في صفحة السورة والنظرة العامة.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export-links"
            download="links.md"
            className="flex items-center gap-2 bg-white border border-natural-300 hover:bg-natural-100 text-natural-800 px-5 py-3 rounded-xl font-medium transition shadow-sm text-sm"
            title="تنزيل ملف ذاكرة الروابط (Markdown)"
          >
            <FileDown className="w-4 h-4" />
            <span>تنزيل فهرس الروابط (MD)</span>
          </a>
          <button
            onClick={handleSave}
            disabled={saving || dirtyIds.length === 0}
            className="flex items-center gap-2 bg-natural-800 hover:bg-natural-900 text-white px-6 py-3 rounded-xl font-medium transition shadow-sm text-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'جاري الحفظ...' : `حفظ التغييرات (${dirtyIds.length})`}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-natural-300 rounded-2xl p-4 shadow-sm">
        <SurahSortSelect value={sort} onChange={setSort} />
        <div className="flex items-center gap-2 flex-1 min-w-52">
          <Search className="w-4 h-4 text-natural-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم السورة أو اسمها..."
            className="w-full bg-natural-50 border border-natural-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-natural-100 rounded-xl p-1">
          {([['all', 'الكل'], ['filled', 'مكتملة'], ['missing', 'ناقصة']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === key ? 'bg-white shadow-sm text-natural-900' : 'text-natural-500 hover:text-natural-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => store.refresh()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-natural-600 hover:bg-natural-100 transition cursor-pointer"
          title="إعادة التحميل من الذاكرة الموحدة"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث
        </button>
      </div>

      {/* The Table */}
      <div className="bg-white border border-natural-300 rounded-2xl shadow-sm overflow-hidden p-4">
        <CollapsibleSection
          title={<span className="text-sm font-bold font-sans">جدول روابط التلاوة (114 سورة)</span>}
          badge={
            <span className="text-[11px] font-sans font-bold bg-natural-100 text-natural-600 px-2.5 py-1 rounded-full">
              {Object.values(entries).filter(Boolean).length} مكتملة
            </span>
          }
        >
          <div className="pt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-natural-50 border-b border-natural-200 text-natural-600 text-xs font-bold">
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3 text-right">السورة</th>
              <th className="p-3 w-[38%]">رابط يوتيوب / المعرّف</th>
              <th className="p-3 w-28 text-center">الحالة</th>
              <th className="p-3 w-20 text-center">تحقق</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((id) => {
              const value = extractYouTubeId(inputs[id] || '');
              const isSaved = entries[id] === value && !!value;
              const rs = rowState[id];
              const state = rs?.error ? 'error' : rs?.verifying ? 'verifying' : rs?.dirty ? 'dirty' : isSaved ? 'saved' : 'empty';
              return (
                <tr key={id} className="border-b border-natural-100 last:border-0 hover:bg-amber-50/30 transition-colors">
                  <td className="p-2.5 text-center font-bold text-natural-500">{id}</td>
                  <td className="p-2.5">
                    <div className="font-bold text-natural-900">سورة {SURAH_NAMES[id - 1]}</div>
                    {value && (
                      <a
                        href={`https://www.youtube.com/watch?v=${value}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-amber-700 hover:underline flex items-center gap-1 mt-0.5 font-mono dir-ltr"
                      >
                        {value} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </td>
                  <td className="p-2.5">
                    <input
                      value={inputs[id] || ''}
                      onChange={(e) => handleChange(id, e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... أو ID"
                      className={inputCls}
                    />
                    {value && (
                      <img
                        loading="lazy"
                        src={`https://img.youtube.com/vi/${value}/mqdefault.jpg`}
                        alt=""
                        className="mt-2 h-14 rounded-lg border border-natural-200 object-cover"
                      />
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    {state === 'saved' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> محفوظ
                      </span>
                    )}
                    {state === 'dirty' && (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                        <Save className="w-3 h-3" /> غير محفوظ
                      </span>
                    )}
                    {state === 'verifying' && (
                      <span className="inline-flex items-center text-[10px] font-bold text-natural-500 bg-natural-50 border border-natural-200 px-2 py-1 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" /> جارٍ الفحص...
                      </span>
                    )}
                    {state === 'error' && (
                      <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> غير صالح
                      </span>
                    )}
                    {state === 'empty' && (
                      <span className="text-[10px] font-bold text-natural-400 bg-natural-50 border border-natural-200 px-2 py-1 rounded-full">
                        ناقصة
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => verifyRow(id)}
                      disabled={!value || rs?.verifying}
                      className="p-2 rounded-lg text-amber-700 hover:bg-amber-100 border border-amber-200 bg-amber-50 transition cursor-pointer disabled:opacity-40"
                      title="التحقق من توفر الفيديو على يوتيوب"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-natural-500">
                  لا توجد سور مطابقة للبحث الحالي.
                </td>
              </tr>
            )}
          </tbody>
        </table>
          </div>
        </CollapsibleSection>
      </div>

      <div className="text-xs text-natural-500">
        <span className="font-bold text-natural-700">ملاحظة:</span> يفضل أن تكون التلاوة بصوت واحد وبدون مقدمات طويلة حتى تتطابق التزامن مع الآيات. الحفظ يتم في الذاكرة الموحدة (المتصفح) وتنعكس تغييراتك في كل اللوحة فوراً.
      </div>
    </div>
  );
}