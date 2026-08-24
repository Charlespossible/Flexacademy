import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useInView } from 'framer-motion';
import {
  Mail, MapPin, Phone,
  Send, MessageSquare, Zap, Clock,
  CheckCircle, ArrowRight, Linkedin, Twitter,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────
const contactFormSchema = z.object({
  name:      z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:     z.string().email('Please enter a valid email address'),
  subject:   z.string().min(5, 'Subject must be at least 5 characters').max(100),
  category:  z.enum(['support', 'business', 'feedback', 'partnership', 'careers', 'other'], {
    errorMap: () => ({ message: 'Please select a category' }),
  }),
  message:   z.string().min(10, 'Message must be at least 10 characters').max(5000),
  subscribe: z.boolean().default(false),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// ─── Static data ──────────────────────────────────────────────────────────────
const CONTACT_CHANNELS = [
  { icon: Mail,           title: 'Email Support', desc: 'We respond within 24 hours',        value: 'support@flexacademy.ng',  href: 'mailto:support@flexacademy.ng' },
  { icon: Phone,          title: 'Call Us',        desc: 'Mon – Fri, 9 AM – 6 PM WAT',       value: '+234 800 FLEX EDU',        href: 'tel:+234800333953'             },
  { icon: MapPin,         title: 'Visit Us',       desc: 'Lagos & Abuja offices',             value: 'Lagos, Nigeria',           href: '#'                             },
  { icon: MessageSquare,  title: 'Live Chat',      desc: 'Chat with our support team',        value: 'Available 24 / 7',         href: '#'                             },
];

const CATEGORIES = [
  { value: 'support',     label: 'Technical Support' },
  { value: 'business',    label: 'Business Inquiry'  },
  { value: 'feedback',    label: 'Feedback'          },
  { value: 'partnership', label: 'Partnership'       },
  { value: 'careers',     label: 'Careers'           },
  { value: 'other',       label: 'Other'             },
];

const FAQ_ITEMS = [
  {
    q: 'How quickly will I receive a response?',
    a: 'We typically respond to emails within 24 hours during business days. For urgent issues, use our live chat which is available 24/7.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major Nigerian debit/credit cards via Paystack, bank transfers, and mobile money platforms.',
  },
  {
    q: 'Can I schedule a demo?',
    a: 'Yes! Submit the form with category "Business Inquiry" and our team will reach out within 24 hours to book a time.',
  },
  {
    q: 'Do you offer school or corporate plans?',
    a: "Yes. We have bulk pricing for schools and enterprises. Choose the 'Partnership' category in the form and we'll send you a custom quote.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// ─── Channel Card ─────────────────────────────────────────────────────────────
function ChannelCard({ icon: Icon, title, desc, value, href }: (typeof CONTACT_CHANNELS)[0]) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="group flex flex-col gap-3 p-5 rounded-2xl bg-base-surface border border-border-subtle hover:border-accent/25 hover:shadow-glow transition-all duration-300"
    >
      <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
        <Icon size={20} className="text-accent" />
      </div>
      <div className="flex-1">
        <p className="font-display font-semibold text-text-primary text-sm mb-0.5">{title}</p>
        <p className="text-xs text-text-muted mb-2">{desc}</p>
        <p className="text-sm font-semibold text-accent">{value}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
        Contact <ArrowRight size={11} />
      </div>
    </motion.a>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <FadeIn delay={index * 0.06}>
      <div
        className={cn(
          'rounded-xl border transition-all duration-200 overflow-hidden',
          open ? 'border-accent/25 bg-accent/[0.03]' : 'border-border-subtle bg-base-surface'
        )}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          aria-expanded={open}
        >
          <span className="font-medium text-text-primary text-sm leading-snug">{q}</span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
            <ChevronDown size={16} className="text-accent" />
          </motion.div>
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <p className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">{a}</p>
        </motion.div>
      </div>
    </FadeIn>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative bg-base-surface border border-border-subtle rounded-2xl p-8 w-full max-w-sm text-center shadow-card"
      >
        <div className="w-14 h-14 rounded-full bg-brand-success/10 border-2 border-brand-success/25 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-brand-success" />
        </div>
        <h3 className="font-display font-bold text-xl text-text-primary mb-2">Message Sent!</h3>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          Thanks for reaching out. We'll get back to you within 24 hours.
        </p>
        <Button onClick={onClose} size="lg" className="w-full">Close</Button>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', subject: '', category: 'support', message: '', subscribe: false },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      await new Promise((r) => setTimeout(r, 1500));
      console.log('Contact form:', data);
      setShowSuccess(true);
      reset();
      setTimeout(() => setShowSuccess(false), 4000);
      toast.success("Message sent! We'll be in touch soon.");
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-base overflow-x-hidden">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] opacity-[0.12]"
            style={{ background: 'radial-gradient(ellipse at center top, #6ee7b7, transparent 68%)' }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold mb-6">
              <Zap size={12} />
              We&apos;re Here to Help
            </span>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-4">
              Get in Touch
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
              Have questions? Want to partner with us? Our team is ready to help.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Contact Channels ───────────────────────────────────────────────── */}
      <section className="pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACT_CHANNELS.map((ch, i) => (
              <FadeIn key={ch.title} delay={i * 0.07}>
                <ChannelCard {...ch} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Right Info ──────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

            {/* Contact Form */}
            <FadeIn>
              <div className="bg-base-surface border border-border-subtle rounded-2xl p-5 sm:p-8">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-1">
                  Send us a Message
                </h2>
                <p className="text-text-muted text-sm mb-7">
                  Fill out the form and we'll get back to you as soon as possible.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  {/* Name + Email row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="e.g. Ngozi Obi"
                      autoComplete="name"
                      error={errors.name?.message}
                      {...register('name')}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      leftIcon={<Mail size={14} />}
                      error={errors.email?.message}
                      {...register('email')}
                    />
                  </div>

                  {/* Category + Subject row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
                        Category
                      </label>
                      <select
                        {...register('category')}
                        className={cn(
                          'w-full bg-base-elevated border rounded-lg px-3.5 py-2.5 text-text-primary text-sm',
                          'focus:outline-none focus:ring-1 transition-all duration-150',
                          'border-border-subtle focus:border-accent/30 focus:ring-accent/20',
                        )}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1.5 text-xs text-brand-danger">⚠ {errors.category.message}</p>
                      )}
                    </div>
                    <Input
                      label="Subject"
                      placeholder="What is this about?"
                      error={errors.subject?.message}
                      {...register('subject')}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wide">
                      Message <span className="text-brand-danger">*</span>
                    </label>
                    <textarea
                      id="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                      className={cn(
                        'w-full bg-base-elevated border rounded-lg px-3.5 py-2.5',
                        'text-text-primary placeholder:text-text-muted text-sm',
                        'focus:outline-none focus:ring-1 transition-all duration-150 resize-none',
                        errors.message
                          ? 'border-brand-danger/50 focus:border-brand-danger focus:ring-brand-danger/20'
                          : 'border-border-subtle focus:border-accent/30 focus:ring-accent/20',
                      )}
                      {...register('message')}
                    />
                    {errors.message && (
                      <p className="mt-1.5 text-xs text-brand-danger">⚠ {errors.message.message}</p>
                    )}
                  </div>

                  {/* Subscribe */}
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border border-border-subtle bg-base-elevated accent-accent cursor-pointer"
                      {...register('subscribe')}
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                      Subscribe to our newsletter for updates
                    </span>
                  </label>

                  <Button type="submit" size="lg" className="w-full" loading={isSubmitting} leftIcon={!isSubmitting ? <Send size={16} /> : undefined}>
                    {isSubmitting ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>

                {/* Response time note */}
                <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-brand-info/5 border border-brand-info/20">
                  <Clock size={16} className="text-brand-info shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted">
                    <span className="font-semibold text-brand-info">Response time:</span>{' '}
                    We typically reply within 24 hours on business days.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* Right Column */}
            <div className="space-y-5">

              {/* Business Hours */}
              <FadeIn delay={0.18}>
                <div className="bg-base-surface border border-border-subtle rounded-2xl p-5">
                  <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    Business Hours
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM WAT' },
                      { day: 'Saturday',        hours: '10:00 AM – 4:00 PM WAT' },
                      { day: 'Sunday',          hours: 'Closed' },
                    ].map(({ day, hours }) => (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">{day}</span>
                        <span className={cn('font-semibold', hours === 'Closed' ? 'text-text-muted' : 'text-text-primary')}>{hours}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-4 pt-3 border-t border-border-subtle leading-relaxed">
                    Live chat is 24/7. Email on weekends may take up to 48 hours.
                  </p>
                </div>
              </FadeIn>

              {/* Social */}
              <FadeIn delay={0.26}>
                <div className="bg-base-surface border border-border-subtle rounded-2xl p-5">
                  <h3 className="font-display font-semibold text-text-primary mb-4">Connect With Us</h3>
                  <div className="flex gap-3">
                    {[
                      { href: 'https://twitter.com/flexacademy',           label: 'Twitter',  Icon: Twitter  },
                      { href: 'https://linkedin.com/company/flexacademy',  label: 'LinkedIn', Icon: Linkedin },
                    ].map(({ href, label, Icon }) => (
                      <motion.a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:shadow-glow transition-all"
                      >
                        <Icon size={17} />
                      </motion.a>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-base-surface/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-text-muted">
              Quick answers to common questions about the platform.
            </p>
          </FadeIn>
          <div className="space-y-2.5">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} {...item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <div className="bg-base-surface border border-accent/20 rounded-2xl p-8 sm:p-12 shadow-glow">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center mx-auto mb-6">
                <MessageSquare size={24} className="text-accent" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                Still have questions?
              </h2>
              <p className="text-text-muted mb-8 leading-relaxed">
                Our support team is ready to help. Reach out anytime through email or phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild>
                  <a href="mailto:support@flexacademy.ng" className="gap-2">
                    <Mail size={16} />
                    Email Us
                  </a>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <a href="tel:+234800333953" className="gap-2">
                    <Phone size={16} />
                    Call Now
                  </a>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </div>
  );
}
