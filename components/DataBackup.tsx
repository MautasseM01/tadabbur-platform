'use client';

import { useRef, useState } from 'react';
import { Download, Upload, CheckCircle2, AlertTriangle, Loader2, Database } from 'lucide-react';

const KEY_PREFIXES = [
  'tadabbur_',
  'surah_notes_',
  'surah_time_total_',
  'surah_reading_theme',
  'surah_autoplay_next',
];

export function collectTadabburData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (KEY_PREFIXES.some((p) => key.startsWith(p))) {
      try {
        data[key] = localStorage.getItem(key) || '';
      } catch {
        // ignore
      }
    }
  }
  return data;
}

export default function DataBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    try {
      const data = collectTadabburData();
      const payload = {
        exportedAt: new Date().toISOString(),
        app: 'tadabbur-platform',
        data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tadabbur-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', text: `تم تصدير نسخة احتياطية (${Object.keys(data).length} مفتاح بيانات).` });
    } catch (err) {
      console.error('Export failed:', err);
      setStatus({ type: 'error', text: 'تعذر تصدير النسخة الاحتياطية.' });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      let count = 0;
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
          count++;
        }
      }
      setStatus({ type: 'success', text: `تم استيراد ${count} عنصر بنجاح. جارٍ إعادة تحميل الصفحة...` });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.error('Import failed:', err);
      setStatus({ type: 'error', text: 'ملف النسخة الاحتياطية غير صالح.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-natural-200 rounded-2xl p-5 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-natural-900 font-sans">النسخ الاحتياطي المحلي</h4>
          <p className="text-xs text-natural-600 font-sans mt-0.5">
            صدّر كل ملاحظاتك وجلساتك وإحصائياتك كملف، واستوردها لاحقاً أو على جهاز آخر.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-natural-900 hover:bg-natural-800 text-white px-4 py-2.5 rounded-xl font-sans font-semibold text-xs transition shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>تصدير نسخة احتياطية</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 bg-natural-100 hover:bg-natural-200 text-natural-800 border border-natural-300 px-4 py-2.5 rounded-xl font-sans font-semibold text-xs transition shadow-sm cursor-pointer disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{busy ? 'جاري الاستيراد...' : 'استيراد نسخة محفوظة'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {status && (
        <div className={`mt-3 flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl border ${
          status.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-red-50 text-red-800 border-red-300'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{status.text}</span>
        </div>
      )}
    </div>
  );
}
