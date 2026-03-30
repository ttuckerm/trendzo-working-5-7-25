'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

export interface CreatorStory {
  transformation: string;
  nicheMyths: string[];
  audienceDesiredResult: string;
  creatorCredentials: string | null;
  nicheMistakes: string | null;
}

interface CreatorStoryPhaseProps {
  onComplete: (story: CreatorStory) => void;
  onBack: () => void;
}

export default function CreatorStoryPhase({ onComplete, onBack }: CreatorStoryPhaseProps) {
  const [transformation, setTransformation] = useState('');
  const [myth1, setMyth1] = useState('');
  const [myth2, setMyth2] = useState('');
  const [myth3, setMyth3] = useState('');
  const [desiredResult, setDesiredResult] = useState('');
  const [credentials, setCredentials] = useState('');
  const [mistakes, setMistakes] = useState('');

  const isValid =
    transformation.trim().length >= 20 &&
    myth1.trim().length > 0 &&
    desiredResult.trim().length >= 10;

  const handleSubmit = () => {
    if (!isValid) return;
    const nicheMyths = [myth1, myth2, myth3].map(m => m.trim()).filter(Boolean);
    onComplete({
      transformation: transformation.trim(),
      nicheMyths,
      audienceDesiredResult: desiredResult.trim(),
      creatorCredentials: credentials.trim() || null,
      nicheMistakes: mistakes.trim() || null,
    });
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-2xl w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-[#7b61ff]" />
            <h2 className="text-4xl font-bold bg-gradient-to-br from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
              Your Story
            </h2>
          </div>
          <p className="text-white/60 mb-10">
            This helps us generate content that sounds like you, not a template.
          </p>
        </motion.div>

        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-white font-medium mb-2">
              Your transformation story <span className="text-white/40 text-sm">(2-3 sentences)</span>
            </label>
            <p className="text-white/40 text-sm mb-3">
              What changed for you? What made you start creating content in this niche?
            </p>
            <textarea
              value={transformation}
              onChange={e => setTransformation(e.target.value)}
              placeholder="e.g., I was $40K in debt and figured out a system to pay it off in 2 years while working a regular job. Now I help people do the same."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-[#7b61ff]/50 focus:outline-none transition-colors resize-none"
              rows={3}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-white font-medium mb-2">
              Top myths in your niche <span className="text-white/40 text-sm">(at least 1, up to 3)</span>
            </label>
            <p className="text-white/40 text-sm mb-3">
              What does your audience commonly believe that's wrong?
            </p>
            <div className="space-y-3">
              <input
                value={myth1}
                onChange={e => setMyth1(e.target.value)}
                placeholder='e.g., "You need to make $100K to invest"'
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-[#7b61ff]/50 focus:outline-none transition-colors"
              />
              <input
                value={myth2}
                onChange={e => setMyth2(e.target.value)}
                placeholder="Optional second myth"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-[#7b61ff]/50 focus:outline-none transition-colors"
              />
              <input
                value={myth3}
                onChange={e => setMyth3(e.target.value)}
                placeholder="Optional third myth"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-[#7b61ff]/50 focus:outline-none transition-colors"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-white font-medium mb-2">
              The result your audience wants
            </label>
            <p className="text-white/40 text-sm mb-3">
              In one sentence, what specific outcome are they trying to achieve?
            </p>
            <input
              value={desiredResult}
              onChange={e => setDesiredResult(e.target.value)}
              placeholder='e.g., "Pay off all debt and build a $10K emergency fund within 18 months"'
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-[#7b61ff]/50 focus:outline-none transition-colors"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <label className="block text-white font-medium mb-2">
              Your credentials <span className="text-white/40 text-sm">(optional)</span>
            </label>
            <p className="text-white/40 text-sm mb-3">
              What gives you authority to teach this? Certifications, experience, results?
            </p>
            <input
              value={credentials}
              onChange={e => setCredentials(e.target.value)}
              placeholder='e.g., "Certified financial planner, helped 200+ clients eliminate debt"'
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-[#7b61ff]/50 focus:outline-none transition-colors"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <label className="block text-white font-medium mb-2">
              Common mistakes your audience makes <span className="text-white/40 text-sm">(optional)</span>
            </label>
            <p className="text-white/40 text-sm mb-3">
              What do beginners consistently get wrong in your niche?
            </p>
            <input
              value={mistakes}
              onChange={e => setMistakes(e.target.value)}
              placeholder='e.g., "Trying to pay off all debts at once instead of using the avalanche method"'
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-[#7b61ff]/50 focus:outline-none transition-colors"
            />
          </motion.div>
        </div>

        <motion.div
          className="mt-10 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`
              px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300
              ${isValid
                ? 'bg-gradient-to-r from-[#7b61ff] to-[#ff61a6] text-white hover:shadow-lg hover:shadow-[#7b61ff]/25 hover:scale-105'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
              }
            `}
          >
            Continue
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
