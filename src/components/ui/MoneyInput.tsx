import { useState } from 'react';
import { digitsOnly } from '@/utils/format';
import { cn } from '@/utils/cn';

interface Props {
  initialValue?: number | null;
  onChangeValue: (value: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/** Grouped numeric input; tolerates Persian digits & pasted separators. */
export function MoneyInput({ initialValue = null, onChangeValue, disabled, placeholder }: Props) {
  const format = (raw: string): string => {
    const d = digitsOnly(raw);
    return d ? Number(d).toLocaleString('en-US') : '';
  };

  const [text, setText] = useState(() => (initialValue != null ? format(String(initialValue)) : ''));

  return (
    <input
      type="text"
      dir="ltr"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      value={text}
      placeholder={placeholder ?? '0'}
      onChange={(e) => {
        const t = format(e.target.value);
        setText(t);
        const d = digitsOnly(t);
        onChangeValue(d ? Number(d) : null);
      }}
      className={cn(
        'block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-left text-sm shadow-sm outline-none transition',
        'placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60',
      )}
    />
  );
}