import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, Trophy, Brain, Target, Clock } from 'lucide-react';

// ─── Exam badges floating in brand panel ─────────────────────────────────────
const EXAM_BADGES = [
  { label: 'WAEC', emoji: '📘', delay: 0, x: '12%', y: '22%' },
  { label: 'JAMB/UTME', emoji: '🎯', delay: 0.15, x: '68%', y: '15%' },
  { label: 'NECO', emoji: '📗', delay: 0.3, x: '8%', y: '58%' },
  { label: 'IELTS', emoji: '🌍', delay: 0.45, x: '72%', y: '55%' },
  { label: 'SAT', emoji: '🏆', delay: 0.6, x: '38%', y: '75%' },
  { label: 'IGCSE', emoji: '📙', delay: 0.2, x: '55%', y: '38%' },
];

const FEATURES = [
  { icon: Brain, text: 'AI Tutor available 24/7' },
  { icon: Target, text: 'Past questions from 2000–2024' },
  { icon: Zap, text: 'Spaced repetition flashcards' },
  { icon: Trophy, text: 'Track mastery & climb leaderboards' },
  { icon: Clock, text: 'Timed exam simulations' },
  { icon: BookOpen, text: 'Structured study plans' },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
}

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh flex bg-base pt-16">
      {/* ─── Left Brand Panel ────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col overflow-hidden bg-base-surface">
        {/* Grid texture */}
        <div className="absolute inset-0 bg-grid opacity-60" />

        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-radial from-accent-glow via-transparent to-transparent" />

        {/* Top-right noise layer */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(110,231,183,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(110,231,183,0.4) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 p-8"
        >
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <span className="font-display font-bold text-accent text-base leading-none">F</span>
            </div>
            <span className="font-display font-bold text-xl text-text-primary tracking-tight">
              Flex<span className="text-accent">Academy</span>
            </span>
          </Link>
        </motion.div>

        {/* Main hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              Nigeria's #1 EdTech Platform
            </p>
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-text-primary leading-[1.1] mb-5">
              Study smarter.
              <br />
              <span className="text-gradient">Score higher.</span>
            </h1>
            <p className="text-text-secondary text-base leading-relaxed max-w-sm">
              Ace your WAEC, JAMB, NECO and more with AI-powered learning, past questions,
              and personalized study plans.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.ul
            className="mt-8 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.07 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-accent" />
                </div>
                <span className="text-sm text-text-secondary">{text}</span>
              </motion.li>
            ))}
          </motion.ul>

          {/* Floating exam badges */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {EXAM_BADGES.map(({ label, emoji, delay, x, y }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + delay }}
                className="absolute"
                style={{ left: x, top: y }}
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 3 + delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: delay * 2,
                  }}
                  className="flex items-center gap-1.5 bg-base-elevated/80 backdrop-blur-sm border border-border-subtle rounded-full px-3 py-1.5 shadow-lg"
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
                    {label}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="relative z-10 px-10 xl:px-16 py-8 border-t border-border-subtle"
        >
          <div className="flex items-center gap-8">
            {[
              { value: '50,000+', label: 'Active students' },
              { value: '200,000+', label: 'Past questions' },
              { value: '97%', label: 'Pass rate' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display font-bold text-xl text-text-primary">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Right Form Panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16 max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-text-primary">{heading}</h2>
              <p className="mt-1.5 text-sm text-text-secondary">{subheading}</p>
            </div>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
