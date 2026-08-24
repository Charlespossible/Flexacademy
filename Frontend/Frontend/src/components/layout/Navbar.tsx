import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronDown, Bell, LogOut, Settings, User,
  BookOpen, Brain, Target, Zap, Trophy, LayoutDashboard,
  Users, ClipboardList, CreditCard, BarChart2,
  GraduationCap,
  Sun, Moon, AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';
import type { SubscriptionTier, Role } from '@/types';

// ─── Nav links shown to authenticated students ────────────────────────────────
const STUDENT_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses',      icon: GraduationCap,   label: 'Courses'   },
  { to: '/ai-tutor',     icon: Brain,           label: 'AI Tutor'  },
  { to: '/exam/simulate',icon: Target,          label: 'Exam Sim'  },
  { to: '/gaps',         icon: AlertTriangle,   label: 'Gaps'      },
  { to: '/flashcards',   icon: Zap,             label: 'Flashcards'},
];

// ─── Nav links shown to authenticated tutors ──────────────────────────────────
const TUTOR_NAV = [
  { to: '/tutor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tutor/courses',   icon: BookOpen,        label: 'My Courses' },
  { to: '/tutor/insights',  icon: Brain,           label: 'Insights'   },
  { to: '/notifications',   icon: Bell,            label: 'Alerts'     },
  { to: '/settings',        icon: Settings,        label: 'Settings'   },
];

// ─── Nav links shown to admin / super-admin ──────────────────────────────────
const ADMIN_NAV = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Overview'     },
  { to: '/admin/applications', icon: ClipboardList,   label: 'Applications' },
  { to: '/admin/courses',      icon: BookOpen,        label: 'Content'      },
  { to: '/admin/users',        icon: Users,           label: 'Users'        },
  { to: '/notifications',      icon: Bell,            label: 'Alerts'       },
];

// ─── Nav links shown to authenticated parents ─────────────────────────────────
const PARENT_NAV = [
  { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Overview'      },
  { to: '/notifications',    icon: Bell,            label: 'Alerts'        },
  { to: '/settings',         icon: Settings,        label: 'Settings'      },
];


// ─── Dropdown mega-items for unauthenticated users ────────────────────────────
const FEATURE_ITEMS = [
  { icon: Brain, label: 'AI Tutor', desc: '24/7 personalised tutoring', to: '/register' },
  { icon: Target, label: 'Exam Simulation', desc: 'Timed WAEC, JAMB & more', to: '/register' },
  { icon: Zap, label: 'Smart Flashcards', desc: 'Spaced repetition system', to: '/register' },
  { icon: ClipboardList, label: 'Study Plans', desc: 'AI-generated daily plans', to: '/register' },
  { icon: Users, label: 'Live Classes', desc: 'Book verified tutors', to: '/register' },
  { icon: Trophy, label: 'Leaderboard', desc: 'Compete nationwide', to: '/register' },
];

// ─── Role / plan label ────────────────────────────────────────────────────────
// One source of truth for the badge shown under a user's name. Every role
// resolves to the same shape so the profile button keeps a constant height —
// previously STUDENT rendered a padded pill while other roles rendered plain
// text, which made the button (and the dropdown anchored to it) shift.
function roleMeta(role: Role | undefined, tier: SubscriptionTier | undefined) {
  switch (role) {
    case 'SUPER_ADMIN': return { label: 'Super Admin', text: 'text-red-400',    pill: 'bg-red-400/10 text-red-400 border-red-400/30'          };
    case 'ADMIN':       return { label: 'Admin',       text: 'text-amber-400',  pill: 'bg-amber-400/10 text-amber-400 border-amber-400/30'    };
    case 'TUTOR':       return { label: 'Tutor',       text: 'text-violet-400', pill: 'bg-violet-400/10 text-violet-400 border-violet-400/30' };
    case 'PARENT':      return { label: 'Parent',      text: 'text-blue-400',   pill: 'bg-blue-400/10 text-blue-400 border-blue-400/30'       };
    default: {
      const flexPass = tier === 'BASIC' || tier === 'PRO' || tier === 'ELITE';
      return flexPass
        ? { label: '✦ FlexPass', text: 'text-accent',     pill: 'bg-accent/10 text-accent border-accent/30'              }
        : { label: 'Free',       text: 'text-text-muted', pill: 'bg-base-elevated text-text-muted border-border-subtle' };
    }
  }
}

// Pill form — used where there is room to breathe (dropdown header, drawer).
function RolePill({ meta }: { meta: ReturnType<typeof roleMeta> }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5',
        'text-2xs font-bold whitespace-nowrap shrink-0',
        meta.pill
      )}
    >
      {meta.label}
    </span>
  );
}

// ─── Navbar Component ─────────────────────────────────────────────────────────
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user, subscription, isAuthenticated } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const navLinks =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? ADMIN_NAV  :
    user?.role === 'TUTOR'                                  ? TUTOR_NAV  :
    user?.role === 'PARENT'                                 ? PARENT_NAV :
    STUDENT_NAV;

  const profileMeta = roleMeta(user?.role, subscription?.tier);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'backdrop-blur-xl shadow-xl shadow-black/10'
            : 'bg-transparent'
        )}
        style={scrolled ? {
          backgroundColor: 'var(--navbar-bg)',
          borderBottom: '1px solid var(--navbar-border)',
        } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────────────────────── */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group shrink-0"
              aria-label="FlexAcademy home"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center"
              >
                <span className="font-display font-bold text-accent text-sm leading-none">F</span>
              </motion.div>
              <span className="font-display font-bold text-lg text-text-primary hidden sm:block">
                Flex<span className="text-accent">Academy</span>
              </span>
            </Link>

            {/* ── Desktop nav ──────────────────────────────────────────── */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {isAuthenticated ? (
                // Authenticated: show app links
                navLinks.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => cn(
                      'flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'text-accent bg-accent/10'
                        : 'text-text-secondary hover:text-text-primary hover:bg-base-subtle'
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </NavLink>
                ))
              ) : (
                // Unauthenticated: marketing links
                <>
                  {/* Features dropdown */}
                  <div ref={featuresRef} className="relative">
                    <button
                      onClick={() => setFeaturesOpen((v) => !v)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                        featuresOpen
                          ? 'text-accent bg-accent/10'
                          : 'text-text-secondary hover:text-text-primary hover:bg-base-subtle'
                      )}
                      aria-expanded={featuresOpen}
                      aria-haspopup="true"
                    >
                      Features
                      <motion.div animate={{ rotate: featuresOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {featuresOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full left-0 mt-2 w-80 bg-base-elevated border border-border-subtle rounded-2xl shadow-card overflow-hidden"
                        >
                          <div className="p-2">
                            {FEATURE_ITEMS.map(({ icon: Icon, label, desc, to }) => (
                              <Link
                                key={label}
                                to={to}
                                onClick={() => setFeaturesOpen(false)}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-base-subtle transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-accent/15 transition-colors">
                                  <Icon size={15} className="text-accent" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-border-subtle p-3">
                            <Link
                              to="/register"
                              onClick={() => setFeaturesOpen(false)}
                              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/15 transition-colors"
                            >
                              Explore all features →
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {[
                    { to: '/',        label: 'Home'    },
                    { to: '/exam',    label: 'Exams'   },
                    { to: '/pricing', label: 'Pricing' },
                    { to: '/contact', label: 'Contact' },
                  ].map(({ to, label }) => (
                    <a
                      key={label}
                      href={to}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-base-subtle transition-all duration-150"
                    >
                      {label}
                    </a>
                  ))}
                </>
              )}
            </nav>

            {/* ── Right actions ─────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  {/* Notification bell */}
                  <Link
                    to="/notifications"
                    className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-subtle transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {/* unread dot */}
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-danger border-2 border-base" />
                  </Link>

                  {/* Profile dropdown.
                      The wrapper matches the navbar row height (h-16) so the
                      panel's `top-full` resolves to the navbar's bottom edge
                      rather than the button's — otherwise the menu opens
                      overlapping the navbar border. */}
                  <div ref={profileRef} className="relative flex items-center h-16">
                    <button
                      onClick={() => setProfileOpen((v) => !v)}
                      className="flex items-center gap-2 h-10 pl-1 pr-1.5 lg:pr-2.5 rounded-xl hover:bg-base-subtle transition-colors"
                      aria-label="Profile menu"
                      aria-expanded={profileOpen}
                    >
                      <Avatar
                        src={user.avatar}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        size="sm"
                      />
                      {/* Constant two-line block: name over role/plan, both truncating
                          so a long name can never stretch the button into the nav. */}
                      <span className="hidden lg:flex flex-col items-start justify-center min-w-0 max-w-[8rem]">
                        <span className="w-full text-xs font-semibold text-text-primary leading-tight truncate">
                          {user.firstName}
                        </span>
                        <span className={cn('w-full text-2xs font-medium leading-tight truncate', profileMeta.text)}>
                          {profileMeta.label}
                        </span>
                      </span>
                      <ChevronDown
                        size={13}
                        className={cn(
                          'text-text-muted hidden lg:block shrink-0 transition-transform duration-200',
                          profileOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-base-elevated border border-border-subtle rounded-2xl shadow-card overflow-hidden"
                        >
                          {/* User info header */}
                          <div className="p-4 border-b border-border-subtle">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={user.avatar}
                                firstName={user.firstName}
                                lastName={user.lastName}
                                size="md"
                              />
                              {/* flex-1 + min-w-0 is what actually lets truncate
                                  kick in inside a flex row */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-text-primary truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-text-muted truncate">{user.email}</p>
                              </div>
                            </div>
                            {/* Plan / role gets its own row here, where there is
                                room for a full pill without distorting the button */}
                            <div className="mt-3">
                              <RolePill meta={profileMeta} />
                            </div>
                          </div>

                          {/* Menu items — role-aware */}
                          <div className="p-2">
                            {[
                              {
                                icon: LayoutDashboard,
                                label: 'Dashboard',
                                to: user?.role === 'PARENT'     ? '/parent/dashboard' :
                                    user?.role === 'TUTOR'      ? '/tutor/dashboard'  :
                                    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin/dashboard' :
                                    '/dashboard',
                              },
                              { icon: User, label: 'My Profile', to: '/profile' },
                              ...(user?.role === 'STUDENT' ? [
                                { icon: BarChart2, label: 'My Progress', to: '/progress' },
                                { icon: CreditCard, label: 'Subscription', to: '/subscription' },
                              ] : []),
                              { icon: Settings, label: 'Settings', to: '/settings' },
                            ].map(({ icon: Icon, label, to }) => (
                              <Link
                                key={to}
                                to={to}
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-base-subtle transition-colors"
                              >
                                <Icon size={15} />
                                {label}
                              </Link>
                            ))}
                          </div>

                          {/* Sign out */}
                          <div className="p-2 border-t border-border-subtle">
                            <button
                              onClick={() => { logout(); setProfileOpen(false); }}
                              disabled={isLoggingOut}
                              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-brand-danger hover:bg-brand-danger/10 transition-colors"
                            >
                              <LogOut size={15} />
                              {isLoggingOut ? 'Signing out…' : 'Sign out'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                // Guest CTAs
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/register')}
                    className="shadow-glow-sm"
                  >
                    Get started free
                  </Button>
                </div>
              )}

              {/* ── Theme toggle ─────────────────────────────────────── */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-subtle transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.span
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Sun size={17} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Moon size={17} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-base-subtle transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X size={20} />
                    </motion.div>
                  ) : (
                    <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[80vw] max-w-sm flex flex-col lg:hidden overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-subtle)' }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <span className="font-display font-bold text-accent text-xs">F</span>
                  </div>
                  <span className="font-display font-bold text-base text-text-primary">
                    Flex<span className="text-accent">Academy</span>
                  </span>
                </Link>
                <div className="flex items-center gap-1">
                  {/* Theme toggle in mobile drawer */}
                  <button
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-subtle transition-colors"
                  >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-base-subtle"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer body */}
              <div className="flex-1 p-4">
                {isAuthenticated ? (
                  <>
                    {user && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-base-subtle mb-4">
                        <Avatar src={user.avatar} firstName={user.firstName} lastName={user.lastName} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-text-muted truncate mb-1.5">{user.email}</p>
                          <RolePill meta={profileMeta} />
                        </div>
                      </div>
                    )}
                    <nav className="space-y-1">
                      {navLinks.map(({ to, icon: Icon, label }) => (
                        <NavLink
                          key={to}
                          to={to}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) => cn(
                            'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                            isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-base-subtle'
                          )}
                        >
                          <Icon size={17} />
                          {label}
                        </NavLink>
                      ))}
                    </nav>
                  </>
                ) : (
                  <nav className="space-y-1">
                    {[
                      ...FEATURE_ITEMS.map(f => ({ to: f.to, icon: f.icon, label: f.label })),
                      { to: '/#pricing', icon: CreditCard, label: 'Pricing' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={label}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-base-subtle transition-colors"
                      >
                        <Icon size={17} />
                        {label}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>

              {/* Drawer footer */}
              <div className="p-4 border-t border-border-subtle space-y-2">
                {isAuthenticated ? (
                  <Button
                    variant="danger"
                    size="md"
                    className="w-full"
                    leftIcon={<LogOut size={15} />}
                    loading={isLoggingOut}
                    onClick={() => { logout(); setMobileOpen(false); }}
                  >
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button variant="secondary" size="lg" className="w-full" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
                    </Button>
                    <Button size="lg" className="w-full" asChild>
                      <Link to="/register" onClick={() => setMobileOpen(false)}>Get started free</Link>
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
