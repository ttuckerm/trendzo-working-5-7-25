/**
 * AI Video Prompt Generator Engine
 * Transforms rough video ideas into production-ready cinematic prompts
 * Enhanced with GPT-4o-mini smart genre detection and DPS integration
 * 
 * UPDATED: Now generates scene-by-scene production directions suitable for
 * AI video generators like Sora, Runway, and Kling.
 */

import OpenAI from 'openai';
import { CinematicTemplate, TemplateFields } from './cinematic-template';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface PromptGenerationRequest {
  user_input: string;
  constraints?: {
    no_dialogue?: boolean;
    specific_style?: string;
    camera_requirements?: string;
    duration?: number;
    genre_override?: string; // Manual genre selection
  };
  dps_context?: {
    target_score: number;
    viral_patterns: string[];
    niche: string;
  };
  use_smart_detection?: boolean; // Use GPT-4o-mini for genre detection
}

export interface PromptGenerationResult {
  cinematic_prompt: string;
  structured_data: TemplateFields;
  reasoning: {
    detected_genre: string;
    detected_mood: string;
    detected_elements: string[];
    smart_analysis?: string;
  };
  dps_alignment: {
    predicted_elements: string[];
    expected_impact: number;
  };
  scenes?: SceneDescription[];
}

export interface SceneDescription {
  scene_number: number;
  timing: string;
  visual_description: string;
  dialogue?: string;
  camera_notes: string;
  audio: string;
  style: string;
}

export class PromptGeneratorEngine {
  private template: CinematicTemplate;

  constructor() {
    this.template = new CinematicTemplate();
  }

  /**
   * Generate cinematic prompt from user input
   * UPDATED: Now generates scene-by-scene production directions
   */
  async generate(request: PromptGenerationRequest): Promise<PromptGenerationResult> {
    // Step 1: Analyze input (smart or basic)
    const extractedElements = await this.analyzeInput(
      request.user_input,
      request.use_smart_detection || false,
      request.constraints?.genre_override
    );

    // Step 2: Map to template structure (for backward compatibility)
    const mappedFields = this.mapToTemplate(extractedElements, request.constraints);

    // Step 3: Apply genre-specific defaults
    const completeFields = this.applyDefaults(
      mappedFields,
      extractedElements.genre,
      extractedElements.mood
    );

    // Step 4: Enhance with DPS patterns (if context provided)
    if (request.dps_context) {
      this.enhanceWithDPSPatterns(completeFields, request.dps_context);
    }

    // Step 5: Apply cinematic enhancements
    const cinematicFields = this.applyCinematicStyle(completeFields);

    // Step 6: Generate scene-by-scene production prompt using GPT
    const duration = request.constraints?.duration || 15;
    const cinematicPrompt = await this.generateSceneByScenePrompt(
      request.user_input,
      extractedElements,
      cinematicFields,
      duration,
      request.constraints
    );

    return {
      cinematic_prompt: cinematicPrompt,
      structured_data: cinematicFields,
      reasoning: {
        detected_genre: extractedElements.genre,
        detected_mood: extractedElements.mood,
        detected_elements: extractedElements.elements || [],
        smart_analysis: extractedElements.smart_analysis,
      },
      dps_alignment: {
        predicted_elements: this.identifyViralElements(cinematicFields),
        expected_impact: this.estimateDPSImpact(cinematicFields, request.dps_context),
      },
    };
  }

  /**
   * Generate scene-by-scene production prompt using GPT
   * This produces human-readable directions for AI video generators
   */
  private async generateSceneByScenePrompt(
    userInput: string,
    elements: any,
    fields: TemplateFields,
    duration: number,
    constraints?: any
  ): Promise<string> {
    const numScenes = Math.ceil(duration / 5); // ~5 seconds per scene
    
    const systemPrompt = `You are a professional video director creating shot-by-shot production prompts for AI video generators like Sora, Runway, and Kling.

Given a script or concept, break it down into individual shots with specific visual and audio directions.

For each scene/shot, provide:
1. SCENE NUMBER and TIMING (e.g., "SCENE 1 - HOOK (0-3 seconds)")
2. VISUAL DESCRIPTION: Detailed shot description including:
   - Shot type (close-up, medium, wide, etc.)
   - Subject position and action
   - Lighting (natural, dramatic, soft, etc.)
   - Background/environment
   - Camera movement (static, push in, pan, etc.)
   - Depth of field
3. DIALOGUE: The exact words spoken (if any), or "(no dialogue)"
4. CAMERA NOTES: Technical camera direction
5. AUDIO: Music, sound effects, or voice-only
6. STYLE: Overall aesthetic (documentary, cinematic, vlog, etc.)

Format each scene clearly and separately with line breaks. Make prompts specific enough for AI video generators to produce consistent results.

CRITICAL: Do NOT output internal metadata, JSON, technical parameters, or curly braces. Output ONLY human-readable production directions that a video director would understand.

Example output format:
---
SCENE 1 - HOOK (0-3 seconds)
A medium close-up shot of a confident young professional sitting at a modern minimalist desk. Natural soft lighting from a large window camera-left. Subject looks directly at camera with a knowing, slightly provocative expression. Shallow depth of field, blurred office background.

DIALOGUE: "Most people are leaving money on the table..."

CAMERA: Static shot, eye-level, slowly pushing in
AUDIO: No music, just voice
STYLE: Documentary, authentic, iPhone-quality aesthetic
---`;

    const userPrompt = `Create a shot-by-shot cinematic production prompt for the following:

CONCEPT/SCRIPT:
"""
${userInput}
"""

VIDEO LENGTH: ${duration} seconds
GENRE: ${elements.genre || 'documentary'}
MOOD: ${elements.mood || 'engaging'}
STYLE: ${constraints?.specific_style || 'Modern, authentic TikTok/social media style'}
${constraints?.no_dialogue ? 'NOTE: No dialogue - this is a visual-only video' : ''}

Break this into ${numScenes} scenes (approximately ${Math.round(duration/numScenes)} seconds each).
For each scene, provide detailed visual direction that an AI video generator can use.

Remember: Output clean, human-readable production directions only. No JSON, no metadata objects.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0].message.content || '';
      
      // Clean up any residual formatting issues
      return this.cleanPromptOutput(content);
    } catch (error) {
      console.error('Failed to generate scene-by-scene prompt:', error);
      // Fallback to basic template format if GPT fails
      return this.generateFallbackPrompt(userInput, elements, fields, duration);
    }
  }

  /**
   * Clean up the prompt output to ensure it's human-readable
   */
  private cleanPromptOutput(content: string): string {
    // Remove any JSON-like structures that might have slipped through
    let cleaned = content
      .replace(/\{[^}]+\}/g, '') // Remove JSON objects
      .replace(/\[[^\]]+\]/g, '') // Remove JSON arrays  
      .replace(/locale:|tone_note:|Reference images:/gi, '') // Remove metadata labels
      .replace(/Subject \/ Scene Settings:/gi, '') // Remove metadata headers
      .replace(/Audience:/gi, '')
      .trim();
    
    // Ensure proper line breaks between sections
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned;
  }

  /**
   * Generate a fallback prompt if GPT fails
   */
  private generateFallbackPrompt(
    userInput: string,
    elements: any,
    fields: TemplateFields,
    duration: number
  ): string {
    const numScenes = Math.ceil(duration / 5);
    let prompt = '';

    for (let i = 1; i <= numScenes; i++) {
      const startTime = (i - 1) * Math.round(duration / numScenes);
      const endTime = i * Math.round(duration / numScenes);
      
      prompt += `SCENE ${i} (${startTime}-${endTime} seconds)\n`;
      prompt += `A ${elements.mood || 'dynamic'} shot capturing the essence of: "${userInput.slice(0, 100)}${userInput.length > 100 ? '...' : ''}"\n\n`;
      prompt += `VISUAL: ${fields.lighting}. ${fields.background_location}.\n`;
      prompt += `CAMERA: ${fields.camera}\n`;
      prompt += `AUDIO: ${fields.bgm}\n`;
      prompt += `STYLE: ${fields.visual_taste}\n`;
      prompt += `\n---\n\n`;
    }

    return prompt.trim();
  }

  /**
   * Analyze user input - Smart (GPT-4o-mini) or Basic (pattern matching)
   */
  private async analyzeInput(
    userInput: string,
    useSmartDetection: boolean,
    genreOverride?: string
  ): Promise<any> {
    // Manual genre override takes precedence
    if (genreOverride) {
      return this.analyzeInputBasic(userInput, genreOverride);
    }

    // Smart detection using GPT-4o-mini
    if (useSmartDetection) {
      return await this.analyzeInputSmart(userInput);
    }

    // Basic pattern matching
    return this.analyzeInputBasic(userInput);
  }

  /**
   * Smart genre detection using GPT-4o-mini
   */
  private async analyzeInputSmart(userInput: string): Promise<any> {
    const systemPrompt = `You are a cinematic expert. Analyze the user's video concept and extract:
1. Genre (horror, action, sci-fi, romance, documentary, comedy, drama, thriller)
2. Mood (dark, epic, peaceful, intense, mysterious, uplifting, dramatic)
3. Setting (location/environment)
4. Time of day (morning, day, sunset, night, golden hour)
5. Key visual elements
6. Emotional tone

Respond in JSON format:
{
  "genre": "...",
  "mood": "...",
  "setting": "...",
  "time_of_day": "...",
  "elements": ["element1", "element2", ...],
  "emotional_tone": "...",
  "motion_type": "static/dynamic/chaotic",
  "analysis": "brief explanation of choices"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 400,
      });

      const content = completion.choices[0].message.content || '{}';
      const analysis = JSON.parse(content);

      return {
        subject: userInput,
        genre: analysis.genre || 'documentary',
        mood: analysis.mood || 'neutral',
        setting: analysis.setting || 'environment',
        time_of_day: analysis.time_of_day || 'day',
        motion: analysis.motion_type || 'dynamic',
        emotional_tone: analysis.emotional_tone || 'neutral',
        elements: analysis.elements || [],
        smart_analysis: analysis.analysis,
      };
    } catch (error) {
      console.error('Smart detection failed, falling back to basic:', error);
      return this.analyzeInputBasic(userInput);
    }
  }

  /**
   * Basic genre detection using pattern matching
   */
  private analyzeInputBasic(userInput: string, forceGenre?: string): any {
    const input = userInput.toLowerCase();

    let genre = forceGenre || 'documentary';
    if (!forceGenre) {
      if (input.includes('horror') || input.includes('haunted') || input.includes('scary')) genre = 'horror';
      else if (input.includes('action') || input.includes('battle') || input.includes('fight')) genre = 'action';
      else if (input.includes('romance') || input.includes('love')) genre = 'romance';
      else if (input.includes('sci-fi') || input.includes('space') || input.includes('futuristic')) genre = 'sci-fi';
      else if (input.includes('comedy') || input.includes('funny')) genre = 'comedy';
      else if (input.includes('drama') || input.includes('emotional')) genre = 'drama';
      else if (input.includes('thriller') || input.includes('suspense')) genre = 'thriller';
    }

    let mood = 'neutral';
    if (input.includes('dark') || input.includes('mysterious')) mood = 'dark';
    else if (input.includes('epic') || input.includes('intense')) mood = 'epic';
    else if (input.includes('peaceful') || input.includes('calm')) mood = 'peaceful';
    else if (input.includes('uplifting') || input.includes('inspiring')) mood = 'uplifting';

    return {
      subject: userInput,
      mood,
      genre,
      setting: this.extractSetting(userInput),
      time_of_day: this.extractTimeOfDay(userInput),
      motion: 'dynamic',
      emotional_tone: mood,
      elements: [],
    };
  }

  private extractSetting(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('space')) return 'outer space';
    if (lower.includes('city') || lower.includes('urban')) return 'city environment';
    if (lower.includes('forest')) return 'forest';
    if (lower.includes('ocean') || lower.includes('underwater')) return 'underwater';
    if (lower.includes('desert')) return 'desert landscape';
    if (lower.includes('mountain')) return 'mountain terrain';
    if (lower.includes('office')) return 'modern office';
    if (lower.includes('house') || lower.includes('home')) return 'residential interior';
    return 'environment';
  }

  private extractTimeOfDay(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('night')) return 'night';
    if (lower.includes('morning')) return 'morning';
    if (lower.includes('sunset')) return 'sunset';
    if (lower.includes('golden hour')) return 'golden hour';
    if (lower.includes('dawn')) return 'dawn';
    if (lower.includes('dusk')) return 'dusk';
    return 'day';
  }

  /**
   * Map extracted elements to template fields
   */
  private mapToTemplate(elements: any, constraints?: any): Partial<TemplateFields> {
    return {
      title: this.generateTitle(elements.subject, elements.genre),
      flavor_tag: `${elements.mood}, ${elements.genre}-inspired, cinematic`,
      audience: {
        locale: 'EN',
        tone_note: `${elements.mood}, ${elements.emotional_tone}, cinematic, high-production`,
      },
      reference_images: [],
      subject_type: this.detectSubjectType(elements.subject),
      key_features: `${elements.subject} with ${elements.mood} aesthetic, dynamic motion, strong visual contrast`,
      background_location: `${elements.setting} during ${elements.time_of_day}, establishing sense of scale and atmosphere`,
      dialogues: constraints?.no_dialogue ? '(no dialogue)' : '(no dialogue)',
    };
  }

  private generateTitle(subject: string, genre: string): string {
    const prefixes: Record<string, string> = {
      horror: 'THE',
      action: 'CODE',
      'sci-fi': 'PROJECT',
      romance: 'WHEN',
      documentary: 'INSIDE',
      comedy: 'THE',
      drama: 'STORY',
      thriller: 'EDGE',
    };
    const prefix = prefixes[genre] || 'THE';
    const words = subject.toUpperCase().split(' ').slice(0, 2).join(' ');
    return `${prefix} ${words}`;
  }

  private detectSubjectType(subject: string): string {
    const lower = subject.toLowerCase();
    if (lower.includes('person') || lower.includes('man') || lower.includes('woman') || lower.includes('character')) return 'humanoid';
    if (lower.includes('car') || lower.includes('vehicle')) return 'vehicle';
    if (lower.includes('building') || lower.includes('structure')) return 'architecture';
    if (lower.includes('nature') || lower.includes('landscape')) return 'natural environment';
    return 'object';
  }

  /**
   * Apply genre-specific cinematic defaults
   */
  private applyDefaults(mapped: any, genre: string, mood: string): TemplateFields {
    const defaults = this.getGenreDefaults(genre);

    return {
      title: mapped.title || 'UNTITLED',
      flavor_tag: mapped.flavor_tag || 'cinematic',
      audience: mapped.audience || { locale: 'EN', tone_note: 'cinematic' },
      reference_images: mapped.reference_images || [],
      subject_type: mapped.subject_type || 'object',
      key_features: mapped.key_features || 'visual elements',
      lighting: defaults.lighting,
      grade: defaults.grade,
      visual_taste: 'stylized realism, trailer-like production value, cinematic',
      background_location: mapped.background_location || 'environment',
      camera: defaults.camera,
      lens_focus: '35mm equivalent, shallow depth of field with bokeh, natural focus breathing',
      coverage: 'establishing WS, tracking MS, intimate CU, capturing complete action geography',
      persist: 'consistent visual elements throughout, maintaining color palette and lighting continuity',
      bgm: defaults.bgm,
      sfx: defaults.sfx,
      cues: '[0s] scene opens, [3.0s] key moment, [8.0s] scene closes',
      dialogues: mapped.dialogues || '(no dialogue)',
    };
  }

  /**
   * Genre-specific production defaults
   */
  private getGenreDefaults(genre: string): any {
    const defaults: Record<string, any> = {
      horror: {
        lighting: 'low-key, hard shafts of moonlight through venetian blinds, practical sources casting long shadows, volumetric fog catching light beams, rim light separating subject from darkness',
        camera: 'handheld drift with subtle shake, slow creeping dolly-in, Dutch angles during peak tension, sudden whip pan reveals',
        grade: 'crushed blacks, teal-cyan shadows, sickly green midtones, heavy vignette, pushed grain',
        bgm: 'dissonant strings, sub-bass drones, reversed piano notes, tempo: 60-80 BPM, minor key',
        sfx: 'creaking floorboards, distant whispers, heartbeat thuds, wind howl',
      },
      action: {
        lighting: 'high-contrast key with hard edge, strong backlighting for separation, lens flares from practical explosions, dynamic shadows from moving sources',
        camera: 'gimbal-stabilized with dynamic tilt, rapid dolly zoom, orbital tracking shot, crash zoom into closeup, whip pan transitions',
        grade: 'crushed blacks, blown highlights, amber-teal split-tone, high contrast curve, sharpness boost',
        bgm: 'driving electronic percussion, orchestral stabs, rising synth bass, tempo: 130-150 BPM, power chords',
        sfx: 'impact hits, glass shatters, metal clangs, gunfire, explosion rumbles',
      },
      'sci-fi': {
        lighting: 'hard neon sources (cyan, magenta, electric blue), rim lighting from multiple colored sources, volumetric haze catching beams, practical screen glow',
        camera: 'smooth gimbal with precise framing, reveal shot starting tight expanding wide, orbital 360, slow-motion capture during key moments',
        grade: 'teal-magenta-cyan triad, lifted midtones, cool color cast, strong saturation in highlights, subtle lens distortion',
        bgm: 'synthesizer arpeggios, deep sub-bass pulses, glitch percussion, tempo: 100-120 BPM, lydian mode',
        sfx: 'electronic hums, digital beeps, servo motor whirs, energy pulses, hologram flickers',
      },
      documentary: {
        lighting: 'natural light motivated by environment, practical sources only, soft window light, minimal manipulation, realistic shadows',
        camera: 'handheld observation, locked-off interview framing, subtle zoom to reframe, natural pans following action',
        grade: 'natural skin tones, balanced contrast, slight lift in shadows, minimal saturation, clean look',
        bgm: 'minimal ambient pads, acoustic textures, sparse piano notes, tempo: 60-80 BPM, neutral key',
        sfx: 'environmental ambience, natural room tone, authentic location sounds',
      },
      drama: {
        lighting: 'soft key light with gentle fill, natural window light, warm practicals, emotional lighting transitions',
        camera: 'smooth dolly movements, intimate close-ups, slow push-ins on emotional beats, steady handheld for realism',
        grade: 'warm color palette, gentle contrast, rich skin tones, subtle vignette, natural saturation',
        bgm: 'emotional piano, string arrangements, subtle pads, tempo: 70-90 BPM, major/minor transitions',
        sfx: 'ambient room tone, subtle environmental sounds, emotional emphasis',
      },
      comedy: {
        lighting: 'bright even lighting, minimal shadows, cheerful color temperature, high key setup',
        camera: 'static framing for setups, quick whip pans for reactions, dutch angles for absurdity, crash zooms for emphasis',
        grade: 'vibrant colors, lifted blacks, warm highlights, punchy saturation, clean contrast',
        bgm: 'upbeat ukulele, playful percussion, comedy cues, tempo: 110-130 BPM, major key',
        sfx: 'comedic sound effects, cartoon-style emphasis, exaggerated impacts',
      },
      thriller: {
        lighting: 'harsh shadows, limited sources, dramatic contrast, unpredictable changes, tension-building darkness',
        camera: 'locked-off static building tension, sudden crash zooms, shaky handheld for chaos, tight frames creating claustrophobia',
        grade: 'desaturated, blue-gray tones, deep blacks, crushed contrast, gritty texture',
        bgm: 'tension-building drones, sparse percussion hits, dissonant notes, tempo: 80-100 BPM, atonal',
        sfx: 'tension-building ambience, sudden sharp sounds, breathing, footsteps',
      },
    };

    return defaults[genre] || defaults.documentary;
  }

  /**
   * Apply cinematic enhancements
   */
  private applyCinematicStyle(fields: TemplateFields): TemplateFields {
    // Add color palette if not specified
    if (!fields.key_features.includes('palette:')) {
      fields.key_features = `${fields.key_features}, palette: teal-amber-crimson triad`;
    }

    // Ensure volumetric atmosphere
    if (!fields.lighting.includes('volumetric')) {
      fields.lighting = `${fields.lighting}, subtle volumetric atmosphere`;
    }

    // Add grain texture for cinema quality
    if (!fields.grade.includes('grain')) {
      fields.grade = `${fields.grade}, fine grain texture`;
    }

    return fields;
  }

  /**
   * Enhance with DPS viral patterns
   */
  private enhanceWithDPSPatterns(fields: TemplateFields, dpsContext: any): void {
    // Curiosity Gap pattern
    if (dpsContext.viral_patterns.includes('Curiosity Gap')) {
      fields.camera = `${fields.camera}, reveal shot concealing then exposing key element`;
    }

    // Pattern Interrupt
    if (dpsContext.viral_patterns.includes('Pattern Interrupt')) {
      fields.camera = `${fields.camera}, sudden movement or angle change to break expectations`;
    }

    // High production for high DPS targets
    if (dpsContext.target_score >= 80) {
      fields.visual_taste = `${fields.visual_taste}, trailer-grade polish, high production value`;
      fields.grade = `${fields.grade}, cinema-quality color science`;
    }

    // Niche-specific enhancements
    if (dpsContext.niche.toLowerCase().includes('ai') || dpsContext.niche.toLowerCase().includes('tech')) {
      fields.lighting = `${fields.lighting}, tech-forward neon accents`;
    }
  }

  /**
   * Identify viral elements in the prompt
   */
  private identifyViralElements(fields: TemplateFields): string[] {
    const elements: string[] = [];

    if (fields.camera.includes('reveal')) elements.push('Curiosity Gap');
    if (fields.lighting.includes('dramatic') || fields.lighting.includes('high-contrast')) {
      elements.push('High Contrast Hook');
    }
    if (fields.camera.includes('sudden') || fields.camera.includes('whip')) {
      elements.push('Pattern Interrupt');
    }
    if (fields.bgm.includes('emotional') || fields.lighting.includes('emotional')) {
      elements.push('Emotional Resonance');
    }

    return elements;
  }

  /**
   * Estimate DPS impact of the prompt
   */
  private estimateDPSImpact(fields: TemplateFields, dpsContext?: any): number {
    let score = 60; // Base score

    // Production quality
    if (fields.grade.includes('cinema-quality')) score += 5;
    if (fields.lighting.includes('volumetric')) score += 3;
    if (fields.visual_taste.includes('trailer-grade')) score += 4;

    // Camera work
    if (fields.camera.includes('reveal')) score += 3;
    if (fields.camera.includes('dynamic')) score += 2;

    // Viral patterns
    if (dpsContext) {
      score += dpsContext.viral_patterns.length * 2;
      if (dpsContext.target_score >= 80) score += 5;
    }

    return Math.min(score, 95);
  }
}
