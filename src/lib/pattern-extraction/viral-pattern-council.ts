import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Initialize LLM clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Allow running in browser environment if needed
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || '' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { persistSession: false }
  }
);

interface VideoData {
  id: string;
  url: string;
  transcript: string;
  metrics: any;
  niche: string;
}

export class ViralPatternCouncil {
  
  async analyzeVideo(videoId: string) {
    console.log(`[Council] Analyzing video ${videoId}...`);
    const video = await this.getVideoData(videoId);
    
    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    // Run parallel analysis with all 3 LLMs
    const [gpt4, claude, gemini] = await Promise.all([
      this.analyzeWithGPT4(video),
      this.analyzeWithClaude(video),
      this.analyzeWithGemini(video)
    ]);
    
    // Find consensus patterns
    const consensus = this.findConsensus(gpt4, claude, gemini);
    
    // Store in viral_genomes
    if (consensus) {
      await this.storePatterns(consensus, video.niche, videoId);
    }
    
    return consensus;
  }

  private async getVideoData(videoId: string): Promise<VideoData | null> {
    // Fetch from scraped_videos or video_files
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('*')
      .eq('id', videoId)
      .single();
      
    if (data) return {
      id: data.id,
      url: data.url,
      transcript: data.transcript || '',
      metrics: { views: data.views, likes: data.likes },
      niche: data.niche || 'general'
    };

    // Fallback to video_files
    const { data: fileData } = await supabase
      .from('video_files')
      .select('*')
      .eq('id', videoId)
      .single();

    if (fileData) return {
      id: fileData.id,
      url: fileData.tiktok_url || '',
      transcript: '', // Might need to fetch from separate table
      metrics: {},
      niche: fileData.niche
    };

    return null;
  }
  
  private async analyzeWithGPT4(video: VideoData) {
    try {
      const prompt = `Analyze this viral video transcript and identify:
      1. Emotional arc (e.g., curiosity→shock→satisfaction)
      2. Story structure (e.g., problem→twist→solution)
      3. Psychological triggers used
      
      Transcript: ${video.transcript.substring(0, 2000)}
      Metrics: ${JSON.stringify(video.metrics)}`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (e) {
      console.error('GPT-4 Analysis failed', e);
      return null;
    }
  }
  
  private async analyzeWithClaude(video: VideoData) {
    try {
      const prompt = `Identify viral patterns:
      - Hook mechanism (first 3 seconds)
      - Retention tactics used
      - Engagement drivers
      
      Content: ${video.transcript.substring(0, 2000)}`;
      
      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      return message.content[0].text;
    } catch (e) {
      console.error('Claude Analysis failed', e);
      return null;
    }
  }
  
  private async analyzeWithGemini(video: VideoData) {
    try {
      const prompt = `Analyze multimodal patterns:
      - Visual hooks observed
      - Audio patterns (music, silence, beats)
      - Scene transitions

      Transcript Context: ${video.transcript.substring(0, 1000)}`;

      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return result.text || '';
    } catch (e) {
      console.error('Gemini Analysis failed', e);
      return null;
    }
  }

  private findConsensus(gpt4: string | null, claude: string | null, gemini: string | null) {
    // Simple concatenation for now, in a real system this would be a meta-analysis
    // or structured extraction
    return {
      gpt4_insight: gpt4,
      claude_insight: claude,
      gemini_insight: gemini,
      combined_summary: `
        GPT-4 found: ${gpt4 ? 'Emotional arcs and triggers' : 'Nothing'}
        Claude found: ${claude ? 'Hooks and retention' : 'Nothing'}
        Gemini found: ${gemini ? 'Visual/Audio patterns' : 'Nothing'}
      `
    };
  }

  private async storePatterns(consensus: any, niche: string, videoId: string) {
    // Store simple text pattern for now
    await supabase.from('viral_genomes').insert({
      niche,
      pattern_type: 'consensus_analysis',
      pattern_dna: consensus,
      example_videos: [videoId],
      success_rate: 0.8, // Initial guess
      discovered_by: ['gpt4', 'claude', 'gemini']
    });
  }
}





