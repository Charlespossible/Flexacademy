import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Clock, ArrowRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { PageHero, Section, FadeIn } from '@/components/marketing/MarketingKit';

type Post = {
  title: string;
  excerpt: string;
  category: 'Exam Prep' | 'Study Tips' | 'Product' | 'Parents';
  readMins: number;
  date: string;
  author: string;
  featured?: boolean;
};

const POSTS: Post[] = [
  {
    title: 'The 2026 JAMB syllabus changes nobody told you about',
    excerpt:
      'Four topics quietly moved between papers this year. We went through the official syllabus line by line so you do not revise the wrong thing.',
    category: 'Exam Prep',
    readMins: 8,
    date: '2026-07-14',
    author: 'Amara Obi',
    featured: true,
  },
  {
    title: 'Why re-reading your notes is the worst way to revise',
    excerpt:
      'It feels productive because it feels easy. Here is what the retrieval-practice research actually says, and what to do in the four weeks before an exam.',
    category: 'Study Tips',
    readMins: 6,
    date: '2026-07-02',
    author: 'Cosmas Nduka',
  },
  {
    title: 'How our gap-detection engine decides what you study next',
    excerpt:
      'A look under the hood at how FlexAcademy turns a wrong answer into a diagnosis, and a diagnosis into tomorrow morning\'s drill.',
    category: 'Product',
    readMins: 11,
    date: '2026-06-21',
    author: 'Tunde Adeyemi',
  },
  {
    title: 'A parent\'s guide to reading your child\'s progress report',
    excerpt:
      'Streaks and XP look nice, but they are not the numbers that matter. Here are the three metrics worth checking every Sunday evening.',
    category: 'Parents',
    readMins: 5,
    date: '2026-06-09',
    author: 'Chioma Okafor',
  },
  {
    title: 'Mastering WAEC Further Mathematics: a 12-week plan',
    excerpt:
      'The topic order that actually works, based on how marks are distributed across the last six years of past papers.',
    category: 'Exam Prep',
    readMins: 14,
    date: '2026-05-28',
    author: 'Amara Obi',
  },
  {
    title: 'Spaced repetition, explained without the jargon',
    excerpt:
      'Why reviewing something right before you forget it is worth ten times more than reviewing it while you still remember it perfectly.',
    category: 'Study Tips',
    readMins: 7,
    date: '2026-05-15',
    author: 'Cosmas Nduka',
  },
];

const CATEGORIES = ['All', 'Exam Prep', 'Study Tips', 'Product', 'Parents'] as const;

const CATEGORY_STYLES: Record<Post['category'], string> = {
  'Exam Prep':  'bg-accent/10 text-accent border-accent/20',
  'Study Tips': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'Product':    'bg-violet-400/10 text-violet-400 border-violet-400/20',
  'Parents':    'bg-brand-xp/10 text-brand-xp border-brand-xp/20',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CategoryChip({ category }: { category: Post['category'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider border',
        CATEGORY_STYLES[category]
      )}
    >
      {category}
    </span>
  );
}

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article
      className={cn(
        'group h-full flex flex-col bg-base-surface border border-border-subtle rounded-2xl overflow-hidden',
        'hover:border-border-active transition-colors'
      )}
    >
      {/* Abstract cover — no external images, so we generate a gradient */}
      <div
        className={cn('relative overflow-hidden shrink-0', featured ? 'h-40 sm:h-52' : 'h-28')}
        style={{
          background:
            'linear-gradient(135deg, var(--accent-glow), transparent 60%), var(--bg-elevated)',
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="absolute bottom-3 left-4">
          <CategoryChip category={post.category} />
        </div>
      </div>

      <div className={cn('flex flex-col flex-1', featured ? 'p-6' : 'p-5')}>
        <h3
          className={cn(
            'font-display font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors',
            featured ? 'text-xl mb-3' : 'text-base mb-2'
          )}
        >
          {post.title}
        </h3>
        <p className={cn('text-text-muted leading-relaxed flex-1', featured ? 'text-sm' : 'text-xs')}>
          {post.excerpt}
        </p>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-subtle text-xs text-text-muted">
          <span className="truncate">{post.author}</span>
          <span className="opacity-40">·</span>
          <span className="shrink-0">{formatDate(post.date)}</span>
          <span className="ml-auto flex items-center gap-1 shrink-0">
            <Clock size={11} />
            {post.readMins}m
          </span>
        </div>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [email, setEmail] = useState('');

  const visible = category === 'All' ? POSTS : POSTS.filter((p) => p.category === category);
  const [featured, ...rest] = visible;

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('You are on the list — first issue lands Sunday.');
    setEmail('');
  };

  return (
    <div className="bg-base">
      <PageHero
        eyebrow="The FlexAcademy blog"
        eyebrowIcon={PenLine}
        title="Notes on learning,"
        highlight="exams and the tech behind them."
        subtitle="Syllabus breakdowns, revision science that actually holds up, and the occasional look inside how we build FlexAcademy."
      />

      <Section className="pt-12">
        {/* Category filter */}
        <FadeIn className="mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 py-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  category === c
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-base-surface text-text-muted border-border-subtle hover:text-text-primary'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </FadeIn>

        {visible.length === 0 ? (
          <p className="text-center text-text-muted py-12 text-sm">No posts in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Featured post spans two columns on desktop */}
            <FadeIn className="lg:col-span-2">
              <PostCard post={featured} featured />
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 lg:col-span-1">
              {rest.slice(0, 2).map((p, i) => (
                <FadeIn key={p.title} delay={0.08 + i * 0.06}>
                  <PostCard post={p} />
                </FadeIn>
              ))}
            </div>

            {rest.slice(2).map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.06}>
                <PostCard post={p} />
              </FadeIn>
            ))}
          </div>
        )}
      </Section>

      {/* ── Newsletter ───────────────────────────────────────────────────── */}
      <Section narrow className="border-t border-border-subtle">
        <FadeIn>
          <div className="relative overflow-hidden bg-base-surface border border-border-subtle rounded-2xl p-7 sm:p-9 text-center">
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 rounded-full blur-3xl opacity-50 pointer-events-none"
              style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
            />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Mail size={18} className="text-accent" />
              </div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-2">
                One useful email, every Sunday
              </h2>
              <p className="text-sm text-text-muted mb-6 max-w-md mx-auto leading-relaxed">
                Exam countdowns, a study technique worth trying, and the week&apos;s best question
                from our bank. No spam, unsubscribe in one click.
              </p>

              <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="lg" className="shrink-0">
                  Subscribe
                  <ArrowRight size={15} />
                </Button>
              </form>
            </div>
          </div>
        </FadeIn>
      </Section>

      <Section narrow className="pt-0">
        <FadeIn>
          <p className="text-center text-sm text-text-muted">
            Want to write for us?{' '}
            <Link to="/contact?category=other" className="text-accent hover:underline">
              Pitch an article
            </Link>
          </p>
        </FadeIn>
      </Section>
    </div>
  );
}
