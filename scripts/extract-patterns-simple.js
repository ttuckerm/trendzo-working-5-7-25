/**
 * Simple Pattern Extraction (No LLM) - FEAT-003 Lite
 *
 * Extracts viral patterns from videos using deterministic rules
 * Cost: $0 (no API calls)
 * Speed: Fast (~100 videos/minute)
 *
 * Pattern types extracted:
 * 1. topic - What the video is about
 * 2. hook_structure - How it starts
 * 3. key_phrases - Repeated viral phrases
 * 4. content_structure - Overall flow
 * 5. emotional_tone - Sentiment analysis
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Viral hooks patterns (deterministic detection)
const HOOK_PATTERNS = [
  { pattern: /^(what|how|why)/i, type: 'question', confidence: 0.8 },
  { pattern: /^(stop|wait|listen|look)/i, type: 'command', confidence: 0.9 },
  { pattern: /^(i|let me tell you)/i, type: 'personal', confidence: 0.7 },
  { pattern: /\$\d+/,human: 'money', confidence: 0.95 },
  { pattern: /\d+ (steps?|ways|tips|secrets)/i, type: 'listicle', confidence: 0.85 },
  { pattern: /^(the secret|the truth|nobody tells you)/i, type: 'reveal', confidence: 0.9 }
]

// Emotional triggers
const EMOTIONAL_TRIGGERS = [
  { words: ['secret', 'hidden', 'nobody tells'], emotion: 'curiosity', weight: 0.9 },
  { words: ['worst', 'nightmare', 'scary', 'fear'], emotion: 'fear', weight: 0.85 },
  { words: ['love', 'best', 'amazing', 'incredible'], emotion: 'excitement', weight: 0.8 },
  { words: ['million', 'millionaire', 'wealthy', 'rich'], emotion: 'aspiration', weight: 0.9 },
  { words: ['simple', 'easy', 'quick', 'fast'], emotion: 'convenience', weight: 0.75 }
]

// Key topics (finance niche)
const TOPICS = [
  { keywords: ['invest', 'investment', 'stock', 'portfolio'], topic: 'investing' },
  { keywords: ['debt', 'credit', 'loan', 'payoff'], topic: 'debt_management' },
  { keywords: ['save', 'saving', 'emergency fund'], topic: 'savings' },
  { keywords: ['budget', 'budgeting', 'spending'], topic: 'budgeting' },
  { keywords: ['retire', 'retirement', '401k', 'ira'], topic: 'retirement' },
  { keywords: ['millionaire', 'wealthy', 'wealth', 'rich'], topic: 'wealth_building' }
]

/**
 * Extract patterns from a single video transcript
 */
function extractPatternsFromTranscript(transcript, metadata) {
  const firstSentence = transcript.split(/[.!?]/)[0]
  const words = transcript.toLowerCase().split(/\s+/)

  // 1. Detect hook structure
  let hookType = 'narrative'
  let hookConfidence = 0.5

  for (const { pattern, type, confidence } of HOOK_PATTERNS) {
    if (pattern.test(firstSentence)) {
      hookType = type
      hookConfidence = confidence
      break
    }
  }

  // 2. Detect emotional triggers
  const triggers = []
  for (const { words: triggerWords, emotion, weight } of EMOTIONAL_TRIGGERS) {
    const matches = triggerWords.filter(tw =>
      transcript.toLowerCase().includes(tw)
    )
    if (matches.length > 0) {
      triggers.push({ emotion, matches, weight })
    }
  }

  // 3. Detect topic
  let detectedTopic = 'general_finance'
  let topicScore = 0

  for (const { keywords, topic } of TOPICS) {
    const matchCount = keywords.filter(kw =>
      transcript.toLowerCase().includes(kw)
    ).length

    if (matchCount > topicScore) {
      topicScore = matchCount
      detectedTopic = topic
    }
  }

  // 4. Detect key phrases (repeated 2+ times)
  const phrases = {}
  const transcriptLower = transcript.toLowerCase()

  // Extract 3-5 word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = words.slice(i, i + 3).join(' ')
    if (phrase.length > 10) { // Skip very short phrases
      phrases[phrase] = (phrases[phrase] || 0) + 1
    }
  }

  const viralPhrases = Object.entries(phrases)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase, count]) => ({ phrase, count }))

  // 5. Content structure analysis
  const hasNumbers = /\d+/.test(transcript)
  const hasSteps = /step \d+|first|second|third|finally/i.test(transcript)
  const hasCTA = /like|subscribe|follow|comment|share/i.test(transcript)

  return {
    hook_type: hookType,
    hook_confidence: hookConfidence,
    topic: detectedTopic,
    topic_keywords: topicScore,
    emotional_triggers: triggers,
    viral_phrases: viralPhrases,
    structure: {
      has_numbers: hasNumbers,
      has_steps: hasSteps,
      has_cta: hasCTA,
      length_words: words.length
    },
    dps_score: metadata.dps_score,
    classification: metadata.classification
  }
}

/**
 * Aggregate patterns from multiple videos into viral fingerprints
 */
function aggregatePatterns(videoPatterns) {
  // Group by DPS classification
  const viralVideos = videoPatterns.filter(v =>
    v.classification === 'viral' || v.classification === 'mega-viral'
  )

  console.log(`\n📊 Analyzing ${viralVideos.length} viral videos...`)

  // Count hook types
  const hookCounts = {}
  viralVideos.forEach(v => {
    hookCounts[v.hook_type] = (hookCounts[v.hook_type] || 0) + 1
  })

  // Count topics
  const topicCounts = {}
  viralVideos.forEach(v => {
    topicCounts[v.topic] = (topicCounts[v.topic] || 0) + 1
  })

  // Count emotional triggers
  const triggerCounts = {}
  viralVideos.forEach(v => {
    v.emotional_triggers.forEach(t => {
      triggerCounts[t.emotion] = (triggerCounts[t.emotion] || 0) + 1
    })
  })

  // Extract viral patterns (appear in 20%+ of viral videos)
  const threshold = Math.ceil(viralVideos.length * 0.2)
  const patterns = []

  // Hook patterns
  Object.entries(hookCounts).forEach(([hook, count]) => {
    if (count >= threshold) {
      patterns.push({
        pattern_type: 'hook_structure',
        pattern_value: hook,
        example_count: count,
        success_rate: (count / viralVideos.length),
        avg_dps_score: viralVideos
          .filter(v => v.hook_type === hook)
          .reduce((sum, v) => sum + v.dps_score, 0) / count
      })
    }
  })

  // Topic patterns
  Object.entries(topicCounts).forEach(([topic, count]) => {
    if (count >= threshold) {
      patterns.push({
        pattern_type: 'topic',
        pattern_value: topic,
        example_count: count,
        success_rate: (count / viralVideos.length),
        avg_dps_score: viralVideos
          .filter(v => v.topic === topic)
          .reduce((sum, v) => sum + v.dps_score, 0) / count
      })
    }
  })

  // Emotional trigger patterns
  Object.entries(triggerCounts).forEach(([trigger, count]) => {
    if (count >= threshold) {
      patterns.push({
        pattern_type: 'emotional_trigger',
        pattern_value: trigger,
        example_count: count,
        success_rate: (count / viralVideos.length),
        avg_dps_score: viralVideos
          .filter(v => v.emotional_triggers.some(t => t.emotion === trigger))
          .reduce((sum, v) => sum + v.dps_score, 0) / count
      })
    }
  })

  return patterns
}

/**
 * Main function
 */
async function main() {
  console.log('🧬 SIMPLE PATTERN EXTRACTION (No LLM)')
  console.log('=' .repeat(60))

  // Fetch videos with transcripts and DPS scores
  console.log('\n📥 Fetching videos with transcripts and DPS scores...')

  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, transcript_text, dps_score, dps_classification')
    .not('transcript_text', 'is', null)
    .not('dps_score', 'is', null)
    .gte('dps_score', 60) // Only analyze videos with decent DPS

  if (error) {
    console.error('❌ Error fetching videos:', error)
    return
  }

  console.log(`✅ Found ${videos.length} videos with transcripts and DPS scores`)

  if (videos.length < 10) {
    console.log('\n⚠️  Not enough videos to extract patterns (need at least 10)')
    console.log('   Run transcription first!')
    return
  }

  // Extract patterns from each video
  console.log('\n🔍 Extracting patterns from transcripts...')

  const videoPatterns = videos.map(v =>
    extractPatternsFromTranscript(v.transcript_text, {
      dps_score: v.dps_score,
      classification: v.dps_classification
    })
  )

  console.log(`✅ Patterns extracted from ${videoPatterns.length} videos`)

  // Aggregate into viral fingerprints
  console.log('\n🧬 Generating viral fingerprints...')

  const patterns = aggregatePatterns(videoPatterns)

  console.log(`\n✅ Generated ${patterns.length} viral patterns`)

  // Display patterns
  console.log('\n📋 VIRAL PATTERNS DISCOVERED:')
  console.log('=' .repeat(60))

  patterns.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.pattern_type.toUpperCase()}: "${p.pattern_value}"`)
    console.log(`   Examples: ${p.example_count}`)
    console.log(`   Success rate: ${(p.success_rate * 100).toFixed(1)}%`)
    console.log(`   Avg DPS: ${p.avg_dps_score.toFixed(2)}`)
  })

  // Save to database (optional - would need viral_patterns table)
  console.log(`\n\n💾 Patterns ready to save to database`)
  console.log(`   (Saving to viral_patterns table would require schema update)`)

  console.log(`\n✅ Pattern extraction complete!`)
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
