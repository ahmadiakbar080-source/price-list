import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EyeIcon, LockIcon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/lib/constants';

export function LoginPage() {
  const { user, initializing, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initializing && user) navigate('/admin', { replace: true });
  }, [initializing, user, navigate]);

  if (!initializing && user) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4"
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <LockIcon className="text-2xl" />
            </span>
            <h1 className="text-lg font-extrabold text-slate-900">ورود مدیر</h1>
            <p className="mt-1 text-xs text-slate-500">{APP_NAME}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Input
              label="ایمیل"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="admin@example.com"
            />

            <div className="relative">
              <Input
                label="رمز عبور"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                className="absolute bottom-2.5 end-3 text-xs text-slate-400 hover:text-slate-600"
              >
                <EyeIcon className="text-base" />
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              ورود به پنل مدیریت
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          دسترسی فقط برای مدیر مجاز است — امنیت توسط Supabase Auth و RLS تضمین می‌شود.
        </p>
      </div>
    </div>
  );
}