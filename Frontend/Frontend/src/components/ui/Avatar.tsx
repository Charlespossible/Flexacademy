import { cn, initials, avatarFallback } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  online?: boolean;
}

function Avatar({ src, firstName, lastName, size = 'md', className, online }: AvatarProps) {
  const sizeMap = {
    xs: 'w-6 h-6 text-2xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  const dotSizeMap = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  return (
    <div className={cn('relative shrink-0 inline-block', sizeMap[size])}>
      {src ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className={cn('w-full h-full rounded-full object-cover', className)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = avatarFallback(firstName, lastName);
          }}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center',
            'bg-accent-muted/40 text-accent font-semibold font-display',
            className
          )}
          aria-label={`${firstName} ${lastName}`}
        >
          {initials(firstName, lastName)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-base-surface',
            dotSizeMap[size],
            online ? 'bg-brand-success' : 'bg-text-muted'
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

export { Avatar };
