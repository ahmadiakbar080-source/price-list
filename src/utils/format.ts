const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Convert Persian/Arabic digits to Latin digits. */
export function toEnglishDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const fa = PERSIAN_DIGITS.indexOf(ch);
    const ar = ARABIC_DIGITS.indexOf(ch);
    out += fa >= 0 ? String(fa) : ar >= 0 ? String(ar) : ch;
  }
  return out;
}

/** Keep digits only (accepts Persian/Arabic digit input). */
export function digitsOnly(input: string): string {
  return toEnglishDigits(input).replace(/\D+/g, '');
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

/** 1250000 -> "1,250,000 تومان" (currency label configurable). */
export function formatPrice(value: number | string | null | undefined, currency: string): string {
  const n = Math.round(Number(value ?? 0));
  return `${formatNumber(Number.isFinite(n) ? n : 0)} ${currency}`;
}

/** Jalali (Solar Hijri) date, e.g. «۲۳ مرداد ۱۴۰۵». */
export function formatJalaliDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatJalaliDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/** Normalize letters for tolerant Persian search (ی/ك/ه variants). */
export function normalizeForSearch(input: string): string {
  return toEnglishDigits(input)
    .replace(/[يﻯﻱ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\u064B-\u065F/g, '') // harakat
    .toLowerCase()
    .trim();
}