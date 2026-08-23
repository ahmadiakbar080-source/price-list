import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader } from '@/components/ui/Spinner';
import { Toggle } from '@/components/ui/Toggle';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { useToast } from '@/hooks/useToast';
import {
  BUILTIN_FONTS,
  CUSTOM_FONT_FAMILY,
  DEFAULT_SETTINGS,
  FONT_ACCEPT,
  GENERIC_ERROR,
  TABLE_STYLES,
} from '@/lib/constants';
import {
  getDraftSettings,
  removeFontFile,
  removeLogoFile,
  toPublicSettings,
  updateDraftSettings,
  uploadCustomFont,
  uploadLogo,
} from '@/services/settings';
import type { SettingsDraft } from '@/types';
import { ensureBuiltinWebfont } from '@/utils/assets';
import { formatPrice } from '@/utils/format';
import { cn } from '@/utils/cn';

function Range({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm text-slate-700">
        {label}
        <span className="tabular-nums text-xs text-slate-400">
          {value} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-700">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        />
        <input
          type="text"
          dir="ltr"
          value={value}
          onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-300 px-2 text-left text-xs tabular-nums outline-none focus:border-indigo-500"
        />
      </span>
    </label>
  );
}

export function AppearancePage() {
  const toast = useToast();
  const [s, setS] = useState<SettingsDraft | null>(null);
  const [saving, setSaving] = useState(false);

  // staged uploads (persisted only on Save)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [fontFile, setFontFile] = useState<File | null>(null);

  useEffect(() => {
    getDraftSettings()
      .then(setS)
      .catch((e) => {
        console.error(e);
        toast.error(GENERIC_ERROR);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (s) ensureBuiltinWebfont(s.fontFamily);
  }, [s?.fontFamily]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return <FullPageLoader label="در حال دریافت تنظیمات ظاهری…" />;

  const set = <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) =>
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  const previewStyle = {
    background: s.backgroundColor,
    color: s.textColor,
    fontFamily: s.fontFamily === 'custom' ? undefined : `'${s.fontFamily}'`,
    borderRadius: `${s.borderRadius}px`,
    fontSize: `${s.baseFontSize}px`,
  } as const;

  const save = async () => {
    if (s.fontFamily === 'custom' && !fontFile && !s.customFontUrl) {
      toast.error('برای فونت سفارشی، ابتدا یک فایل فونت (WOFF/WOFF2/TTF) انتخاب کنید.');
      return;
    }
    setSaving(true);
    const previousFontPath = s.customFontPath;
    try {
      let patch = { ...s };

      if (logoFile) {
        const up = await uploadLogo(logoFile);
        toast.success('لوگو با موفقیت آپلود شد.');
        patch = { ...patch, logoUrl: up.url, logoPath: up.path };
      }
      if (clearLogo && !logoFile) {
        patch = { ...patch, logoUrl: null, logoPath: null };
      }
      if (fontFile) {
        const up = await uploadCustomFont(fontFile);
        toast.success('فونت سفارشی با موفقیت آپلود شد.');
        patch = {
          ...patch,
          fontFamily: 'custom',
          customFontUrl: up.url,
          customFontPath: up.path,
          customFontName: up.name,
        };
      }

      const restOfDraft = { ...s };// eslint-disable-line @typescript-eslint/no-unused-vars
      const { fontFamily: _ff, ...restWithoutFont } = restOfDraft; // eslint-disable-line @typescript-eslint/no-unused-vars

      // Send everything except staged-file placeholders:
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        logoUrl: _lu, logoPath: _lp, customFontUrl: _cu, customFontPath: _cp, customFontName: _cn, ...plain
      } = restWithoutFont;

      const finalPatch = {
        ...plain,
        fontFamily: patch.fontFamily,
        logoUrl: patch.logoUrl,
        logoPath: patch.logoPath,
        ...(patch.customFontUrl !== undefined ? { customFontUrl: patch.customFontUrl } : {}),
        customFontPath: patch.customFontPath,
        customFontName: patch.customFontName,
      };

      await updateDraftSettings(finalPatch);

      // best-effort cleanup of replaced files
      if (clearLogo && s.logoPath) void removeLogoFile(s.logoPath);
      if (fontFile && previousFontPath) void removeFontFile(previousFontPath);

      setS(patch);
      setLogoFile(null);
      setClearLogo(false);
      setFontFile(null);
      toast.success('تغییرات با موفقیت ذخیره شد.');
    } catch (e) {
      console.error('[appearance] save:', e);
      toast.error(e instanceof Error ? e.message : GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="ظاهر و فونت"
        subtitle="این تنظیمات روی پیش‌نویس اعمال می‌شود و پس از «انتشار» برای مشتریان نمایان خواهد شد."
        actions={
          <Button onClick={() => void save()} loading={saving}>
            ذخیره تغییرات
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------------- Font ---------------- */}
        <Card>
          <SectionTitle>فونت فارسی</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BUILTIN_FONTS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => set('fontFamily', f.value)}
                style={{ fontFamily: `'${f.value}', sans-serif` }}
                className={cn(
                  'rounded-xl border-2 p-3 text-center transition',
                  s.fontFamily === f.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <span className="block text-lg font-bold">اب</span>
                <span className="mt-1 block text-[11px] text-slate-500">{f.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => set('fontFamily', 'custom')}
              className={cn(
                'rounded-xl border-2 p-3 text-center transition',
                s.fontFamily === 'custom'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <span className="block text-lg font-bold">⌨</span>
              <span className="mt-1 block text-[11px] text-slate-500">سفارشی</span>
            </button>
          </div>

          {s.fontFamily === 'custom' && (
            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
              <label className="block text-xs text-slate-600">
                فایل فونت (WOFF، WOFF2، TTF — حداکثر ۲ مگابایت):
              </label>
              <input
                type="file"
                accept={FONT_ACCEPT}
                onChange={(e) => setFontFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {!fontFile && s.customFontName && (
                <p className="text-[11px] text-emerald-600">فونت فعلی: {s.customFontName}</p>
              )}
              {fontFile && (
                <p className="text-[11px] text-amber-600">
                  «{fontFile.name}» انتخاب شد — برای اعمال، ذخیره کنید.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* ---------------- Colors ---------------- */}
        <Card>
          <SectionTitle>رنگ‌ها</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField label="رنگ اصلی (قیمت)" value={s.primaryColor} onChange={(v) => set('primaryColor', v)} />
            <ColorField label="رنگ پس‌زمینه" value={s.backgroundColor} onChange={(v) => set('backgroundColor', v)} />
            <ColorField label="رنگ متن" value={s.textColor} onChange={(v) => set('textColor', v)} />
          </div>
        </Card>

        {/* ---------------- Layout ---------------- */}
        <Card>
          <SectionTitle>چیدمان جدول</SectionTitle>
          <label className="mb-4 block">
            <span className="mb-1 block text-sm text-slate-700">سبک جدول</span>
            <select
              value={s.tableStyle}
              onChange={(e) => set('tableStyle', e.target.value as SettingsDraft['tableStyle'])}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            >
              {TABLE_STYLES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Range label="اندازه تصویر" value={s.imageSize} min={32} max={128} unit="px" onChange={(v) => set('imageSize', v)} />
            <Range label="گردی گوشه‌ها" value={s.borderRadius} min={0} max={28} unit="px" onChange={(v) => set('borderRadius', v)} />
            <Range label="فاصله ردیف‌ها" value={s.rowSpacing} min={4} max={24} unit="px" onChange={(v) => set('rowSpacing', v)} />
            <Range label="اندازه متن" value={s.baseFontSize} min={14} max={20} unit="px" onChange={(v) => set('baseFontSize', v)} />
          </div>
        </Card>

        {/* ---------------- Logo & visibility ---------------- */}
        <Card>
          <SectionTitle>لوگو</SectionTitle>
          <ImagePicker
            label="تصویر لوگو"
            currentUrl={clearLogo && !logoFile ? null : logoFile ? URL.createObjectURL(logoFile) : s.logoUrl}
            disabled={saving}
            helpText="PNG/JPG/WEBP — بهترین حالت: مربعی و شفاف"
            onFileChange={(f) => {
              setLogoFile(f);
              setClearLogo(false);
              if (!f && s.logoUrl) setClearLogo(true);
            }}
          />
          <div className="mt-4 space-y-3">
            <Toggle checked={s.showLogo} onChange={(v) => set('showLogo', v)} label="نمایش لوگو در صفحه عمومی" />
            <Toggle
              checked={s.showUpdateDate}
              onChange={(v) => set('showUpdateDate', v)}
              label="نمایش تاریخ آخرین به‌روزرسانی"
            />
          </div>
        </Card>

        {/* ---------------- Mini live preview ---------------- */}
        <Card className="lg:col-span-2">
          <SectionTitle>پیش‌نمایش سریع (یک ردیف)</SectionTitle>
          <div style={previewStyle} className="rounded-2xl p-4">
            <div
              className="flex items-center gap-3 p-3"
              style={{
                background: 'rgba(255,255,255,.82)',
                borderRadius: `${Math.round(s.borderRadius * 0.6)}px`,
                border: s.tableStyle === 'bordered' ? '1px solid rgba(100,116,139,.2)' : undefined,
              }}
            >
              <span
                style={{ width: s.imageSize, height: s.imageSize }}
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300"
              >
                تصویر
              </span>
              <span className="flex-1 font-bold">محصول نمونه</span>
              <span className="font-black tabular-nums" style={{ color: s.primaryColor }}>
                {formatPrice(1250000, s.currency || 'تومان')}
              </span>
            </div>
            {s.fontFamily === 'custom' && s.customFontUrl && !fontFile && (
              <p className="mt-2 text-[11px] opacity-70">
                فونت فعال: {CUSTOM_FONT_FAMILY} ({s.customFontName}) — در پیش‌نمایش کامل قابل مشاهده است.
              </p>
            )}
          </div>
        </Card>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        توجه: برای اینکه مشتریان این ظاهر را ببینند، باید از صفحه «انتشار»، تغییرات را منتشر کنید.
      </p>
    </div>
  );
}