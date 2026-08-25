import { useEffect, useState } from 'react';
import type { AppSettings } from '@/types';

interface Props {
  settings: AppSettings;
}

/** اسپلش خوش‌آمدگویی: عکس دلخواه + برند؛ بعد از N ثانیه محو می‌شود. کلیک = رد کردن. */
export function WelcomeSplash({ settings }: Props) {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');

useEffect(() => {
  document.body.style.overflow = 'hidden';

  const t = window.setTimeout(
    () => setPhase('fade'),
    settings.welcomeDuration * 1000
  );

  return () => {
    window.clearTimeout(t);
    document.body.style.overflow = '';
  };
}, [settings.welcomeDuration]);

if (!settings.welcomeImageUrl) return null;

if (phase === 'gone') return null;
  return (
    <div
      onClick={() => setPhase('fade')}
      onTransitionEnd={() => phase === 'fade' && setPhase('gone')}
      role="dialog"
      aria-label="خوش آمدید"
      className={`fixed inset-0 z-[95] flex flex-col items-center justify-center gap-6 px-6 transition-opacity duration-700 ${
        phase === 'fade' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: `${settings.backgroundColor}f5` }}
    >
      <img
        src={settings.welcomeImageUrl ?? ''}
        alt="خوش آمدید"
        className="max-h-[55vh] max-w-[85vw] rounded-3xl object-contain shadow-2xl"
        draggable={false}
      />
      <div className="text-center">
        <h1 className="text-3xl font-black" style={{ color: settings.textColor }}>
          {settings.brandName}
        </h1>
        <p className="mt-1.5 text-sm opacity-70" style={{ color: settings.textColor }}>
          {settings.listTitle}
        </p>
      </div>
      <span className="text-[11px] opacity-50" style={{ color: settings.textColor }}>
        در حال ورود به لیست قیمت… (برای رد کردن، کلیک کنید)
      </span>
    </div>
  );
}