'use client';

import { useState } from 'react';
import { Bot, Youtube, Plus, Loader2, CheckCircle2 } from 'lucide-react';

interface ProcessedResult {
  url: string;
  surahId: number;
  ayahNumber: number;
  title: string;
  scholar: string;
  status: 'success' | 'error';
}

export default function AIProcessingPage() {
  const [urls, setUrls] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedResult[]>([]);

  const handleProcess = async () => {
    const urlArray = urls.split('\n').filter(url => url.trim().length > 0);
    if (urlArray.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    try {
      // Send to server-side Gemini API route
      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlArray })
      });

      if (!response.ok) throw new Error("فشل في معالجة الفيديوهات");

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء المعالجة.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-natural-900 text-white rounded-xl shadow-lg">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-sans text-natural-900">أتمتة الفيديوهات بالذكاء الاصطناعي</h1>
          <p className="text-sm text-natural-600 font-sans">قم بإدراج روابط يوتيوب وسنقوم باستخراج النصوص (Transcript) ومطابقتها مع السور والآيات.</p>
        </div>
      </div>

      <div className="bg-white border border-natural-300 rounded-2xl p-6 shadow-sm">
        <label className="block text-sm font-bold text-natural-700 mb-2 font-sans">
          روابط يوتيوب (كل رابط في سطر جديد)
        </label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=..."
          className="w-full text-left bg-natural-50 border border-natural-300 rounded-xl p-4 min-h-[150px] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-natural-500 transition-shadow"
          dir="ltr"
        />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleProcess}
            disabled={isProcessing || urls.trim().length === 0}
            className="bg-natural-900 hover:bg-natural-800 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold font-sans transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري تحليل التفريغ الصوتي...</span>
              </>
            ) : (
              <>
                <Youtube className="w-5 h-5" />
                <span>بدء المعالجة الذكية</span>
              </>
            )}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-sans text-natural-900">نتائج التحليل</h2>
          <div className="bg-white border border-natural-300 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-natural-100 border-b border-natural-300 font-sans text-[11px] uppercase tracking-widest text-natural-600">
                  <th className="p-4">الفيديو</th>
                  <th className="p-4">العنوان المستخرج</th>
                  <th className="p-4">المُفسر</th>
                  <th className="p-4">السورة المعينة</th>
                  <th className="p-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-200">
                {results.map((result, idx) => (
                  <tr key={idx} className="hover:bg-natural-50 transition">
                    <td className="p-4 font-mono text-xs text-natural-500 truncate max-w-[150px]" dir="ltr">
                      {result.url}
                    </td>
                    <td className="p-4 font-bold text-natural-800 text-sm">
                      {result.title}
                    </td>
                    <td className="p-4 text-natural-600 text-sm">
                      {result.scholar}
                    </td>
                    <td className="p-4">
                      {result.status === 'success' ? (
                        <div className="inline-flex gap-2 text-xs font-bold text-natural-700 bg-natural-100 px-3 py-1 rounded-lg border border-natural-300">
                          <span>سورة: {result.surahId}</span>
                          <span className="opacity-50">|</span>
                          <span>آية: {result.ayahNumber}</span>
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs text-center border border-red-200 bg-red-50 px-2 py-1 rounded">فشل التصنيف</span>
                      )}
                    </td>
                    <td className="p-4">
                      {result.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <span className="text-xs text-red-500">خطأ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
