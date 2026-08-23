import { useCallback, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FullPageLoader } from '@/components/ui/Spinner';
import {
  BoxIcon,
  ChartIcon,
  EyeIcon,
  GearIcon,
  LogoutIcon,
  MenuIcon,
  PaletteIcon,
  RocketIcon,
  XIcon,
} from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { APP_NAME, GENERIC_ERROR } from '@/lib/constants';
import { getDashboardStats } from '@/services/publication';
import type { DashboardStats } from '@/types';
import { cn } from '@/utils/cn';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { AppearancePage } from '@/pages/admin/AppearancePage';
import { GeneralSettingsPage } from '@/pages/admin/GeneralSettingsPage';
import { PreviewPage } from '@/pages/admin/PreviewPage';
import { PublishPage } from '@/pages/admin/PublishPage';

const NAV = [
  { to: '/admin', label: 'داشبورد', icon: ChartIcon, end: true },
  { to: '/admin/products', label: 'محصولات', icon: BoxIcon, end: false },
  { to: '/admin/appearance', label: 'ظاهر و فونت', icon: PaletteIcon, end: false },
  { to: '/admin/settings', label: 'تنظیمات عمومی', icon: GearIcon, end: false },
  { to: '/admin/preview', label: 'پیش‌نمایش', icon: EyeIcon, end: false },
  { to: '/admin/publish', label: 'انتشار', icon: RocketIcon, end: false, pendingDot: true },
] as const;

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getDashboardStats());
    } catch (e) {
      console.error('[admin-layout] stats:', e);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // Reload stats when returning to /admin from anywhere in the panel.
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.info('خارج شدید.');
    } catch {
      /* noop */
    }
    navigate('/admin/login', { replace: true });
  };

  const pendingChanges = stats?.hasUnpublishedChanges ?? false;

  const navList = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV.map(({ to, label, icon: Icon, end, ...rest }) => (
        <NavLink
          key={to}
          to={to}
          end={'end' in rest ? (rest.end as boolean) : end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
            )
          }
        >
          <Icon className="text-lg shrink-0" />
          <span className="flex-1">{label}</span>
          {'pendingDot' in rest && (rest as { pendingDot?: boolean }).pendingDot && pendingChanges && (
            <span className="size-2 rounded-full bg-amber-400" aria-label="تغییرات منتشرنشده" />
          )}
        </NavLink>
      ))}
    </nav>
  );

  const brandAndUser = (
    <>
      <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <ChartIcon className="text-lg" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{APP_NAME}</p>
          <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
        </div>
      </div>
      {pendingChanges && (
        <div className="mx-3 mt-3">
          <Badge tone="amber">تغییرات منتشرنشده دارید</Badge>
        </div>
      )}
    </>
  );

  const logoutBtn = (
    <div className="border-t border-slate-800 p-3">
      <Button variant="ghost" className="w-full justify-start !text-slate-300 hover:!bg-slate-800 hover:!text-white" onClick={() => void handleLogout()}>
        <LogoutIcon className="text-lg" />
        خروج از حساب
      </Button>
    </div>
  );

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar (right side in RTL) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-900 lg:flex">
        {brandAndUser}
        {navList}
        {logoutBtn}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col bg-slate-900 shadow-2xl">
            <button
              className="absolute left-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={() => setDrawerOpen(false)}
              aria-label="بستن منو"
            >
              <XIcon className="text-xl" />
            </button>
            {brandAndUser}
            {navList}
            {logoutBtn}
          </aside>
        </div>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="باز کردن منو"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <MenuIcon className="text-xl" />
            </button>
            <span className="text-sm font-bold text-slate-800">{APP_NAME}</span>
          </div>
          {pendingChanges ? <Badge tone="amber">منتشرنشده</Badge> : <Badge tone="green">به‌روز</Badge>}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="appearance" element={<AppearancePage />} />
            <Route path="settings" element={<GeneralSettingsPage />} />
            <Route path="preview" element={<PreviewPage />} />
            <Route path="publish" element={<PublishPage onChanged={() => void loadStats()} />} />
            <Route path="*" element={<FullPageLoader />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}