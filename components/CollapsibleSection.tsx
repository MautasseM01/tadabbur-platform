'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Generic foldable container for long page sections.
 * The header row is always visible; the body toggles on click.
 */
export default function CollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = true,
  className = '',
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 text-right cursor-pointer group"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-bold">{title}</span>
          {badge}
          {subtitle && <span className="text-xs opacity-70 font-normal">{subtitle}</span>}
        </span>
        <span className="shrink-0 flex items-center gap-1 text-xs font-semibold opacity-70 group-hover:opacity-100 transition">
          {open ? 'طيّ' : 'عرض'}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}