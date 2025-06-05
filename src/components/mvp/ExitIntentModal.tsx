'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ContentGeneratorService } from '@/lib/services/contentGenerator';
import { Niche, Platform } from '@/lib/types/database';

interface ExitIntentModalProps {
  niche: Niche;
  platform: Platform;
  onClose: () => void;
  onConvert: (email: string) => void;
}

export default function ExitIntentModal({ niche, platform, onClose, onConvert }: ExitIntentModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offer, setOffer] = useState<any>(null);

  // Load exit intent offer on mount
  useState(() => {
    const contentGenerator = ContentGeneratorService.getInstance();
    contentGenerator.generateExitIntentOffer(niche, platform, 'landing')
      .then(setOffer)
      .catch(console.error);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onConvert(email);
    } catch (error) {
      console.error('Error submitting email:', error);
      setIsSubmitting(false);
    }
  };

  if (!offer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Attention grabber */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-6xl mb-4"
            >
              🛑
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {offer.headline}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 leading-relaxed"
            >
              {offer.description}
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={offer.inputPlaceholder}
                required
                className="w-full bg-white/10 border-2 border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all"
                autoFocus
              />
            </div>
            
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                offer.ctaText
              )}
            </motion.button>
          </motion.form>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex items-center justify-center gap-4 text-xs text-white/60"
          >
            <span className="flex items-center gap-1">
              <span>🔒</span>
              <span>Secure</span>
            </span>
            <span className="flex items-center gap-1">
              <span>⚡</span>
              <span>Instant Access</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🚫</span>
              <span>No Spam</span>
            </span>
          </motion.div>

          {/* Urgency indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-3 py-1 text-xs text-red-300">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>Limited time offer - expires soon</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}