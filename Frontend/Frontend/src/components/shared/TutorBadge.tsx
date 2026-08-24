import { ShieldCheck, Star } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { CourseTutor } from '@/features/courses/courseService';

/**
 * Who taught this. Shown wherever a course appears, because authorship is part
 * of how a student decides what to study — and it makes the human behind the
 * platform visible rather than leaving content feeling machine-generated.
 */
export function TutorBadge({
  tutor,
  size = 'sm',
  className,
}: {
  tutor: CourseTutor | null;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!tutor) {
    // Seeded/legacy courses have no author. Say so plainly rather than
    // rendering an empty slot that looks like a loading bug.
    return (
      <span className={cn('text-xs text-text-muted', className)}>
        FlexAcademy content
      </span>
    );
  }

  const { firstName, lastName, avatar } = tutor.user;
  const rating = Number(tutor.rating) || 0;

  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <Avatar
        firstName={firstName}
        lastName={lastName}
        src={avatar ?? undefined}
        size={size === 'md' ? 'md' : 'sm'}
      />
      <div className="min-w-0">
        <p
          className={cn(
            'font-medium text-text-primary truncate flex items-center gap-1',
            size === 'md' ? 'text-sm' : 'text-xs'
          )}
        >
          {firstName} {lastName}
          {tutor.isVerified && (
            <ShieldCheck
              size={size === 'md' ? 13 : 11}
              className="text-brand-success shrink-0"
              aria-label="Verified tutor"
            />
          )}
        </p>
        {rating > 0 && (
          <span className="flex items-center gap-1 text-2xs text-text-muted">
            <Star size={9} className="text-brand-xp fill-brand-xp" />
            {rating.toFixed(1)}
            {tutor.totalReviews ? ` (${tutor.totalReviews})` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
