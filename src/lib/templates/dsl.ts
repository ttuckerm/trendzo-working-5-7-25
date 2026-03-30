export type DurationBucket = '<15s' | '15-45s' | '>45s';

export interface FrameworkRule {
  id: string;
  name: string;
  signals: {
    captionRegex?: RegExp[];
    transcriptRegex?: RegExp[];
    requiredKeywords?: string[];
    anyKeywords?: string[];
    structure?: {
      duration?: DurationBucket[];
      hasList?: boolean;
      hasQuestion?: boolean;
      hasPOV?: boolean;
      hasReveal?: boolean;
      hasHowTo?: boolean;
    };
  };
  weights: {
    caption: number;
    transcript: number;
    keywords: number;
    structure: number;
  };
}

// Canonical DSL (deterministic)
export const FRAMEWORK_DSL: FrameworkRule[] = [
  { id: 'pov', name: 'POV Hook', signals: { captionRegex: [/\bpov\b/i], structure: { hasPOV: true } }, weights: { caption: 0.5, transcript: 0.1, keywords: 0.1, structure: 0.3 } },
  { id: 'question-reveal', name: 'Question → Reveal', signals: { captionRegex: [/\?\s*$/], structure: { hasQuestion: true, hasReveal: true } }, weights: { caption: 0.4, transcript: 0.2, keywords: 0.1, structure: 0.3 } },
  { id: 'problem-demo', name: 'Problem → Demo', signals: { anyKeywords: ['problem', 'fix', 'demo'], structure: { hasHowTo: true } }, weights: { caption: 0.2, transcript: 0.3, keywords: 0.3, structure: 0.2 } },
  { id: 'counterintuitive', name: 'Counterintuitive Tip', signals: { anyKeywords: ['nobody tells you', "no one tells you", 'counterintuitive', 'actually'] }, weights: { caption: 0.4, transcript: 0.2, keywords: 0.3, structure: 0.1 } },
  { id: 'duet-stitch', name: 'Duet / Stitch', signals: { anyKeywords: ['duet', 'stitch'] }, weights: { caption: 0.5, transcript: 0.1, keywords: 0.3, structure: 0.1 } },
  { id: 'green-screen', name: 'Green Screen', signals: { anyKeywords: ['green screen'] }, weights: { caption: 0.5, transcript: 0.0, keywords: 0.4, structure: 0.1 } },
  { id: 'before-after', name: 'Before → After', signals: { anyKeywords: ['before', 'after'], structure: { hasReveal: true } }, weights: { caption: 0.3, transcript: 0.2, keywords: 0.3, structure: 0.2 } },
  { id: 'list-of-n', name: 'List of N', signals: { captionRegex: [/\b\d+\s+(reasons|tips|ways|steps)\b/i], structure: { hasList: true } }, weights: { caption: 0.6, transcript: 0.1, keywords: 0.2, structure: 0.1 } },
  { id: 'myth-truth', name: 'Myth → Truth', signals: { anyKeywords: ['myth', 'truth'] }, weights: { caption: 0.3, transcript: 0.2, keywords: 0.4, structure: 0.1 } },
  { id: 'storytime', name: 'Storytime Hook', signals: { captionRegex: [/^story time|storytime/i] }, weights: { caption: 0.7, transcript: 0.1, keywords: 0.1, structure: 0.1 } },
  { id: 'tutorial-3-steps', name: 'Tutorial in 3 Steps', signals: { captionRegex: [/\b(3|three)\s+steps?\b/i], structure: { hasHowTo: true, hasList: true } }, weights: { caption: 0.5, transcript: 0.1, keywords: 0.2, structure: 0.2 } },
  { id: 'reaction', name: 'Reaction', signals: { anyKeywords: ['reacting', 'reaction'], structure: {} }, weights: { caption: 0.5, transcript: 0.1, keywords: 0.3, structure: 0.1 } },
  { id: 'why-explain', name: 'Why…? Explanation', signals: { captionRegex: [/^why\b/i], structure: { hasQuestion: true } }, weights: { caption: 0.6, transcript: 0.1, keywords: 0.2, structure: 0.1 } },
  { id: 'howto', name: 'How-To', signals: { captionRegex: [/^how\s*to\b/i], structure: { hasHowTo: true } }, weights: { caption: 0.6, transcript: 0.1, keywords: 0.2, structure: 0.1 } },
  { id: 'demo-reveal', name: 'Demo with Reveal', signals: { anyKeywords: ['demo', 'reveal'], structure: { hasReveal: true } }, weights: { caption: 0.3, transcript: 0.2, keywords: 0.3, structure: 0.2 } },
  { id: 'fast-cut', name: 'POV + Fast Cut', signals: { requiredKeywords: ['pov'], structure: { duration: ['<15s', '15-45s'] } }, weights: { caption: 0.5, transcript: 0.0, keywords: 0.3, structure: 0.2 } },
  { id: 'qa', name: 'Q → A', signals: { captionRegex: [/\?\s/], structure: { hasQuestion: true } }, weights: { caption: 0.5, transcript: 0.2, keywords: 0.1, structure: 0.2 } },
];


