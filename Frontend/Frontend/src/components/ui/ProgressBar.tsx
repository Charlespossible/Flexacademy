import { cn } from '@/lib/utils';

// ─── Linear Progress Bar ──────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'xp' | 'info';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

function ProgressBar({
  value,
  max = 100,
  size = 'sm',
  color = 'accent',
  showLabel = false,
  label,
  animated = true,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heightMap = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' };
  const colorMap = {
    accent: 'bg-accent',
    success: 'bg-brand-success',
    warning: 'bg-brand-warning',
    danger: 'bg-brand-danger',
    xp: 'bg-brand-xp',
    info: 'bg-brand-info',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-text-muted">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium text-text-secondary">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-base-subtle rounded-full overflow-hidden', heightMap[size])}>
        <div
          className={cn(
            'h-full rounded-full',
            colorMap[color],
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

// ─── Ring / Radial Progress ───────────────────────────────────────────────────
interface RingProgressProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
}

function RingProgress({
  value,
  size = 64,
  strokeWidth = 4,
  color = '#6ee7b7',
  trackColor = 'rgba(255,255,255,0.06)',
  className,
  children,
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}

export { ProgressBar, RingProgress };
