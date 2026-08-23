import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  hasError: boolean;
}

/** Last-resort boundary: shows a friendly Persian message, logs details. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-lg font-bold text-slate-800">مشکلی پیش آمد</h1>
        <p className="max-w-md text-sm leading-6 text-slate-500">
          در بارگذاری برنامه خطایی رخ داد. لطفاً صفحه را دوباره بارگذاری کنید. اگر مشکل ادامه داشت،
          از تنظیم شدن متغیرهای محیطی (.env) مطمئن شوید.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          بارگذاری مجدد
        </button>
      </div>
    );
  }
}