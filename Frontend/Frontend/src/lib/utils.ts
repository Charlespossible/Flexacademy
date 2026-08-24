import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { SubscriptionTier, DifficultyLevel } from '@/types';

// ─── Tailwind class merging ──────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Seconds → m:ss, for media positions shown to the student. */
export function formatClock(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ─── Date/Time ───────────────────────────────────────────────────────────────
export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, 'MMM d, yyyy · h:mm a');
}

// ─── Numbers ─────────────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-NG').format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ─── Strings ─────────────────────────────────────────────────────────────────
export function truncate(str: string, length = 80): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Tier helpers ─────────────────────────────────────────────────────────────
export const TIER_ORDER: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ELITE: 3,
};

export function tierAtLeast(userTier: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[required];
}

export function getTierColor(tier: SubscriptionTier): string {
  const map: Record<SubscriptionTier, string> = {
    FREE: 'text-text-secondary border-white/10',
    BASIC: 'text-brand-info border-brand-info/30 bg-brand-info/10',
    PRO: 'text-accent border-accent/30 bg-accent/10',
    ELITE: 'text-brand-xp border-brand-xp/30 bg-brand-xp/10',
  };
  return map[tier];
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────
export function getDifficultyColor(level: DifficultyLevel): string {
  const map: Record<DifficultyLevel, string> = {
    BEGINNER: 'text-brand-success border-brand-success/30 bg-brand-success/10',
    INTERMEDIATE: 'text-brand-xp border-brand-xp/30 bg-brand-xp/10',
    ADVANCED: 'text-brand-warning border-brand-warning/30 bg-brand-warning/10',
    EXAM_READY: 'text-brand-danger border-brand-danger/30 bg-brand-danger/10',
  };
  return map[level];
}

// ─── Mastery level ────────────────────────────────────────────────────────────
export function getMasteryColor(level: number): string {
  if (level < 40) return 'text-brand-danger';
  if (level < 70) return 'text-brand-xp';
  return 'text-brand-success';
}

export function getMasteryBarColor(level: number): string {
  if (level < 40) return 'bg-brand-danger';
  if (level < 70) return 'bg-brand-xp';
  return 'bg-brand-success';
}

// ─── SM-2 next review estimate ────────────────────────────────────────────────
export function getNextReviewEstimate(result: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'): string {
  const map = {
    AGAIN: 'Tomorrow',
    HARD: 'In 2 days',
    GOOD: 'In ~5 days',
    EASY: 'In ~10 days',
  };
  return map[result];
}

// ─── Password strength ────────────────────────────────────────────────────────
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  width: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;

  const levels: PasswordStrength[] = [
    { score: 0, label: '', color: 'bg-text-muted', width: 'w-0' },
    { score: 1, label: 'Weak', color: 'bg-brand-danger', width: 'w-1/4' },
    { score: 2, label: 'Fair', color: 'bg-brand-warning', width: 'w-2/4' },
    { score: 3, label: 'Good', color: 'bg-brand-xp', width: 'w-3/4' },
    { score: 4, label: 'Strong', color: 'bg-brand-success', width: 'w-full' },
  ];

  return levels[score] as PasswordStrength;
}

// ─── Local storage helpers ────────────────────────────────────────────────────
export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  },
  remove(key: string): void {
    localStorage.removeItem(key);
  },
};

// ─── Error message extractor ──────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    if ('response' in error) {
      const resp = (error as { response?: { data?: { message?: string } } }).response;
      if (resp?.data?.message) return resp.data.message;
    }
    if ('message' in error) return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
}

// ─── Countdown helpers ────────────────────────────────────────────────────────
export function secondsToMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Avatar fallback URL ──────────────────────────────────────────────────────
export function avatarFallback(firstName: string, lastName: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}+${lastName}&backgroundColor=1e2235&textColor=6ee7b7`;
}

// ─── Study session heatmap helpers ───────────────────────────────────────────
export function getHeatmapIntensity(minutes: number): string {
  if (minutes === 0) return 'bg-base-subtle';
  if (minutes < 30) return 'bg-accent-muted/30';
  if (minutes < 60) return 'bg-accent-muted/60';
  if (minutes < 120) return 'bg-accent/60';
  return 'bg-accent';
}
