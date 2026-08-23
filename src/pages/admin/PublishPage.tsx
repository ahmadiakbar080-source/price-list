import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader } from '@/components/ui/Spinner';
import { ClockIcon, RocketIcon } from '@/components/icons';
import { useToast } from '@/hooks/useToast';
import { GENERIC_ERROR } from '@/lib/constants';
import {
  getDashboardStats,
  listRecentPublications,
  publishChanges,
} from '@/services/publication';
import { formatJalaliDateTime, formatNumber } from '@/utils/format';
import type { DashboardStats, Publication } from '@/types';

interface Props {
  onChanged?: () => void;
}

export function PublishPage({ onChanged }: Props) {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<Publication[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [st, hist] = await Promise.all([getDashboardStats(), listRecentPublications()]);
      setStats(st);
      setHistory(hist);
    } catch (e) {
      console.error('[publish]', e);
      toast.error(GENERIC_ERROR);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Atomic publish — calls the PostgreSQL publish_changes() function. */
  const doPublish = async () => {
    setConfirmOpen(false);
    setPublishing(true);
    try {
      const res = await publishChanges();
      toast.success(
        `تغییرات با موفقیت منتشر شد. (نسخه v${res.version} — ${formatNumber(res.productCount)} محصول)`,
      );
      await load();
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error(GENERIC_ERROR);
    } finally {
      setPublishing(false);
    }
  };

  if (!stats) return <FullPageLoader label="در حال دریافت وضعیت انتشار…" />;

  const hasChanges = stats.hasUnpublishedChanges;

  return (
    <div className="pb-10">
      <PageHeader
        title="انتشار تغییرات"
        subtitle="با انتشار، اسنپ‌شات فعلی پیش‌نویس به‌صورت اتمی جایگزین نسخه عمومی می‌شود."
      />

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {hasChanges ? (
            <div className="space-y-1.5">
              <Badge tone="amber">تغییرات منتشرنشده دارید</Badge>
              <p className="text-sm leading-6 text-slate-600">
                مشتریان در حال حاضر نسخه قبلی را می‌بینند. با کلیک روی دکمه، نسخه جدید عمومی می‌شود.
              </p>
            </div>
          ) : stats.publishedVersion ? (
            <div className="space-y-1.5">
              <Badge tone="green">همه تغییرات منتشر شده است</Badge>
              <p className="text-sm text-slate-600">
                آخرین انتشار:{' '}
                {stats.lastPublishedAt ? formatJalaliDateTime(stats.lastPublishedAt) : '—'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Badge tone="slate">هنوز چیزی منتشر نشده است</Badge>
              <p className="text-sm text-slate-600">
                برای اینکه صفحه عمومی فعال شود، حداقل یک‌بار منتشر کنید.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={() => setConfirmOpen(true)}
          loading={publishing}
          disabled={!hasChanges}
          title={hasChanges ? undefined : 'تغییر جدیدی برای انتشار وجود ندارد'}
        >
          <RocketIcon /> انتشار تغییرات
        </Button>
      </Card>

      <Card className="mt-4 overflow-hidden !p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-700">تاریخچه انتشارها</h2>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            <ClockIcon className="me-1.5 inline-block" />
            هنوز هیچ نسخه‌ای منتشر نشده است.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-2.5 text-start font-medium">نسخه</th>
                <th className="px-5 py-2.5 text-start font-medium">تعداد محصولات</th>
                <th className="px-5 py-2.5 text-start font-medium">تاریخ انتشار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((pub) => (
                <tr key={pub.version} className="text-slate-700">
                  <td className="px-5 py-3 font-bold tabular-nums">v{pub.version}</td>
                  <td className="px-5 py-3 tabular-nums">{formatNumber(pub.productCount)}</td>
                  <td className="px-5 py-3">{formatJalaliDateTime(pub.publishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="انتشار تغییرات"
        message="آیا مطمئن هستید که می‌خواهید این تغییرات را منتشر کنید؟ پس از انتشار، مشتریان بلافاصله نسخه جدید را مشاهده خواهند کرد."
        confirmLabel="انتشار"
        cancelLabel="انصراف"
        loading={publishing}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void doPublish()}
      />
    </div>
  );
}