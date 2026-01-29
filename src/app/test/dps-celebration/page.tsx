'use client';

import { useState } from 'react';
import { DPSScoreDisplay } from '@/components/ui/dps-score-display';
import { ViralCelebration } from '@/components/ui/viral-celebration';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassRipple } from '@/components/ui/glass-ripple';
import { ChromaticGlass } from '@/components/ui/chromatic-glass';
import { Zap, Sparkles, Play } from 'lucide-react';

export default function DPSCelebrationTestPage() {
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  const testScores = [25, 55, 72, 85, 95];

  const triggerScore = (newScore: number) => {
    setShowScore(false);
    setTimeout(() => {
      setScore(newScore);
      setShowScore(true);
    }, 100);
  };

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(155, 89, 182, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 217, 255, 0.06) 0%, transparent 50%),
          #0a0a0a
        `,
      }}
    >
      <h1 className="text-3xl font-bold text-white mb-2">
        Liquid Glass Design System Test
      </h1>
      <p className="text-[rgba(255,255,255,0.5)] mb-8">
        Test page for DPS celebration and glass components
      </p>

      {/* Section: DPS Score Tests */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4">DPS Score Display</h2>
        <div className="flex flex-wrap gap-3 mb-6">
          {testScores.map(s => (
            <GlassButton
              key={s}
              variant={s >= 80 ? 'primary' : 'ghost'}
              glow={s >= 80}
              onClick={() => triggerScore(s)}
              leftIcon={s >= 80 ? <Sparkles className="w-4 h-4" /> : undefined}
            >
              Test {s} DPS
            </GlassButton>
          ))}
        </div>

        {showScore && (
          <div className="max-w-md">
            <DPSScoreDisplay
              score={score}
              confidence={0.87}
              range={[Math.max(0, score - 10), Math.min(100, score + 10)]}
              animated={true}
            />
            <ViralCelebration score={score} />
          </div>
        )}
      </section>

      {/* Section: Glass Card Variants */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4">Glass Card Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard variant="default" className="p-6">
            <h3 className="text-white font-medium mb-2">Default Card</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-sm">
              Standard glass card with blur effect
            </p>
          </GlassCard>

          <GlassCard variant="elevated" className="p-6">
            <h3 className="text-white font-medium mb-2">Elevated Card</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-sm">
              Stronger blur and shadow for prominence
            </p>
          </GlassCard>

          <GlassCard
            variant="interactive"
            className="p-6"
            onClick={() => alert('Interactive card clicked!')}
          >
            <h3 className="text-white font-medium mb-2">Interactive Card</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-sm">
              Click me! Hover lift and press depth
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Section: Glass Button Variants */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4">Glass Button Variants</h2>
        <div className="flex flex-wrap gap-3">
          <GlassButton variant="primary" leftIcon={<Zap className="w-4 h-4" />}>
            Primary
          </GlassButton>
          <GlassButton variant="secondary">
            Secondary
          </GlassButton>
          <GlassButton variant="tertiary">
            Tertiary
          </GlassButton>
          <GlassButton variant="ghost">
            Ghost
          </GlassButton>
          <GlassButton variant="danger">
            Danger
          </GlassButton>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <GlassButton variant="primary" glow>
            Primary Glow
          </GlassButton>
          <GlassButton variant="secondary" glow>
            Secondary Glow
          </GlassButton>
          <GlassButton variant="tertiary" glow>
            Tertiary Glow
          </GlassButton>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <GlassButton size="sm">Small</GlassButton>
          <GlassButton size="md">Medium</GlassButton>
          <GlassButton size="lg">Large</GlassButton>
          <GlassButton loading>Loading</GlassButton>
          <GlassButton disabled>Disabled</GlassButton>
        </div>
      </section>

      {/* Section: Glass Ripple Effect */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4">Ripple Effect</h2>
        <GlassRipple className="inline-block rounded-2xl">
          <GlassCard variant="interactive" className="p-8">
            <div className="flex items-center gap-3">
              <Play className="w-6 h-6 text-white" />
              <span className="text-white font-medium">Click anywhere for ripple</span>
            </div>
          </GlassCard>
        </GlassRipple>
      </section>

      {/* Section: Chromatic Aberration Effect */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4">Chromatic Glass Effect</h2>
        <ChromaticGlass intensity={5} className="inline-block">
          <GlassCard variant="elevated" className="p-8">
            <h3 className="text-white font-medium mb-2">Hover for RGB Shift</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-sm">
              Move your mouse around to see the chromatic aberration effect
            </p>
          </GlassCard>
        </ChromaticGlass>
      </section>

      {/* Section: Video Card Example */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4">Video Card (9:16 aspect)</h2>
        <div className="w-[200px]">
          <GlassCard variant="video" className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white font-medium text-sm">Template Title</p>
              <p className="text-[rgba(255,255,255,0.6)] text-xs">@creator</p>
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-[#2ECC71]/80 text-white text-xs font-bold">
              85 DPS
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Verification Checklist */}
      <section className="mt-16 border-t border-[rgba(255,255,255,0.1)] pt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Verification Checklist</h2>
        <GlassCard variant="subtle" className="p-6">
          <ul className="space-y-2 text-[rgba(255,255,255,0.7)] text-sm">
            <li>[ ] Score animates from 0 to target</li>
            <li>[ ] Score color changes based on threshold (red → yellow → cyan → green)</li>
            <li>[ ] 80+ DPS triggers celebration with confetti</li>
            <li>[ ] Confetti animation is smooth (60fps)</li>
            <li>[ ] Celebration auto-dismisses after ~4 seconds</li>
            <li>[ ] Glass cards have visible blur effect</li>
            <li>[ ] Buttons have correct gradients and glow</li>
            <li>[ ] Ripple effect fires on click</li>
            <li>[ ] Chromatic aberration visible on hover</li>
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}
