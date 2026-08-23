import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader } from '@/components/ui/Spinner';
import { BoxIcon, EyeIcon, RocketIcon } from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import { getDashboardStats } from '@/services/publication';
import { formatJalaliDateTime } from '@/utils/format';
import type { DashboardStats } from '@/types';

export function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => {
        console.error('[dashboard]', e);
        setFailed(true);
        toast.error(GENERIC_ERROR);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed)
    return (
      <Card className="text-center text-sm text-slate-600">
        خطا در دریافت آمار. اگر این اولین اجراست، مطمئن شوید فایل <code>supabase/schema.sql</code> در
        Supabase اجرا شده باشد.
      </Card>
    );
  if (!stats) return <FullPageLoader label="در حال دریافت آمار…" />;

  const items = [
    { label: 'کل محصولات', value: stats.totalProducts, tone: 'text-slate-900' },
    { label: 'فعال', value: stats.activeProducts, tone: 'text-emerald-600' },
    { label: 'غیرفعال', value: stats.inactiveProducts, tone: 'text-slate-400' },
  ];

  return (
    <div>
      <PageHeader
        title="داشبورد"
        subtitle="نمای کلی لیست قیمت و وضعیت انتشار"
        actions={
          <>
            <Link to="/admin/preview">
              <Button variant="secondary">
                <EyeIcon /> پیش‌نمایش
              </Button>
            </Link>
            <Link to="/admin/publish">
              <Button>
                <RocketIcon /> انتشار
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((it) => (
          <Card key={it.label} className="text-center">
            <p className={`text-3xl font-black tabular-nums ${it.tone}`}>{it.value}</p>
            <p className="mt-1 text-xs text-slate-500">{it.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionTitle>وضعیت انتشار</SectionTitle>
          {stats.hasUnpublishedChanges ? (
            <div className="space-y-2">
              <Badge tone="amber">تغییرات منتشرنشده دارید</Badge>
              <p className="text-sm leading-6 text-slate-600">
                مشتریان همچنان آخرین نسخه منتشرشده را می‌بینند. برای اعمال تغییرات، از صفحه انتشار اقدام کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge tone="green">همه تغییرات منتشر شده است</Badge>
              <p className="text-sm text-slate-600">صفحه عمومی مشتریان کاملاً به‌روز است.</p>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>آخرین انتشار</SectionTitle>
          {stats.lastPublishedAt ? (
            <div className="space-y-1.5 text-sm text-slate-700">
              <p>
                <span className="text-slate-500">تاریخ: </span>
                {formatJalaliDateTime(stats.lastPublishedAt)}
              </p>
              <p>
                <span className="text-slate-500">نسخه: </span>
                <span className="font-bold tabular-nums">v{stats.publishedVersion}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">هنوز هیچ نسخه‌ای منتشر نشده است.</p>
          )}
        </Card>
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BoxIcon className="text-xl" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">مدیریت محصولات</p>
            <p className="text-xs text-slate-500">افزودن، ویرایش، ترتیب‌بندی و تصاویر</p>
          </div>
        </div>
        <Link to="/admin/products">
          <Button variant="secondary">رفتن به محصولات</Button>
        </Link>
      </Card>
    </div>
  );
}