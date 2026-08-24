import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ─── FadeIn — shared scroll reveal (same easing as Home / Contact) ────────────
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── ComingSoonBadge — used in the footer + on gated pages ───────────────────
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 shrink-0 rounded-full',
        'px-1.5 py-[1px] text-3xs font-bold uppercase tracking-wider leading-[1.4]',
        'bg-brand-xp/10 text-brand-xp border border-brand-xp/25',
        'whitespace-nowrap',
        className
      )}
    >
      <span className="relative flex h-1 w-1 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-xp opacity-70" />
        <span className="relative inline-flex h-1 w-1 rounded-full bg-brand-xp" />
      </span>
      Soon
    </span>
  );
}

// ─── Eyebrow — small pill above a page title ─────────────────────────────────
export function Eyebrow({ icon: Icon = Sparkles, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 border border-accent/20 text-xs font-medium text-accent mb-5">
      <Icon size={12} />
      {children}
    </span>
  );
}

// ─── PageHero — the standard top block for every marketing page ──────────────
export function PageHero({
  eyebrow,
  eyebrowIcon,
  title,
  highlight,
  subtitle,
  children,
}: {
  eyebrow?: string;
  eyebrowIcon?: React.ElementType;
  title: string;
  highlight?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 sm:pt-24 sm:pb-16 text-center">
        <FadeIn>
          {eyebrow && <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>}
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-text-primary">
            {title}
            {highlight && <> <span className="text-gradient">{highlight}</span></>}
          </h1>
          {subtitle && (
            <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Section — consistent vertical rhythm + optional heading ─────────────────
export function Section({
  heading,
  sub,
  children,
  className,
  narrow = false,
}: {
  heading?: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <section className={cn('py-14 sm:py-16', className)}>
      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', narrow ? 'max-w-3xl' : 'max-w-6xl')}>
        {heading && (
          <FadeIn className="mb-10 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {heading}
            </h2>
            {sub && <p className="mt-3 text-text-muted max-w-2xl mx-auto leading-relaxed">{sub}</p>}
          </FadeIn>
        )}
        {children}
      </div>
    </section>
  );
}

// ─── FeatureCard — icon + title + copy tile ──────────────────────────────────
export function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent = 'text-accent',
  bg = 'bg-accent/10',
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  accent?: string;
  bg?: string;
}) {
  return (
    <div className="h-full bg-base-surface border border-border-subtle rounded-2xl p-6 hover:border-border-active transition-colors">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', bg)}>
        <Icon size={18} className={accent} />
      </div>
      <h3 className="font-display font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── StatStrip — big numbers row ─────────────────────────────────────────────
export function StatStrip({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(({ value, label }, i) => (
        <FadeIn key={label} delay={i * 0.06}>
          <div className="text-center bg-base-surface border border-border-subtle rounded-2xl py-6 px-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-accent leading-none">{value}</p>
            <p className="text-xs text-text-muted mt-2">{label}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}

// ─── CTASection — closing call to action ─────────────────────────────────────
export function CTASection({
  title,
  sub,
  primaryLabel = 'Get started free',
  primaryTo = '/register',
  secondaryLabel,
  secondaryTo,
}: {
  title: string;
  sub?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}) {
  return (
    <section className="py-16 border-t border-border-subtle">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">
            {title}
          </h2>
          {sub && <p className="text-text-muted mb-8 leading-relaxed">{sub}</p>}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={primaryTo}>
                {primaryLabel}
                <ArrowRight size={16} />
              </Link>
            </Button>
            {secondaryLabel && secondaryTo && (
              <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                <Link to={secondaryTo}>{secondaryLabel}</Link>
              </Button>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
