import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider } from '@/hooks/useToast';
import { FullPageLoader } from '@/components/ui/Spinner';
import { PublicPriceListPage } from '@/pages/PublicPriceListPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import PrintPage from '@/pages/admin/PrintPage';

/** Admin bundle is code-split away from the lightweight public page. */
const AdminApp = lazy(() => import('@/layouts/AdminLayout'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader label="در حال بررسی ورود…" />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public customer page — no authentication (§5) */}
      <Route path="/" element={<PublicPriceListPage />} />
      <Route path="/price-list" element={<Navigate to="/" replace />} />
<Route
  path="/admin/print"
  element={
    <RequireAuth>
      <PrintPage />
    </RequireAuth>
  }
/>
      {/* Admin */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin/*"
        element={
          <RequireAuth>
            <Suspense fallback={<FullPageLoader />}>
              <AdminApp />
            </Suspense>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}