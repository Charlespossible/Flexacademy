import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { DifficultyLevel, SubscriptionTier, ExamCategory } from '@/types';
import { EXAM_DISPLAY } from '@/types';

// ─── Base Badge ───────────────────────────────────────────────────────────────
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full text-xs font-medium border px-2.5 py-0.5 shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-base-elevated text-text-secondary border-border-subtle',
        accent: 'bg-accent/10 text-accent border-accent/30',
        success: 'bg-brand-success/10 text-brand-success border-brand-success/30',
        danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/30',
        warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/30',
        info: 'bg-brand-info/10 text-brand-info border-brand-info/30',
        xp: 'bg-brand-xp/10 text-brand-xp border-brand-xp/30',
        outline: 'bg-transparent text-text-secondary border-border-subtle',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          variant === 'success' && 'bg-brand-success',
          variant === 'danger' && 'bg-brand-danger',
          variant === 'warning' && 'bg-brand-warning',
          variant === 'info' && 'bg-brand-info',
          variant === 'accent' && 'bg-accent',
          variant === 'xp' && 'bg-brand-xp',
          !variant || variant === 'default' && 'bg-text-muted',
        )} />
      )}
      {children}
    </span>
  );
}

// ─── Difficulty Badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ level }: { level: DifficultyLevel }) {
  const map: Record<DifficultyLevel, { label: string; variant: BadgeProps['variant'] }> = {
    BEGINNER: { label: 'Beginner', variant: 'success' },
    INTERMEDIATE: { label: 'Intermediate', variant: 'xp' },
    ADVANCED: { label: 'Advanced', variant: 'warning' },
    EXAM_READY: { label: 'Exam Ready', variant: 'danger' },
  };
  const config = map[level];
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────
// Any paid tier (BASIC / PRO / ELITE) = FlexPass full access in our 2-plan model
function TierBadge({ tier }: { tier: SubscriptionTier }) {
  const isFlexPass = tier === 'BASIC' || tier === 'PRO' || tier === 'ELITE';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full text-xs font-bold border px-2.5 py-0.5',
        isFlexPass
          ? 'bg-accent/10 text-accent border-accent/30'
          : 'bg-base-elevated text-text-muted border-border-subtle'
      )}
    >
      {isFlexPass ? '✦ FlexPass' : 'Free'}
    </span>
  );
}

// ─── Exam Category Badge ──────────────────────────────────────────────────────
function ExamBadge({ category }: { category: ExamCategory }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-muted/30 text-accent border border-accent/20">
      {EXAM_DISPLAY[category]}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<string, BadgeProps['variant']> = {
    ACTIVE: 'success', APPROVED: 'success', COMPLETED: 'success', RESOLVED: 'success',
    PENDING: 'xp', SCHEDULED: 'xp', IN_PROGRESS: 'info',
    CANCELLED: 'danger', FAILED: 'danger', REJECTED: 'danger',
    EXPIRED: 'warning', TRIAL: 'info', UNDER_REVIEW: 'info',
  };
  const variant = variants[status] ?? 'default';
  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} dot className={className}>
      {label.charAt(0) + label.slice(1).toLowerCase()}
    </Badge>
  );
}

export { Badge, badgeVariants, DifficultyBadge, TierBadge, ExamBadge, StatusBadge };
