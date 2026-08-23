import { useState } from 'react';
import { cn } from '@/utils/cn';
import { digitsOnly } from '@/utils/format';

interface Props {
  value: string;
  display?: string;
  numeric?: boolean;
  ariaLabel: string;
  className?: string;
  onCommit: (next: string) => Promise<void>;
}

/** Click-to-edit field: Enter/blur saves, Esc cancels (§18). */
export function InlineEdit({ value, display, numeric = false, ariaLabel, className, onCommit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = async () => {
    setEditing(false);
    const next = numeric ? String(Number(digitsOnly(draft) || 0)) : draft.trim();
    if (next === value) return;
    await onCommit(next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        aria-label={ariaLabel}
        value={draft}
        inputMode={numeric ? 'numeric' : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        dir={numeric ? 'ltr' : undefined}
        className={cn(
          'h-8 w-full min-w-0 rounded-md border border-indigo-400 bg-white px-2 text-sm outline-none ring-2 ring-indigo-100',
          numeric && 'text-left tabular-nums',
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title="برای ویرایش کلیک کنید"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        '-mx-1.5 truncate rounded-md px-1.5 py-0.5 text-start transition hover:bg-indigo-50 hover:text-indigo-700',
        className,
      )}
    >
      {display ?? value}
    </button>
  );
}