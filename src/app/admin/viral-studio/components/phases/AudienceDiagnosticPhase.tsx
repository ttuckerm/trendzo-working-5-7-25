'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Sparkles, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import type { AudienceDiagnosticAnswers } from '@/lib/onboarding/creator-stage';

export interface AudienceEnrichmentData {
  location: string;
  occupation: string;
}

interface AudienceDiagnosticPhaseProps {
  onComplete: (answers: AudienceDiagnosticAnswers, enrichment?: AudienceEnrichmentData) => void;
  onBack?: () => void;
  inferredRegion?: string | null;
}

const QUESTIONS = [
  {
    key: 'idealViewer' as const,
    label: 'YOUR IDEAL VIEWER',
    icon: Users,
    question: 'Who is your ideal viewer?',
    placeholder: 'e.g. College students interested in personal finance who feel overwhelmed by investing...',
  },
  {
    key: 'problemSolved' as const,
    label: 'PROBLEM YOU SOLVE',
    icon: Target,
    question: 'What problem do you solve for them?',
    placeholder: 'e.g. I break down complex investing concepts into simple 60-second explanations...',
  },
  {
    key: 'uniqueAngle' as const,
    label: 'YOUR UNIQUE ANGLE',
    icon: Sparkles,
    question: 'What makes YOUR take different?',
    placeholder: 'e.g. I use real portfolio examples instead of theory, showing actual gains and losses...',
  },
] as const;

export default function AudienceDiagnosticPhase({ onComplete, onBack, inferredRegion }: AudienceDiagnosticPhaseProps) {
  const [answers, setAnswers] = useState<AudienceDiagnosticAnswers>({
    idealViewer: '',
    problemSolved: '',
    uniqueAngle: '',
  });
  const [enrichment, setEnrichment] = useState<AudienceEnrichmentData>({
    location: inferredRegion ?? '',
    occupation: '',
  });

  const updateAnswer = useCallback((key: keyof AudienceDiagnosticAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateEnrichment = useCallback((key: keyof AudienceEnrichmentData, value: string) => {
    setEnrichment(prev => ({ ...prev, [key]: value }));
  }, []);

  const canSubmit = answers.idealViewer.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const hasEnrichment = enrichment.location.trim() || enrichment.occupation.trim();
    onComplete(answers, hasEnrichment ? enrichment : undefined);
  }, [answers, enrichment, canSubmit, onComplete]);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
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
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}

        {/* Header */}
        <motion.div variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
            Let&apos;s get clear on your audience
          </h2>
          <p className="text-white/50 text-base mt-3">
            Your content preferences are strong, but we need a sharper picture of who you&apos;re creating for.
            Answer these 3 questions to unlock better templates.
          </p>
        </motion.div>

        {/* Questions */}
        <motion.div variants={fadeUp} className="mt-10 space-y-6">
          {QUESTIONS.map(({ key, label, icon: Icon, question, placeholder }) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#7b61ff]" />
                <label className="text-[11px] uppercase tracking-widest text-white/40 font-mono">
                  {label}
                </label>
              </div>
              <p className="text-white text-sm font-medium mb-2">{question}</p>
              <textarea
                value={answers[key]}
                onChange={e => updateAnswer(key, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:border-[#7b61ff]/50 focus:outline-none focus:ring-1 focus:ring-[#7b61ff]/30 resize-none"
              />
            </div>
          ))}
        </motion.div>

        {/* Optional enrichment */}
        <motion.div variants={fadeUp} className="mt-8">
          <p className="text-[11px] uppercase tracking-widest text-white/30 font-mono mb-4">
            Optional — helps with posting time &amp; cultural relevance
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#7b61ff]" />
                <label className="text-white/50 text-xs font-medium">Your Location</label>
              </div>
              <input
                type="text"
                value={enrichment.location}
                onChange={e => updateEnrichment('location', e.target.value)}
                placeholder="e.g. New York, USA"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:border-[#7b61ff]/50 focus:outline-none focus:ring-1 focus:ring-[#7b61ff]/30"
              />
              {inferredRegion && !enrichment.location && (
                <button
                  type="button"
                  onClick={() => updateEnrichment('location', inferredRegion)}
                  className="text-[#7b61ff]/60 text-xs mt-1 hover:text-[#7b61ff]"
                >
                  Use detected: {inferredRegion}
                </button>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-[#7b61ff]" />
                <label className="text-white/50 text-xs font-medium">Your Occupation</label>
              </div>
              <input
                type="text"
                value={enrichment.occupation}
                onChange={e => updateEnrichment('occupation', e.target.value)}
                placeholder="e.g. Marketing Manager"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:border-[#7b61ff]/50 focus:outline-none focus:ring-1 focus:ring-[#7b61ff]/30"
              />
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={fadeUp} className="mt-10">
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.01 } : undefined}
            whileTap={canSubmit ? { scale: 0.98 } : undefined}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
              canSubmit
                ? 'bg-[#7b61ff] hover:bg-[#6b51ef]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            SHOW ME TEMPLATES →
          </motion.button>
          <p className="text-center text-white/30 text-xs mt-3">
            Only the first question is required. Skip the rest if you&apos;re unsure.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
