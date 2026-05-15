/**
 * Public landing page (/) — The Escape Assessment.
 *
 * Long-form direct-response sales letter in the powered-instrument aesthetic.
 * The only actions on this page: enter a code (above the fold + at the bottom),
 * subscribe for code-drop notifications, or open the YouTube channel.
 *
 * No nav, no footer, no testimonials, no third-party tracking.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import '@/styles/instrument.css';

import { HookSection } from '@/components/landing/HookSection';
import { BetrayalSection } from '@/components/landing/BetrayalSection';
import { MethodSection } from '@/components/landing/MethodSection';
import { ReceiveSection } from '@/components/landing/ReceiveSection';
import { StackSection } from '@/components/landing/StackSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PromiseSection } from '@/components/landing/PromiseSection';
import { NotForSection } from '@/components/landing/NotForSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { ScarcitySection } from '@/components/landing/ScarcitySection';
import { CostSection } from '@/components/landing/CostSection';
import { CTASection } from '@/components/landing/CTASection';
import { CloseSection } from '@/components/landing/CloseSection';
import { CheckoutBanner } from '@/components/landing/CheckoutBanner';

export const metadata: Metadata = {
  title: 'The Escape Assessment',
  description:
    "A personalized 14-day sprint, calibrated to your income, your runway, and the life you're trying to build. Free with a code.",
  openGraph: {
    title: 'The Escape Assessment',
    description: "You weren't the failure. You were the product.",
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-instrument-bg text-instrument-primary font-body antialiased">
      <Suspense fallback={null}>
        <CheckoutBanner />
      </Suspense>
      <HookSection />
      <BetrayalSection />
      <MethodSection />
      <ReceiveSection />
      <StackSection />
      <TestimonialsSection />
      <PromiseSection />
      <NotForSection />
      <StatsSection />
      <ScarcitySection />
      <CostSection />
      <CTASection />
      <CloseSection />
    </main>
  );
}
