/**
 * Text Analysis Feature Extractors (Groups A-E)
 *
 * Extracts 68 features from transcript text:
 * - Group A: Basic Text Metrics (15 features)
 * - Group B: Punctuation Analysis (10 features)
 * - Group C: Pronoun and Perspective (8 features)
 * - Group D: Emotional and Power Words (20 features)
 * - Group E: Viral Pattern Words (15 features)
 */

import type {
  BasicTextMetrics,
  PunctuationAnalysis,
  PronounPerspective,
  EmotionalPowerWords,
  ViralPatternWords,
} from './types';

// ============================================================================
// WORD LISTS FOR FEATURE EXTRACTION
// ============================================================================

const FIRST_PERSON_SINGULAR = ['i', 'me', 'my', 'mine', 'myself'];
const FIRST_PERSON_PLURAL = ['we', 'us', 'our', 'ours', 'ourselves'];
const SECOND_PERSON = ['you', 'your', 'yours', 'yourself', 'yourselves'];
const THIRD_PERSON = ['he', 'she', 'it', 'they', 'them', 'him', 'her', 'his', 'hers', 'their', 'theirs', 'himself', 'herself', 'itself', 'themselves'];

const POSITIVE_EMOTIONS = ['happy', 'joy', 'love', 'excited', 'amazing', 'awesome', 'fantastic', 'wonderful', 'great', 'excellent', 'perfect', 'beautiful', 'brilliant', 'delightful', 'fabulous', 'incredible', 'lovely', 'marvelous', 'spectacular', 'superb'];

const NEGATIVE_EMOTIONS = ['sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'worst', 'disaster', 'failure', 'pain', 'suffering', 'miserable', 'depressed', 'upset', 'frustrated', 'annoyed', 'furious', 'tragic', 'dreadful'];

const POWER_WORDS = ['secret', 'proven', 'guaranteed', 'powerful', 'ultimate', 'essential', 'exclusive', 'limited', 'breakthrough', 'revolutionary', 'shocking', 'incredible', 'amazing', 'stunning', 'extraordinary', 'phenomenal', 'remarkable', 'outstanding', 'exceptional', 'unbelievable'];

const URGENCY_WORDS = ['now', 'today', 'immediately', 'urgent', 'hurry', 'quick', 'fast', 'instant', 'asap', 'deadline', 'limited', 'expires', 'ending', 'last chance', 'final', 'act now', 'don\'t wait', 'time sensitive', 'while supplies last', 'before it\'s gone'];

const CURIOSITY_WORDS = ['discover', 'reveal', 'secret', 'hidden', 'unknown', 'mystery', 'curious', 'surprising', 'unexpected', 'unbelievable', 'shocking', 'what if', 'imagine', 'wonder', 'fascinating', 'intriguing', 'remarkable', 'strange', 'weird', 'bizarre'];

const FEAR_WORDS = ['danger', 'risk', 'threat', 'warning', 'scary', 'afraid', 'terrified', 'panic', 'worried', 'anxious', 'fear', 'nightmare', 'horror', 'creepy', 'disturbing', 'alarming', 'frightening', 'ominous', 'sinister', 'menacing'];

const TRUST_WORDS = ['proven', 'tested', 'verified', 'certified', 'authentic', 'genuine', 'honest', 'reliable', 'trustworthy', 'credible', 'legitimate', 'official', 'authorized', 'endorsed', 'recommended', 'backed', 'guaranteed', 'secure', 'safe', 'protected'];

const SURPRISE_WORDS = ['unexpected', 'shocking', 'surprising', 'amazed', 'astonished', 'stunned', 'blown away', 'mind-blowing', 'unbelievable', 'incredible', 'wow', 'omg', 'whoa', 'can\'t believe', 'never thought', 'didn\'t expect', 'turns out', 'plot twist', 'suddenly', 'out of nowhere'];

const ANGER_WORDS = ['angry', 'furious', 'outraged', 'mad', 'pissed', 'enraged', 'livid', 'irate', 'infuriated', 'annoyed', 'irritated', 'frustrated', 'aggravated', 'exasperated', 'fed up', 'sick of', 'can\'t stand', 'hate', 'disgusted', 'offensive'];

const SADNESS_WORDS = ['sad', 'depressed', 'unhappy', 'miserable', 'heartbroken', 'devastated', 'disappointed', 'let down', 'hurt', 'pain', 'sorrow', 'grief', 'loss', 'tears', 'crying', 'broken', 'lonely', 'hopeless', 'desperate', 'tragic'];

const JOY_WORDS = ['happy', 'joyful', 'excited', 'thrilled', 'delighted', 'pleased', 'glad', 'cheerful', 'elated', 'ecstatic', 'overjoyed', 'blissful', 'content', 'satisfied', 'proud', 'grateful', 'thankful', 'blessed', 'celebrate', 'victory'];

const ANTICIPATION_WORDS = ['waiting', 'expecting', 'hoping', 'can\'t wait', 'looking forward', 'excited', 'anticipating', 'eager', 'ready', 'preparing', 'about to', 'soon', 'coming', 'upcoming', 'next', 'future', 'planning', 'scheduled', 'pending', 'imminent'];

const DISGUST_WORDS = ['disgusting', 'gross', 'nasty', 'revolting', 'repulsive', 'vile', 'foul', 'sickening', 'nauseating', 'offensive', 'appalling', 'horrid', 'hideous', 'loathsome', 'abhorrent', 'detestable', 'repugnant', 'distasteful', 'unpleasant', 'yuck'];

const SHOCK_WORDS = ['shocking', 'unbelievable', 'insane', 'crazy', 'wild', 'mind-blowing', 'jaw-dropping', 'stunning', 'explosive', 'bombshell', 'revelation', 'exposed', 'leaked', 'scandal', 'outrageous', 'extreme', 'radical', 'unprecedented', 'historic', 'breaking'];

const CONTROVERSY_WORDS = ['controversial', 'debate', 'argument', 'disagree', 'conflict', 'dispute', 'polarizing', 'divisive', 'contentious', 'questionable', 'problematic', 'criticized', 'backlash', 'outrage', 'cancel', 'banned', 'forbidden', 'taboo', 'sensitive', 'hot topic'];

const SCARCITY_WORDS = ['rare', 'limited', 'exclusive', 'scarce', 'few', 'only', 'last', 'final', 'running out', 'disappearing', 'vanishing', 'endangered', 'unique', 'one of a kind', 'special', 'select', 'elite', 'premium', 'hard to find', 'sold out'];

const SOCIAL_PROOF_WORDS = ['everyone', 'millions', 'thousands', 'popular', 'trending', 'viral', 'famous', 'celebrities', 'experts', 'professionals', 'proven', 'tested', 'reviewed', 'rated', 'recommended', 'bestseller', 'award-winning', 'top-rated', 'most-loved', 'fan favorite'];

const AUTHORITY_WORDS = ['expert', 'professional', 'doctor', 'scientist', 'research', 'study', 'proven', 'certified', 'licensed', 'qualified', 'experienced', 'specialist', 'authority', 'official', 'verified', 'endorsed', 'approved', 'recommended', 'backed by', 'according to'];

const RECIPROCITY_WORDS = ['free', 'gift', 'bonus', 'giveaway', 'offer', 'deal', 'discount', 'save', 'value', 'reward', 'benefit', 'advantage', 'perk', 'extra', 'complimentary', 'no cost', 'on us', 'at no charge', 'gratis', 'courtesy'];

const COMMITMENT_WORDS = ['promise', 'guarantee', 'commit', 'pledge', 'vow', 'swear', 'assure', 'ensure', 'dedicate', 'devoted', 'loyal', 'faithful', 'stick to', 'follow through', 'honor', 'uphold', 'maintain', 'preserve', 'continue', 'persist'];

const LIKING_WORDS = ['like', 'love', 'enjoy', 'favorite', 'prefer', 'appreciate', 'admire', 'adore', 'fond of', 'attracted', 'drawn to', 'appeal', 'charm', 'delight', 'pleasure', 'satisfy', 'gratify', 'please', 'relatable', 'connect'];

const CONSENSUS_WORDS = ['agree', 'consensus', 'majority', 'most', 'everyone', 'all', 'universal', 'common', 'widespread', 'accepted', 'standard', 'normal', 'typical', 'usual', 'conventional', 'mainstream', 'popular opinion', 'general belief', 'widely held', 'shared view'];

const STORYTELLING_MARKERS = ['once', 'when', 'then', 'suddenly', 'finally', 'first', 'next', 'after', 'before', 'while', 'until', 'since', 'meanwhile', 'eventually', 'afterwards', 'previously', 'later', 'earlier', 'in the beginning', 'in the end'];

const CONFLICT_WORDS = ['fight', 'battle', 'struggle', 'conflict', 'war', 'versus', 'against', 'oppose', 'challenge', 'confrontation', 'clash', 'dispute', 'competition', 'rivalry', 'tension', 'friction', 'disagreement', 'feud', 'quarrel', 'combat'];

const RESOLUTION_WORDS = ['solved', 'fixed', 'resolved', 'settled', 'concluded', 'finished', 'completed', 'ended', 'overcome', 'defeated', 'conquered', 'achieved', 'accomplished', 'succeeded', 'won', 'victory', 'triumph', 'breakthrough', 'solution', 'answer'];

const TRANSFORMATION_WORDS = ['changed', 'transformed', 'evolved', 'became', 'turned into', 'converted', 'shifted', 'transitioned', 'morphed', 'revolutionized', 'reinvented', 'reimagined', 'reformed', 'renewed', 'revitalized', 'before and after', 'from to', 'journey', 'growth', 'progress'];

const REVELATION_WORDS = ['discovered', 'found', 'realized', 'learned', 'revealed', 'uncovered', 'exposed', 'unveiled', 'disclosed', 'shared', 'admitted', 'confessed', 'truth', 'fact', 'reality', 'insight', 'understanding', 'knowledge', 'awareness', 'epiphany'];

const CALL_TO_ACTION = ['click', 'subscribe', 'follow', 'like', 'comment', 'share', 'buy', 'get', 'download', 'join', 'sign up', 'register', 'try', 'start', 'begin', 'learn', 'discover', 'watch', 'check out', 'visit'];

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

function calculateFleschReadingEase(
  totalWords: number,
  totalSentences: number,
  totalSyllables: number
): number {
  if (totalWords === 0 || totalSentences === 0) return 0;
  const avgWordsPerSentence = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;
  return 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
}

function calculateFleschKincaidGrade(
  totalWords: number,
  totalSentences: number,
  totalSyllables: number
): number {
  if (totalWords === 0 || totalSentences === 0) return 0;
  const avgWordsPerSentence = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;
  return 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
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
// GROUP A: BASIC TEXT METRICS
// ============================================================================

export function extractBasicTextMetrics(transcript: string): BasicTextMetrics {
  const words = transcript.match(/\b\w+\b/g) || [];
  const sentences = transcript.match(/[.!?]+/g) || [];
  const chars = transcript.replace(/\s/g, '').length;

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const charCount = chars;

  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const uniqueWordCount = uniqueWords.size;
  const lexicalDiversity = wordCount > 0 ? uniqueWordCount / wordCount : 0;

  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgWordLength = wordCount > 0 ? charCount / wordCount : 0;
  const avgSentenceLength = wordCount / sentenceCount;

  const fleschReadingEase = calculateFleschReadingEase(wordCount, sentenceCount, totalSyllables);
  const fleschKincaidGrade = calculateFleschKincaidGrade(wordCount, sentenceCount, totalSyllables);

  // Simplified readability scores (approximations)
  const avgSyllablesPerWord = totalSyllables / Math.max(wordCount, 1);
  const smogIndex = 1.043 * Math.sqrt(totalSyllables * (30 / sentenceCount)) + 3.1291;
  const automatedReadabilityIndex = 4.71 * (charCount / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;
  const colemanLiauIndex = 0.0588 * ((charCount / wordCount) * 100) - 0.296 * ((sentenceCount / wordCount) * 100) - 15.8;
  const gunningFogIndex = 0.4 * (avgSentenceLength + 100 * (totalSyllables / wordCount));
  const linsearWriteFormula = (avgSentenceLength + 3 * avgSyllablesPerWord) / 2;

  return {
    word_count: wordCount,
    char_count: charCount,
    sentence_count: sentenceCount,
    avg_word_length: avgWordLength,
    avg_sentence_length: avgSentenceLength,
    unique_word_count: uniqueWordCount,
    lexical_diversity: lexicalDiversity,
    syllable_count: totalSyllables,
    flesch_reading_ease: fleschReadingEase,
    flesch_kincaid_grade: fleschKincaidGrade,
    smog_index: smogIndex,
    automated_readability_index: automatedReadabilityIndex,
    coleman_liau_index: colemanLiauIndex,
    gunning_fog_index: gunningFogIndex,
    linsear_write_formula: linsearWriteFormula,
  };
}

// ============================================================================
// GROUP B: PUNCTUATION ANALYSIS
// ============================================================================

export function extractPunctuationAnalysis(transcript: string): PunctuationAnalysis {
  return {
    question_mark_count: (transcript.match(/\?/g) || []).length,
    exclamation_count: (transcript.match(/!/g) || []).length,
    ellipsis_count: (transcript.match(/\.{3,}/g) || []).length,
    comma_count: (transcript.match(/,/g) || []).length,
    period_count: (transcript.match(/\./g) || []).length,
    semicolon_count: (transcript.match(/;/g) || []).length,
    colon_count: (transcript.match(/:/g) || []).length,
    dash_count: (transcript.match(/[-—–]/g) || []).length,
    quotation_count: (transcript.match(/["'"'"]/g) || []).length,
    parenthesis_count: (transcript.match(/[()]/g) || []).length,
  };
}

// ============================================================================
// GROUP C: PRONOUN AND PERSPECTIVE
// ============================================================================

export function extractPronounPerspective(transcript: string): PronounPerspective {
  const firstPersonSingular = countWordOccurrences(transcript, FIRST_PERSON_SINGULAR);
  const firstPersonPlural = countWordOccurrences(transcript, FIRST_PERSON_PLURAL);
  const secondPerson = countWordOccurrences(transcript, SECOND_PERSON);
  const thirdPerson = countWordOccurrences(transcript, THIRD_PERSON);

  const totalPronouns = firstPersonSingular + firstPersonPlural + secondPerson + thirdPerson;

  const firstPersonRatio = totalPronouns > 0 ? (firstPersonSingular + firstPersonPlural) / totalPronouns : 0;
  const secondPersonRatio = totalPronouns > 0 ? secondPerson / totalPronouns : 0;
  const thirdPersonRatio = totalPronouns > 0 ? thirdPerson / totalPronouns : 0;

  // Count perspective shifts (simplified - count sentences with different pronouns)
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let shifts = 0;
  let prevPerspective = '';

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    let perspective = '';

    if (FIRST_PERSON_SINGULAR.some(p => lower.includes(` ${p} `) || lower.startsWith(`${p} `))) {
      perspective = 'first_singular';
    } else if (FIRST_PERSON_PLURAL.some(p => lower.includes(` ${p} `) || lower.startsWith(`${p} `))) {
      perspective = 'first_plural';
    } else if (SECOND_PERSON.some(p => lower.includes(` ${p} `) || lower.startsWith(`${p} `))) {
      perspective = 'second';
    } else if (THIRD_PERSON.some(p => lower.includes(` ${p} `) || lower.startsWith(`${p} `))) {
      perspective = 'third';
    }

    if (perspective && prevPerspective && perspective !== prevPerspective) {
      shifts++;
    }
    if (perspective) prevPerspective = perspective;
  }

  return {
    first_person_singular_count: firstPersonSingular,
    first_person_plural_count: firstPersonPlural,
    second_person_count: secondPerson,
    third_person_count: thirdPerson,
    first_person_ratio: firstPersonRatio,
    second_person_ratio: secondPersonRatio,
    third_person_ratio: thirdPersonRatio,
    perspective_shift_count: shifts,
  };
}

// ============================================================================
// GROUP D: EMOTIONAL AND POWER WORDS
// ============================================================================

export function extractEmotionalPowerWords(transcript: string): EmotionalPowerWords {
  const positiveCount = countWordOccurrences(transcript, POSITIVE_EMOTIONS);
  const negativeCount = countWordOccurrences(transcript, NEGATIVE_EMOTIONS);
  const powerCount = countWordOccurrences(transcript, POWER_WORDS);
  const urgencyCount = countWordOccurrences(transcript, URGENCY_WORDS);
  const curiosityCount = countWordOccurrences(transcript, CURIOSITY_WORDS);
  const fearCount = countWordOccurrences(transcript, FEAR_WORDS);
  const trustCount = countWordOccurrences(transcript, TRUST_WORDS);
  const surpriseCount = countWordOccurrences(transcript, SURPRISE_WORDS);
  const angerCount = countWordOccurrences(transcript, ANGER_WORDS);
  const sadnessCount = countWordOccurrences(transcript, SADNESS_WORDS);
  const joyCount = countWordOccurrences(transcript, JOY_WORDS);
  const anticipationCount = countWordOccurrences(transcript, ANTICIPATION_WORDS);
  const disgustCount = countWordOccurrences(transcript, DISGUST_WORDS);

  const totalEmotional = positiveCount + negativeCount + fearCount + surpriseCount +
                        angerCount + sadnessCount + joyCount + anticipationCount + disgustCount;

  const words = (transcript.match(/\b\w+\b/g) || []).length;
  const emotionalIntensity = words > 0 ? totalEmotional / words : 0;

  const sentimentPolarity = positiveCount + negativeCount > 0
    ? (positiveCount - negativeCount) / (positiveCount + negativeCount)
    : 0;

  const sentimentSubjectivity = words > 0 ? totalEmotional / words : 0;

  // Emotional arc pattern (simplified)
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const emotionalScores = sentences.map(s => {
    const pos = countWordOccurrences(s, POSITIVE_EMOTIONS);
    const neg = countWordOccurrences(s, NEGATIVE_EMOTIONS);
    return pos - neg;
  });

  let arcPattern = 'flat';
  if (emotionalScores.length >= 3) {
    const start = emotionalScores[0];
    const mid = emotionalScores[Math.floor(emotionalScores.length / 2)];
    const end = emotionalScores[emotionalScores.length - 1];

    if (end > start) arcPattern = 'rise';
    else if (end < start) arcPattern = 'fall';
    else if (mid > start && mid > end) arcPattern = 'peak';
    else if (mid < start && mid < end) arcPattern = 'valley';
  }

  const emotionalVolatility = emotionalScores.length > 0
    ? Math.sqrt(emotionalScores.reduce((sum, score) => sum + Math.pow(score, 2), 0) / emotionalScores.length)
    : 0;

  const positiveNegativeRatio = negativeCount > 0 ? positiveCount / negativeCount : positiveCount;
  const netEmotionalImpact = positiveCount - negativeCount;

  return {
    positive_emotion_count: positiveCount,
    negative_emotion_count: negativeCount,
    power_word_count: powerCount,
    urgency_word_count: urgencyCount,
    curiosity_word_count: curiosityCount,
    fear_word_count: fearCount,
    trust_word_count: trustCount,
    surprise_word_count: surpriseCount,
    anger_word_count: angerCount,
    sadness_word_count: sadnessCount,
    joy_word_count: joyCount,
    anticipation_word_count: anticipationCount,
    disgust_word_count: disgustCount,
    emotional_intensity_score: emotionalIntensity,
    sentiment_polarity: sentimentPolarity,
    sentiment_subjectivity: sentimentSubjectivity,
    emotional_arc_pattern: arcPattern,
    emotional_volatility: emotionalVolatility,
    positive_negative_ratio: positiveNegativeRatio,
    net_emotional_impact: netEmotionalImpact,
  };
}

// ============================================================================
// GROUP E: VIRAL PATTERN WORDS
// ============================================================================

export function extractViralPatternWords(transcript: string): ViralPatternWords {
  return {
    shock_word_count: countWordOccurrences(transcript, SHOCK_WORDS),
    controversy_word_count: countWordOccurrences(transcript, CONTROVERSY_WORDS),
    scarcity_word_count: countWordOccurrences(transcript, SCARCITY_WORDS),
    social_proof_word_count: countWordOccurrences(transcript, SOCIAL_PROOF_WORDS),
    authority_word_count: countWordOccurrences(transcript, AUTHORITY_WORDS),
    reciprocity_word_count: countWordOccurrences(transcript, RECIPROCITY_WORDS),
    commitment_word_count: countWordOccurrences(transcript, COMMITMENT_WORDS),
    liking_word_count: countWordOccurrences(transcript, LIKING_WORDS),
    consensus_word_count: countWordOccurrences(transcript, CONSENSUS_WORDS),
    storytelling_marker_count: countWordOccurrences(transcript, STORYTELLING_MARKERS),
    conflict_word_count: countWordOccurrences(transcript, CONFLICT_WORDS),
    resolution_word_count: countWordOccurrences(transcript, RESOLUTION_WORDS),
    transformation_word_count: countWordOccurrences(transcript, TRANSFORMATION_WORDS),
    revelation_word_count: countWordOccurrences(transcript, REVELATION_WORDS),
    call_to_action_count: countWordOccurrences(transcript, CALL_TO_ACTION),
  };
}
