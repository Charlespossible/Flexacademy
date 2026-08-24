import {
  HeroSection,
  FeaturesSection,
  HybridSection,
} from './home/HomeSections1to5';

import {
  TestimonialsSection,
  FinalCTASection,
} from './home/HomeSections6to10';

/**
 * Lean 5-section homepage — optimised for conversion, not education.
 *  1. Hero         — headline + subheadline + CTAs + exam chips + dashboard preview
 *  2. Features     — AI Tutor + Human Tutors bento + 3 supporting cards
 *  3. Hybrid       — 3-step AI → Tutor → Student handoff visual
 *  4. Testimonials — 2 focused cards (hybrid story + exam outcome story)
 *  5. Final CTA    — "You're never studying alone"
 *
 * Pricing lives at /pricing (linked in the navbar).
 * How It Works, Exam Categories, AI Showcase, Tutor Trust are
 * available as section components for dedicated feature pages.
 */
export default function HomePage() {
  return (
    <div className="bg-base overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <HybridSection />
      <TestimonialsSection />
      <FinalCTASection />
    </div>
  );
}
