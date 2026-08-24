import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// ─── Card ─────────────────────────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  accent?: boolean; // left accent border
  accentColor?: string;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, glow = false, accent = false, accentColor, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-base-surface border border-border-subtle rounded-xl shadow-card',
        hover && 'transition-all duration-200 hover:border-border-subtle hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        glow && 'shadow-accent border-accent/20',
        accent && 'border-l-2',
        className
      )}
      style={accent && accentColor ? { borderLeftColor: accentColor } : undefined}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

// ─── CardHeader ───────────────────────────────────────────────────────────────
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 p-5 pb-0', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

// ─── CardTitle ────────────────────────────────────────────────────────────────
const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display text-base font-semibold text-text-primary leading-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// ─── CardDescription ─────────────────────────────────────────────────────────
const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-muted', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

// ─── CardContent ──────────────────────────────────────────────────────────────
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// ─── CardFooter ───────────────────────────────────────────────────────────────
const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-5 pt-0', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconColor?: string;
  trend?: { value: number; label?: string };
  className?: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, iconColor = 'text-accent', trend, className, onClick }: StatCardProps) {
  return (
    <Card
      className={cn('p-5', onClick && 'cursor-pointer', className)}
      hover={!!onClick}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">{label}</p>
          <p className="font-display text-2xl font-bold text-text-primary truncate">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs mt-1',
              trend.value >= 0 ? 'text-brand-success' : 'text-brand-danger'
            )}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              {trend.label && <span className="text-text-muted ml-1">{trend.label}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg bg-base-elevated shrink-0',
            iconColor
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, StatCard };
