import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader } from '@/components/ui/Spinner';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/hooks/useToast';
import { CURRENCY_PRESETS, GENERIC_ERROR } from '@/lib/constants';
import { getDraftSettings, updateDraftSettings } from '@/services/settings';
import type { SettingsDraft } from '@/types';

export function GeneralSettingsPage() {
  const toast = useToast();
  const [s, setS] = useState<SettingsDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [customCurrency, setCustomCurrency] = useState('');

  useEffect(() => {
    getDraftSettings()
      .then((d) => {
        setS(d);
        if (!CURRENCY_PRESETS.includes(d.currency as (typeof CURRENCY_PRESETS)[number])) {
          setCustomCurrency(d.currency); // واحد ذخیره‌شده «سفارشی» بوده است
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error(GENERIC_ERROR);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!s) return <FullPageLoader label="در حال دریافت تنظیمات…" />;

  const currencyChoice = CURRENCY_PRESETS.includes(s.currency as (typeof CURRENCY_PRESETS)[number])
    ? s.currency
    : '__custom__';

  const save = async () => {
    const finalCurrency =
      currencyChoice === '__custom__' ? customCurrency.trim() : s.currency.trim();
    if (!finalCurrency) {
      toast.error('واحد پول را انتخاب یا وارد کنید.');
      return;
    }
    setSaving(true);
    try {
      await updateDraftSettings({
        brandName: s.brandName.trim() || 'برند من',
        listTitle: s.listTitle.trim() || 'لیست قیمت محصولات',
        currency: finalCurrency,
        showUpdateDate: s.showUpdateDate,
      });
      toast.success('تغییرات با موفقیت ذخیره شد.');
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl pb-10">
      <PageHeader
        title="تنظیمات عمومی"
        subtitle="این مقادیر روی پیش‌نویس اعمال می‌شود و پس از انتشار برای مشتریان نمایان خواهد شد."
        actions={
          <Button onClick={() => void save()} loading={saving}>
            ذخیره تغییرات
          </Button>
        }
      />

      <Card className="space-y-5">
        <SectionTitle>اطلاعات برند</SectionTitle>

        <Input
          label="نام برند"
          value={s.brandName}
          maxLength={80}
          disabled={saving}
          onChange={(e) => setS({ ...s, brandName: e.target.value })}
          placeholder="مثلاً: ARIX"
        />

        <Input
          label="عنوان لیست قیمت"
          value={s.listTitle}
          maxLength={120}
          disabled={saving}
          onChange={(e) => setS({ ...s, listTitle: e.target.value })}
          placeholder="مثلاً: لیست قیمت محصولات"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">واحد پول</span>
            <select
              value={currencyChoice}
              disabled={saving}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__custom__') {
                  setCustomCurrency('');
                  setS({ ...s, currency: '' });
                } else {
                  setS({ ...s, currency: v });
                }
              }}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500"
            >
              {CURRENCY_PRESETS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__custom__">سفارشی…</option>
            </select>
          </label>

          {currencyChoice === '__custom__' && (
            <Input
              label="واحد پول سفارشی"
              value={customCurrency}
              maxLength={20}
              disabled={saving}
              onChange={(e) => {
                setCustomCurrency(e.target.value);
                setS({ ...s, currency: e.target.value });
              }}
              placeholder="مثلاً: افغانی"
            />
          )}
        </div>

        <Toggle
          checked={s.showUpdateDate}
          onChange={(v) => setS({ ...s, showUpdateDate: v })}
          label="نمایش تاریخ آخرین به‌روزرسانی در صفحه عمومی"
        />
      </Card>

      <p className="mt-4 text-xs text-slate-500">
        توجه: تا وقتی از صفحه «انتشار»، تغییرات را منتشر نکنید، مشتریان این مقادیر را نمی‌بینند.
      </p>
    </div>
  );
}