import { CheckIcon } from '@/components/icons';
import { cn } from '@/utils/cn';
import type { TemplateId } from '@/types';

interface TemplateTokens {
  pageBg: string;
  cardBg: string;
  headBg: string;
  rowAltBg: string;
  text: string;
  muted: string;
  accent: string;
  line: string;
  radius: number;
  blur?: boolean;
}

interface TemplateMeta {
  value: TemplateId;
  label: string;
  vibe: string;
  desc: string;
  priceUsesAccent: boolean;
  tokens: TemplateTokens;
}

const TEMPLATES: TemplateMeta[] = [
  {
    value: 'classic',
    label: 'کلاسیک',
    vibe: 'Clean × Formal',
    desc: 'جدول رسمی با ردیف‌های یک‌درمیان — همان سبک همیشگی',
    priceUsesAccent: true,
    tokens: {
      pageBg: 'linear-gradient(180deg,#dbe2ec,#eef1f6)',
      cardBg: 'rgba(255,255,255,.92)',
      headBg: '#f1f5f9',
      rowAltBg: 'rgba(100,116,139,.08)',
      text: '#0f172a',
      muted: '#64748b',
      accent: '#4f46e5',
      line: 'rgba(100,116,139,.2)',
      radius: 12,
    },
  },
  {
    value: 'liquid-glass',
    label: 'لیکوید گلس',
    vibe: 'Glass × Modern',
    desc: 'شیشه‌ای مات با گرادیان‌های رنگی و حاشیه‌های نورانی',
    priceUsesAccent: true,
    tokens: {
      pageBg:
        'radial-gradient(140px 70px at 82% 0%,rgba(99,102,241,.45),transparent),radial-gradient(120px 70px at 0% 100%,rgba(236,72,153,.35),transparent),linear-gradient(180deg,#eef2ff,#f8fafc)',
      cardBg: 'rgba(255,255,255,.45)',
      headBg: 'rgba(255,255,255,.5)',
      rowAltBg: 'rgba(255,255,255,.32)',
      text: '#0f172a',
      muted: '#64748b',
      accent: '#4f46e5',
      line: 'rgba(255,255,255,.75)',
      radius: 16,
      blur: true,
    },
  },
  {
    value: 'premium-dark',
    label: 'پریمیوم دارک',
    vibe: 'Luxury × Technology × Professional',
    desc: 'ذغالی تیره، کارت‌های خاکستری تیره و آبی الکتریکی — مناسب برندهای طراحی و تکنولوژی',
    priceUsesAccent: true,
    tokens: {
      pageBg: 'linear-gradient(180deg,#0a0c11,#0d1017)',
      cardBg: '#141722',
      headBg: 'rgba(255,255,255,.04)',
      rowAltBg: 'rgba(255,255,255,.02)',
      text: '#e7e9ee',
      muted: '#9aa3b2',
      accent: '#3b82f6',
      line: 'rgba(255,255,255,.09)',
      radius: 14,
    },
  },
  {
    value: 'minimal-white',
    label: 'مینیمال وایت',
    vibe: 'Clean × Elegant × Minimal',
    desc: 'سفید خالص، خطوط بسیار ظریف و فضای خالی زیاد — رسمی و بی‌نهایت تمیز',
    priceUsesAccent: true,
    tokens: {
      pageBg: '#fcfcfb',
      cardBg: '#ffffff',
      headBg: '#fafaf8',
      rowAltBg: '#fafaf8',
      text: '#141414',
      muted: '#6b7280',
      accent: '#1e40af',
      line: '#e8e6e1',
      radius: 8,
    },
  },
  {
    value: 'neon-future',
    label: 'نئون فیوچر',
    vibe: 'Futuristic × Creative × Digital',
    desc: 'گرادیان آبی/بنفش/فیروزه‌ای روی تیره، گلس‌مورفیزم و درخشش ظریف',
    priceUsesAccent: true,
    tokens: {
      pageBg:
        'radial-gradient(150px 80px at 85% 0%,rgba(34,211,238,.35),transparent),radial-gradient(130px 80px at 0% 100%,rgba(139,92,246,.4),transparent),#05060f',
      cardBg: 'rgba(12,16,32,.6)',
      headBg: 'rgba(34,211,238,.06)',
      rowAltBg: 'rgba(255,255,255,.02)',
      text: '#dbe4f3',
      muted: '#93a6c8',
      accent: '#22d3ee',
      line: 'rgba(125,211,252,.2)',
      radius: 16,
      blur: true,
    },
  },
  {
    value: 'luxury-editorial',
    label: 'لوکس ادیتوریال',
    vibe: 'Luxury × Editorial × Sophisticated',
    desc: 'کرم مجله‌ای با مشکی و طلایی شامپاینی — تایپوگرافی بزرگ و خطوط ظریف، بدون گرادیان و گلو',
    priceUsesAccent: false,
    tokens: {
      pageBg: '#faf6ee',
      cardBg: 'transparent',
      headBg: 'transparent',
      rowAltBg: 'rgba(168,132,44,.05)',
      text: '#1c1917',
      muted: '#78716c',
      accent: '#a8842c',
      line: 'rgba(28,25,23,.16)',
      radius: 2,
    },
  },
];

/* ---------- ماکاپ کوچک هر تمپلیت (روی کارت) ---------- */
function TemplateMock({ t }: { t: TemplateMeta }) {
  const rows = [
    { name: 'دریل شارژی', price: '1,500,000' },
    { name: 'فرز آهنگری', price: '980,000' },
  ];
  const priceColor = t.priceUsesAccent ? t.tokens.accent : t.tokens.text;

  return (
    <div className="h-32 w-full overflow-hidden p-3" style={{ background: t.tokens.pageBg }}>
      <div
        className="h-full overflow-hidden shadow-lg"
        style={{
          background: t.tokens.cardBg,
          border: `1px solid ${t.tokens.line}`,
          borderRadius: t.tokens.radius,
          backdropFilter: t.tokens.blur ? 'blur(6px)' : undefined,
        }}
      >
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ background: t.tokens.headBg, borderBottom: `1px solid ${t.tokens.line}` }}
        >
          <span className="text-[9px] font-bold" style={{ color: t.tokens.muted }}>تصویر</span>
          <span className="text-[9px] font-bold" style={{ color: t.tokens.muted }}>نام محصول</span>
          <span className="text-[9px] font-bold" style={{ color: t.tokens.muted }}>قیمت مصرف‌کننده</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: i % 2 === 1 ? t.tokens.rowAltBg : 'transparent',
              borderBottom: `1px solid ${t.tokens.line}`,
            }}
          >
            <span
              className="size-6 shrink-0"
              style={{
                background: t.tokens.headBg === 'transparent' ? 'rgba(255,255,255,.6)' : t.tokens.headBg,
                border: `1px solid ${t.tokens.line}`,
                borderRadius: Math.max(2, Math.round(t.tokens.radius / 3)),
              }}
            />
            <span className="h-1.5 flex-1 rounded-full" style={{ background: t.tokens.muted, opacity: 0.35 }} />
            <span className="text-[10px] font-black tabular-nums" style={{ color: priceColor }}>
              {r.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- پیش‌نمایش زنده تمپلیت انتخاب‌شده ---------- */
function LivePreview({ t }: { t: TemplateMeta }) {
  const rows = [
    { name: 'دریل شارژی 18V', price: '1,500,000' },
    { name: 'فرز آهنگری 4"', price: '980,000' },
    { name: 'پیچ‌گوشتی برقی', price: '2,420,000' },
  ];
  const priceColor = t.priceUsesAccent ? t.tokens.accent : t.tokens.text;

  return (
    <div className="rounded-2xl p-4 sm:p-6" style={{ background: t.tokens.pageBg, color: t.tokens.text }}>
      <div className="text-center">
        <p className="text-xl font-black tracking-tight" style={{ color: t.tokens.text }}>برند شما</p>
        <p className="mt-1 text-xs" style={{ color: t.tokens.muted }}>لیست قیمت محصولات</p>
        <span
          className="mt-3 inline-block rounded-full px-3 py-1 text-[10px]"
          style={{
            color: t.tokens.accent,
            border: `1px solid ${t.tokens.line}`,
            background: t.tokens.headBg === 'transparent' ? 'transparent' : t.tokens.headBg,
          }}
        >
          آخرین به‌روزرسانی: امروز
        </span>
      </div>

      <div
        className="mt-4 overflow-hidden"
        style={{
          background: t.tokens.cardBg,
          border: `1px solid ${t.tokens.line}`,
          borderRadius: t.tokens.radius,
          backdropFilter: t.tokens.blur ? 'blur(10px)' : undefined,
          boxShadow: '0 18px 45px -28px rgba(0,0,0,.45)',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: t.tokens.headBg, borderBottom: `1px solid ${t.tokens.line}` }}
        >
          <span className="text-[10px] font-bold" style={{ color: t.tokens.muted }}>تصویر</span>
          <span className="text-[10px] font-bold" style={{ color: t.tokens.muted }}>نام محصول</span>
          <span className="text-[10px] font-bold" style={{ color: t.tokens.muted }}>قیمت مصرف‌کننده</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              background: i % 2 === 1 ? t.tokens.rowAltBg : 'transparent',
              borderBottom: i < rows.length - 1 ? `1px solid ${t.tokens.line}` : undefined,
            }}
          >
            <span
              className="size-9 shrink-0"
              style={{
                background: t.tokens.headBg === 'transparent' ? 'rgba(255,255,255,.65)' : t.tokens.headBg,
                border: `1px solid ${t.tokens.line}`,
                borderRadius: Math.max(2, Math.round(t.tokens.radius / 3)),
              }}
            />
            <span className="flex-1 text-center text-xs font-semibold">{r.name}</span>
            <span className="text-xs font-black tabular-nums" style={{ color: priceColor }}>
              {r.price}
              <span className="ms-1 text-[9px] font-medium" style={{ color: t.tokens.muted }}>تومان</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- انتخابگر اصلی ---------- */
interface Props {
  value: TemplateId;
  onChange: (next: TemplateId) => void;
}

export function TemplatePicker({ value, onChange }: Props) {
  const selected = TEMPLATES.find((t) => t.value === value) ?? TEMPLATES[0];

  return (
    <div className="lg:col-span-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">تمپلیت لیست قیمت</h2>
        <span className="text-[11px] text-slate-400">
          فعال: <b className="text-slate-600">{selected.label}</b>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              aria-pressed={active}
              className={cn(
                'group overflow-hidden rounded-2xl border-2 bg-white text-start shadow-sm transition-all duration-200',
                active
                  ? 'border-indigo-600 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
              )}
            >
              <div className="relative">
                <TemplateMock t={t} />
                {/* نشانگر انتخاب */}
                <span
                  className={cn(
                    'absolute end-2 top-2 flex size-6 items-center justify-center rounded-full transition',
                    active ? 'bg-indigo-600 text-white opacity-100' : 'bg-white/90 text-transparent opacity-0 group-hover:opacity-100',
                  )}
                >
                  <CheckIcon className="text-sm" />
                </span>
              </div>
              <div className="border-t border-slate-100 p-3.5">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  {t.label}
                  {active && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                      فعال
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[10px] font-medium tracking-wide text-indigo-400" dir="ltr">
                  {t.vibe}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* پیش‌نمایش زنده — با انتخاب، همان لحظه عوض می‌شود */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] text-slate-400">
          پیش‌نمایش زنده «{selected.label}» — برای دیدن لیست واقعی، بعد از ذخیره به صفحه «پیش‌نمایش» بروید.
        </p>
        <LivePreview t={selected} />
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-400">
        نکته: چهار تمپلیت جدید پالت رنگی اختصاصی خودشان را دارند و تنظیمات «رنگ‌ها» روی آن‌ها اثر نمی‌کند؛
        فونت، اندازه تصویر، گردی گوشه‌ها، فاصله ردیف‌ها و اندازه متن روی همه تمپلیت‌ها اعمال می‌شود.
      </p>
    </div>
  );
}