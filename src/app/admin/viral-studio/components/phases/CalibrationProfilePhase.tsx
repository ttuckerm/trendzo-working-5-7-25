'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Users, Palette, Trophy, ArrowLeft } from 'lucide-react';
import type { InferredProfile } from '@/lib/onboarding/calibration-scorer';

interface CalibrationProfilePhaseProps {
  inferredProfile: InferredProfile;
  onComplete: (finalProfile: InferredProfile) => void;
  onBack?: () => void;
}

const CARDS = [
  { key: 'niche', label: 'YOUR NICHE', icon: Crosshair },
  { key: 'audience', label: 'YOUR AUDIENCE', icon: Users },
  { key: 'style', label: 'CONTENT STYLE', icon: Palette },
  { key: 'competitors', label: 'KEY COMPETITORS', icon: Trophy },
] as const;

type CardKey = (typeof CARDS)[number]['key'];

export default function CalibrationProfilePhase({ inferredProfile, onComplete, onBack }: CalibrationProfilePhaseProps) {
  const [profile, setProfile] = useState<InferredProfile>(() => ({ ...inferredProfile }));
  const [editingCard, setEditingCard] = useState<CardKey | null>(null);
  const [offer, setOffer] = useState('');
  const [exclusions, setExclusions] = useState('');

  const getCardValue = (key: CardKey): string => {
    switch (key) {
      case 'niche':
        return profile.inferredNiche;
      case 'audience':
        return `${profile.inferredAudience.description} (${profile.inferredAudience.ageRange})`;
      case 'style':
        return profile.inferredContentStyle;
      case 'competitors':
        return profile.inferredCompetitors.join(' · ');
    }
  };

  const handleCardSave = useCallback((key: CardKey, value: string) => {
    setProfile(prev => {
      switch (key) {
        case 'niche':
          return { ...prev, inferredNiche: value };
        case 'audience':
          return { ...prev, inferredAudience: { ...prev.inferredAudience, description: value } };
        case 'style':
          return { ...prev, inferredContentStyle: value };
        case 'competitors':
          return { ...prev, inferredCompetitors: value.split(',').map(s => s.trim()).filter(Boolean) };
        default:
          return prev;
      }
    });
    setEditingCard(null);
  }, []);

  const handleSubmit = useCallback(() => {
    const finalProfile: InferredProfile = {
      ...profile,
      inferredOffer: offer.trim() || null,
      inferredExclusions: exclusions.trim()
        ? exclusions.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    };
    onComplete(finalProfile);
  }, [profile, offer, exclusions, onComplete]);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-16">
      <motion.div
        className="max-w-[700px] w-full"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Back button */}
        {onBack && (
          <motion.button
            onClick={onBack}
            variants={fadeUp}
            className="mb-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Go back to signal calibration"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}

        {/* Header */}
        <motion.div variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
            Here&apos;s what we know about you
          </h2>
          <p className="text-white/50 text-base mt-3">
            Inferred from your 8 reactions. Tap any card to correct it.
          </p>
        </motion.div>

        {/* 4 Editable Summary Cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
          {CARDS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              onClick={() => { if (editingCard !== key) setEditingCard(key); }}
              className="bg-white/5 border border-white/10 backdrop-blur rounded-xl p-5 cursor-pointer transition-all hover:border-white/20"
            >
              <Icon className="w-5 h-5 text-[#7b61ff] mb-2" />
              <div className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-1">
                {label}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {editingCard === key ? (
                  <motion.div key={`${key}-editor`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}>
                    <CardEditor
                      cardKey={key}
                      value={key === 'audience' ? profile.inferredAudience.description : (key === 'competitors' ? profile.inferredCompetitors.join(', ') : getCardValue(key))}
                      onSave={handleCardSave}
                    />
                  </motion.div>
                ) : (
                  <motion.div key={`${key}-display`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="text-white text-sm font-medium">
                    {getCardValue(key)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Two text inputs */}
        <motion.div variants={fadeUp} className="mt-8 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-2 block">
              What do you sell? (Business / Offer)
            </label>
            <input
              type="text"
              value={offer}
              onChange={e => setOffer(e.target.value)}
              placeholder="e.g. Business coaching for entrepreneurs..."
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:border-[#7b61ff]/50 focus:outline-none focus:ring-1 focus:ring-[#7b61ff]/30"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-white/40 font-mono mb-2 block">
              Anything we should never include?
            </label>
            <input
              type="text"
              value={exclusions}
              onChange={e => setExclusions(e.target.value)}
              placeholder="e.g. Never mention specific competitors by name..."
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:border-[#7b61ff]/50 focus:outline-none focus:ring-1 focus:ring-[#7b61ff]/30"
            />
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={fadeUp} className="mt-10">
          <motion.button
            onClick={handleSubmit}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl font-semibold text-white bg-[#7b61ff] hover:bg-[#6b51ef] transition-all"
          >
            THIS LOOKS RIGHT →
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Inline Card Editor ──────────────────────────────────────────────────────

function CardEditor({
  cardKey,
  value,
  onSave,
}: {
  cardKey: CardKey;
  value: string;
  onSave: (key: CardKey, value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const isMultiline = cardKey === 'competitors';

  const commit = () => onSave(cardKey, draft);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  };

  const inputClasses =
    'w-full bg-transparent text-white text-sm font-medium border border-white/20 rounded-lg px-2 py-1 focus:border-[#7b61ff]/50 focus:ring-1 focus:ring-[#7b61ff]/30 focus:outline-none';

  if (isMultiline) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        rows={2}
        className={inputClasses + ' resize-none'}
      />
    );
  }

  return (
    <input
      autoFocus
      type="text"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={inputClasses}
    />
  );
}
