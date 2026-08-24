import { useEffect, useState } from 'react';
import { XIcon, ZoomInIcon, ZoomOutIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * لایت‌باکس تمام‌صفحه — کلیک: بزرگنمایی/کوچک‌نمایی.
 * در حالت زوم، پن کردن با اسکرول/درگ انجام می‌شود.
 */
export function ImageLightbox({ src, alt, onClose }: Props) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    // فاز capture تا Escape اول فقط لایت‌باکس را ببندد نه مودال زیرش را
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-slate-950/92 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* نوار ابزار */}
      <div className="flex items-center justify-between p-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
          {zoomed ? 'برای کوچک‌نمایی روی عکس کلیک کنید' : 'برای بزرگنمایی روی عکس کلیک کنید'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
            aria-label={zoomed ? 'کوچک‌نمایی' : 'بزرگنمایی'}
          >
            {zoomed ? <ZoomOutIcon className="text-xl" /> : <ZoomInIcon className="text-xl" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
            aria-label="بستن"
          >
            <XIcon className="text-xl" />
          </button>
        </div>
      </div>

      {/* تصویر */}
      <div
        className={cn('flex flex-1', zoomed ? 'overflow-auto p-4' : 'items-center justify-center overflow-hidden p-6')}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          onClick={() => setZoomed((z) => !z)}
          className={cn(
            'mx-auto block rounded-lg object-contain shadow-2xl transition-all duration-200',
            zoomed ? 'w-[300%] max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in',
          )}
          draggable={false}
        />
      </div>
    </div>
  );
}