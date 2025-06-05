'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveEmailCapture, sendMagicLinkEmail } from '@/lib/services/magicLink';
import { trackEvent } from '@/lib/services/analytics';

export default function SaveTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Save email and generate magic link
      const { success, token } = await saveEmailCapture({
        email,
        captureSource: 'save_template',
        templateId: searchParams.get('templateId') || undefined
      });

      if (success && token) {
        // Track the event
        trackEvent('email_capture', {
          source: 'save_template',
          email_domain: email.split('@')[1]
        });

        // Send magic link email (in production)
        await sendMagicLinkEmail(email, token);

        setShowSuccess(true);

        // Redirect after showing success
        setTimeout(() => {
          router.push('/editor-mvp?saved=true');
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c0c0c] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-6xl mb-4"
          >
            📧
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email!</h2>
          <p className="text-white/80 mb-6">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-white/60 text-sm">
            Click the link in your email to access your saved template and continue editing.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0c0c] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-6xl mb-4"
          >
            💾
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Save Your Template</h2>
          <p className="text-white/80">
            Enter your email to save your progress and get a shareable link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
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
                <span>Saving...</span>
              </div>
            ) : (
              'Save Template & Get Link'
            )}
          </motion.button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <span>🔒</span>
            <span>Secure</span>
          </span>
          <span className="flex items-center gap-1">
            <span>⚡</span>
            <span>Instant Access</span>
          </span>
          <span className="flex items-center gap-1">
            <span>🔗</span>
            <span>Shareable Link</span>
          </span>
        </div>

        <button
          onClick={() => router.back()}
          className="mt-4 text-white/60 text-sm hover:text-white transition-colors"
        >
          ← Back to editor
        </button>
      </motion.div>
    </div>
  );
}