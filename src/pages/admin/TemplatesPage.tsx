import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader } from '@/components/ui/Spinner';
import { Toggle } from '@/components/ui/Toggle';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import {
  getDraftSettings,
  removeWelcomeImageFile,
  updateDraftSettings,
  uploadWelcomeImage,
} from '@/services/settings';
import { cn } from '@/utils/cn';
import type { SettingsDraft } from '@/types';

const TEMPLATES = [
  {
    value: 'classic' as const,
    title: 'کلاسیک',
    desc: 'جدول حرفه‌ای با ردیف‌های یک‌درمیان — تمیز و رسمی',
    bg: 'linear-gradient(180deg,rgba(51,65,85,.15),#f1f5f9)',
    chip: 'bg-slate-700',
  },
  {
    value: 'liquid-glass' as const,
    title: 'لیکوید گلس',
    desc: 'شیشه‌ای مدرن با بلور و گرادیان‌های رنگی — چشم‌نواز و لاکچری',
    bg: 'radial-gradient(120px 60px at 80% 0%,rgba(99,102,241,.5),transparent),radial-gradient(100px 60px at 10% 100%,rgba(236,72,153,.4),transparent),linear-gradient(180deg,#eef2ff,#f8fafc)',
    chip: 'bg-white/60 backdrop-blur border border-white',
  },
];

export function TemplatesPage() {
  const toast = useToast();
  const [s, setS] = useState<SettingsDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);

  useEffect(() => {
    getDraftSettings()
      .then(setS)
      .catch((e) => {
        console.error(e);
        toast.error(GENERIC_ERROR);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!s) return <FullPageLoader label="در حال دریافت تنظیمات…" />;

  const set = <K extends keyof SettingsDraft>(k: K, v: SettingsDraft[K]) =>
    setS((prev) => (prev ? { ...prev, [k]: v } : prev));

  const save = async () => {
    setSaving(true);
    try {
      let patch: Partial<SettingsDraft> = {
        template: s.template,
        welcomeEnabled: s.welcomeEnabled,
        welcomeDuration: s.welcomeDuration,
      };

      if (s.welcomeEnabled && !s.welcomeImageUrl && !imageFile) {
        toast.error('برای فعال کردن خوش‌آمدگویی، ابتدا یک تصویر انتخاب کنید.');
        setSaving(false);
        return;
      }

      if (imageFile) {
        const up = await uploadWelcomeImage(imageFile);
        patch = { ...patch, welcomeImageUrl: up.url, welcomeImagePath: up.path };
      } else if (clearImage) {
        patch = { ...patch, welcomeImageUrl: null, welcomeImagePath: null };
      }

      if (clearImage && s.welcomeImagePath) void removeWelcomeImageFile(s.welcomeImagePath);

      await updateDraftSettings(patch);
      setS((prev) => (prev ? { ...prev, ...patch } as SettingsDraft : prev));
      setImageFile(null);
      setClearImage(false);
      toast.success('تغییرات با موفقیت ذخیره شد. برای اعمال، «انتشار تغییرات» را بزنید.');
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="قالب و خوش‌آمدگویی"
        subtitle="قالب صفحه عمومی و صفحه خوش‌آمدگویی — پس از انتشار برای مشتریان اعمال می‌شود."
        actions={
          <Button onClick={() => void save()} loading={saving}>
            ذخیره تغییرات
          </Button>
        }
      />

      {/* ---------- انتخاب قالب ---------- */}
      <SectionTitle>قالب لیست قیمت</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => set('template', t.value)}
            className={cn(
              'overflow-hidden rounded-2xl border-2 text-start shadow-sm transition',
              s.template === t.value ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <div className="h-28 w-full" style={{ background: t.bg }}>
              <div className="mx-4 mt-4 rounded-lg bg-white/70 p-2 shadow">
                <div className={cn('mb-1.5 h-2 w-16 rounded-full', t.chip)} />
                <div className="mb-1 h-1.5 w-full rounded-full bg-slate-300/70" />
                <div className="mb-1 h-1.5 w-5/6 rounded-full bg-slate-300/50" />
                <div className="h-1.5 w-4/6 rounded-full bg-slate-300/40" />
              </div>
            </div>
            <div className="bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                {t.title}
                {s.template === t.value && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">فعال</span>
                )}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ---------- خوش‌آمدگویی ---------- */}
      <div className="mt-8">
        <SectionTitle>صفحه خوش‌آمدگویی</SectionTitle>
        <Card className="space-y-5">
          <Toggle
            checked={s.welcomeEnabled}
            onChange={(v) => set('welcomeEnabled', v)}
            label="نمایش صفحه خوش‌آمدگویی هنگام ورود مشتری"
          />

          <ImagePicker
            label="تصویر خوش‌آمدگویی"
            currentUrl={clearImage && !imageFile ? null : imageFile ? URL.createObjectURL(imageFile) : s.welcomeImageUrl}
            disabled={saving}
            helpText="بهترین حالت: تصویر مربعی یا عمودی با کیفیت بالا — JPG/PNG/WEBP تا ۵ مگابایت"
            onFileChange={(f) => {
              setImageFile(f);
              setClearImage(false);
              if (!f && s.welcomeImageUrl) setClearImage(true);
            }}
          />

          <label className="block max-w-xs">
            <span className="mb-1 flex items-center justify-between text-sm text-slate-700">
              مدت نمایش
              <span className="tabular-nums text-xs text-slate-400">{s.welcomeDuration} ثانیه</span>
            </span>
            <input
              type="range"
              min={2}
              max={15}
              value={s.welcomeDuration}
              onChange={(e) => set('welcomeDuration', Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </label>

          <p className="text-xs text-slate-500">
            مشتری می‌تواند با کلیک روی صفحه، زودتر رد شود. تصویر و تنظیمات پس از «انتشار» برای مشتریان فعال می‌شود.
          </p>
        </Card>
      </div>
    </div>
  );
}