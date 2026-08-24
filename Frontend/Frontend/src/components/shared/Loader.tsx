import { motion } from 'framer-motion';

/**
 * Spinner — loading indicator
 * Used for async operations
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: { container: 'w-6 h-6', circle: 4 },
    md: { container: 'w-10 h-10', circle: 6 },
    lg: { container: 'w-16 h-16', circle: 8 },
  };

  const { container } = sizeMap[size];

  return (
    <div className={`${container} flex items-center justify-center`}>
      <motion.div
        className={`w-full h-full rounded-full border-2 border-accent/20 border-t-accent`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * FullScreenLoader — full viewport loading screen
 * Used for page transitions and initial auth check
 */
export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-base flex items-center justify-center z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Spinner size="lg" />
        <p className="text-sm text-text-muted">Loading...</p>
      </motion.div>
    </div>
  );
}

/**
 * SkeletonCard — placeholder for loading states
 */
export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <motion.div
          key={idx}
          className="h-24 bg-base-elevated rounded-xl animate-pulse"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
