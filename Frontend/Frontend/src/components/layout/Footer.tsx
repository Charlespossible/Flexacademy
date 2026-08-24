import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Twitter, Youtube, Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { EXAM_DISPLAY, type ExamCategory } from '@/types';
import { ComingSoonBadge } from '@/components/marketing/MarketingKit';

// ─── Footer link groups ───────────────────────────────────────────────────────
// `soon` renders a "Soon" pill beside the label for features not yet live.
type FooterLink = { label: string; to: string; soon?: boolean };

const FOOTER_LINKS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Learn',
    links: [
      { label: 'Courses', to: '/courses' },
      { label: 'Flashcards', to: '/flashcards' },
      { label: 'Coding & AI', to: '/coding-ai', soon: true },
      { label: 'Past Questions', to: '/questions', soon: true },
      { label: 'Study Plans', to: '/study-plans', soon: true },
      { label: 'Live Classes', to: '/live-classes', soon: true },
    ],
  },
  {
    heading: 'Practice',
    links: [
      { label: 'Exam Simulation', to: '/exam/simulate' },
      { label: 'AI Tutor', to: '/ai-tutor' },
      { label: 'Leaderboard', to: '/leaderboard' },
      { label: 'Progress Tracker', to: '/progress' },
      { label: 'Certificates', to: '/certificates', soon: true },
    ],
  },
  {
    heading: 'Platform',
    links: [
      { label: 'For Schools', to: '/for-schools', soon: true },
      { label: 'For Parents', to: '/for-parents' },
      { label: 'Become a Tutor', to: '/become-a-tutor' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Referrals', to: '/referrals' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Press', to: '/press' },
      { label: 'Careers', to: '/careers' },
      { label: 'Contact', to: '/contact' },
      { label: 'Help Centre', to: '/help' },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Twitter, label: 'Twitter/X', href: 'https://twitter.com/flexacademy' },
  { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/@flexacademy' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/flexacademy' },
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com/flexacademy' },
];

const EXAM_CATEGORIES: ExamCategory[] = ['WAEC', 'JAMB', 'NECO', 'GCE', 'IGCSE', 'SAT', 'IELTS', 'COMMON_ENTRANCE', 'GMAT', 'GRE'];

// ─── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="relative bg-base-surface border-t border-border-subtle overflow-hidden">
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] opacity-60"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.3), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Upper section ──────────────────────────────────────────────── */}
        <div className="pt-16 pb-12 grid grid-cols-1 lg:grid-cols-6 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                <span className="font-display font-bold text-accent text-base">F</span>
              </div>
              <span className="font-display font-bold text-xl text-text-primary">
                Flex<span className="text-accent">Academy</span>
              </span>
            </Link>

            <p className="text-sm text-text-muted leading-relaxed max-w-xs mb-6">
              Nigeria&apos;s most powerful EdTech platform. Helping students ace WAEC, JAMB, NECO
              and international exams with AI-powered learning tools.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 mb-6">
              {[
                { icon: MapPin, text: 'Lagos & Abuja, Nigeria' },
                { icon: Mail, text: 'hello@flexacademy.ng' },
                { icon: Phone, text: '+234 800 FLEX EDU' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-text-muted">
                  <Icon size={13} className="text-accent/60 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.1, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-lg bg-base-elevated border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-colors"
                >
                  <Icon size={15} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading} className="lg:col-span-1">
              <h4 className="font-display text-xs font-bold text-text-primary uppercase tracking-widest mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, to, soon }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="group inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors"
                    >
                      <span>{label}</span>
                      {soon && <ComingSoonBadge className="group-hover:border-brand-xp/50" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Exam badges strip ───────────────────────────────────────────── */}
        <div className="py-6 border-t border-border-subtle">
          <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-4">
            Supported examinations
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAM_CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/5 border border-accent/15 text-accent/80"
              >
                {EXAM_DISPLAY[cat]}
              </span>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────────────────── */}
        <div className="py-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} FlexAcademy Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: 'Privacy Policy', to: '/privacy' },
              { label: 'Terms of Service', to: '/terms' },
              { label: 'Cookie Policy', to: '/cookies' },
            ].map(({ label, to }) => (
              <Link key={label} to={to} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
