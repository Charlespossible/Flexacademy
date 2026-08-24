import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';
import type { SubscriptionTier } from '@/types';
import { Button } from '@/components/ui/Button';
import { TierBadge } from '@/components/ui/Badge';

// ─── ProtectedRoute — requires authentication ─────────────────────────────────
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ─── PublicOnlyRoute — redirect authenticated users away (e.g. login page) ───
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  if (!isInitialized) return <FullScreenLoader />;

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'PARENT') return <Navigate to="/parent/dashboard" replace />;
    if (user.role === 'TUTOR')  return <Navigate to="/tutor/dashboard"  replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── RoleGuard — role-based access ───────────────────────────────────────────
interface RoleGuardProps {
  children: React.ReactNode;
  roles: Array<'STUDENT' | 'TUTOR' | 'PARENT' | 'SCHOOL_ADMIN' | 'ADMIN' | 'SUPER_ADMIN'>;
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.role)) {
    return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── FeatureGate — subscription tier gating ──────────────────────────────────
interface FeatureGateProps {
  children: React.ReactNode;
  tier: SubscriptionTier;
  featureName?: string;
  renderLocked?: () => React.ReactNode;
}

export function FeatureGate({
  children,
  tier,
  featureName,
  renderLocked,
}: FeatureGateProps) {
  const hasFeature = useAuthStore((s) => s.hasFeature);

  if (hasFeature(tier)) return <>{children}</>;

  if (renderLocked) return <>{renderLocked()}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center bg-base-surface border border-border-subtle rounded-xl">
      <div className="w-12 h-12 rounded-full bg-accent-muted/30 border border-accent/20 flex items-center justify-center">
        <Lock size={20} className="text-accent" />
      </div>
      <div>
        <p className="font-display font-semibold text-text-primary mb-1">
          {featureName ?? 'This feature'} requires{' '}
          <TierBadge tier={tier} />
        </p>
        <p className="text-sm text-text-muted mt-2 max-w-xs">
          Unlock this and many more features by upgrading your plan.
        </p>
      </div>
      <Button asChild size="md">
        <Link to="/subscription">Upgrade now</Link>
      </Button>
    </div>
  );
}

// ─── Full screen loader (app initialisation) ──────────────────────────────────
function FullScreenLoader() {
  return (
    <div className="min-h-dvh bg-base flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-accent/10" />
          <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="font-display font-bold text-accent text-xs">F</span>
          </div>
          <span className="font-display text-base font-semibold text-text-primary">
            FlexAcademy
          </span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export { FullScreenLoader };
