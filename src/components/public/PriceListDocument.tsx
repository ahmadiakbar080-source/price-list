import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClockIcon,
  CompareIcon,
  HeartIcon,
  ImageIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  TagIcon,
} from '@/components/icons';
import { CompareModal } from '@/components/public/CompareModal';
import { ImageLightbox } from '@/components/public/ImageLightbox';
import { ProductDetailModal } from '@/components/public/ProductDetailModal';
import { CUSTOM_FONT_FAMILY } from '@/lib/constants';
import { useToast } from '@/hooks/useToast';
import { ensureBuiltinWebfont } from '@/utils/assets';
import { formatJalaliDate, formatNumber, normalizeForSearch } from '@/utils/format';
import { getFavorites, toggleFavorite } from '@/utils/favorites';
import { shareOrCopy } from '@/utils/share';
import { applyDynamicManifest, listenInstallPrompt } from '@/utils/pwa';
import { cn } from '@/utils/cn';
import type { AppSettings, Category, Product } from '@/types';

interface Props {
  settings: AppSettings;
  products: Product[];
  categories: Category[];
  lastPublishedAt: string | null;
  isPreview?: boolean;
}

const PAGE_SIZE = 50;
const MAX_COMPARE = 4;

function getPageNumbers(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | '…'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

function CategoryChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button type="button" className="pl-chip" data-active={active} onClick={onClick}>
      {label}
      <span className={cn('tabular-nums', !active && 'opacity-60')}>({formatNumber(count)})</span>
    </button>
  );
}

function buildCss(s: AppSettings): string {
  const stack =
    s.fontFamily === 'custom'
      ? `'${CUSTOM_FONT_FAMILY}', Vazirmatn, Tahoma, sans-serif`
      : `'${s.fontFamily}', Vazirmatn, Tahoma, sans-serif`;
  const face =
    s.fontFamily === 'custom' && s.customFontUrl
      ? `@font-face{font-family:'${CUSTOM_FONT_FAMILY}';src:url('${s.customFontUrl}');font-display:swap;}`
      : '';

  return `${face}
/* ================= BASE (کلاسیک) ================= */
.pl-root{font-family:${stack};color:${s.textColor};
  --pl-primary:${s.primaryColor};--pl-radius:${s.borderRadius}px;--pl-gap:${s.rowSpacing}px;
  --pl-fs:${s.baseFontSize}px;--pl-img:${s.imageSize}px;}
.pl-root{background:
  linear-gradient(180deg, rgba(51,65,85,.20) 0%, rgba(51,65,85,.07) 35%, rgba(51,65,85,.16) 100%),
  ${s.backgroundColor};}

.pl-surface{background:rgba(255,255,255,.78);}
.pl-search{background:rgba(255,255,255,.85);border:1px solid rgba(100,116,139,.25);border-radius:calc(var(--pl-radius) * .9);}
.pl-table-wrap{border:1px solid rgba(100,116,139,.16);border-radius:var(--pl-radius);overflow:hidden;
  background:rgba(255,255,255,.55);box-shadow:0 14px 40px -22px rgba(15,23,42,.35);}
.pl-table{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--pl-fs);}
.pl-table th{text-align:center;font-size:.76em;font-weight:700;letter-spacing:.02em;color:#475569;
  padding:.7rem .8rem;background:rgba(241,245,249,.95);border-bottom:1px solid rgba(100,116,139,.18);white-space:nowrap;}
.pl-table td{padding:calc(var(--pl-gap)/2 + 6px) .8rem;vertical-align:middle;border-bottom:1px solid rgba(100,116,139,.10);}
.pl-table tbody tr:last-child td{border-bottom:none;}
.pl-table tbody tr{transition:background .15s ease;cursor:pointer;}
.pl-table tbody tr:nth-child(even){background:rgba(100,116,139,.10);}
.pl-table[data-style='striped'] tbody tr:nth-child(even){background:rgba(100,116,139,.18);}
.pl-table tbody tr:hover{background:rgba(100,116,139,.14);}

.pl-table col.c-img{width:calc(var(--pl-img) + 1.9rem);}
.pl-table col.c-price{width:7.6rem;}
.pl-table td:first-child .pl-thumb{margin-inline:auto;}
.pl-thumb{position:relative;width:var(--pl-img);height:var(--pl-img);flex:0 0 auto;display:flex;
  align-items:center;justify-content:center;overflow:visible;
  background:rgba(255,255,255,.95);border:1px solid rgba(100,116,139,.14);border-radius:calc(var(--pl-radius)*.6);}
.pl-thumb > img{width:100%;height:100%;object-fit:contain;display:block;padding:2px;border-radius:inherit;}
.pl-thumb > svg{opacity:.3;}

.pl-fab{position:absolute;z-index:2;width:24px;height:24px;display:flex;align-items:center;justify-content:center;
  padding:0;border-radius:999px;background:rgba(255,255,255,.96);border:1px solid rgba(100,116,139,.3);
  color:#64748b;box-shadow:0 2px 6px rgba(15,23,42,.18);transition:all .15s ease;cursor:pointer;}
.pl-fab svg{width:13px;height:13px;}
.pl-fav{top:-9px;inset-inline-start:-9px;}
.pl-comp{bottom:-9px;inset-inline-end:-9px;}
.pl-fab:hover{color:var(--pl-primary);border-color:var(--pl-primary);transform:scale(1.1);}
.pl-fav.active{color:#e11d48;border-color:#e11d48;}
.pl-fav.active svg{fill:#e11d48;}
.pl-comp.active{background:var(--pl-primary);border-color:var(--pl-primary);color:#fff;}

.pl-chip{flex-shrink:0;display:inline-flex;align-items:center;gap:.3rem;border-radius:999px;
  border:1px solid rgba(100,116,139,.3);background:rgba(255,255,255,.85);padding:.45rem .95rem;
  font-size:.75rem;font-weight:700;color:#475569;box-shadow:0 1px 4px rgba(15,23,42,.08);
  transition:all .15s ease;white-space:nowrap;cursor:pointer;}
.pl-chip:hover{border-color:var(--pl-primary);color:var(--pl-primary);}
.pl-chip[data-active='true']{background:var(--pl-primary);border-color:var(--pl-primary);color:#fff;}

.pl-btn{display:inline-flex;align-items:center;gap:.4rem;border-radius:12px;border:1px solid rgba(100,116,139,.35);
  background:rgba(255,255,255,.9);padding:.5rem 1rem;font-size:.75rem;font-weight:700;color:#475569;
  box-shadow:0 1px 3px rgba(15,23,42,.08);transition:all .15s ease;cursor:pointer;}
.pl-btn:hover{border-color:var(--pl-primary);color:var(--pl-primary);}
.pl-btn:disabled{opacity:.4;pointer-events:none;}
.pl-btn[data-active='true']{background:var(--pl-primary);border-color:var(--pl-primary);color:#fff;}

.pl-brand{font-size:1.5rem;font-weight:900;letter-spacing:-.01em;line-height:1.25;}
.pl-subtitle{margin-top:.4rem;font-size:.875rem;font-weight:500;opacity:.75;}
.pl-date{margin-top:1rem;display:inline-flex;align-items:center;gap:.4rem;border-radius:999px;
  padding:.3rem .8rem;font-size:.75rem;opacity:.9;background:rgba(255,255,255,.78);}

.pl-name{font-weight:600;word-break:break-word;text-align:center;}
.pl-table td:last-child{text-align:center;}
.pl-price{color:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:100%;margin-inline:auto;gap:1px;line-height:1.3;font-variant-numeric:tabular-nums;}
.pl-price-num{font-size:.8em;font-weight:600;white-space:nowrap;}
.pl-price-cur{font-size:.5em;font-weight:500;opacity:.65;white-space:nowrap;}

.pl-table[data-style='bordered'] th,
.pl-table[data-style='bordered'] td{border:1px solid rgba(100,116,139,.16);}

.pl-compare-bar{position:fixed;bottom:14px;left:14px;right:14px;z-index:60;margin-inline:auto;max-width:34rem;
  display:flex;align-items:center;justify-content:space-between;gap:10px;padding:.65rem .9rem;border-radius:16px;
  background:rgba(15,23,42,.92);color:#fff;box-shadow:0 18px 50px -18px rgba(15,23,42,.6);backdrop-filter:blur(8px);}

/* ================= LIQUID GLASS ================= */
.pl-root[data-template='liquid-glass']{background:
  radial-gradient(1100px 600px at 85% -10%, rgba(99,102,241,.30), transparent 60%),
  radial-gradient(900px 500px at -10% 25%, rgba(14,165,233,.26), transparent 55%),
  radial-gradient(900px 600px at 50% 115%, rgba(236,72,153,.22), transparent 60%),
  linear-gradient(180deg,#eef2ff 0%,#f8fafc 45%,#eef2ff 100%);}
.pl-root[data-template='liquid-glass'] .pl-surface{background:rgba(255,255,255,.5);backdrop-filter:blur(12px);}
.pl-root[data-template='liquid-glass'] .pl-search{background:rgba(255,255,255,.45);
  backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);
  border:1px solid rgba(255,255,255,.7);border-radius:999px;box-shadow:0 10px 30px -18px rgba(30,41,59,.4);}
.pl-root[data-template='liquid-glass'] .pl-table-wrap{background:rgba(255,255,255,.38);
  backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);
  border:1px solid rgba(255,255,255,.65);border-radius:calc(var(--pl-radius) + 10px);
  box-shadow:0 25px 60px -30px rgba(30,41,59,.45);}
.pl-root[data-template='liquid-glass'] .pl-table th{background:rgba(255,255,255,.45);border-bottom:1px solid rgba(255,255,255,.7);}
.pl-root[data-template='liquid-glass'] .pl-table td{border-bottom:1px solid rgba(255,255,255,.35);}
.pl-root[data-template='liquid-glass'] .pl-table tbody tr:nth-child(even){background:rgba(255,255,255,.32);}
.pl-root[data-template='liquid-glass'] .pl-table tbody tr:hover{background:rgba(255,255,255,.55);}
.pl-root[data-template='liquid-glass'] .pl-thumb{background:rgba(255,255,255,.75);border-color:rgba(255,255,255,.8);}
.pl-root[data-template='liquid-glass'] .pl-chip{background:rgba(255,255,255,.45);backdrop-filter:blur(10px);border-color:rgba(255,255,255,.7);}
.pl-root[data-template='liquid-glass'] .pl-chip[data-active='true']{background:color-mix(in srgb, var(--pl-primary) 88%, transparent);}
.pl-root[data-template='liquid-glass'] .pl-btn{background:rgba(255,255,255,.5);backdrop-filter:blur(10px);border-color:rgba(255,255,255,.7);}
.pl-root[data-template='liquid-glass'] .pl-date{background:rgba(255,255,255,.5);backdrop-filter:blur(10px);}

/* ================= PREMIUM DARK ================= */
.pl-root[data-template='premium-dark']{
  color:#e7e9ee;
  --tpl-accent:#3b82f6;--tpl-accent-soft:rgba(59,130,246,.12);
  --tpl-card:#141722;--tpl-line:rgba(255,255,255,.09);--tpl-muted:#9aa3b2;
  background:
    radial-gradient(1000px 520px at 85% -12%, rgba(59,130,246,.12), transparent 55%),
    linear-gradient(180deg,#0a0c11 0%,#0d1017 55%,#0a0c11 100%);}
.pl-root[data-template='premium-dark'] .pl-brand{color:#fff;}
.pl-root[data-template='premium-dark'] .pl-subtitle{color:var(--tpl-muted);}
.pl-root[data-template='premium-dark'] .pl-date{background:rgba(255,255,255,.05);border:1px solid var(--tpl-line);color:var(--tpl-muted);}
.pl-root[data-template='premium-dark'] .pl-search{background:rgba(255,255,255,.045);border:1px solid var(--tpl-line);color:#e7e9ee;}
.pl-root[data-template='premium-dark'] .pl-search::placeholder{color:#6b7280;}
.pl-root[data-template='premium-dark'] .pl-table-wrap{background:var(--tpl-card);border:1px solid var(--tpl-line);
  border-radius:calc(var(--pl-radius) + 6px);box-shadow:0 30px 70px -35px rgba(0,0,0,.85);}
.pl-root[data-template='premium-dark'] .pl-table th{background:rgba(255,255,255,.035);color:var(--tpl-muted);
  border-bottom:1px solid var(--tpl-line);letter-spacing:.06em;}
.pl-root[data-template='premium-dark'] .pl-table td{border-bottom:1px solid rgba(255,255,255,.055);}
.pl-root[data-template='premium-dark'] .pl-table tbody tr:nth-child(even){background:rgba(255,255,255,.02);}
.pl-root[data-template='premium-dark'] .pl-table tbody tr:hover{background:var(--tpl-accent-soft);}
.pl-root[data-template='premium-dark'] .pl-thumb{background:#0e1119;border-color:var(--tpl-line);}
.pl-root[data-template='premium-dark'] .pl-name{color:#f3f4f6;}
.pl-root[data-template='premium-dark'] .pl-price-num{color:var(--tpl-accent);font-weight:800;}
.pl-root[data-template='premium-dark'] .pl-price-cur{color:var(--tpl-muted);}
.pl-root[data-template='premium-dark'] .pl-fab{background:#1b2030;border-color:var(--tpl-line);color:var(--tpl-muted);}
.pl-root[data-template='premium-dark'] .pl-fav.active{color:#f43f5e;border-color:#f43f5e;}
.pl-root[data-template='premium-dark'] .pl-fav.active svg{fill:#f43f5e;}
.pl-root[data-template='premium-dark'] .pl-comp.active{background:var(--tpl-accent);border-color:var(--tpl-accent);color:#fff;
  box-shadow:0 0 14px rgba(59,130,246,.45);}
.pl-root[data-template='premium-dark'] .pl-chip{background:rgba(255,255,255,.045);border-color:var(--tpl-line);color:var(--tpl-muted);}
.pl-root[data-template='premium-dark'] .pl-chip:hover{border-color:var(--tpl-accent);color:#fff;}
.pl-root[data-template='premium-dark'] .pl-chip[data-active='true']{background:var(--tpl-accent);border-color:var(--tpl-accent);color:#fff;
  box-shadow:0 0 16px rgba(59,130,246,.35);}
.pl-root[data-template='premium-dark'] .pl-btn{background:rgba(255,255,255,.045);border-color:var(--tpl-line);color:#cbd5e1;}
.pl-root[data-template='premium-dark'] .pl-btn:hover{border-color:var(--tpl-accent);color:#fff;}
.pl-root[data-template='premium-dark'] .pl-btn[data-active='true']{background:var(--tpl-accent);border-color:var(--tpl-accent);color:#fff;}
.pl-root[data-template='premium-dark'] .pl-compare-bar{background:rgba(17,20,30,.95);border:1px solid var(--tpl-line);}

/* ================= MINIMAL WHITE ================= */
.pl-root[data-template='minimal-white']{
  color:#141414;
  --tpl-accent:#1e40af;--tpl-line:#e8e6e1;--tpl-muted:#6b7280;
  background:#fcfcfb;}
.pl-root[data-template='minimal-white'] .pl-brand{color:#111;}
.pl-root[data-template='minimal-white'] .pl-subtitle{color:var(--tpl-muted);}
.pl-root[data-template='minimal-white'] .pl-date{background:#fff;border:1px solid var(--tpl-line);color:var(--tpl-muted);}
.pl-root[data-template='minimal-white'] .pl-search{background:#fff;border:1px solid var(--tpl-line);}
.pl-root[data-template='minimal-white'] .pl-table-wrap{background:#fff;border:1px solid var(--tpl-line);
  border-radius:calc(var(--pl-radius) * .6);box-shadow:0 1px 2px rgba(20,20,20,.04);}
.pl-root[data-template='minimal-white'] .pl-table th{background:#fafaf8;color:var(--tpl-muted);border-bottom:1px solid var(--tpl-line);}
.pl-root[data-template='minimal-white'] .pl-table td{border-bottom:1px solid #f1f0ec;}
.pl-root[data-template='minimal-white'] .pl-table tbody tr:nth-child(even){background:#fafaf8;}
.pl-root[data-template='minimal-white'] .pl-table tbody tr:hover{background:#f4f6fb;}
.pl-root[data-template='minimal-white'] .pl-thumb{background:#fff;border-color:var(--tpl-line);}
.pl-root[data-template='minimal-white'] .pl-price-num{color:var(--tpl-accent);font-weight:700;}
.pl-root[data-template='minimal-white'] .pl-chip{background:#fff;border-color:var(--tpl-line);color:#44403c;}
.pl-root[data-template='minimal-white'] .pl-chip[data-active='true']{background:#111;border-color:#111;color:#fff;}
.pl-root[data-template='minimal-white'] .pl-btn{background:#fff;border-color:var(--tpl-line);color:#44403c;}
.pl-root[data-template='minimal-white'] .pl-btn[data-active='true']{background:#111;border-color:#111;color:#fff;}
.pl-root[data-template='minimal-white'] .pl-compare-bar{background:#111;}

/* ================= NEON FUTURE ================= */
.pl-root[data-template='neon-future']{
  color:#dbe4f3;
  --tpl-accent:#22d3ee;--tpl-accent2:#8b5cf6;--tpl-line:rgba(125,211,252,.16);--tpl-muted:#93a6c8;
  background:
    radial-gradient(1000px 560px at 88% -12%, rgba(34,211,238,.14), transparent 55%),
    radial-gradient(900px 520px at -8% 18%, rgba(139,92,246,.16), transparent 55%),
    radial-gradient(900px 560px at 50% 118%, rgba(59,130,246,.12), transparent 60%),
    #05060f;}
.pl-root[data-template='neon-future'] .pl-brand{color:#fff;}
.pl-root[data-template='neon-future'] .pl-subtitle{color:var(--tpl-muted);}
.pl-root[data-template='neon-future'] .pl-date{background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.25);color:#a5f3fc;}
.pl-root[data-template='neon-future'] .pl-search{background:rgba(10,14,30,.55);border:1px solid var(--tpl-line);color:#e2e8f0;
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}
.pl-root[data-template='neon-future'] .pl-search::placeholder{color:#64748b;}
.pl-root[data-template='neon-future'] .pl-table-wrap{position:relative;background:rgba(12,16,32,.55);
  backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);
  border:1px solid var(--tpl-line);border-radius:calc(var(--pl-radius) + 10px);
  box-shadow:0 30px 80px -35px rgba(0,0,0,.9);}
.pl-root[data-template='neon-future'] .pl-table-wrap::before{content:'';display:block;height:2px;
  background:linear-gradient(90deg,transparent 5%,var(--tpl-accent) 35%,var(--tpl-accent2) 70%,transparent 95%);}
.pl-root[data-template='neon-future'] .pl-table th{background:rgba(34,211,238,.05);color:#7dd3fc;
  border-bottom:1px solid rgba(34,211,238,.22);}
.pl-root[data-template='neon-future'] .pl-table td{border-bottom:1px solid rgba(125,211,252,.08);}
.pl-root[data-template='neon-future'] .pl-table tbody tr{transition:background .2s ease;}
.pl-root[data-template='neon-future'] .pl-table tbody tr:nth-child(even){background:rgba(255,255,255,.02);}
.pl-root[data-template='neon-future'] .pl-table tbody tr:hover{background:rgba(34,211,238,.06);}
.pl-root[data-template='neon-future'] .pl-thumb{background:rgba(255,255,255,.06);border-color:var(--tpl-line);}
.pl-root[data-template='neon-future'] .pl-price-num{color:#fff;font-weight:800;text-shadow:0 0 16px rgba(34,211,238,.5);}
.pl-root[data-template='neon-future'] .pl-price-cur{color:#7dd3fc;}
.pl-root[data-template='neon-future'] .pl-fab{background:rgba(10,14,30,.85);border-color:var(--tpl-line);color:#94a3b8;}
.pl-root[data-template='neon-future'] .pl-fav.active{color:#f472b6;border-color:#f472b6;}
.pl-root[data-template='neon-future'] .pl-fav.active svg{fill:#f472b6;}
.pl-root[data-template='neon-future'] .pl-comp.active{background:var(--tpl-accent);border-color:var(--tpl-accent);color:#04121a;
  box-shadow:0 0 12px rgba(34,211,238,.6);}
.pl-root[data-template='neon-future'] .pl-chip{background:rgba(10,14,30,.55);border-color:var(--tpl-line);color:#9fb2d4;
  backdrop-filter:blur(8px);}
.pl-root[data-template='neon-future'] .pl-chip:hover{border-color:var(--tpl-accent);color:#fff;}
.pl-root[data-template='neon-future'] .pl-chip[data-active='true']{background:linear-gradient(120deg,rgba(34,211,238,.9),rgba(139,92,246,.9));
  border-color:transparent;color:#fff;box-shadow:0 0 18px rgba(34,211,238,.35);}
.pl-root[data-template='neon-future'] .pl-btn{background:rgba(10,14,30,.55);border-color:var(--tpl-line);color:#9fb2d4;}
.pl-root[data-template='neon-future'] .pl-btn:hover{border-color:var(--tpl-accent);color:#fff;}
.pl-root[data-template='neon-future'] .pl-btn[data-active='true']{background:linear-gradient(120deg,rgba(34,211,238,.9),rgba(139,92,246,.9));
  border-color:transparent;color:#fff;}
.pl-root[data-template='neon-future'] .pl-compare-bar{background:rgba(10,14,30,.92);border:1px solid var(--tpl-line);}

/* ================= LUXURY EDITORIAL ================= */
.pl-root[data-template='luxury-editorial']{
  color:#1c1917;
  --tpl-accent:#a8842c;--tpl-line:rgba(28,25,23,.16);--tpl-muted:#78716c;
  background:#faf6ee;}
.pl-root[data-template='luxury-editorial'] .pl-brand{color:#111;font-size:2rem;letter-spacing:-.02em;}
.pl-root[data-template='luxury-editorial'] .pl-subtitle{color:var(--tpl-muted);letter-spacing:.14em;font-size:.8rem;}
.pl-root[data-template='luxury-editorial'] .pl-date{background:transparent;border:none;border-radius:0;
  border-top:1px solid var(--tpl-line);border-bottom:1px solid var(--tpl-line);
  padding:.45rem 1.1rem;color:var(--tpl-accent);letter-spacing:.08em;opacity:1;}
.pl-root[data-template='luxury-editorial'] .pl-search{background:#fffdf8;border:1px solid var(--tpl-line);border-radius:2px;}
.pl-root[data-template='luxury-editorial'] .pl-table-wrap{background:transparent;border:none;box-shadow:none;border-radius:0;}
.pl-root[data-template='luxury-editorial'] .pl-table th{background:transparent;color:var(--tpl-muted);
  border-bottom:2px solid #1c1917;letter-spacing:.12em;font-size:.7em;}
.pl-root[data-template='luxury-editorial'] .pl-table td{border-bottom:1px solid var(--tpl-line);}
.pl-root[data-template='luxury-editorial'] .pl-table tbody tr:nth-child(even){background:transparent;}
.pl-root[data-template='luxury-editorial'] .pl-table[data-style='striped'] tbody tr:nth-child(even){background:rgba(168,132,44,.05);}
.pl-root[data-template='luxury-editorial'] .pl-table tbody tr:hover{background:rgba(168,132,44,.06);}
.pl-root[data-template='luxury-editorial'] .pl-thumb{background:#fff;border-color:var(--tpl-line);border-radius:2px;}
.pl-root[data-template='luxury-editorial'] .pl-price-num{color:#1c1917;font-weight:700;}
.pl-root[data-template='luxury-editorial'] .pl-price-cur{color:var(--tpl-accent);font-weight:600;opacity:1;}
.pl-root[data-template='luxury-editorial'] .pl-fab{background:#fffdf8;border-color:var(--tpl-line);color:var(--tpl-muted);}
.pl-root[data-template='luxury-editorial'] .pl-fav.active{color:var(--tpl-accent);border-color:var(--tpl-accent);}
.pl-root[data-template='luxury-editorial'] .pl-fav.active svg{fill:var(--tpl-accent);}
.pl-root[data-template='luxury-editorial'] .pl-comp.active{background:#1c1917;border-color:#1c1917;color:#faf6ee;}
.pl-root[data-template='luxury-editorial'] .pl-chip{background:transparent;border-color:var(--tpl-line);color:#57534e;border-radius:2px;}
.pl-root[data-template='luxury-editorial'] .pl-chip:hover{border-color:var(--tpl-accent);color:var(--tpl-accent);}
.pl-root[data-template='luxury-editorial'] .pl-chip[data-active='true']{background:#1c1917;border-color:#1c1917;color:#faf6ee;}
.pl-root[data-template='luxury-editorial'] .pl-btn{background:transparent;border-color:var(--tpl-line);color:#57534e;border-radius:2px;}
.pl-root[data-template='luxury-editorial'] .pl-btn:hover{border-color:var(--tpl-accent);color:var(--tpl-accent);}
.pl-root[data-template='luxury-editorial'] .pl-btn[data-active='true']{background:#1c1917;border-color:#1c1917;color:#faf6ee;}
.pl-root[data-template='luxury-editorial'] .pl-compare-bar{background:#1c1917;}

/* ================= MOBILE ================= */
@media (max-width:640px){
  .pl-table{font-size:calc(var(--pl-fs)*.88);}
  .pl-table th{padding:.55rem .5rem;font-size:.7em;}
  .pl-table td{padding:calc(var(--pl-gap)/2 + 3px) .5rem;}
  .pl-table col.c-price{width:6.4rem;}
  .pl-thumb{width:calc(var(--pl-img)*.85);height:calc(var(--pl-img)*.85);}
  .pl-fab{width:26px;height:26px;}
}
`;
}

export function PriceListDocument({
  settings,
  products,
  categories,
  lastPublishedAt,
  isPreview = false,
}: Props) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [favOnly, setFavOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [installer, setInstaller] = useState<(() => Promise<void>) | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureBuiltinWebfont(settings.fontFamily);
  }, [settings.fontFamily]);

  useEffect(() => {
    if (isPreview) return;
    applyDynamicManifest(settings);
  }, [settings, isPreview]);

  useEffect(() => {
    if (isPreview) return;
    return listenInstallPrompt(setInstaller);
  }, [isPreview]);

  useEffect(() => {
    setPage(1);
  }, [query, activeCat, favOnly]);

  const filtered = useMemo(() => {
    let list = products;
    if (favOnly) list = list.filter((p) => favorites.includes(p.id));
    if (activeCat !== 'all') list = list.filter((p) => p.categoryId === activeCat);
    const q = normalizeForSearch(query);
    if (q) list = list.filter((p) => normalizeForSearch(p.name).includes(q));
    return list;
  }, [products, query, activeCat, favOnly, favorites]);

  const favCount = useMemo(
    () => products.filter((p) => favorites.includes(p.id)).length,
    [products, favorites],
  );

  const compareProducts = useMemo(
    () => products.filter((p) => compareIds.includes(p.id)),
    [products, compareIds],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(p);
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const toggleFav = (id: string) => setFavorites(toggleFavorite(id));

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((x) => x !== id));
      return;
    }
    if (compareIds.length >= MAX_COMPARE) {
      toast.info(`حداکثر ${formatNumber(MAX_COMPARE)} محصول قابل مقایسه است.`);
      return;
    }
    setCompareIds([...compareIds, id]);
  };

  const shareList = async () => {
    try {
      const res = await shareOrCopy({
        title: settings.brandName,
        text: `${settings.brandName} — ${settings.listTitle}`,
        url: window.location.origin + window.location.pathname,
      });
      if (res === 'copied') toast.success('لینک لیست قیمت کپی شد.');
    } catch (e) {
      console.error(e);
      toast.error('خطا در اشتراک‌گذاری. لطفاً دوباره تلاش کنید.');
    }
  };

  const dateLabel =
    settings.showUpdateDate && lastPublishedAt ? formatJalaliDate(lastPublishedAt) : null;

  return (
    <div className="pl-root min-h-screen" data-template={settings.template}>
      <style>{buildCss(settings)}</style>

      <div className="mx-auto w-full max-w-3xl px-3 pb-16 pt-10 sm:px-6">
        {/* ---------- Header ---------- */}
        <header className="text-center">
          {settings.showLogo && settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={settings.brandName}
              className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain"
            />
          )}
          <h1 className="pl-brand">{settings.brandName}</h1>
          <h2 className="pl-subtitle">{settings.listTitle}</h2>

          {dateLabel && (
            <p className="pl-date">
              <ClockIcon className="text-sm" />
              آخرین به‌روزرسانی: {dateLabel}
            </p>
          )}

          {!isPreview && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button type="button" className="pl-btn" onClick={() => void shareList()}>
                <ShareIcon />
                اشتراک‌گذاری لیست قیمت
              </button>
              {installer && (
                <button type="button" className="pl-btn" onClick={() => void installer()}>
                  <PlusIcon />
                  نصب اپلیکیشن
                </button>
              )}
            </div>
          )}
        </header>

        {/* ---------- Search ---------- */}
        <div className="relative mx-auto mt-6 max-w-md">
          <SearchIcon className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-base opacity-40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی محصول…"
            aria-label="جستجوی محصول"
            className="pl-search h-11 w-full pe-10 ps-4 text-sm outline-none transition"
          />
        </div>

        {/* ---------- Category + Favorites chips ---------- */}
        {(categories.length > 0 || favCount > 0) && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1.5" role="tablist" aria-label="دسته‌بندی‌ها">
            <CategoryChip
              active={activeCat === 'all' && !favOnly}
              label="همه"
              count={products.length}
              onClick={() => {
                setActiveCat('all');
                setFavOnly(false);
              }}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={activeCat === c.id && !favOnly}
                label={c.name}
                count={products.filter((p) => p.categoryId === c.id).length}
                onClick={() => {
                  setActiveCat(c.id);
                  setFavOnly(false);
                }}
              />
            ))}
            {favCount > 0 && (
              <CategoryChip
                active={favOnly}
                label="♥ علاقه‌مندی‌ها"
                count={favCount}
                onClick={() => setFavOnly((v) => !v)}
              />
            )}
          </div>
        )}

        {/* ---------- Table ---------- */}
        <main className="mt-4" ref={tableRef}>
          {filtered.length === 0 ? (
            <div className="py-16 text-center opacity-70">
              {favOnly ? (
                <HeartIcon className="mx-auto mb-3 text-4xl opacity-40" />
              ) : activeCat !== 'all' && query === '' ? (
                <TagIcon className="mx-auto mb-3 text-4xl opacity-40" />
              ) : (
                <ImageIcon className="mx-auto mb-3 text-4xl opacity-40" />
              )}
              <p className="text-sm font-medium">
                {favOnly
                  ? 'هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید. روی ♥ روی تصویر محصولات بزنید.'
                  : query
                    ? 'محصولی با این نام پیدا نشد.'
                    : activeCat !== 'all'
                      ? 'محصولی در این دسته‌بندی منتشر نشده است.'
                      : 'هنوز محصولی منتشر نشده است.'}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2 text-center text-[11px] opacity-50">
                کلیک روی محصول: جزئیات و اشتراک‌گذاری — کلیک روی تصویر: بزرگنمایی — ♥: علاقه‌مندی
              </p>

              <div className="pl-table-wrap">
                <table className="pl-table" data-style={settings.tableStyle}>
                  <colgroup>
                    <col className="c-img" />
                    <col />
                    <col className="c-price" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">تصویر</th>
                      <th scope="col">نام محصول</th>
                      <th scope="col">قیمت مصرف‌کننده</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((p) => {
                      const isFav = favorites.includes(p.id);
                      const inCompare = compareIds.includes(p.id);
                      return (
                        <tr key={p.id} onClick={() => setDetail(p)}>
                          <td
                            onClick={(e) => {
                              if (p.imageUrl) {
                                e.stopPropagation();
                                setLightbox({ src: p.imageUrl, alt: p.name });
                              }
                            }}
                          >
                            <div className="pl-thumb">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} loading="lazy" decoding="async" />
                              ) : (
                                <ImageIcon className="text-lg" />
                              )}
                              <button
                                type="button"
                                aria-label={isFav ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                                className={cn('pl-fab pl-fav', isFav && 'active')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFav(p.id);
                                }}
                              >
                                <HeartIcon />
                              </button>
                              <button
                                type="button"
                                aria-label={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
                                className={cn('pl-fab pl-comp', inCompare && 'active')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompare(p.id);
                                }}
                              >
                                <CompareIcon />
                              </button>
                            </div>
                          </td>
                          <td className="pl-name">{p.name}</td>
                          <td>
                            <div className="pl-price">
                              <span className="pl-price-num">{formatNumber(p.price)}</span>
                              <span className="pl-price-cur">{settings.currency}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ---------- Pagination ---------- */}
              {pageCount > 1 && (
                <nav className="mt-5 flex flex-col items-center gap-3" aria-label="صفحه‌بندی">
                  <p className="text-xs opacity-60 tabular-nums">
                    صفحه {formatNumber(safePage)} از {formatNumber(pageCount)} — مجموع{' '}
                    {formatNumber(filtered.length)} محصول
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      className="pl-btn"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                    >
                      قبلی
                    </button>

                    {getPageNumbers(safePage, pageCount).map((n, idx) =>
                      n === '…' ? (
                        <span key={`e-${idx}`} className="px-1 text-xs opacity-50">
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          type="button"
                          className="pl-btn min-w-8 tabular-nums"
                          data-active={n === safePage}
                          onClick={() => goToPage(n)}
                          aria-current={n === safePage ? 'page' : undefined}
                        >
                          {formatNumber(n)}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      className="pl-btn"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= pageCount}
                    >
                      بعدی
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </main>

        <footer className="mt-12 text-center text-[11px] opacity-50">
          همه قیمت‌ها به «{settings.currency}» است — {settings.brandName}
        </footer>
      </div>

      {/* ---------- Compare bar ---------- */}
      {!isPreview && compareIds.length > 0 && (
        <div className="pl-compare-bar">
          <span className="text-xs font-bold">
            {formatNumber(compareIds.length)} محصول برای مقایسه انتخاب شد
          </span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="rounded-lg px-2.5 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              پاک کردن
            </button>
            <button
              type="button"
              disabled={compareIds.length < 2}
              onClick={() => setCompareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold transition hover:bg-indigo-400 disabled:pointer-events-none disabled:opacity-40"
            >
              <CompareIcon />
              مقایسه
            </button>
          </span>
        </div>
      )}

      {/* ---------- Modals ---------- */}
      {detail && (
        <ProductDetailModal
          product={detail}
          categoryName={categories.find((c) => c.id === detail.categoryId)?.name ?? null}
          settings={settings}
          onZoomImage={(src, alt) => setLightbox({ src, alt })}
          onClose={() => setDetail(null)}
        />
      )}

      {compareOpen && compareProducts.length >= 2 && (
        <CompareModal
          products={compareProducts}
          categories={categories}
          settings={settings}
          onRemove={(id) => {
            setCompareIds(compareIds.filter((x) => x !== id));
            if (compareIds.length <= 2) setCompareOpen(false);
          }}
          onClose={() => setCompareOpen(false)}
        />
      )}

      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}