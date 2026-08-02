'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { AIProviderOption } from '@/lib/ai';
import { getSelectedAIModel, setSelectedAIModel } from '@/lib/aiClient';

interface ModelSelectorProps {
  theme?: 'light' | 'sepia' | 'dark';
}

export default function ModelSelector({ theme = 'light' }: ModelSelectorProps) {
  const [providers, setProviders] = useState<AIProviderOption[] | null>(null);
  const [selection, setSelection] = useState(getSelectedAIModel());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai/providers')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!providers) return;
    for (const p of providers) {
      for (const m of p.models) {
        if (`${p.id}::${m.id}` === value) {
          const next = { provider: p.id, model: m.id };
          setSelection(next);
          setSelectedAIModel(next.provider, next.model);
          return;
        }
      }
    }
  };

  const themeClasses = (() => {
    switch (theme) {
      case 'dark':
        return {
          wrapper: 'bg-[#1e1e26] border-[#323240] text-[#f4f4f5]',
          icon: 'text-amber-400',
          select: 'bg-transparent text-[#e4e4e7]',
          label: 'text-[#a1a1aa]',
        };
      case 'sepia':
        return {
          wrapper: 'bg-[#ebdcc4] border-[#d8c5a8] text-[#2d2013]',
          icon: 'text-amber-900',
          select: 'bg-transparent text-[#3e2e1e]',
          label: 'text-[#785e40]',
        };
      default:
        return {
          wrapper: 'bg-natural-100 border-natural-200 text-natural-900',
          icon: 'text-amber-700',
          select: 'bg-transparent text-natural-800',
          label: 'text-natural-500',
        };
    }
  })();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-xs transition-all ${themeClasses.wrapper}`}
      title="اختر مزود الذكاء الاصطناعي للتحليل البياني (مجاني: محلي، Groq، OpenRouter)"
    >
      <BrainCircuit className={`w-4 h-4 shrink-0 ${themeClasses.icon}`} />
      <div className="flex flex-col leading-tight min-w-0">
        <span className={`text-[10px] font-bold ${themeClasses.label}`}>نموذج الذكاء الاصطناعي</span>
        {providers === null ? (
          <span className={`text-xs flex items-center gap-1 ${themeClasses.select}`}>
            <Loader2 className="w-3 h-3 animate-spin" /> جارٍ التحميل...
          </span>
        ) : (
          <select
            value={`${selection.provider}::${selection.model}`}
            onChange={handleChange}
            className={`text-xs font-semibold outline-none cursor-pointer max-w-[220px] ${themeClasses.select}`}
            aria-label="اختر نموذج الذكاء الاصطناعي"
          >
            {providers.map((p) => (
              <optgroup key={p.id} label={p.label}>
                {p.models.map((m) => (
                  <option key={`${p.id}::${m.id}`} value={`${p.id}::${m.id}`}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
