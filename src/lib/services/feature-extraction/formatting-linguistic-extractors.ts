/**
 * Formatting and Linguistic Feature Extractors (Groups F-H)
 *
 * Extracts 20 features:
 * - Group F: Capitalization and Formatting (5 features)
 * - Group G: Linguistic Complexity (10 features)
 * - Group H: Dialogue and Interaction (5 features)
 */

import type {
  CapitalizationFormatting,
  LinguisticComplexity,
  DialogueInteraction,
} from './types';

// ============================================================================
// WORD LISTS FOR LINGUISTIC ANALYSIS
// ============================================================================

// Common words (simple vocabulary)
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
]);

// Rare/advanced words (examples - would need larger list for production)
const RARE_WORDS = [
  'ubiquitous', 'ephemeral', 'quintessential', 'serendipity', 'paradigm',
  'dichotomy', 'juxtaposition', 'anomaly', 'cacophony', 'ethereal',
  'esoteric', 'idiosyncratic', 'magnanimous', 'nefarious', 'ostensible',
  'pernicious', 'prolific', 'resilient', 'superfluous', 'tenacious',
  'ambiguous', 'arbitrary', 'comprehensive', 'convoluted', 'disparate',
  'empirical', 'facilitate', 'hypothetical', 'implement', 'inherent'
];

// Tech/business jargon
const JARGON_WORDS = [
  'synergy', 'leverage', 'bandwidth', 'paradigm', 'ecosystem',
  'scalable', 'disruptive', 'innovative', 'optimize', 'streamline',
  'metrics', 'analytics', 'dashboard', 'interface', 'algorithm',
  'blockchain', 'cryptocurrency', 'saas', 'b2b', 'roi',
  'kpi', 'agile', 'pivot', 'unicorn', 'disruption'
];

// Common slang words
const SLANG_WORDS = [
  'gonna', 'wanna', 'gotta', 'yeah', 'nah', 'yep', 'nope',
  'cool', 'awesome', 'lit', 'fire', 'sick', 'dope', 'vibes',
  'lowkey', 'highkey', 'sus', 'cap', 'no cap', 'bet', 'fam',
  'bruh', 'yo', 'sup', 'wassup', 'legit', 'savage', 'goat',
  'slay', 'ghosting', 'flex', 'simp', 'stan', 'tea', 'shade'
];

// Common acronyms
const ACRONYMS = [
  'lol', 'omg', 'btw', 'fyi', 'asap', 'rsvp', 'diy', 'faq',
  'tbd', 'tba', 'eta', 'ftw', 'imo', 'imho', 'tldr', 'afaik',
  'brb', 'gtg', 'idk', 'jk', 'nvm', 'smh', 'tbh', 'tfw',
  'ai', 'ml', 'ux', 'ui', 'api', 'sdk', 'aws', 'saas'
];

// Dialogue markers
const DIALOGUE_MARKERS = [
  'said', 'asked', 'told', 'replied', 'answered', 'shouted',
  'whispered', 'exclaimed', 'explained', 'mentioned', 'stated',
  'declared', 'announced', 'admitted', 'confessed', 'claimed'
];

// Imperative verbs (commands)
const IMPERATIVE_VERBS = [
  'click', 'subscribe', 'follow', 'like', 'comment', 'share',
  'watch', 'listen', 'read', 'learn', 'discover', 'find',
  'get', 'try', 'start', 'stop', 'make', 'take', 'give',
  'go', 'come', 'look', 'see', 'check', 'buy', 'download'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

function isAllCaps(word: string): boolean {
  if (word.length < 2) return false;
  return word === word.toUpperCase() && /[A-Z]/.test(word);
}

function isTitleCase(word: string): boolean {
  return word.length > 0 && word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase();
}

function isSentenceCase(word: string): boolean {
  return word.length > 0 && word === word.toLowerCase();
}

function countWordOccurrences(text: string, wordList: string[]): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const word of wordList) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

// ============================================================================
// GROUP F: CAPITALIZATION AND FORMATTING
// ============================================================================

export function extractCapitalizationFormatting(transcript: string): CapitalizationFormatting {
  const words = transcript.match(/\b[A-Za-z]+\b/g) || [];
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      all_caps_word_count: 0,
      title_case_ratio: 0,
      sentence_case_ratio: 0,
      mixed_case_ratio: 0,
      caps_lock_abuse_score: 0,
    };
  }

  let allCapsCount = 0;
  let titleCaseCount = 0;
  let sentenceCaseCount = 0;
  let mixedCaseCount = 0;

  for (const word of words) {
    if (isAllCaps(word)) {
      allCapsCount++;
    } else if (isTitleCase(word)) {
      titleCaseCount++;
    } else if (isSentenceCase(word)) {
      sentenceCaseCount++;
    } else {
      mixedCaseCount++;
    }
  }

  const titleCaseRatio = titleCaseCount / totalWords;
  const sentenceCaseRatio = sentenceCaseCount / totalWords;
  const mixedCaseRatio = mixedCaseCount / totalWords;

  // Caps lock abuse: penalize excessive all-caps usage
  const capsRatio = allCapsCount / totalWords;
  const capsLockAbuseScore = capsRatio > 0.1 ? capsRatio * 10 : 0; // 0-10 scale

  return {
    all_caps_word_count: allCapsCount,
    title_case_ratio: titleCaseRatio,
    sentence_case_ratio: sentenceCaseRatio,
    mixed_case_ratio: mixedCaseRatio,
    caps_lock_abuse_score: capsLockAbuseScore,
  };
}

// ============================================================================
// GROUP G: LINGUISTIC COMPLEXITY
// ============================================================================

export function extractLinguisticComplexity(transcript: string): LinguisticComplexity {
  const words = (transcript.match(/\b\w+\b/g) || []).map(w => w.toLowerCase());
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      polysyllabic_word_count: 0,
      complex_word_ratio: 0,
      rare_word_count: 0,
      jargon_count: 0,
      slang_count: 0,
      acronym_count: 0,
      technical_term_count: 0,
      simple_word_ratio: 0,
      average_syllables_per_word: 0,
      lexical_density: 0,
    };
  }

  // Count polysyllabic words (3+ syllables)
  let polysyllabicCount = 0;
  let totalSyllables = 0;

  for (const word of words) {
    const syllables = countSyllables(word);
    totalSyllables += syllables;
    if (syllables >= 3) {
      polysyllabicCount++;
    }
  }

  const complexWordRatio = polysyllabicCount / totalWords;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  // Count rare words
  const rareWordCount = countWordOccurrences(transcript, RARE_WORDS);

  // Count jargon
  const jargonCount = countWordOccurrences(transcript, JARGON_WORDS);

  // Count slang
  const slangCount = countWordOccurrences(transcript, SLANG_WORDS);

  // Count acronyms
  const acronymCount = countWordOccurrences(transcript, ACRONYMS);

  // Technical terms (approximation: jargon + acronyms)
  const technicalTermCount = jargonCount + acronymCount;

  // Count simple words (from common word list)
  const simpleWords = words.filter(w => COMMON_WORDS.has(w)).length;
  const simpleWordRatio = simpleWords / totalWords;

  // Lexical density: ratio of content words to total words
  // Content words = nouns, verbs, adjectives, adverbs (approximated as non-common words)
  const contentWords = totalWords - simpleWords;
  const lexicalDensity = contentWords / totalWords;

  return {
    polysyllabic_word_count: polysyllabicCount,
    complex_word_ratio: complexWordRatio,
    rare_word_count: rareWordCount,
    jargon_count: jargonCount,
    slang_count: slangCount,
    acronym_count: acronymCount,
    technical_term_count: technicalTermCount,
    simple_word_ratio: simpleWordRatio,
    average_syllables_per_word: avgSyllablesPerWord,
    lexical_density: lexicalDensity,
  };
}

// ============================================================================
// GROUP H: DIALOGUE AND INTERACTION
// ============================================================================

export function extractDialogueInteraction(transcript: string): DialogueInteraction {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Count direct questions (sentences ending with ?)
  const directQuestions = (transcript.match(/\?/g) || []).length;

  // Count rhetorical questions (heuristic: questions with "can", "should", "would", "isn't", "don't")
  const rhetoricalMarkers = ['can you', 'should you', 'would you', 'isn\'t it', 'don\'t you', 'right?', 'doesn\'t it'];
  let rhetoricalQuestions = 0;
  for (const marker of rhetoricalMarkers) {
    const regex = new RegExp(marker, 'gi');
    const matches = transcript.match(regex);
    if (matches) rhetoricalQuestions += matches.length;
  }

  // Count imperative sentences (commands - sentences starting with verbs)
  let imperativeCount = 0;
  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase();
    for (const verb of IMPERATIVE_VERBS) {
      if (trimmed.startsWith(verb + ' ') || trimmed === verb) {
        imperativeCount++;
        break;
      }
    }
  }

  // Count dialogue markers
  const dialogueMarkerCount = countWordOccurrences(transcript, DIALOGUE_MARKERS);

  // Conversational tone score (0-10)
  // Based on: questions, imperatives, pronouns, contractions, slang
  const questionRatio = sentences.length > 0 ? directQuestions / sentences.length : 0;
  const imperativeRatio = sentences.length > 0 ? imperativeCount / sentences.length : 0;
  const contractionCount = (transcript.match(/'(m|re|ve|ll|d|s|t)\b/g) || []).length;
  const contractionRatio = (transcript.match(/\b\w+\b/g) || []).length > 0
    ? contractionCount / (transcript.match(/\b\w+\b/g) || []).length
    : 0;

  const conversationalToneScore = Math.min(10,
    questionRatio * 20 +
    imperativeRatio * 15 +
    contractionRatio * 30 +
    (dialogueMarkerCount > 0 ? 2 : 0)
  );

  return {
    direct_question_count: directQuestions,
    rhetorical_question_count: rhetoricalQuestions,
    imperative_sentence_count: imperativeCount,
    dialogue_marker_count: dialogueMarkerCount,
    conversational_tone_score: conversationalToneScore,
  };
}
