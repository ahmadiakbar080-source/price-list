import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">{children}</h2>;
}