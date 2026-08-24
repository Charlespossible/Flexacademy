import { Link } from 'react-router-dom';
import { Newspaper, Download, ExternalLink, Mail, Quote } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  PageHero, Section, FadeIn, StatStrip, CTASection,
} from '@/components/marketing/MarketingKit';

const COVERAGE = [
  { outlet: 'TechCabal',       title: 'FlexAcademy wants to give every Nigerian student an AI tutor', date: '2026-06-18' },
  { outlet: 'BusinessDay',     title: 'Edtech startups are betting on WAEC and JAMB prep',            date: '2026-05-02' },
  { outlet: 'Techpoint Africa', title: 'Inside the gap-detection engine reshaping exam revision',      date: '2026-03-27' },
  { outlet: 'The Guardian NG', title: 'Can AI close Nigeria\'s classroom teacher shortage?',           date: '2026-02-11' },
  { outlet: 'Nairametrics',    title: 'FlexAcademy crosses 40,000 active students',                    date: '2025-11-30' },
];

const RELEASES = [
  { title: 'FlexAcademy opens institutional pilot to 25 Nigerian schools', date: '2026-07-08' },
  { title: 'Verified tutor marketplace exits beta',                        date: '2026-04-15' },
  { title: 'FlexAcademy launches parent progress dashboards',              date: '2026-01-22' },
];

const FACTS = [
  { k: 'Founded',      v: '2023, Lagos, Nigeria' },
  { k: 'Headquarters', v: 'Lagos & Abuja' },
  { k: 'Team size',    v: '38 full-time' },
  { k: 'Exams covered', v: 'WAEC, JAMB, NECO, GCE, IGCSE, SAT, IELTS, Common Entrance, GMAT, GRE' },
  { k: 'Category',     v: 'Education technology / AI-assisted learning' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PressPage() {
  return (
    <div className="bg-base">
      <PageHero
        eyebrow="Press & media"
        eyebrowIcon={Newspaper}
        title="Press kit and"
        highlight="media resources."
        subtitle="Everything you need to write about FlexAcademy — company facts, brand assets, recent coverage, and a direct line to our team."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="mailto:press@flexacademy.ng">
              <Mail size={16} />
              press@flexacademy.ng
            </a>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/contact?category=other">
              <Download size={16} />
              Request brand assets
            </Link>
          </Button>
        </div>
      </PageHero>

      {/* ── Key numbers ──────────────────────────────────────────────────── */}
      <Section className="pt-12 pb-6">
        <StatStrip
          stats={[
            { value: '40,000+', label: 'Active students'   },
            { value: '1.2M',    label: 'Questions answered' },
            { value: '38',      label: 'Team members'      },
            { value: '2023',    label: 'Founded'           },
          ]}
        />
      </Section>

      {/* ── Boilerplate ──────────────────────────────────────────────────── */}
      <Section heading="Company boilerplate" narrow>
        <FadeIn>
          <div className="bg-base-surface border border-border-subtle rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-4">
              <Quote size={18} className="text-accent/50 shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary leading-relaxed">
                FlexAcademy is a Nigerian education technology company building AI-assisted exam
                preparation for secondary and pre-university students. The platform combines an AI
                tutor, a verified past-question bank spanning ten examinations, adaptive
                gap-detection, and a marketplace of vetted human tutors. Founded in Lagos in 2023,
                FlexAcademy serves more than 40,000 students across Nigeria.
              </p>
            </div>
            <p className="text-xs text-text-muted border-t border-border-subtle pt-4">
              Please use this paragraph verbatim when describing FlexAcademy in published work.
            </p>
          </div>
        </FadeIn>
      </Section>

      {/* ── Fast facts ───────────────────────────────────────────────────── */}
      <Section heading="Fast facts" narrow className="bg-base-surface/40 border-y border-border-subtle">
        <FadeIn>
          <dl className="bg-base-surface border border-border-subtle rounded-2xl divide-y divide-border-subtle overflow-hidden">
            {FACTS.map(({ k, v }) => (
              <div key={k} className="flex flex-col sm:flex-row gap-1 sm:gap-6 px-5 py-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted sm:w-40 shrink-0 pt-0.5">
                  {k}
                </dt>
                <dd className="text-sm text-text-secondary leading-relaxed">{v}</dd>
              </div>
            ))}
          </dl>
        </FadeIn>
      </Section>

      {/* ── Coverage ─────────────────────────────────────────────────────── */}
      <Section heading="In the news" narrow>
        <div className="space-y-3">
          {COVERAGE.map((c, i) => (
            <FadeIn key={c.title} delay={i * 0.06}>
              <div className="group flex items-center gap-4 bg-base-surface border border-border-subtle rounded-xl px-5 py-4 hover:border-border-active transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xs font-bold uppercase tracking-wider text-accent">
                      {c.outlet}
                    </span>
                    <span className="text-2xs text-text-muted">{formatDate(c.date)}</span>
                  </div>
                  <p className="text-sm text-text-primary leading-snug">{c.title}</p>
                </div>
                <ExternalLink
                  size={14}
                  className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Press releases ───────────────────────────────────────────────── */}
      <Section heading="Press releases" narrow className="bg-base-surface/40 border-y border-border-subtle">
        <div className="space-y-3">
          {RELEASES.map((r, i) => (
            <FadeIn key={r.title} delay={i * 0.06}>
              <div className="flex items-start gap-4 bg-base-surface border border-border-subtle rounded-xl px-5 py-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Newspaper size={15} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary leading-snug">{r.title}</p>
                  <p className="text-xs text-text-muted mt-1">{formatDate(r.date)}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── Brand guidance ───────────────────────────────────────────────── */}
      <Section heading="Using our brand" narrow>
        <FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
              <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Please do</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>Write our name as one word: FlexAcademy</li>
                <li>Use the supplied logo files without modification</li>
                <li>Keep clear space equal to the logo mark around it</li>
              </ul>
            </div>
            <div className="bg-base-surface border border-border-subtle rounded-2xl p-6">
              <h3 className="font-display font-semibold text-text-primary text-sm mb-3">Please don&apos;t</h3>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>Write &ldquo;Flex Academy&rdquo; or &ldquo;Flexacademy&rdquo;</li>
                <li>Recolour, stretch or add effects to the logo</li>
                <li>Imply partnership or endorsement without written consent</li>
              </ul>
            </div>
          </div>
        </FadeIn>
      </Section>

      <CTASection
        title="Working on a story?"
        sub="Our team responds to press enquiries within one business day."
        primaryLabel="Email the press team"
        primaryTo="/contact?category=other"
        secondaryLabel="About FlexAcademy"
        secondaryTo="/about"
      />
    </div>
  );
}
