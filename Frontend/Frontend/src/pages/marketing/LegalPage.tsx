import { Link } from 'react-router-dom';
import { ScrollText, Shield, Cookie } from 'lucide-react';

import { PageHero, Section, FadeIn } from '@/components/marketing/MarketingKit';
import { cn } from '@/lib/utils';

// ─── Document registry ────────────────────────────────────────────────────────
type Doc = {
  slug: 'privacy' | 'terms' | 'cookies';
  label: string;
  icon: React.ElementType;
  title: string;
  highlight: string;
  subtitle: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

const DOCS: Record<Doc['slug'], Doc> = {
  privacy: {
    slug: 'privacy',
    label: 'Privacy Policy',
    icon: Shield,
    title: 'Privacy',
    highlight: 'Policy',
    subtitle: 'What we collect, why we collect it, and the things we will never do with it.',
    updated: '2026-06-01',
    sections: [
      {
        heading: '1. Who we are',
        body: [
          'FlexAcademy Technologies Ltd is a company registered in Nigeria, operating the FlexAcademy learning platform. In this policy, "we", "us" and "our" refer to FlexAcademy Technologies Ltd.',
          'We are the data controller for the personal information described in this policy. You can reach our data protection contact at privacy@flexacademy.ng.',
        ],
      },
      {
        heading: '2. Information we collect',
        body: [
          'Account information: your name, email address, role (student, parent, tutor), and — for students — your target examination, subjects and grade level.',
          'Learning data: questions you attempt, answers you give, time spent, topic mastery scores and the gaps our engine identifies. This is the core of what makes the product work.',
          'Conversation data: messages exchanged with our AI tutor, retained so that students, and where applicable their linked parent, can review them.',
          'Payment data: we use a third-party payment processor. We receive confirmation of payment and the last four digits of your card. We never see or store full card numbers.',
          'Technical data: IP address, device type, browser and pages visited, used for security and to keep the platform fast on Nigerian networks.',
        ],
      },
      {
        heading: '3. How we use your information',
        body: [
          'To provide the service: personalising your study plan, generating gap reports, matching you with tutors and processing payments.',
          'To communicate with you: transactional emails about your account, and — only if you opt in — product updates and study tips.',
          'To improve the platform: understanding aggregate patterns in how students learn so we can build better teaching tools.',
          'To keep everyone safe: detecting fraud, abuse and safeguarding concerns on accounts belonging to minors.',
        ],
      },
      {
        heading: '4. What we will never do',
        body: [
          'We do not sell your personal data. Not to advertisers, not to data brokers, not to anyone.',
          'We do not show third-party advertising on the platform, so we have no commercial reason to profile you for advertisers.',
          'We do not use identifiable student learning data to train third-party AI models.',
        ],
      },
      {
        heading: '5. Children and parental access',
        body: [
          'FlexAcademy is designed for secondary and pre-university students, many of whom are minors. Where a student is under 18, a parent or guardian may link their account and review learning progress and AI conversations.',
          'We collect the minimum information necessary from student accounts and apply content filtering to all AI interactions.',
        ],
      },
      {
        heading: '6. Sharing your information',
        body: [
          'With your tutor: if you book a session, your matched tutor sees your relevant gap report and progress in the subject they teach — not your full account.',
          'With your linked parent: progress data and AI conversations, where a parent link has been approved.',
          'With service providers: hosting, email delivery and payment processing partners, who are contractually bound to protect your data.',
          'When legally required: in response to a valid legal request from a competent authority.',
        ],
      },
      {
        heading: '7. Data retention',
        body: [
          'We keep your account data for as long as your account is active. If you delete your account, personal data is permanently removed within 30 days.',
          'Anonymised, aggregated performance statistics that cannot identify you may be retained for educational research.',
        ],
      },
      {
        heading: '8. Your rights',
        body: [
          'Under the Nigeria Data Protection Act you have the right to access your data, correct it, request its deletion, object to certain processing, and receive a portable copy.',
          'Exercise any of these by emailing privacy@flexacademy.ng. We respond within 30 days.',
        ],
      },
      {
        heading: '9. Security',
        body: [
          'Data is encrypted in transit and at rest. Access to production systems is restricted, logged and reviewed.',
          'No system is perfectly secure. If a breach ever affects your personal data, we will notify you and the relevant authority without undue delay.',
        ],
      },
      {
        heading: '10. Changes to this policy',
        body: [
          'If we make material changes we will notify you by email and in the app at least 14 days before they take effect. The date at the top of this page always reflects the current version.',
        ],
      },
    ],
  },

  terms: {
    slug: 'terms',
    label: 'Terms of Service',
    icon: ScrollText,
    title: 'Terms of',
    highlight: 'Service',
    subtitle: 'The agreement between you and FlexAcademy. Written to be read, not to be skipped.',
    updated: '2026-06-01',
    sections: [
      {
        heading: '1. Agreement',
        body: [
          'By creating an account or using FlexAcademy you agree to these terms. If you are under 18, you confirm that a parent or guardian has reviewed and accepted them on your behalf.',
        ],
      },
      {
        heading: '2. Your account',
        body: [
          'You are responsible for keeping your login credentials confidential and for all activity under your account.',
          'One account per person. Sharing an account between multiple students degrades the personalisation engine and may result in suspension.',
          'You must provide accurate information, particularly your examination board and subjects, since the platform builds your study plan from it.',
        ],
      },
      {
        heading: '3. Subscriptions and payment',
        body: [
          'Paid plans renew automatically at the end of each billing period until cancelled. You may cancel at any time from Settings → Subscription.',
          'Cancelling stops future charges. You retain access for the remainder of the period you have already paid for.',
          'We offer a full refund within 7 days of your first payment on any plan. Later refunds are considered case by case.',
          'We may change pricing with at least 30 days notice. Existing subscribers keep their current rate until the end of their billing period.',
        ],
      },
      {
        heading: '4. Acceptable use',
        body: [
          'Do not scrape, resell or redistribute our question bank, explanations or AI outputs.',
          'Do not attempt to use the AI tutor to complete assessed work that your school requires you to do unaided. The platform is a study aid, not a substitute for your own effort.',
          'Do not harass tutors or other students, upload unlawful content, or attempt to bypass technical restrictions.',
          'Accounts that breach these rules may be suspended or terminated without refund.',
        ],
      },
      {
        heading: '5. Tutors on the platform',
        body: [
          'Tutors are independent contractors, not employees of FlexAcademy. We verify credentials and references, but we do not guarantee particular outcomes from any session.',
          'Tutors set their own rates. FlexAcademy retains a 15% platform fee from each completed booking.',
          'Sessions cancelled less than 12 hours before the scheduled start are chargeable, since the tutor has reserved the slot.',
        ],
      },
      {
        heading: '6. Intellectual property',
        body: [
          'The platform, its content, branding and software are owned by FlexAcademy Technologies Ltd. You receive a personal, non-transferable licence to use them for your own study.',
          'Content you create — notes, answers, flashcards you write — remains yours. You grant us a licence to store and display it in order to operate the service.',
        ],
      },
      {
        heading: '7. No guarantee of results',
        body: [
          'We build the best preparation tools we can, and our students consistently improve. But we cannot and do not guarantee any particular examination grade or admission outcome.',
        ],
      },
      {
        heading: '8. Availability and liability',
        body: [
          'We aim for continuous availability but do not guarantee uninterrupted service. Maintenance and outages happen.',
          'To the fullest extent permitted by Nigerian law, our total liability arising from your use of the platform is limited to the amount you paid us in the twelve months preceding the claim.',
        ],
      },
      {
        heading: '9. Termination',
        body: [
          'You may delete your account at any time. We may suspend or terminate accounts that breach these terms, and will explain why where we lawfully can.',
        ],
      },
      {
        heading: '10. Governing law',
        body: [
          'These terms are governed by the laws of the Federal Republic of Nigeria. Disputes are subject to the exclusive jurisdiction of the Nigerian courts.',
        ],
      },
    ],
  },

  cookies: {
    slug: 'cookies',
    label: 'Cookie Policy',
    icon: Cookie,
    title: 'Cookie',
    highlight: 'Policy',
    subtitle: 'The small files we store in your browser, what each one does, and how to turn off the optional ones.',
    updated: '2026-06-01',
    sections: [
      {
        heading: '1. What cookies are',
        body: [
          'Cookies are small text files a website stores in your browser. They let the site remember things between page loads — most importantly, that you are signed in.',
          'We also use similar technologies such as local storage, which works the same way for our purposes and is covered by this policy.',
        ],
      },
      {
        heading: '2. Strictly necessary cookies',
        body: [
          'Authentication: keeps you signed in as you move between pages, and keeps your session secure. Without this you would have to log in on every single page.',
          'Security: helps us detect and block automated abuse and cross-site request forgery.',
          'Preferences: remembers your theme choice (dark or light) and your selected exam and subjects.',
          'These cannot be switched off, because the platform genuinely does not function without them.',
        ],
      },
      {
        heading: '3. Analytics cookies',
        body: [
          'We use privacy-respecting analytics to understand which features are used and where students get stuck — for example, noticing that a particular onboarding step is being abandoned.',
          'This data is aggregated. We do not use it to build advertising profiles, and we do not share it with advertisers.',
          'You can opt out of analytics cookies without any loss of functionality.',
        ],
      },
      {
        heading: '4. What we do not use',
        body: [
          'We do not run third-party advertising cookies or tracking pixels from ad networks. FlexAcademy carries no advertising, so there is nothing to target.',
        ],
      },
      {
        heading: '5. Managing cookies',
        body: [
          'You can control non-essential cookies from Settings → Privacy inside the app.',
          'You can also clear or block cookies entirely in your browser settings. Note that blocking strictly necessary cookies will sign you out and prevent you from logging back in.',
        ],
      },
      {
        heading: '6. Changes',
        body: [
          'If we introduce new categories of cookies we will update this page and, where required, ask for your consent before setting them.',
        ],
      },
    ],
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LegalPage({ doc: slug }: { doc: Doc['slug'] }) {
  const doc = DOCS[slug];

  return (
    <div className="bg-base">
      <PageHero
        eyebrow={`Updated ${new Date(doc.updated).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        eyebrowIcon={doc.icon}
        title={doc.title}
        highlight={doc.highlight}
        subtitle={doc.subtitle}
      />

      <Section narrow className="pt-12">
        {/* Cross-links between the three legal documents */}
        <FadeIn className="mb-10">
          <div className="flex flex-wrap items-center gap-2">
            {Object.values(DOCS).map((d) => (
              <Link
                key={d.slug}
                to={`/${d.slug}`}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  d.slug === slug
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-base-surface text-text-muted border-border-subtle hover:text-text-primary'
                )}
              >
                <d.icon size={12} />
                {d.label}
              </Link>
            ))}
          </div>
        </FadeIn>

        {/* Body */}
        <article className="space-y-9">
          {doc.sections.map((s, i) => (
            <FadeIn key={s.heading} delay={Math.min(i * 0.04, 0.3)}>
              <section>
                <h2 className="font-display text-lg font-bold text-text-primary mb-3 tracking-tight">
                  {s.heading}
                </h2>
                <div className="space-y-3">
                  {s.body.map((p, j) => (
                    <p key={j} className="text-sm text-text-secondary leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            </FadeIn>
          ))}
        </article>

        {/* Footer note */}
        <FadeIn delay={0.1}>
          <div className="mt-12 pt-8 border-t border-border-subtle">
            <p className="text-sm text-text-muted leading-relaxed">
              Questions about this document? Email{' '}
              <a href="mailto:legal@flexacademy.ng" className="text-accent hover:underline">
                legal@flexacademy.ng
              </a>{' '}
              or{' '}
              <Link to="/contact" className="text-accent hover:underline">
                contact our team
              </Link>
              . We would rather explain it than have you guess.
            </p>
          </div>
        </FadeIn>
      </Section>
    </div>
  );
}
