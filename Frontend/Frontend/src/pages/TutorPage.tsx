import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Brain, Users, Zap, Star, CheckCircle, ArrowRight,
  TrendingUp, Sparkles, Clock, BarChart2, Target,
  Award, BookOpen, MessageCircle, Video,
  Trophy, Flame, Bot, User, Plus, Minus,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// ─── Animation Helper ──────────────────────────────────────────────────────
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
  const inView = useInView(ref, { once: true, margin: '-64px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-accent/10 border border-accent/20 text-accent">
      <Sparkles size={10} aria-hidden="true" />
      {children}
    </span>
  );
}

// ─── Hybrid Model Explainer ───────────────────────────────────────────────
const HYBRID_BENEFITS = [
  {
    icon: Bot,
    title: 'AI Tutor (FlexBot)',
    description: 'Available 24/7, instant responses, covers all topics',
    color: 'from-blue-500 to-cyan-500',
    features: ['Instant answers', '24/7 availability', 'All subjects', 'Practice generation'],
  },
  {
    icon: User,
    title: 'Human Tutor',
    description: 'Personalized guidance, empathy, exam strategy',
    color: 'from-emerald-500 to-teal-500',
    features: ['Personal touch', 'Live sessions', 'Strategy coaching', 'Accountability'],
  },
  {
    icon: Zap,
    title: 'Combined Power',
    description: '100x faster learning with AI + human synergy',
    color: 'from-amber-500 to-orange-500',
    features: ['Optimized learning', 'Quick breakthroughs', 'Exam mastery', 'High success rate'],
  },
];

const AI_CAPABILITIES = [
  { icon: Brain, text: 'Understand any concept in seconds' },
  { icon: Zap, text: 'Generate unlimited practice questions' },
  { icon: BarChart2, text: 'Real-time performance analytics' },
  { icon: Target, text: 'Adaptive difficulty levels' },
  { icon: Clock, text: 'Instant explanations anytime' },
  { icon: BookOpen, text: 'Multi-language support (English & Pidgin)' },
];

const HUMAN_ADVANTAGES = [
  { icon: Users, text: 'One-on-one personalized coaching' },
  { icon: Video, text: 'Live video sessions & live classes' },
  { icon: MessageCircle, text: 'Exam strategy & mental preparation' },
  { icon: Award, text: 'Verified credentials & track record' },
  { icon: TrendingUp, text: 'Custom study plans & accountability' },
  { icon: Star, text: 'Emotional support & motivation' },
];

// ─── How They Work Together ────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    number: 1,
    title: 'Student Starts with AI',
    description: 'Ask FlexBot any question. Get instant clarity on concepts.',
    icon: Bot,
  },
  {
    number: 2,
    title: 'AI Identifies Gaps',
    description: 'FlexBot analyzes performance and identifies weak areas.',
    icon: BarChart2,
  },
  {
    number: 3,
    title: 'Match with Human Tutor',
    description: 'Based on gaps, we match you with the perfect human tutor.',
    icon: Users,
  },
  {
    number: 4,
    title: 'Human Augmented by AI',
    description: 'Tutor uses AI insights to create hyper-targeted sessions.',
    icon: Zap,
  },
  {
    number: 5,
    title: 'Continuous Loop',
    description: 'AI and human feedback creates exponential improvement.',
    icon: TrendingUp,
  },
  {
    number: 6,
    title: 'Master Your Exams',
    description: 'Ready for WAEC, JAMB, NECO with 100x confidence.',
    icon: Trophy,
  },
];

// ─── Featured Tutors ──────────────────────────────────────────────────────
const FEATURED_TUTORS = [
  {
    id: 1,
    name: 'Dr. Chioma Adeyemi',
    specialty: 'Mathematics & Physics',
    rating: 4.9,
    reviews: 342,
    students: 1200,
    hourlyRate: '₦3,500',
    about: 'Former JAMB tutor with 12+ years experience. Specializes in problem-solving techniques.',
    credentials: ['WAEC: A1', 'JAMB: 398/400', 'Physics PhD'],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chioma',
  },
  {
    id: 2,
    name: 'Tunde Okafor',
    specialty: 'English & Literature',
    rating: 4.8,
    reviews: 287,
    students: 950,
    hourlyRate: '₦2,500',
    about: 'Cambridge A-Level examiner. Known for making complex texts simple.',
    credentials: ['A* English', 'Examiner (Cambridge)', 'MA Literature'],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tunde',
  },
  {
    id: 3,
    name: 'Amara Okonkwo',
    specialty: 'Biology & Chemistry',
    rating: 4.95,
    reviews: 420,
    students: 1500,
    hourlyRate: '₦3,200',
    about: 'Medical school admissions expert. 98% of students get A1 in sciences.',
    credentials: ['Medicine (UNIBEN)', 'JAMB: 399/400', 'Certified educator'],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara',
  },
  {
    id: 4,
    name: 'Kazeem Adebayo',
    specialty: 'JAMB Prep & General Studies',
    rating: 4.7,
    reviews: 298,
    students: 1100,
    hourlyRate: '₦2,800',
    about: 'JAMB strategy specialist. Average student improvement: 80+ points.',
    credentials: ['JAMB: 395/400', 'Education strategist', 'Test prep expert'],
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kazeem',
  },
];

// ─── Matching Process ─────────────────────────────────────────────────────
const MATCHING_PROCESS = [
  {
    phase: 'Assessment',
    description: 'FlexBot assesses your learning style, goals, and weak areas',
    icon: BarChart2,
  },
  {
    phase: 'Criteria',
    description: 'We match based on subject, availability, teaching style, and experience',
    icon: Target,
  },
  {
    phase: 'Connection',
    description: 'You meet your tutor for a free 15-min consultation call',
    icon: Users,
  },
  {
    phase: 'Optimization',
    description: 'AI feeds performance data to tutor for personalized sessions',
    icon: Zap,
  },
];

// ─── Success Stories ──────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    student: 'Blessing Chioma',
    role: 'JAMB 2024 Success',
    text: 'FlexBot helped me understand concepts, but my tutor Amara took it to another level. Combined, I went from 180 to 360. This is real!',
    score: '360/400',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blessing',
  },
  {
    student: 'David Obi',
    role: 'WAEC Top Performer',
    text: 'The AI gave me instant feedback on 100s of practice questions, and my tutor Dr. Chioma made sure I understood the WHY. Perfect combo.',
    score: '8 A1s',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  },
  {
    student: 'Precious Adewale',
    role: 'Medical Admission',
    text: 'Amara + FlexBot accelerated my prep timeline. Got into med school on first try. The synergy was unreal.',
    score: 'UNILAG Med',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Precious',
  },
];

// ─── Tutor Card Component ────────────────────────────────────────────────
function TutorCard({ tutor, delay }: { tutor: typeof FEATURED_TUTORS[0]; delay: number }) {
  return (
    <FadeIn delay={delay}>
      <motion.div
        whileHover={{ y: -8 }}
        className="group"
      >
        <Card className="overflow-hidden h-full">
          {/* Image section */}
          <div className="relative h-32 bg-gradient-to-br from-accent/20 to-brand-info/20 overflow-hidden">
            <motion.img
              src={tutor.image}
              alt={tutor.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
            />
            <div className="absolute top-3 right-3 px-2 py-1 bg-brand-success/20 border border-brand-success/30 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <Star size={12} className="text-brand-success fill-brand-success" aria-hidden="true" />
                <span className="text-xs font-bold text-brand-success">{tutor.rating}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-5">
            {/* Name & specialty */}
            <h3 className="font-display font-semibold text-text-primary text-lg mb-1">
              {tutor.name}
            </h3>
            <p className="text-xs text-accent font-medium mb-3">
              {tutor.specialty}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="bg-base-elevated rounded-lg p-2">
                <p className="text-text-muted">Reviews</p>
                <p className="font-semibold text-text-primary">{tutor.reviews}</p>
              </div>
              <div className="bg-base-elevated rounded-lg p-2">
                <p className="text-text-muted">Students</p>
                <p className="font-semibold text-text-primary">{tutor.students.toLocaleString()}</p>
              </div>
            </div>

            {/* About */}
            <p className="text-xs text-text-muted mb-3 line-clamp-2">
              {tutor.about}
            </p>

            {/* Credentials */}
            <div className="flex flex-wrap gap-1 mb-4">
              {tutor.credentials.map((cred) => (
                <span
                  key={cred}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent/10 border border-accent/20 text-accent"
                >
                  {cred}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
              <span className="font-semibold text-text-primary">{tutor.hourlyRate}/hr</span>
              <Button
                variant="primary"
                size="sm"
                asChild
              >
                <Link to="/register">Book Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </FadeIn>
  );
}

// ─── FAQ Item ──────────────────────────────────────────────────────────
function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <FadeIn delay={index * 0.05}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <Card
          className={cn(
            'p-4 cursor-pointer transition-all duration-200',
            open && 'ring-1 ring-accent/30 shadow-glow-sm'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-text-primary text-sm">
                {question}
              </h4>
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="shrink-0 mt-0.5"
            >
              {open ? (
                <Minus size={18} className="text-accent" aria-hidden="true" />
              ) : (
                <Plus size={18} className="text-accent" aria-hidden="true" />
              )}
            </motion.div>
          </div>
          <motion.div
            initial={false}
            animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-text-muted pt-3 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        </Card>
      </button>
    </FadeIn>
  );
}

// ─── Main Tutor Page ───────────────────────────────────────────────────
export default function TutorPage() {
  return (
    <div className="bg-base overflow-x-hidden">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[600px] flex items-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(110,231,183,0.3), transparent)' }}
          />
          <div className="absolute -right-48 top-1/3 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: '#60a5fa' }}
          />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <FadeIn>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 inline-flex"
            >
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent/10 border border-accent/25 text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                AI + Human Tutoring Revolution
              </span>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-text-primary mb-6">
              100x Faster Learning with AI +{' '}
              <span className="text-gradient">Human Tutors</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg text-text-secondary leading-relaxed max-w-3xl mx-auto mb-10">
              FlexBot handles the heavy lifting. Your human tutor maximizes the breakthroughs. Together,
              they create an unstoppable learning machine that transforms your exam performance.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="shadow-glow gap-2" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Button>
              <Button size="xl" variant="secondary" gap-2 asChild>
                <Link to="/contact">Learn More</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* HYBRID MODEL BENEFITS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <SectionLabel>The Hybrid Advantage</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-4">
              AI Meets Human Expertise
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Each has superpowers. Together, they're unstoppable.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HYBRID_BENEFITS.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <motion.div whileHover={{ y: -4 }}>
                    <Card className="h-full">
                      <CardContent className="p-6">
                        <div className={cn(
                          'w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br',
                          `bg-gradient-to-br ${benefit.color}`
                        )}>
                          <Icon size={24} className="text-white" aria-hidden="true" />
                        </div>
                        <h3 className="font-display font-semibold text-lg text-text-primary mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-text-muted mb-4">
                          {benefit.description}
                        </p>
                        <div className="space-y-2">
                          {benefit.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-accent shrink-0" aria-hidden="true" />
                              <span className="text-xs text-text-secondary">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* HOW THEY WORK TOGETHER */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-base-surface">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Proven Workflow</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-4">
              The 6-Step Learning Loop
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              How AI and human expertise combine for exponential growth
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <FadeIn key={idx} delay={idx * 0.08}>
                  <Card className="relative h-full">
                    {/* Step number badge */}
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-accent to-brand-info flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {step.number}
                    </div>

                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
                        <Icon size={24} className="text-accent" aria-hidden="true" />
                      </div>
                      <h3 className="font-display font-semibold text-lg text-text-primary mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {step.description}
                      </p>
                    </CardContent>

                    {/* Connecting arrow (except last) */}
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <div className="hidden lg:block absolute -right-8 top-1/2 -translate-y-1/2">
                        <ArrowRight size={24} className="text-accent/30" aria-hidden="true" />
                      </div>
                    )}
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CAPABILITIES COMPARISON */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Feature Comparison</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-4">
              What Each Brings to the Table
            </h2>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* AI Capabilities */}
            <FadeIn>
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Bot size={24} className="text-blue-500" aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-text-primary">
                    AI Tutor Superpowers
                  </h3>
                </div>
                <ul className="space-y-3">
                  {AI_CAPABILITIES.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={14} className="text-blue-500" aria-hidden="true" />
                        </div>
                        <span className="text-sm text-text-secondary pt-0.5">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </FadeIn>

            {/* Human Advantages */}
            <FadeIn delay={0.1}>
              <Card className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <User size={24} className="text-emerald-500" aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-text-primary">
                    Human Tutor Advantages
                  </h3>
                </div>
                <ul className="space-y-3">
                  {HUMAN_ADVANTAGES.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={14} className="text-emerald-500" aria-hidden="true" />
                        </div>
                        <span className="text-sm text-text-secondary pt-0.5">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FEATURED TUTORS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-base-surface">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Top Performers</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-4">
              Meet Your Potential Tutors
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Vetted, verified, and proven to deliver results. Each has transformed hundreds of students.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_TUTORS.map((tutor, idx) => (
              <TutorCard key={tutor.id} tutor={tutor} delay={idx * 0.1} />
            ))}
          </div>

          <FadeIn delay={0.5}>
            <div className="text-center mt-12">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/tutors">
                  Browse All Tutors
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MATCHING PROCESS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Smart Matching</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-4">
              How We Match You with the Right Tutor
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Powered by AI analysis of your learning style and needs
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MATCHING_PROCESS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <Card className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                      <Icon size={24} className="text-accent" aria-hidden="true" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-text-primary mb-2">
                      {step.phase}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {step.description}
                    </p>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TESTIMONIALS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-base-surface">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <SectionLabel>Success Stories</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-4">
              Students Are Crushing It
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <motion.div whileHover={{ y: -4 }}>
                  <Card className="h-full">
                    <CardContent className="p-6">
                      {/* Stars */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className="text-brand-xp fill-brand-xp"
                            aria-hidden="true"
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-sm text-text-secondary mb-6 leading-relaxed italic">
                        "{testimonial.text}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.student}
                          className="w-10 h-10 rounded-full border-2 border-accent/20"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text-primary text-sm">
                            {testimonial.student}
                          </p>
                          <p className="text-xs text-text-muted">{testimonial.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent text-sm">
                            {testimonial.score}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FAQ */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <SectionLabel>Common Questions</SectionLabel>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-text-primary mt-4 mb-4">
              FAQs About Our Tutoring
            </h2>
          </FadeIn>

          <div className="space-y-3">
            {[
              {
                q: 'Do I have to use both AI and human tutors?',
                a: 'No! Use FlexBot alone or pair with a human tutor. Most students find the combination creates the fastest results, but it\'s your choice.',
              },
              {
                q: 'How are tutors selected and verified?',
                a: 'Every tutor undergoes rigorous vetting: credential verification, teaching demo, student feedback, and ongoing performance monitoring. Only the top 5% make it.',
              },
              {
                q: 'What if I don\'t click with my tutor?',
                a: 'We offer a free tutor swap within the first session. We also handle matching issues proactively based on your feedback.',
              },
              {
                q: 'Can I schedule sessions around my timetable?',
                a: 'Yes! Tutors offer flexible scheduling. Many work early mornings, evenings, and weekends. Check availability on the tutor profile.',
              },
              {
                q: 'How much does human tutoring cost?',
                a: 'Rates vary by tutor expertise and experience, typically ₦2,500 - ₦5,000/hour. All tutors show hourly rates upfront. FlexBot AI is included free in most plans.',
              },
              {
                q: 'Can FlexBot replace a human tutor?',
                a: 'FlexBot is incredible for concept clarity and practice, but human tutors add strategy, accountability, and emotional support. Together is 100x better.',
              },
            ].map((item, idx) => (
              <FAQItem
                key={idx}
                question={item.q}
                answer={item.a}
                index={idx}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FINAL CTA */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-base-surface">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <Card className="p-12 text-center border-accent/30">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6"
              >
                <Flame className="w-8 h-8 text-accent" aria-hidden="true" />
              </motion.div>

              <h2 className="font-display text-3xl lg:text-4xl font-bold text-text-primary mb-3">
                Ready for 100x Learning?
              </h2>
              <p className="text-text-muted mb-8 max-w-2xl mx-auto">
                Join thousands of students already crushing exams with AI + human tutoring.
                Start with AI, add a tutor, or go all-in. Your choice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  asChild
                >
                  <Link to="/register">
                    <Zap size={18} aria-hidden="true" />
                    Get Started Free
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  asChild
                >
                  <Link to="/tutors">
                    Browse Tutors
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
