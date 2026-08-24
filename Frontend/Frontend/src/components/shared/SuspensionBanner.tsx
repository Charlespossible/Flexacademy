import { AlertOctagon, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Shown to a suspended user on every page that renders it.
 *
 * Suspension is deliberately *soft*: the user keeps read access and can see
 * exactly why they were suspended and how to appeal. A silent lockout leaves
 * people with no recourse and generates support tickets that say only
 * "it stopped working".
 *
 * Renders nothing for users in good standing.
 */
export function SuspensionBanner() {
  const user = useAuthStore((s) => s.user);
  const suspendedAt = user?.suspendedAt;
  if (!suspendedAt) return null;

  const reason = user?.suspensionReason ?? 'No reason was recorded.';

  const since = new Date(suspendedAt).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 rounded-2xl bg-brand-danger/8 border border-brand-danger/30"
    >
      <AlertOctagon size={18} className="text-brand-danger shrink-0 mt-0.5" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-danger">
          Your account is suspended
        </p>
        <p className="text-sm text-text-secondary mt-1 leading-relaxed">{reason}</p>

        <p className="text-xs text-text-muted mt-2">
          Suspended on {since}. You can still view your account, but you cannot
          publish or edit content, and your students have been paused.
          Courses you already published remain available to them.
        </p>

        <a
          href="mailto:support@flexacademy.ng?subject=Suspension%20appeal"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent hover:underline"
        >
          <Mail size={12} />
          Appeal this decision
        </a>
      </div>
    </div>
  );
}
