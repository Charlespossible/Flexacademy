import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

// ─── Tooltip ──────────────────────────────────────────────────────────────────
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
}

function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 300,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-50 rounded-lg bg-base-elevated border border-border-subtle',
              'px-3 py-1.5 text-xs text-text-primary shadow-xl shadow-card',
              'animate-fade-in',
              className
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-base-elevated" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-px bg-base-subtle" />
      {label && <span className="text-xs text-text-muted shrink-0 font-medium">{label}</span>}
      <div className="flex-1 h-px bg-base-subtle" />
    </div>
  );
}

export { Tooltip, Divider };
