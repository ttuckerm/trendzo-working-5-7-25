'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { AGENCY_SKILL_SETS } from '@/lib/skills/agency-skills';

const NICHES = Object.keys(AGENCY_SKILL_SETS);

const T = {
  bg: '#08080d',
  card: '#1c1c24',
  accent: '#f04a4d',
  cyan: '#00d4ff',
  green: '#2dd4a8',
  textPrimary: '#e8e8f0',
  textSecondary: '#8888a0',
  textDim: '#55556a',
  raised: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
  inset: 'inset -3px -3px 8px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.6)',
} as const;

type Role = 'creator' | 'agency';

const FEATURES = [
  { title: 'VPS Predictions', desc: 'AI-powered viral potential scoring for your content', icon: '⚡' },
  { title: 'Content Briefs', desc: 'Strategic content plans tailored to your niche', icon: '📋' },
  { title: 'Coaching Insights', desc: 'Actionable recommendations to improve performance', icon: '🎯' },
  { title: 'Creator Cards', desc: 'Shareable profile cards with AI chat agents', icon: '🃏' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('creator');

  // Step 2 (agency)
  const [agencyName, setAgencyName] = useState('');
  const [agencyNiche, setAgencyNiche] = useState('');

  // Step 2/3 (creator)
  const [creatorNiche, setCreatorNiche] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);

      // Check if already onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded, full_name, role')
        .eq('id', user.id)
        .single();

      if (profile?.onboarded) {
        router.replace(profile.role === 'agency' ? '/agency' : '/dashboard');
        return;
      }

      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.role && (profile.role === 'agency' || profile.role === 'creator')) {
        setSelectedRole(profile.role as Role);
      }
      setLoading(false);
    }
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSteps = selectedRole === 'agency' ? 4 : 4;
  const progress = Math.round((step / totalSteps) * 100);

  const handleComplete = useCallback(async () => {
    if (!userId) return;
    setSaving(true);

    const niche = selectedRole === 'agency' ? agencyNiche : creatorNiche;

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        onboarded: true,
        full_name: fullName || null,
        role: selectedRole,
        primary_niche: niche || null,
      })
      .eq('id', userId);

    if (error) {
      console.error('[onboarding] Failed to update profile:', error);
      setSaving(false);
      return;
    }

    // Also update onboarding_profiles if it exists
    await supabase
      .from('onboarding_profiles')
      .update({
        onboarding_step: 'complete',
        onboarding_completed_at: new Date().toISOString(),
        niche_key: niche || null,
        account_type: selectedRole,
        business_name: selectedRole === 'agency' ? agencyName : fullName,
      })
      .eq('user_id', userId);

    // Redirect based on role
    router.replace(selectedRole === 'agency' ? '/agency' : '/dashboard');
  }, [userId, selectedRole, agencyNiche, creatorNiche, fullName, agencyName, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <div className="w-6 h-6 rounded-full animate-pulse" style={{ background: T.accent }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: T.bg }}>
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: T.textSecondary }}>
              Step {step} of {totalSteps}
            </span>
            <span className="text-[10px] font-mono" style={{ color: T.cyan }}>{progress}%</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: T.card }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: T.cyan }}
            />
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{ background: T.card, boxShadow: T.raised }}>
          {/* Step 1: Name + Role */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: T.textPrimary }}>Welcome to Trendzo</h1>
              <p className="text-sm mb-6" style={{ color: T.textSecondary }}>Let&apos;s get you set up.</p>

              <label className="block text-xs font-mono uppercase tracking-wide mb-2" style={{ color: T.textSecondary }}>
                Your name
              </label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-6"
                style={{ background: T.card, boxShadow: T.inset, color: T.textPrimary, border: 'none' }}
              />

              <label className="block text-xs font-mono uppercase tracking-wide mb-3" style={{ color: T.textSecondary }}>
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['creator', 'agency'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className="px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-200 text-center capitalize"
                    style={{
                      background: T.card,
                      boxShadow: selectedRole === role ? T.inset : T.raisedSm,
                      color: selectedRole === role ? T.cyan : T.textSecondary,
                      border: selectedRole === role ? `1px solid ${T.cyan}33` : '1px solid transparent',
                    }}
                  >
                    {role === 'agency' ? 'Agency' : 'Creator'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!fullName.trim()}
                className="w-full mt-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition"
                style={{ background: T.accent }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Agency setup OR Creator niche */}
          {step === 2 && selectedRole === 'agency' && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: T.textPrimary }}>Agency Details</h1>
              <p className="text-sm mb-6" style={{ color: T.textSecondary }}>Tell us about your agency.</p>

              <label className="block text-xs font-mono uppercase tracking-wide mb-2" style={{ color: T.textSecondary }}>
                Agency name
              </label>
              <input
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                placeholder="e.g. Spark Creative"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-6"
                style={{ background: T.card, boxShadow: T.inset, color: T.textPrimary, border: 'none' }}
              />

              <label className="block text-xs font-mono uppercase tracking-wide mb-3" style={{ color: T.textSecondary }}>
                Primary niche
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                {NICHES.map(n => (
                  <button
                    key={n}
                    onClick={() => setAgencyNiche(n)}
                    className="px-3 py-2 rounded-lg text-xs font-mono transition-all duration-150 text-left capitalize"
                    style={{
                      background: T.card,
                      boxShadow: agencyNiche === n ? T.inset : T.raisedSm,
                      color: agencyNiche === n ? T.cyan : T.textSecondary,
                    }}
                  >
                    {n.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl text-sm transition"
                  style={{ color: T.textSecondary }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!agencyName.trim() || !agencyNiche}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition"
                  style={{ background: T.accent }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedRole === 'creator' && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: T.textPrimary }}>Your Niche</h1>
              <p className="text-sm mb-6" style={{ color: T.textSecondary }}>What kind of content do you create?</p>

              <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {NICHES.map(n => (
                  <button
                    key={n}
                    onClick={() => setCreatorNiche(n)}
                    className="px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-150 text-left capitalize"
                    style={{
                      background: T.card,
                      boxShadow: creatorNiche === n ? T.inset : T.raisedSm,
                      color: creatorNiche === n ? T.cyan : T.textSecondary,
                    }}
                  >
                    {n.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl text-sm transition"
                  style={{ color: T.textSecondary }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!creatorNiche}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition"
                  style={{ background: T.accent }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Agency invite / Creator agency link */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: T.textPrimary }}>
                {selectedRole === 'agency' ? 'Invite Creators' : 'Agency Connection'}
              </h1>
              <p className="text-sm mb-6" style={{ color: T.textSecondary }}>
                {selectedRole === 'agency'
                  ? 'You can invite creators later from your dashboard.'
                  : 'If you work with an agency, they can connect you from their dashboard.'}
              </p>

              <div className="rounded-xl p-4 mb-6" style={{ background: T.bg, boxShadow: T.inset }}>
                <p className="text-xs" style={{ color: T.textDim }}>
                  {selectedRole === 'agency'
                    ? 'After setup, go to Clients to add your creators. Each creator will get their own dashboard with VPS scores and coaching.'
                    : 'No agency? No problem. You can use Trendzo independently and connect with an agency anytime.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-xl text-sm transition"
                  style={{ color: T.textSecondary }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition"
                  style={{ background: T.accent }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Feature overview */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: T.textPrimary }}>You&apos;re Ready</h1>
              <p className="text-sm mb-6" style={{ color: T.textSecondary }}>Here&apos;s what&apos;s available to you:</p>

              <div className="space-y-3 mb-8">
                {FEATURES.map(f => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: T.bg }}
                  >
                    <span className="text-lg mt-0.5">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: T.textPrimary }}>{f.title}</p>
                      <p className="text-xs" style={{ color: T.textSecondary }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-3 rounded-xl text-sm transition"
                  style={{ color: T.textSecondary }}
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
                  style={{ background: T.green }}
                >
                  {saving ? 'Setting up...' : 'Launch Dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
