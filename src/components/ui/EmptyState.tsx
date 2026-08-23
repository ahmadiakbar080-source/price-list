import type { ReactNode } from 'react';
import { InboxIcon } from '@/components/icons';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <InboxIcon className="text-2xl" />
      </span>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}