'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceMicButton({
  onTranscript,
  onInterimTranscript,
  disabled = false,
}: VoiceMicButtonProps) {
  const [interimText, setInterimText] = useState('');
  const [flashError, setFlashError] = useState(false);

  const { isListening, isSupported, toggleListening, error } = useVoiceInput({
    onTranscript: (text) => {
      setInterimText('');
      onTranscript(text);
    },
    onInterim: (text) => {
      setInterimText(text);
      onInterimTranscript?.(text);
    },
  });

  // Flash gold border briefly on error then reset
  useEffect(() => {
    if (error) {
      setFlashError(true);
      const timer = setTimeout(() => setFlashError(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isSupported) return null;

  const buttonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    background: '#1c1c24',
    boxShadow: isListening
      ? '-3px -3px 8px rgba(255,255,255,0.1), 3px 3px 8px rgba(0,0,0,0.5), 0 0 12px rgba(240,74,77,0.4)'
      : '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
    color: isListening ? '#f04a4d' : '#8888a0',
    transition: 'box-shadow 180ms cubic-bezier(0.23, 1, 0.32, 1), color 140ms cubic-bezier(0.23, 1, 0.32, 1), opacity 140ms cubic-bezier(0.23, 1, 0.32, 1)',
    opacity: disabled ? 0.4 : 1,
    flexShrink: 0,
    padding: 0,
    outline: 'none',
    position: 'relative',
    ...(isListening
      ? { animation: 'voicePulse 1.5s ease-in-out infinite' }
      : {}),
  };

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes voicePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          style={buttonStyle}
          onMouseEnter={(e) => {
            if (!isListening && !disabled) {
              e.currentTarget.style.color = '#e8e8f0';
            }
          }}
          onMouseLeave={(e) => {
            if (!isListening && !disabled) {
              e.currentTarget.style.color = '#8888a0';
            }
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {/* Listening indicator with interim transcript */}
        {isListening && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: 6,
              whiteSpace: 'nowrap',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#f04a4d',
              pointerEvents: 'none',
            }}
          >
            {interimText ? `"${interimText}"` : 'Listening...'}
          </div>
        )}
      </div>
    </>
  );
}
