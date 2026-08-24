import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold',
    'transition-all duration-150 select-none cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base',
    'disabled:pointer-events-none disabled:opacity-40',
    'font-body',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-accent text-base hover:bg-accent/90',
          'shadow-sm hover:shadow-glow-sm active:scale-[0.98]',
        ],
        secondary: [
          'bg-base-elevated text-text-primary border border-border-subtle',
          'hover:bg-base-subtle hover:border-border-subtle active:scale-[0.98]',
        ],
        ghost: [
          'text-text-secondary hover:bg-base-subtle hover:text-text-primary',
          'active:scale-[0.98]',
        ],
        danger: [
          'bg-brand-danger/10 text-brand-danger border border-brand-danger/30',
          'hover:bg-brand-danger/20 hover:border-brand-danger/50 active:scale-[0.98]',
        ],
        outline: [
          'border border-border-subtle text-text-primary',
          'hover:bg-base-subtle hover:border-border-active active:scale-[0.98]',
        ],
        link: [
          'text-accent underline-offset-4 hover:underline h-auto p-0',
          'rounded-none',
        ],
        tier: [
          'bg-gradient-to-r from-brand-xp to-yellow-300 text-base',
          'hover:opacity-90 active:scale-[0.98] font-bold tracking-wide',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        xl: 'h-13 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-xs': 'h-7 w-7 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // ── When asChild=true, Radix Slot uses React.Children.only internally.
    // It must receive exactly ONE React element child — no sibling nodes,
    // no falsy expressions, nothing else. Pass children directly and let
    // the consumer (e.g. <Link>) own its inner content entirely.
    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    // ── Normal <button> render — icons and loading state are safe here.
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {!loading && leftIcon && (
          <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
