'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { verifyMagicLink, createUserFromMagicLink } from '@/lib/services/magicLink';
import { supabaseClient } from '@/lib/supabase-client';

export default function MagicLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your magic link...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid magic link');
      return;
    }

    handleMagicLink(token);
  }, [searchParams]);

  const handleMagicLink = async (token: string) => {
    try {
      // Verify the magic link token
      const { success, email, data } = await verifyMagicLink(token);
      
      if (!success || !email || !data) {
        setStatus('error');
        setMessage('This link has expired or is invalid');
        return;
      }

      // Create or update user
      const { success: userCreated, user } = await createUserFromMagicLink(data);
      
      if (!userCreated || !user) {
        setStatus('error');
        setMessage('Failed to create account');
        return;
      }

      // Sign in the user
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: 'temp_password_will_be_reset' // This will trigger password reset flow
      });

      if (signInError) {
        // If sign in fails, still consider it a success and redirect to auth
        setStatus('success');
        setMessage('Account created! Please set your password.');
        setTimeout(() => {
          router.push(`/auth?email=${encodeURIComponent(email)}&action=set_password`);
        }, 2000);
        return;
      }

      // Success - redirect based on capture source
      setStatus('success');
      setMessage('Success! Redirecting to your video...');
      
      setTimeout(() => {
        if (data.template_id) {
          router.push(`/editor-mvp?templateId=${data.template_id}&restored=true`);
        } else {
          router.push('/editor-mvp?welcome=true');
        }
      }, 1500);

    } catch (error) {
      console.error('Magic link error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0c0c] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl"
            >
              ✅
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl"
            >
              ❌
            </motion.div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {status === 'verifying' && 'Verifying Magic Link'}
          {status === 'success' && 'Welcome to TRENDZO!'}
          {status === 'error' && 'Link Expired'}
        </h1>

        <p className="text-white/60 mb-6">
          {message}
        </p>

        {status === 'error' && (
          <button
            onClick={() => router.push('/auth')}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Try Again
          </button>
        )}
      </motion.div>
    </div>
  );
}