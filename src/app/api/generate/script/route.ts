import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ScriptGenerationRequest {
  concept: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  length: 15 | 30 | 60;
  niche: string;
  patternId?: string; // NEW: Optional pattern ID from Bloomberg
}

interface ScriptPart {
  section: string;
  timing: string;
  content: string;
}

interface ScriptResponse {
  script: {
    hook: ScriptPart;
    context: ScriptPart;
    value: ScriptPart;
    cta: ScriptPart;
    fullScript: string;
  };
  predictedDps: number;
  confidence: number;
  reasoning: string;
  patternSource?: string;
  sourceVideoId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ScriptGenerationRequest = await req.json();
    const { concept, platform, length, niche, patternId } = body;

    // Validate input
    if (!concept || !platform || !length || !niche) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get platform-specific guidance
    const platformGuidance = getPlatformGuidance(platform, length);

    // =====================================================
    // FETCH REAL PATTERN DNA from viral_genomes
    // =====================================================
    const patternData = await fetchRealPatternData(concept, niche, patternId);

    // Generate script using OpenAI with REAL pattern DNA
    const scriptResult = await generateScriptWithOpenAI(
      concept,
      platform,
      length,
      niche,
      platformGuidance,
      patternData
    );

    // Calculate predicted DPS using real analysis
    const dpsResult = await calculatePredictedDPS(
      scriptResult,
      platform,
      niche
    );

    // Log API usage for cost tracking
    await logAPIUsage({
      endpoint: 'script_generation',
      concept,
      platform,
      niche,
      tokensUsed: scriptResult.tokensUsed,
      cost: scriptResult.cost,
      patternSource: patternData.source,
    });

    const response: ScriptResponse = {
      script: scriptResult.script,
      predictedDps: dpsResult.dps,
      confidence: dpsResult.confidence,
      reasoning: dpsResult.reasoning,
      patternSource: patternData.source,
      sourceVideoId: patternData.primaryPattern?.source_video_id,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        attributes: dpsResult.attributes,
        recommendations: dpsResult.recommendations,
        // Include metadata about pattern usage
        patternMetadata: {
          source: patternData.source,
          patternsUsed: patternData.viralGenomes.length,
          exampleVideosUsed: patternData.topPerformingVideos.length,
          primaryPatternType: patternData.primaryPattern?.pattern_type,
          primaryPatternDps: patternData.primaryPattern?.dps_average,
          sourceVideoId: patternData.primaryPattern?.source_video_id,
        }
      },
    });

  } catch (error: any) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fetch REAL pattern DNA from viral_genomes
 * This ensures scripts are based on actual viral patterns, not just AI imagination
 */
async function fetchRealPatternData(concept: string, niche: string, patternId?: string) {
  try {
    let primaryPattern: any = null;
    let viralGenomes: any[] = [];
    let source = 'none';

    // PRIORITY 1: If patternId is provided, fetch that specific pattern
    if (patternId) {
      const { data: specificPattern, error } = await supabase
        .from('viral_genomes')
        .select('*')
        .eq('id', patternId)
        .single();

      if (!error && specificPattern) {
        primaryPattern = specificPattern;
        viralGenomes = [specificPattern];
        source = 'viral_genomes_specific';
        console.log(`[Script Gen] Using specific pattern: ${patternId}`);
      }
    }

    // PRIORITY 2: Find patterns matching the niche
    if (!primaryPattern) {
      // Try multiple niche formats since niche might be stored differently
      const nicheVariants = [
        niche,
        niche.toLowerCase(),
        niche.toLowerCase().replace(/\s+/g, '-'),
        niche.toLowerCase().replace(/\s+/g, '_'),
        'general', // Fallback
      ];

      for (const nicheQuery of nicheVariants) {
        const { data: patterns, error } = await supabase
          .from('viral_genomes')
          .select('*')
          .eq('niche', nicheQuery)
          .order('dps_average', { ascending: false })
          .limit(5);

        if (!error && patterns && patterns.length > 0) {
          viralGenomes = patterns;
          primaryPattern = patterns[0];
          source = 'viral_genomes_niche';
          console.log(`[Script Gen] Found ${patterns.length} patterns for niche: ${nicheQuery}`);
          break;
        }
      }
    }

    // PRIORITY 3: If still no patterns, get top patterns regardless of niche
    if (!primaryPattern) {
      const { data: topPatterns, error } = await supabase
        .from('viral_genomes')
        .select('*')
        .order('dps_average', { ascending: false })
        .limit(5);

      if (!error && topPatterns && topPatterns.length > 0) {
        viralGenomes = topPatterns;
        primaryPattern = topPatterns[0];
        source = 'viral_genomes_top';
        console.log(`[Script Gen] Using top ${topPatterns.length} patterns (no niche match)`);
      }
    }

    // PRIORITY 4: Get example videos with transcripts for additional context
    const { data: topVideos } = await supabase
      .from('scraped_videos')
      .select('video_id, title, caption, transcript_text, dps_score, views_count, likes_count')
      .not('transcript_text', 'is', null)
      .order('dps_score', { ascending: false })
      .limit(3);

    const topPerformingVideos = (topVideos || []).map(v => ({
      videoId: v.video_id,
      title: v.title,
      dps: v.dps_score,
      views: v.views_count,
      caption: v.caption,
      transcript: v.transcript_text?.slice(0, 500), // Limit transcript length
    }));

    if (topPerformingVideos.length > 0 && source === 'none') {
      source = 'scraped_videos_fallback';
    }

    // Log what we found
    console.log(`[Script Gen] Pattern data summary:`, {
      source,
      viralGenomesCount: viralGenomes.length,
      exampleVideosCount: topPerformingVideos.length,
      primaryPatternType: primaryPattern?.pattern_type,
      primaryPatternDps: primaryPattern?.dps_average,
    });

    return {
      viralGenomes,
      primaryPattern,
      topPerformingVideos,
      source,
      hasRealData: viralGenomes.length > 0 || topPerformingVideos.length > 0,
    };
  } catch (error) {
    console.error('[Script Gen] Error fetching pattern data:', error);
    return { 
      viralGenomes: [], 
      primaryPattern: null,
      topPerformingVideos: [], 
      source: 'error',
      hasRealData: false 
    };
  }
}

function getPlatformGuidance(platform: string, length: number) {
  const guidance = {
    tiktok: {
      hook: 'Bold, pattern-interrupt, scroll-stopping. Use visual shock or curiosity gap.',
      pacing: 'Fast, energetic, punchy. Every second counts.',
      style: 'Casual, authentic, conversational. Like talking to a friend.',
      viral_threshold: 70,
    },
    instagram: {
      hook: 'Visual storytelling. Start with intrigue or relatability.',
      pacing: 'Smooth, aesthetic, rhythmic. Balance speed with polish.',
      style: 'Aspirational yet authentic. Blend inspiration with education.',
      viral_threshold: 65,
    },
    youtube: {
      hook: 'Promise value immediately. Tease the payoff.',
      pacing: 'Structured, clear, informative. Build momentum.',
      style: 'Professional yet personable. Educational entertainment.',
      viral_threshold: 60,
    },
  };

  return guidance[platform as keyof typeof guidance] || guidance.tiktok;
}

async function generateScriptWithOpenAI(
  concept: string,
  platform: string,
  length: number,
  niche: string,
  platformGuidance: any,
  patternData: { 
    viralGenomes: any[], 
    primaryPattern: any,
    topPerformingVideos: any[], 
    hasRealData: boolean,
    source: string 
  }
) {
  // =====================================================
  // BUILD PROMPT WITH REAL PATTERN DNA
  // =====================================================
  let patternContext = '';
  
  if (patternData.hasRealData) {
    // PRIMARY PATTERN: Extract full DNA if available
    if (patternData.primaryPattern) {
      const p = patternData.primaryPattern;
      const dna = p.pattern_dna || {};
      
      patternContext += `\n\n🧬 **PRIMARY VIRAL PATTERN (PROVEN TO WORK - ${p.dps_average?.toFixed(1) || 'N/A'} DPS)**\n`;
      patternContext += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      // Core pattern elements
      if (dna.topic) patternContext += `📌 **Topic/Theme**: ${dna.topic}\n`;
      if (dna.angle) patternContext += `🎯 **Unique Angle**: ${dna.angle}\n`;
      
      // Hook structures - THE MOST IMPORTANT PART
      patternContext += `\n🪝 **HOOK STRUCTURE (Use this exact pattern)**:\n`;
      if (dna.hook_spoken) patternContext += `   • Spoken Hook: "${dna.hook_spoken}"\n`;
      if (dna.hook_text) patternContext += `   • Text Hook: "${dna.hook_text}"\n`;
      if (dna.hook_visual) patternContext += `   • Visual Hook: ${dna.hook_visual}\n`;
      
      // Story structure
      if (dna.story_structure) {
        patternContext += `\n📖 **Story Structure**: ${dna.story_structure}\n`;
      }
      
      // Visual format
      if (dna.visual_format) {
        patternContext += `🎬 **Visual Format**: ${dna.visual_format}\n`;
      }
      
      // Key visuals
      if (dna.key_visuals && Array.isArray(dna.key_visuals)) {
        patternContext += `📸 **Key Visuals**: ${dna.key_visuals.join(', ')}\n`;
      }
      
      // Audio description
      if (dna.audio_description) {
        patternContext += `🔊 **Audio Style**: ${dna.audio_description}\n`;
      }
      
      // Viral patterns identified
      if (dna.viral_patterns && Array.isArray(dna.viral_patterns)) {
        patternContext += `\n⚡ **Viral Patterns Used**: ${dna.viral_patterns.join(', ')}\n`;
      }
      
      // Nine Attributes scores from the pattern
      patternContext += `\n📊 **PROVEN PERFORMANCE METRICS**:\n`;
      if (dna.hook_strength) patternContext += `   • Hook Strength: ${dna.hook_strength}/10\n`;
      if (dna.tam_resonance) patternContext += `   • TAM Resonance: ${dna.tam_resonance}/10\n`;
      if (dna.sharability) patternContext += `   • Shareability: ${dna.sharability}/10\n`;
      if (dna.value_density) patternContext += `   • Value Density: ${dna.value_density}/10\n`;
      if (dna.curiosity_gaps) patternContext += `   • Curiosity Gaps: ${dna.curiosity_gaps}/10\n`;
      if (dna.emotional_journey) patternContext += `   • Emotional Journey: ${dna.emotional_journey}/10\n`;
      
      patternContext += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    }
    
    // Additional patterns for variety
    if (patternData.viralGenomes.length > 1) {
      patternContext += `\n\n📚 **ADDITIONAL VIRAL PATTERNS IN THIS NICHE**:\n`;
      patternData.viralGenomes.slice(1, 4).forEach((p, i) => {
        const dna = p.pattern_dna || {};
        patternContext += `${i + 2}. **${p.pattern_type}** (${p.dps_average?.toFixed(1) || 'N/A'} DPS)\n`;
        if (dna.topic) patternContext += `   Topic: ${dna.topic?.slice(0, 100)}...\n`;
        if (dna.story_structure) patternContext += `   Structure: ${dna.story_structure}\n`;
      });
    }
    
    // Example transcripts from top videos
    if (patternData.topPerformingVideos.length > 0) {
      patternContext += `\n\n📹 **REAL VIRAL VIDEO EXAMPLES**:\n`;
      patternData.topPerformingVideos.slice(0, 2).forEach((v, i) => {
        patternContext += `\n${i + 1}. "${v.title?.slice(0, 60)}..." - ${v.dps?.toFixed(1) || 'N/A'} DPS, ${v.views?.toLocaleString() || 'N/A'} views\n`;
        if (v.transcript) {
          patternContext += `   Transcript excerpt: "${v.transcript.slice(0, 200)}..."\n`;
        }
      });
      patternContext += `\n**Study these examples and incorporate their successful elements.**\n`;
    }
  } else {
    patternContext = `\n\n⚠️ No viral patterns found in database for "${niche}". Generate based on general viral best practices.\n`;
  }

  const systemPrompt = `You are an expert viral short-form video scriptwriter specializing in ${platform} content. You have access to REAL viral pattern data extracted from videos that actually went viral.

${patternContext}

YOUR MISSION: Write a ${length}-second script for "${niche}" content that REPLICATES the proven viral patterns above.

**THE NINE ATTRIBUTES FRAMEWORK (Maximize Each)**:
1. **Hook Strength** - First 3 seconds must STOP THE SCROLL using the proven hook style above
2. **Pattern Interrupt** - Unexpected elements that break expectations
3. **Emotional Resonance** - Create strong feelings (curiosity, excitement, FOMO)
4. **Value Density** - Maximum useful info per second
5. **Curiosity Gaps** - Create open loops that MUST be closed
6. **Retention Architecture** - Keep viewers watching through end
7. **Social Currency** - Makes viewer look smart by sharing
8. **CTA Power** - Clear, compelling call-to-action
9. **Format Optimization** - Platform-specific best practices

**Platform (${platform.toUpperCase()}) Guidance**:
- Hook style: ${platformGuidance.hook}
- Pacing: ${platformGuidance.pacing}
- Style: ${platformGuidance.style}
- Viral threshold: ${platformGuidance.viral_threshold} DPS

CRITICAL: Your script MUST follow the hook structure and story pattern from the PRIMARY VIRAL PATTERN above. Don't just make something up - USE THE PROVEN FORMULA.`;

  const userPrompt = `Create a ${length}-second viral script about: "${concept}"

Requirements:
1. Use the hook pattern style from the viral pattern data
2. Follow the proven story structure
3. Include specific, concrete details (numbers, examples)
4. End with a compelling CTA

You MUST respond with this EXACT format (including the section headers):

HOOK:
Write the opening hook here (0-3 seconds). Must stop the scroll.

CONTEXT:
Write the context/setup here (3-8 seconds). Establish the problem or situation.

VALUE:
Write the main value content here (8-${length - 5} seconds). Deliver the core message.

CTA:
Write the call-to-action here (${length - 5}-${length} seconds). Tell them what to do next.

FULL SCRIPT:
Write the complete script as it would be spoken, without section headers. This is what the creator will actually say.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7, // Slightly lower for more pattern adherence
    max_tokens: 1500,
  });

  const content = completion.choices[0].message.content || '';
  const tokensUsed = completion.usage?.total_tokens || 0;
  const cost = (tokensUsed / 1000) * 0.0005; // GPT-4o-mini pricing

  // Parse the structured response
  const script = parseScriptFromCompletion(content, length);

  return {
    script,
    tokensUsed,
    cost,
    rawContent: content,
    patternSource: patternData.source,
  };
}

function parseScriptFromCompletion(content: string, length: number) {
  console.log('[Script Parse] Raw content length:', content.length);
  console.log('[Script Parse] Raw content:', content);
  
  const sections = {
    hook: '',
    context: '',
    value: '',
    cta: '',
    fullScript: '',
  };

  // Split by common section headers
  // Look for HOOK:, CONTEXT:, VALUE:, CTA:, FULL SCRIPT:
  const hookMatch = content.match(/HOOK:?\s*\n([\s\S]*?)(?=\nCONTEXT:?|\n\n\s*CONTEXT)/i);
  const contextMatch = content.match(/CONTEXT:?\s*\n([\s\S]*?)(?=\nVALUE:?|\n\n\s*VALUE)/i);
  const valueMatch = content.match(/VALUE:?\s*\n([\s\S]*?)(?=\nCTA:?|\n\n\s*CTA)/i);
  const ctaMatch = content.match(/CTA:?\s*\n([\s\S]*?)(?=\nFULL SCRIPT:?|\n\n\s*FULL)/i);
  const fullScriptMatch = content.match(/FULL SCRIPT:?\s*\n([\s\S]*?)$/i);

  if (hookMatch) sections.hook = hookMatch[1].trim();
  if (contextMatch) sections.context = contextMatch[1].trim();
  if (valueMatch) sections.value = valueMatch[1].trim();
  if (ctaMatch) sections.cta = ctaMatch[1].trim();
  if (fullScriptMatch) sections.fullScript = fullScriptMatch[1].trim();

  console.log('[Script Parse] Parsed sections:', {
    hook: sections.hook.slice(0, 100),
    context: sections.context.slice(0, 100),
    value: sections.value.slice(0, 100),
    cta: sections.cta.slice(0, 100),
    fullScript: sections.fullScript.slice(0, 100),
  });

  // If standard parsing failed, try alternative approach
  if (!sections.hook && !sections.fullScript) {
    console.log('[Script Parse] Standard parsing failed, trying line-by-line...');
    
    const lines = content.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const lowerLine = trimmedLine.toLowerCase();
      
      // Check for section headers
      if (lowerLine.startsWith('hook')) {
        currentSection = 'hook';
        continue;
      } else if (lowerLine.startsWith('context')) {
        currentSection = 'context';
        continue;
      } else if (lowerLine.startsWith('value')) {
        currentSection = 'value';
        continue;
      } else if (lowerLine.startsWith('cta')) {
        currentSection = 'cta';
        continue;
      } else if (lowerLine.includes('full script')) {
        currentSection = 'fullScript';
        continue;
      }
      
      // Add content to current section
      if (currentSection && trimmedLine) {
        const key = currentSection as keyof typeof sections;
        sections[key] += (sections[key] ? '\n' : '') + trimmedLine;
      }
    }
  }

  // Final fallback: if still no content, use entire response
  if (!sections.hook && !sections.fullScript && content.length > 50) {
    console.log('[Script Parse] Using entire content as fullScript');
    sections.fullScript = content;
    
    // Try to split into rough sections
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length >= 4) {
      sections.hook = paragraphs[0];
      sections.context = paragraphs[1];
      sections.value = paragraphs.slice(2, -1).join('\n\n');
      sections.cta = paragraphs[paragraphs.length - 1];
    } else if (paragraphs.length >= 1) {
      sections.hook = paragraphs[0];
    }
  }

  // Build fullScript from sections if not explicitly provided
  const finalFullScript = sections.fullScript || 
    [sections.hook, sections.context, sections.value, sections.cta].filter(Boolean).join('\n\n');

  return {
    hook: {
      section: 'Hook',
      timing: '0-3s',
      content: sections.hook || 'Hook content unavailable',
    },
    context: {
      section: 'Context',
      timing: '3-8s',
      content: sections.context || 'Context content unavailable',
    },
    value: {
      section: 'Value',
      timing: `8-${length - 5}s`,
      content: sections.value || 'Value content unavailable',
    },
    cta: {
      section: 'CTA',
      timing: `${length - 5}-${length}s`,
      content: sections.cta || 'CTA content unavailable',
    },
    fullScript: finalFullScript || 'Script content not available. Please try regenerating.',
  };
}

async function calculatePredictedDPS(
  scriptResult: any,
  platform: string,
  niche: string
) {
  const script = scriptResult.script;

  // Analyze script against Nine Attributes
  const attributes = {
    patternInterrupt: analyzePatternInterrupt(script.hook.content),
    emotionalResonance: analyzeEmotionalResonance(script.fullScript),
    socialCurrency: analyzeSocialCurrency(script.fullScript, niche),
    valueDensity: analyzeValueDensity(script.value.content),
    hookStrength: analyzeHookStrength(script.hook.content),
    retentionArchitecture: analyzeRetention(script.fullScript),
    ctaPower: analyzeCTA(script.cta.content),
    formatOptimization: 0.85, // High since we're using platform guidance
    trendAlignment: scriptResult.patternSource?.includes('viral_genomes') ? 0.90 : 0.70, // Higher if using real patterns
  };

  // Calculate weighted DPS (0-100 scale)
  const weights = {
    hookStrength: 0.20,
    patternInterrupt: 0.15,
    emotionalResonance: 0.15,
    valueDensity: 0.12,
    retentionArchitecture: 0.12,
    socialCurrency: 0.10,
    ctaPower: 0.08,
    formatOptimization: 0.05,
    trendAlignment: 0.03,
  };

  let dps = 0;
  let reasoning = [];

  // Pattern source bonus
  if (scriptResult.patternSource === 'viral_genomes_specific') {
    reasoning.push('✅ Using specific viral pattern from database');
    dps += 3; // Bonus for using real pattern
  } else if (scriptResult.patternSource === 'viral_genomes_niche') {
    reasoning.push('✅ Using viral patterns from niche');
    dps += 2;
  } else if (scriptResult.patternSource === 'viral_genomes_top') {
    reasoning.push('⚠️ Using top patterns (no niche match)');
    dps += 1;
  }

  for (const [attr, value] of Object.entries(attributes)) {
    const weight = weights[attr as keyof typeof weights] || 0;
    dps += value * weight * 100;

    if (value >= 0.8) {
      reasoning.push(`✅ Strong ${formatAttrName(attr)}: ${(value * 100).toFixed(0)}%`);
    } else if (value < 0.6) {
      reasoning.push(`⚠️ Weak ${formatAttrName(attr)}: ${(value * 100).toFixed(0)}%`);
    }
  }

  // Platform adjustment
  const platformBonus = {
    tiktok: 1.05,
    instagram: 1.02,
    youtube: 1.00,
  };
  dps *= platformBonus[platform as keyof typeof platformBonus] || 1.0;

  // Cap at 100
  dps = Math.min(dps, 100);

  // Calculate confidence based on attribute variance and data source
  const attributeValues = Object.values(attributes);
  const avgAttribute = attributeValues.reduce((a, b) => a + b, 0) / attributeValues.length;
  const variance = attributeValues.reduce((sum, val) => sum + Math.pow(val - avgAttribute, 2), 0) / attributeValues.length;
  let confidence = Math.max(0.6, 1 - (variance * 2));
  
  // Higher confidence if using real patterns
  if (scriptResult.patternSource?.includes('viral_genomes')) {
    confidence = Math.min(confidence + 0.1, 0.98);
  }

  // Generate optimization recommendations
  const recommendations = generateOptimizationRecommendations(attributes, scriptResult.script);

  return {
    dps: Math.round(dps * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: reasoning.join('\n'),
    attributes,
    recommendations,
    attributeSource: 'local_analysis', // Could be 'kai' if we integrate Kai later
  };
}

function formatAttrName(attr: string): string {
  return attr.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Generate optimization recommendations based on Nine Attributes scores
 */
function generateOptimizationRecommendations(attributes: any, script: any) {
  const recommendations = [];

  // Hook Strength recommendations
  if (attributes.hookStrength < 0.7) {
    recommendations.push({
      attribute: 'hookStrength',
      current: attributes.hookStrength,
      target: 0.85,
      impact: '+2-3 DPS',
      suggestion: 'Strengthen hook: Add a number or question in the first 3 seconds',
      example: `Try: "What if I told you ${script.hook.content.toLowerCase().slice(0, 30)}..."`,
    });
  }

  // Pattern Interrupt recommendations
  if (attributes.patternInterrupt < 0.7) {
    recommendations.push({
      attribute: 'patternInterrupt',
      current: attributes.patternInterrupt,
      target: 0.85,
      impact: '+1.5-2 DPS',
      suggestion: 'Add pattern interrupt: Use unexpected statement or visual shock',
      example: 'Start with "Stop scrolling!" or "You won\'t believe this..."',
    });
  }

  // Emotional Resonance recommendations
  if (attributes.emotionalResonance < 0.7) {
    recommendations.push({
      attribute: 'emotionalResonance',
      current: attributes.emotionalResonance,
      target: 0.80,
      impact: '+1.5 DPS',
      suggestion: 'Increase emotional impact: Add words like "shocking", "incredible", "struggle"',
      example: 'Emphasize the transformation or struggle in the story',
    });
  }

  // Value Density recommendations
  if (attributes.valueDensity < 0.7) {
    recommendations.push({
      attribute: 'valueDensity',
      current: attributes.valueDensity,
      target: 0.85,
      impact: '+1-2 DPS',
      suggestion: 'Increase value density: Add specific numbers, steps, or data points',
      example: 'Include "3 ways to..." or "Studies show X% of people..."',
    });
  }

  // Retention Architecture recommendations
  if (attributes.retentionArchitecture < 0.7) {
    recommendations.push({
      attribute: 'retentionArchitecture',
      current: attributes.retentionArchitecture,
      target: 0.80,
      impact: '+1-1.5 DPS',
      suggestion: 'Improve retention: Add curiosity gap or open loop at 8 seconds',
      example: 'Insert "But here\'s what most people don\'t know..." at mid-point',
    });
  }

  // CTA Power recommendations
  if (attributes.ctaPower < 0.7) {
    recommendations.push({
      attribute: 'ctaPower',
      current: attributes.ctaPower,
      target: 0.85,
      impact: '+0.5-1 DPS',
      suggestion: 'Strengthen CTA: Add urgency and specific action',
      example: 'Change to "Follow now for daily tips" instead of just "Follow for more"',
    });
  }

  // Social Currency recommendations
  if (attributes.socialCurrency < 0.7) {
    recommendations.push({
      attribute: 'socialCurrency',
      current: attributes.socialCurrency,
      target: 0.80,
      impact: '+1 DPS',
      suggestion: 'Increase shareability: Add "Most people don\'t know this..." or cite research',
      example: 'Include insider knowledge or expert perspective',
    });
  }

  return recommendations;
}

// Attribute analysis functions
function analyzePatternInterrupt(hook: string): number {
  const interruptWords = ['stop', 'wait', 'shock', 'secret', 'never', 'why', 'how', 'what if', 'imagine', 'surprising', 'crazy', 'insane', 'wild'];
  const hasQuestion = hook.includes('?');
  const hasNumbers = /\d+/.test(hook);
  const hasEmphasis = /!|ALL CAPS|\*/.test(hook);
  const hasDirectAddress = /you|your/i.test(hook);

  let score = 0.5;
  if (interruptWords.some(word => hook.toLowerCase().includes(word))) score += 0.2;
  if (hasQuestion) score += 0.15;
  if (hasNumbers) score += 0.1;
  if (hasEmphasis) score += 0.05;
  if (hasDirectAddress) score += 0.05;

  return Math.min(score, 1.0);
}

function analyzeEmotionalResonance(text: string): number {
  const emotionalWords = [
    'amazing', 'shocking', 'incredible', 'unbelievable', 'powerful', 'transform',
    'struggle', 'success', 'fail', 'win', 'fear', 'excited', 'worried', 'happy',
    'love', 'hate', 'angry', 'frustrated', 'overwhelmed', 'relief', 'breakthrough'
  ];

  const matches = emotionalWords.filter(word =>
    text.toLowerCase().includes(word)
  ).length;

  return Math.min(0.5 + (matches * 0.08), 1.0);
}

function analyzeSocialCurrency(text: string, niche: string): number {
  const shareableIndicators = [
    'most people don\'t know',
    'secret',
    'insider',
    'expert',
    'proven',
    'research shows',
    'study found',
    'trick',
    'hack',
    'nobody tells you',
    'the truth about',
  ];

  const matches = shareableIndicators.filter(phrase =>
    text.toLowerCase().includes(phrase)
  ).length;

  return Math.min(0.6 + (matches * 0.12), 1.0);
}

function analyzeValueDensity(valueSection: string): number {
  const words = valueSection.split(/\s+/).length;
  const sentences = valueSection.split(/[.!?]+/).filter(s => s.trim()).length;
  const hasNumbers = /\d+/.test(valueSection);
  const hasSteps = /first|second|third|next|then|finally|step/i.test(valueSection);
  const hasSpecifics = /percent|minutes|dollars|hours|days|weeks/i.test(valueSection);

  let score = 0.5;
  if (words > 50) score += 0.1;
  if (sentences >= 3) score += 0.1;
  if (hasNumbers) score += 0.15;
  if (hasSteps) score += 0.1;
  if (hasSpecifics) score += 0.1;

  return Math.min(score, 1.0);
}

function analyzeHookStrength(hook: string): number {
  const words = hook.split(/\s+/).length;
  const isShort = words <= 15;
  const hasQuestion = hook.includes('?');
  const hasNumber = /\d+/.test(hook);
  const hasStrongVerb = /stop|watch|discover|learn|get|make|avoid|fix|master|unlock/i.test(hook);
  const hasYou = /you|your/i.test(hook);

  let score = 0.4;
  if (isShort) score += 0.15;
  if (hasQuestion) score += 0.15;
  if (hasNumber) score += 0.15;
  if (hasStrongVerb) score += 0.1;
  if (hasYou) score += 0.1;

  return Math.min(score, 1.0);
}

function analyzeRetention(fullScript: string): number {
  const hasOpenLoop = /but|however|wait|here's the thing|plot twist|except/i.test(fullScript);
  const hasProgression = /first|next|then|finally|and that's when|and here's/i.test(fullScript);
  const hasPayoff = /that's why|so|because|result|and that's how/i.test(fullScript);
  const sentences = fullScript.split(/[.!?]+/).filter(s => s.trim()).length;
  const hasMidPointHook = /but here's|and this is where|now here's/i.test(fullScript);

  let score = 0.5;
  if (hasOpenLoop) score += 0.12;
  if (hasProgression) score += 0.12;
  if (hasPayoff) score += 0.1;
  if (sentences >= 6) score += 0.08;
  if (hasMidPointHook) score += 0.1;

  return Math.min(score, 1.0);
}

function analyzeCTA(cta: string): number {
  const hasAction = /follow|like|comment|share|save|click|watch|try|get|download|subscribe/i.test(cta);
  const hasUrgency = /now|today|don't miss|limited|before/i.test(cta);
  const hasReason = /to|for|because|so you can|if you want/i.test(cta);
  const hasSpecificAction = /follow for more|save this|share with/i.test(cta);

  let score = 0.5;
  if (hasAction) score += 0.2;
  if (hasUrgency) score += 0.15;
  if (hasReason) score += 0.1;
  if (hasSpecificAction) score += 0.1;

  return Math.min(score, 1.0);
}

async function logAPIUsage(data: {
  endpoint: string;
  concept: string;
  platform: string;
  niche: string;
  tokensUsed: number;
  cost: number;
  patternSource?: string;
}) {
  try {
    await supabase.from('api_usage_logs').insert({
      endpoint: data.endpoint,
      metadata: {
        concept: data.concept,
        platform: data.platform,
        niche: data.niche,
        patternSource: data.patternSource,
      },
      tokens_used: data.tokensUsed,
      cost_usd: data.cost,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
    // Don't fail the request if logging fails
  }
}
