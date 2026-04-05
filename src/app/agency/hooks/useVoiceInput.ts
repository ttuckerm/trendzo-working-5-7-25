'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API types (not in all TS libs)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  language?: string;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  error: string | null;
}

export function useVoiceInput(options: UseVoiceInputOptions): UseVoiceInputReturn {
  const { onTranscript, onInterim, language = 'en-US' } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterim);
  onTranscriptRef.current = onTranscript;
  onInterimRef.current = onInterim;

  // Check support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported(
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    setError(null);

    // Abort any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (!result) return;

      const transcript = result[0].transcript;

      if (result.isFinal) {
        onTranscriptRef.current(transcript);
      } else {
        onInterimRef.current?.(transcript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      const code: string = event.error || '';
      let message: string;

      switch (code) {
        case 'not-allowed':
          message =
            'Microphone access denied. Please allow microphone in browser settings.';
          break;
        case 'no-speech':
          message = 'No speech detected. Try again.';
          break;
        case 'network':
          message = 'Network error during speech recognition.';
          break;
        default:
          message = 'Speech recognition error. Try again.';
      }

      setError(message);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    error,
  };
}
