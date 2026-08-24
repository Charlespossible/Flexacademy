import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight,  Clock, Target, Trophy, BarChart2, Brain, Zap, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EXAM_DISPLAY, type ExamCategory } from '@/types';

// ─── Animation helper ─────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const EXAM_CATEGORIES: {
  key: ExamCategory;
  emoji: string;
  fullName: string;
  description: string;
  questionCount: string;
  yearsAvailable: string;
  subjects: string[];
  accentColor: string;
  level: string;
}[] = [
  {
    key: 'WAEC',
    emoji: '📘',
    fullName: 'West African Senior School Certificate',
    description:
      'The most widely taken secondary school exit exam in West Africa. FlexAcademy covers all subjects with past papers from 2000 to the current year, complete with full marking schemes and AI explanations.',
    questionCount: '80,000+',
    yearsAvailable: '2000 – 2024',
    subjects: ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature', 'Geography', 'Accounting'],
    accentColor: '#60a5fa',
    level: 'Secondary',
  },
  {
    key: 'JAMB',
    emoji: '🎯',
    fullName: 'Joint Admissions and Matriculation Board (UTME)',
    description:
      'Nigeria\'s university entrance examination. Our JAMB prep covers all UTME subjects, Use of English, and subject combinations. Timed mock tests simulate the CBT format exactly.',
    questionCount: '60,000+',
    yearsAvailable: '1999 – 2024',
    subjects: ['Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature', 'Commerce', 'Accounting'],
    accentColor: '#6ee7b7',
    level: 'University Entrance',
  },
  {
    key: 'NECO',
    emoji: '📗',
    fullName: 'National Examinations Council',
    description:
      'The National Examinations Council conducts both the SSCE and BECE. FlexAcademy provides comprehensive NECO preparation across all subjects with past questions and structured study plans.',
    questionCount: '40,000+',
    yearsAvailable: '2001 – 2024',
    subjects: ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Agricultural Science', 'Civic Education', 'Economics', 'History'],
    accentColor: '#34d399',
    level: 'Secondary',
  },
  {
    key: 'GCE',
    emoji: '📕',
    fullName: 'General Certificate of Education (Nov/Dec)',
    description:
      'The GCE November/December external exam for candidates who missed or wish to improve their WAEC results. Full past question coverage with AI-powered weak area analysis.',
    questionCount: '20,000+',
    yearsAvailable: '2005 – 2024',
    subjects: ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature', 'Geography'],
    accentColor: '#fb923c',
    level: 'Secondary',
  },
  {
    key: 'COMMON_ENTRANCE',
    emoji: '🏫',
    fullName: 'Common Entrance Examination',
    description:
      'Preparatory school entrance exams for Junior Secondary School (JSS1). FlexAcademy\'s adaptive learning system identifies weak spots and builds confidence before the big day.',
    questionCount: '5,000+',
    yearsAvailable: '2010 – 2024',
    subjects: ['English Language', 'Mathematics', 'Quantitative Reasoning', 'Verbal Reasoning', 'General Knowledge'],
    accentColor: '#60a5fa',
    level: 'Primary → Junior Secondary',
  },
  {
    key: 'IGCSE',
    emoji: '🌍',
    fullName: 'Cambridge International GCSE',
    description:
      'The internationally recognised qualification from Cambridge Assessment. Our IGCSE preparation covers core and extended curricula across all major subjects with Cambridge-style mark schemes.',
    questionCount: '15,000+',
    yearsAvailable: '2010 – 2024',
    subjects: ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'Business Studies', 'Computer Science', 'History', 'Geography'],
    accentColor: '#a78bfa',
    level: 'International Secondary',
  },
  {
    key: 'SAT',
    emoji: '🏆',
    fullName: 'Scholastic Assessment Test',
    description:
      'The standard US college admission test. FlexAcademy\'s SAT prep covers Evidence-Based Reading & Writing and Math sections, with full-length timed mock tests matching the Digital SAT format.',
    questionCount: '10,000+',
    yearsAvailable: '2015 – 2024',
    subjects: ['Evidence-Based Reading', 'Writing and Language', 'Math (No Calculator)', 'Math (Calculator)', 'Essay (optional)'],
    accentColor: '#f472b6',
    level: 'International University Entrance',
  },
  {
    key: 'IELTS',
    emoji: '✈️',
    fullName: 'International English Language Testing System',
    description:
      'The world\'s most popular English proficiency test for study abroad, work, and immigration. FlexAcademy covers all four sections: Listening, Reading, Writing, and Speaking preparation.',
    questionCount: '8,000+',
    yearsAvailable: '2015 – 2024',
    subjects: ['Listening', 'Academic Reading', 'General Reading', 'Academic Writing', 'General Writing', 'Speaking Practice'],
    accentColor: '#facc15',
    level: 'International Proficiency',
  },
];

const PLATFORM_FEATURES = [
  {
    icon: FileText,
    title: 'Past questions by year',
    desc: 'Filter questions by year, topic, and difficulty. Every question is verified and explained.',
  },
  {
    icon: Clock,
    title: 'Timed simulations',
    desc: 'Full-length mock exams with server-side timers that match the real exam format exactly.',
  },
  {
    icon: Brain,
    title: 'AI explanations',
    desc: 'FlexBot explains every wrong answer in plain English, with worked examples and diagrams.',
  },
  {
    icon: BarChart2,
    title: 'Mastery tracking',
    desc: 'Topic-by-topic mastery scores show exactly where to focus your remaining study time.',
  },
  {
    icon: Zap,
    title: 'Smart flashcards',
    desc: 'Auto-generated flashcards from past questions. Spaced repetition schedules your reviews.',
  },
  {
    icon: Trophy,
    title: 'Performance badges',
    desc: 'Earn XP and badges as you progress. Climb the national leaderboard for your exam type.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ExamsPage() {
  return (
    <div
      className="min-h-screen pt-20"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center top, var(--accent-primary) 0%, transparent 68%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex"
          >
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
              style={{
                backgroundColor: 'var(--accent-glow)',
                border: '1px solid var(--border-active)',
                color: 'var(--accent-primary)',
              }}
            >
              <Target size={11} /> Supported Examinations
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl lg:text-6xl font-bold mb-5"
            style={{ color: 'var(--text-primary)' }}
          >
            Every major exam.{' '}
            <span className="text-gradient">One platform.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            From WAEC and JAMB to IELTS and SAT — FlexAcademy has the past
            questions, AI tutoring, and timed simulations you need to walk in
            confident on exam day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Button size="lg" className="shadow-glow gap-2" asChild>
              <Link to="/register">
                Start preparing free
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/exam/simulate">Try a free simulation</Link>
            </Button>
          </motion.div>

          {/* Quick stat strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 mt-12"
          >
            {[
              { value: '8', label: 'Exam bodies' },
              { value: '238,000+', label: 'Past questions' },
              { value: '24 years', label: 'Of papers covered' },
              { value: '97%', label: 'Student pass rate' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="font-display text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── EXAM CARDS ──────────────────────────────────────────────────────── */}
      <section className="py-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {EXAM_CATEGORIES.map(
              (
                {
                  key,
                  emoji,
                  fullName,
                  description,
                  questionCount,
                  yearsAvailable,
                  subjects,
                  accentColor,
                  level,
                },
                i
              ) => (
                <FadeIn key={key} delay={i * 0.06}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {/* Card top accent bar */}
                    <div
                      className="h-1"
                      style={{ backgroundColor: accentColor }}
                    />

                    <div className="p-6 lg:p-8">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Left: identity */}
                        <div className="flex items-start gap-4 lg:w-64 shrink-0">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              border: `1px solid ${accentColor}30`,
                            }}
                          >
                            {emoji}
                          </div>
                          <div className="min-w-0">
                            <h2
                              className="font-display text-xl font-bold mb-0.5"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {EXAM_DISPLAY[key]}
                            </h2>
                            <p
                              className="text-xs leading-snug"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {fullName}
                            </p>
                            <span
                              className="inline-block mt-2 text-2xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${accentColor}18`,
                                color: accentColor,
                                border: `1px solid ${accentColor}35`,
                              }}
                            >
                              {level}
                            </span>
                          </div>
                        </div>

                        {/* Middle: description + subjects */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm leading-relaxed mb-4"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {description}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {subjects.map((s) => (
                              <span
                                key={s}
                                className="text-2xs font-medium px-2 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: 'var(--bg-elevated)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right: stats + CTA */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-3 shrink-0">
                          <div className="flex gap-4 lg:flex-col lg:gap-3 lg:text-right">
                            <div>
                              <p
                                className="font-display text-lg font-bold"
                                style={{ color: accentColor }}
                              >
                                {questionCount}
                              </p>
                              <p
                                className="text-2xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                questions
                              </p>
                            </div>
                            <div>
                              <p
                                className="font-display text-lg font-bold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {yearsAvailable}
                              </p>
                              <p
                                className="text-2xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                papers covered
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0 gap-1.5"
                            asChild
                          >
                            <Link to="/register">
                              Start prep
                              <ArrowRight size={13} />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </FadeIn>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ───────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14">
            <h2
              className="font-display text-3xl lg:text-4xl font-bold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              How FlexAcademy prepares you
            </h2>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Every exam type gets the same powerful toolkit — past questions,
              AI tutoring, and real-time performance tracking.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <FadeIn key={title} delay={i * 0.07}>
                <div
                  className="rounded-xl p-5 h-full"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: 'var(--accent-glow)',
                      border: '1px solid var(--border-active)',
                    }}
                  >
                    <Icon size={18} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <h3
                    className="font-display text-sm font-bold mb-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <FadeIn>
            <h2
              className="font-display text-4xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Ready to start{' '}
              <span className="text-gradient">practising?</span>
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Free access to core features. Upgrade anytime as your exam
              approaches.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" className="shadow-glow gap-2" asChild>
                <Link to="/register">
                  Create free account
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/pricing">View pricing</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
