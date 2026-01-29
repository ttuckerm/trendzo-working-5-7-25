"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  context?: string;
  showEmoji?: boolean;
  showRating?: boolean;
  showComment?: boolean;
}

/**
 * A reusable feedback widget that allows users to provide feedback 
 * during usability testing
 */
export default function FeedbackWidget({
  position = 'bottom-right',
  context = 'general',
  showEmoji = true,
  showRating = true,
  showComment = true,
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'emoji' | 'rating' | 'comment' | 'thanks'>('initial');
  const [feedback, setFeedback] = useState<{
    type: string;
    value: string | number;
    comment?: string;
  }>({
    type: '',
    value: '',
  });
  
  const { collectFeedback } = useUsabilityTest();
  
  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };
  
  // Handle toggling the widget
  const toggleWidget = () => {
    setIsOpen(!isOpen);
    
    // Reset to initial state when closing
    if (isOpen) {
      setTimeout(() => {
        setStep('initial');
        setFeedback({
          type: '',
          value: '',
        });
      }, 300);
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (value: 'happy' | 'sad') => {
    setFeedback({
      ...feedback,
      type: 'emoji',
      value,
    });
    
    // If we don't need more steps, submit now
    if (!showRating && !showComment) {
      submitFeedback({
        type: 'emoji',
        value,
        context,
      });
      setStep('thanks');
    } else {
      // Otherwise go to next step
      setStep(showRating ? 'rating' : 'comment');
    }
  };
  
  // Handle rating selection
  const handleRatingSelect = (value: number) => {
    setFeedback({
      ...feedback,
      type: feedback.type || 'rating',
      value: value,
    });
    
    // If we don't need more steps, submit now
    if (!showComment) {
      submitFeedback({
        type: feedback.type || 'rating',
        value,
        context,
      });
      setStep('thanks');
    } else {
      // Otherwise go to next step
      setStep('comment');
    }
  };
  
  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const comment = formData.get('comment') as string;
    
    // Update feedback with comment
    setFeedback({
      ...feedback,
      comment,
    });
    
    // Submit the complete feedback
    submitFeedback({
      type: feedback.type || 'comment',
      value: feedback.value || comment,
      context,
      metadata: {
        comment,
      },
    });
    
    setStep('thanks');
  };
  
  // Submit feedback to the usability test context
  const submitFeedback = (feedbackData: any) => {
    collectFeedback({
      type: feedbackData.type as 'emoji' | 'rating' | 'comment' | 'issue',
      value: feedbackData.value,
      context: feedbackData.context,
      metadata: feedbackData.metadata,
    });
  };
  
  return (
    <>
      {/* Floating button */}
      <motion.button
        className={`fixed z-50 rounded-full p-3 shadow-lg ${
          isOpen ? "bg-gray-800 text-white" : "bg-primary-500 text-white"
        } ${positionClasses[position]}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: 1, 
          rotate: isOpen ? 45 : 0 
        }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleWidget}
        aria-label={isOpen ? "Close feedback" : "Give feedback"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
      
      {/* Feedback panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed z-40 rounded-lg shadow-xl overflow-hidden bg-white w-80 p-4 ${
              positionClasses[position]
            } ${position === 'bottom-right' ? 'mr-16' : 
                position === 'bottom-left' ? 'ml-16' : 'mb-16'}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            {step === 'thanks' ? (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <ThumbsUp className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-medium mb-2">Thank you for your feedback</h3>
                <p className="text-gray-600 mb-4">Your input helps us improve the product.</p>
                <button 
                  onClick={toggleWidget}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-center">How can we improve?</h3>
                {/* Simplified feedback content */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleWidget()}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => setStep('thanks')}
                    className="w-full py-2 px-4 bg-primary-500 text-white rounded-md"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 