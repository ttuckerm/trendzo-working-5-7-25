import { TikTokVideo, TemplateSection, TemplateAnalysis, TrendingTemplate } from '@/lib/types/trendingTemplate';
import { templateAnalysisService } from './templateAnalysisService';
import { trendingTemplateService } from './trendingTemplateService';
import { getAnalyzerSettings } from './systemSettingsService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Advanced service for analyzing TikTok videos using Claude AI
 * This service builds on the basic templateAnalysisService by adding
 * AI-powered analysis capabilities for deeper insights
 */
export const advancedTemplateAnalysisService = {
  /**
   * Analyze video metadata and content using Claude AI
   * @param video TikTok video object to analyze
   * @returns Enhanced template analysis with AI insights
   */
  async analyzeVideoWithAI(video: TikTokVideo): Promise<{
    templateSections: TemplateSection[];
    category: string;
    analysis: TemplateAnalysis;
  }> {
    try {
      // Get analyzer settings
      const settings = await getAnalyzerSettings();
      
      // Get basic template sections from the existing service
      const templateSections = templateAnalysisService.analyzeVideoForTemplates(video);
      const category = templateAnalysisService.categorizeVideo(video);
      
      // Use AI to enhance the analysis
      const aiAnalysis = await this.performClaudeAnalysis(video, templateSections);
      
      // Calculate engagement rate
      const engagementRate = await this.calculateEngagementRate(video);
      
      return {
        templateSections: aiAnalysis.enhancedSections || templateSections,
        category: aiAnalysis.refinedCategory || category,
        analysis: {
          templateId: '', // Will be set when saved to database
          videoId: video.id,
          estimatedSections: aiAnalysis.enhancedSections || templateSections,
          detectedElements: aiAnalysis.detectedElements || {
            hasCaption: video.text.length > 0,
            hasCTA: this.detectCTA(video.text),
            hasProductDisplay: false, // Requires visual analysis
            hasTextOverlay: templateSections.some(s => s.textOverlays.length > 0),
            hasVoiceover: false, // Requires audio analysis
            hasBgMusic: false, // Requires audio analysis
          },
          effectiveness: {
            engagementRate,
            // Other metrics would be calculated over time
          },
          engagementInsights: aiAnalysis.engagementInsights || '',
          similarityPatterns: aiAnalysis.similarityPatterns || '',
          confidenceScore: aiAnalysis.confidenceScore || settings.confidenceThreshold
        }
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      
      // Fallback to basic analysis
      const templateSections = templateAnalysisService.analyzeVideoForTemplates(video);
      const category = templateAnalysisService.categorizeVideo(video);
      
      // Calculate engagement rate
      const engagementRate = await this.calculateEngagementRate(video);
      
      return {
        templateSections,
        category,
        analysis: {
          templateId: '',
          videoId: video.id,
          estimatedSections: templateSections,
          detectedElements: {
            hasCaption: video.text.length > 0,
            hasCTA: this.detectCTA(video.text),
            hasProductDisplay: false,
            hasTextOverlay: templateSections.some(s => s.textOverlays.length > 0),
            hasVoiceover: false,
            hasBgMusic: false,
          },
          effectiveness: {
            engagementRate,
          }
        }
      };
    }
  },
  
  /**
   * Use Claude AI to perform advanced analysis on the video
   * @param video TikTok video to analyze
   * @param templateSections Initial template sections
   * @returns Enhanced analysis data
   */
  async performClaudeAnalysis(video: TikTokVideo, templateSections: TemplateSection[]) {
    try {
      // Get analyzer settings
      const settings = await getAnalyzerSettings();
      
      // Prepare prompt for Claude
      const prompt = this.generateAnalysisPrompt(video, templateSections, settings);
      
      // Call Claude AI API
      const response = await fetch('/api/anthropic/analyze-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error(`Claude API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      const parsedResponse = this.parseClaudeResponse(data.text);
      
      // Apply confidence threshold from settings
      if (parsedResponse.confidenceScore < settings.confidenceThreshold) {
        console.log(`Analysis confidence ${parsedResponse.confidenceScore} below threshold ${settings.confidenceThreshold}, using default values`);
        // Return limited data if confidence is too low
        return {
          confidenceScore: parsedResponse.confidenceScore
        };
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Error calling Claude AI:', error);
      // Return empty enhancement data to fall back to basic analysis
      return {};
    }
  },
  
  /**
   * Generate a prompt for Claude AI to analyze the video
   */
  generateAnalysisPrompt(video: TikTokVideo, templateSections: TemplateSection[], settings: any): string {
    // Calculate engagement metrics to include in the prompt
    const totalEngagements = video.stats.diggCount + video.stats.commentCount + video.stats.shareCount;
    const engagementRate = totalEngagements / Math.max(1, video.stats.playCount) * 100;
    const likeToViewRatio = video.stats.diggCount / Math.max(1, video.stats.playCount) * 100;
    const commentToViewRatio = video.stats.commentCount / Math.max(1, video.stats.playCount) * 100;
    const shareToViewRatio = video.stats.shareCount / Math.max(1, video.stats.playCount) * 100;
    
    // Extract text patterns and hashtags for better context
    const captionWords = video.text.split(/\s+/).length;
    const captionLength = video.text.length;
    const captionDensity = captionWords > 0 ? captionLength / captionWords : 0;
    const hashtagCount = (video.hashtags || []).length;
    
    // Apply the feature specific weights from settings
    const featureWeights = settings.featureSpecificWeights || {
      caption: 0.2,
      audio: 0.3,
      visualStyle: 0.3,
      length: 0.1,
      hashtags: 0.1
    };
    
    return `
      You are an expert TikTok template analyst. Analyze this TikTok video data and identify template patterns, structure, engagement factors, and viral potential.
      
      VIDEO INFORMATION:
      Description: ${video.text}
      Duration: ${video.videoMeta?.duration || 0} seconds
      Hashtags: ${(video.hashtags || []).join(', ')}
      Author: ${video.authorMeta.nickname} (Verified: ${video.authorMeta.verified ? 'Yes' : 'No'})
      
      ENGAGEMENT METRICS:
      Views: ${video.stats.playCount.toLocaleString()}
      Likes: ${video.stats.diggCount.toLocaleString()} (${likeToViewRatio.toFixed(2)}% of views)
      Comments: ${video.stats.commentCount.toLocaleString()} (${commentToViewRatio.toFixed(2)}% of views)
      Shares: ${video.stats.shareCount.toLocaleString()} (${shareToViewRatio.toFixed(2)}% of views)
      Total Engagement Rate: ${engagementRate.toFixed(2)}%
      
      TEXT ANALYSIS:
      Caption Word Count: ${captionWords}
      Caption Length: ${captionLength} characters
      Word Density: ${captionDensity.toFixed(2)} characters per word
      Hashtag Count: ${hashtagCount}
      
      CURRENT TEMPLATE STRUCTURE:
      ${JSON.stringify(templateSections, null, 2)}
      
      ANALYSIS SETTINGS:
      When analyzing, apply these weights to different factors:
      - Engagement weight: ${settings.engagementWeight} (how much to prioritize engagement metrics)
      - Growth rate weight: ${settings.growthRateWeight} (how much to prioritize growth velocity)
      - User feedback weight: ${settings.userFeedbackWeight} (how much to prioritize user signals)
      
      For specific features, use these weights:
      - Caption importance: ${featureWeights.caption}
      - Audio importance: ${featureWeights.audio}
      - Visual style importance: ${featureWeights.visualStyle}
      - Video length importance: ${featureWeights.length}
      - Hashtags importance: ${featureWeights.hashtags}
      
      Your confidence threshold is set to ${settings.confidenceThreshold} - only provide detailed analysis if your confidence level exceeds this threshold.
      Minimum data points required for reliable analysis: ${settings.minimumDataPoints}
      
      Based on this data, provide a comprehensive template analysis with the following components:
      
      1. ENHANCED TEMPLATE SECTIONS:
         - Identify all distinct sections (hook, intro, main content, transitions, CTA, outro)
         - Provide exact timestamps for each section (start time and duration)
         - Describe each section's purpose and content type
         - Note any special effects, transitions, or patterns used in each section
      
      2. TEMPLATE CATEGORIZATION:
         - Identify the primary content category (e.g., tutorial, dance, comedy, product)
         - Subcategorize by specific template type (e.g., "How-To Tutorial", "Transformation Reveal")
         - Note industry or niche relevance (e.g., beauty, fitness, finance)
         - Estimate the template trend age (new, established, or classic pattern)
      
      3. ENGAGEMENT ANALYSIS:
         - Explain why this video might be engaging (specific elements that drive views)
         - Identify hook strength and attention retention factors
         - Note call-to-action effectiveness
         - Highlight any viral triggers or emotional elements
      
      4. VIRALITY POTENTIAL:
         - Rate the template's viral potential on a scale of 1-10
         - Identify specific elements that could make this template spread
         - Note any trending elements leveraged in the content
         - Suggest optimizations to increase virality
      
      5. TEMPLATE OPTIMIZATION RECOMMENDATIONS:
         - Suggest specific improvements to each section
         - Identify missing elements that could boost engagement
         - Note timing adjustments that could improve retention
         - Recommend pattern variations for different niches
      
      6. CONFIDENCE ASSESSMENT:
         - Provide a confidence score (0-1) for your analysis
         - Note any factors that increase or decrease confidence
         - Explain what additional data would improve the analysis
      
      Format your response as valid JSON with these keys:
      {
        "enhancedSections": [
          {
            "id": "string",
            "type": "string",
            "startTime": number,
            "duration": number,
            "purpose": "string",
            "contentDescription": "string"
          }
        ],
        "refinedCategory": {
          "primary": "string",
          "subType": "string",
          "industry": "string",
          "trendAge": "string"
        },
        "engagementInsights": "string",
        "viralityScore": number,
        "optimizationTips": "string",
        "confidenceScore": number,
        "confidenceFactors": {
          "positive": ["string"],
          "negative": ["string"]
        },
        "weightedAnalysis": {
          "caption": number,
          "audio": number,
          "visualStyle": number,
          "length": number,
          "hashtags": number
        }
      }`;
  },
  
  /**
   * Parse Claude AI's response into structured data
   */
  parseClaudeResponse(responseText: string): any {
    try {
      // First attempt: Try to parse the entire response as JSON directly
      try {
        return JSON.parse(responseText);
      } catch (directParseError) {
        console.log('Direct JSON parse failed, trying alternative methods');
      }
      
      // Second attempt: Look for JSON code blocks (Claude often wraps JSON in markdown)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        responseText.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        // Parse the JSON from the matched block, cleaning up any markdown formatting
        const jsonContent = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
        try {
          return JSON.parse(jsonContent);
        } catch (blockParseError) {
          console.error('Failed to parse JSON from code block:', blockParseError);
        }
      }
      
      // Third attempt: Try to extract sections directly
      if (responseText.includes('"enhancedSections"') || 
          responseText.includes('"detectedElements"') ||
          responseText.includes('"viralityFactors"')) {
        
        // Look for a complete JSON object 
        const potentialMatch = responseText.match(/{[\s\S]*?enhancedSections[\s\S]*?}/);
        if (potentialMatch) {
          try {
            return JSON.parse(potentialMatch[0]);
          } catch (sectionParseError) {
            console.error('Failed to parse JSON with enhancedSections:', sectionParseError);
          }
        }
        
        // If we can't find a complete JSON object, try to reconstruct one from the content
        try {
          const fullJson = `{${responseText.split('{')[1].split('}').slice(0, -1).join('}')}}`; 
          return JSON.parse(fullJson);
        } catch (reconstructError) {
          console.error('Failed to reconstruct JSON:', reconstructError);
        }
      }
      
      // Final fallback: Extract any JSON-like objects, even if partial
      const jsonPattern = /{[^{}]*({[^{}]*}[^{}]*)*}/g;
      const jsonMatches = responseText.match(jsonPattern);
      
      if (jsonMatches && jsonMatches.length > 0) {
        // Try each match until one parses successfully
        for (const match of jsonMatches) {
          try {
            return JSON.parse(match);
          } catch (matchError) {
            // Continue to the next match
          }
        }
      }
      
      // If we get here, we couldn't parse any JSON
      console.warn('Could not parse valid JSON from Claude response, returning empty object');
      console.debug('Original response:', responseText);
      return {};
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return {};
    }
  },
  
  /**
   * Identify templates with similar patterns
   * @param templateId ID of the template to find similarities for
   * @param limit Maximum number of similar templates to return
   */
  async findSimilarTemplates(templateId: string, limit = 10): Promise<TrendingTemplate[]> {
    try {
      // Get the template we want to compare
      const template = await trendingTemplateService.getTrendingTemplateById(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Get all templates in the same category
      const categoryTemplates = await trendingTemplateService.getTrendingTemplatesByCategory(
        template.category, 
        50 // Get more to increase chance of finding similar ones
      );
      
      // Filter out the current template
      const otherTemplates = categoryTemplates.filter(t => t.id !== templateId);
      
      // Simple similarity check based on duration and structure
      const similarityScores = otherTemplates.map(t => ({
        template: t,
        score: this.calculateTemplateSimilarity(template, t)
      }));
      
      // Sort by similarity score descending
      similarityScores.sort((a, b) => b.score - a.score);
      
      // Return the top matches
      return similarityScores.slice(0, limit).map(s => s.template);
    } catch (error) {
      console.error('Error finding similar templates:', error);
      return [];
    }
  },
  
  /**
   * Calculate similarity score between two templates
   * Higher score = more similar
   */
  calculateTemplateSimilarity(template1: TrendingTemplate, template2: TrendingTemplate): number {
    let score = 0;
    
    // Duration similarity (max 20 points)
    const durationDiff = Math.abs(template1.metadata.duration - template2.metadata.duration);
    score += Math.max(0, 20 - (durationDiff * 2));
    
    // Section structure similarity (max 40 points)
    const sections1 = template1.templateStructure;
    const sections2 = template2.templateStructure;
    
    if (sections1.length === sections2.length) {
      score += 10;
      
      // Compare section types
      let matchingTypes = 0;
      for (let i = 0; i < Math.min(sections1.length, sections2.length); i++) {
        if (sections1[i].type === sections2[i].type) {
          matchingTypes++;
        }
      }
      score += 30 * (matchingTypes / Math.max(sections1.length, sections2.length));
    }
    
    // Hashtag similarity (max 20 points)
    const hashtags1 = template1.metadata.hashtags || [];
    const hashtags2 = template2.metadata.hashtags || [];
    
    const commonHashtags = hashtags1.filter(tag => hashtags2.includes(tag)).length;
    score += 20 * (commonHashtags / Math.max(hashtags1.length, hashtags2.length, 1));
    
    // Engagement similarity (max 20 points)
    const engagementDiff = Math.abs(
      template1.stats.engagementRate - template2.stats.engagementRate
    );
    score += Math.max(0, 20 - (engagementDiff * 10));
    
    return score;
  },
  
  /**
   * Track velocity of template popularity growth
   * @param templateId Template to analyze
   * @returns Growth metrics
   */
  async trackTemplateVelocity(templateId: string): Promise<{
    dailyGrowth: number;
    weeklyGrowth: number;
    velocityScore: number;
  }> {
    try {
      const template = await trendingTemplateService.getTrendingTemplateById(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const dailyViews = template.trendData.dailyViews;
      const dates = Object.keys(dailyViews).sort();
      
      if (dates.length < 2) {
        return { 
          dailyGrowth: 0, 
          weeklyGrowth: template.trendData.growthRate,
          velocityScore: 0 
        };
      }
      
      // Calculate daily growth (last day)
      const lastDate = dates[dates.length - 1];
      const prevDate = dates[dates.length - 2];
      
      const lastValue = dailyViews[lastDate] || 0;
      const prevValue = dailyViews[prevDate] || 0;
      
      let dailyGrowth = 0;
      if (prevValue > 0) {
        dailyGrowth = ((lastValue - prevValue) / prevValue) * 100;
      }
      
      // Weekly growth is already calculated in the template
      const weeklyGrowth = template.trendData.growthRate;
      
      // Calculate velocity score (combination of growth rate and acceleration)
      // Higher score = faster trending
      let velocityScore = (dailyGrowth + weeklyGrowth) / 2;
      
      // Add bonus for acceleration (if daily growth > weekly growth)
      if (dailyGrowth > weeklyGrowth) {
        velocityScore += (dailyGrowth - weeklyGrowth) / 2;
      }
      
      return { dailyGrowth, weeklyGrowth, velocityScore };
    } catch (error) {
      console.error('Error tracking template velocity:', error);
      return { dailyGrowth: 0, weeklyGrowth: 0, velocityScore: 0 };
    }
  },
  
  /**
   * Calculate engagement rate for a TikTok video
   * This can be influenced by system settings when available
   */
  async calculateEngagementRate(video: TikTokVideo): Promise<number> {
    try {
      // Try to get settings, use defaults if not available
      const settings = await getAnalyzerSettings().catch(() => ({
        engagementWeight: 0.5,
        growthRateWeight: 0.3,
        userFeedbackWeight: 0.2
      }));
      
      // Calculate basic engagement rate
      const totalEngagements = video.stats.diggCount + video.stats.commentCount + video.stats.shareCount;
      const viewCount = Math.max(1, video.stats.playCount); // Avoid division by zero
      
      const likesRate = video.stats.diggCount / viewCount;
      const commentsRate = video.stats.commentCount / viewCount;
      const sharesRate = video.stats.shareCount / viewCount;
      
      // Apply weights from settings
      const weightedLikes = likesRate * settings.engagementWeight;
      const weightedComments = commentsRate * settings.userFeedbackWeight;
      const weightedShares = sharesRate * settings.growthRateWeight;
      
      // Calculate weighted engagement rate
      return (weightedLikes + weightedComments + weightedShares) * 100;
    } catch (error) {
      console.error('Error calculating engagement rate:', error);
      // Fallback to basic calculation
      const totalEngagements = video.stats.diggCount + video.stats.commentCount + video.stats.shareCount;
      const viewCount = Math.max(1, video.stats.playCount);
      return (totalEngagements / viewCount) * 100;
    }
  },
  
  /**
   * Simple detection for call-to-action text
   */
  detectCTA(text: string): boolean {
    const ctaPatterns = [
      'follow', 'subscribe', 'like', 'comment', 'share',
      'click', 'link in bio', 'check out', 'try', 'get',
      'buy', 'shop', 'order', 'sign up', 'join',
      'learn more', 'find out', 'discover', 'visit', 'contact'
    ];
    
    return ctaPatterns.some(pattern => 
      text.toLowerCase().includes(pattern)
    );
  },
  
  /**
   * Enhance AI analysis with expert insights
   * @param templateId Template ID
   * @param aiAnalysis AI-generated analysis
   * @param expertInsights Expert insights
   * @returns Enhanced analysis
   */
  async enhanceWithExpertInsights(
    templateId: string,
    aiAnalysis: any,
    expertInsights: any
  ) {
    try {
      // Get analyzer settings
      const settings = await getAnalyzerSettings();
      
      // If expert override is disabled in settings, return AI analysis only
      if (!settings.enableExpertOverride) {
        console.log('Expert override disabled in settings, using AI analysis only');
        return aiAnalysis;
      }
      
      // Create a deep copy of the AI analysis to avoid modifying the original
      const enhancedAnalysis = JSON.parse(JSON.stringify(aiAnalysis || {}));
      
      // If no expert insights, return AI analysis as is
      if (!expertInsights) {
        return enhancedAnalysis;
      }
      
      // Enhance with expert insights based on expert confidence
      const expertConfidence = this.calculateExpertConfidence(expertInsights);
      
      // Apply expert insights selectively based on confidence
      if (expertConfidence > 0.8) {
        // High confidence: use expert insights for all fields
        if (expertInsights.category) {
          enhancedAnalysis.category = expertInsights.category;
        }
        
        if (expertInsights.templateStructure && expertInsights.templateStructure.length > 0) {
          enhancedAnalysis.estimatedSections = expertInsights.templateStructure;
        }
        
        if (expertInsights.engagementFactors) {
          enhancedAnalysis.engagementInsights = expertInsights.engagementFactors;
        }
        
        // Preserve the expert confidence score for tracking
        enhancedAnalysis.expertConfidence = expertConfidence;
      } else if (expertConfidence > 0.5) {
        // Medium confidence: blend AI and expert insights
        if (expertInsights.category) {
          // For category, use expert if provided, otherwise keep AI
          enhancedAnalysis.category = expertInsights.category;
        }
        
        if (expertInsights.templateStructure && expertInsights.templateStructure.length > 0) {
          // For structure, keep AI sections but adjust based on expert insights
          // This is a simplified example - real implementation would be more complex
          enhancedAnalysis.estimatedSections = this.blendTemplateSections(
            enhancedAnalysis.estimatedSections,
            expertInsights.templateStructure
          );
        }
        
        // Combine engagement insights
        if (expertInsights.engagementFactors) {
          enhancedAnalysis.engagementInsights = 
            `${enhancedAnalysis.engagementInsights || ''}\n\nExpert insights: ${expertInsights.engagementFactors}`;
        }
        
        // Record expert confidence level
        enhancedAnalysis.expertConfidence = expertConfidence;
      } else {
        // Low confidence: use AI analysis but note expert input
        if (expertInsights.notes) {
          enhancedAnalysis.expertNotes = expertInsights.notes;
        }
        
        // Record low expert confidence
        enhancedAnalysis.expertConfidence = expertConfidence;
      }
      
      // Log this enhancement for auditing and improvement tracking
      console.log(`Enhanced template ${templateId} with expert insights (confidence: ${expertConfidence})`);
      
      return enhancedAnalysis;
    } catch (error) {
      console.error('Error enhancing with expert insights:', error);
      // Return original AI analysis if enhancement fails
      return aiAnalysis || {};
    }
  },
  
  /**
   * Calculate an overall confidence score based on expert insights
   * @param expertInsights Expert insights object
   * @returns Confidence score between 0-1
   */
  calculateExpertConfidence(expertInsights: any): number {
    if (!expertInsights) return 0;
    
    let confidenceScore = 0;
    let factorsConsidered = 0;
    
    // Calculate average confidence from tags
    if (expertInsights.tags && expertInsights.tags.length > 0) {
      const tagConfidenceSum = expertInsights.tags.reduce(
        (sum: number, tag: any) => sum + (tag.confidence || 0.7), 
        0
      );
      confidenceScore += tagConfidenceSum / expertInsights.tags.length;
      factorsConsidered++;
    }
    
    // Consider performance rating (convert 1-5 scale to 0-1)
    if (expertInsights.performanceRating) {
      confidenceScore += expertInsights.performanceRating / 5;
      factorsConsidered++;
    }
    
    // Consider the presence of notes (having notes increases confidence)
    if (expertInsights.notes && expertInsights.notes.length > 30) {
      confidenceScore += 0.8; // Detailed notes increase confidence
      factorsConsidered++;
    } else if (expertInsights.notes) {
      confidenceScore += 0.5; // Some notes are better than none
      factorsConsidered++;
    }
    
    // Consider recommended uses
    if (expertInsights.recommendedUses && expertInsights.recommendedUses.length > 0) {
      confidenceScore += Math.min(0.9, expertInsights.recommendedUses.length * 0.2);
      factorsConsidered++;
    }
    
    // Calculate average confidence score
    return factorsConsidered > 0 
      ? Math.min(1, confidenceScore / factorsConsidered)
      : 0;
  },
  
  /**
   * Blend AI-generated template sections with expert insights
   * @param aiSections AI-generated template sections
   * @param expertSections Expert-provided template sections
   * @returns Blended template sections
   */
  blendTemplateSections(aiSections: TemplateSection[], expertSections: TemplateSection[]): TemplateSection[] {
    // If either is missing, return the other
    if (!aiSections || aiSections.length === 0) return expertSections;
    if (!expertSections || expertSections.length === 0) return aiSections;
    
    // Create a deep copy of AI sections as the base
    const blendedSections = JSON.parse(JSON.stringify(aiSections));
    
    // Map expert sections by type for easier lookup
    const expertSectionsByType: Record<string, TemplateSection> = {};
    expertSections.forEach(section => {
      expertSectionsByType[section.type] = section;
    });
    
    // Update AI sections with expert data where available
    for (let i = 0; i < blendedSections.length; i++) {
      const section = blendedSections[i];
      const expertSection = expertSectionsByType[section.type];
      
      if (expertSection) {
        // Update timing if expert provided it
        if (expertSection.startTime !== undefined) {
          section.startTime = expertSection.startTime;
        }
        
        if (expertSection.duration !== undefined) {
          section.duration = expertSection.duration;
        }
        
        // Update content descriptions if provided
        if (expertSection.contentDescription) {
          section.contentDescription = expertSection.contentDescription;
        }
        
        // Update text overlays if provided and non-empty
        if (expertSection.textOverlays && expertSection.textOverlays.length > 0) {
          section.textOverlays = expertSection.textOverlays;
        }
        
        // Mark as expert-enhanced
        section.expertEnhanced = true;
      }
    }
    
    // Add any expert sections that don't exist in AI sections
    const aiSectionTypes = new Set(blendedSections.map(s => s.type));
    
    expertSections.forEach(section => {
      if (!aiSectionTypes.has(section.type)) {
        // Mark as expert-added
        section.expertEnhanced = true;
        section.expertAdded = true;
        blendedSections.push(section);
      }
    });
    
    // Sort by start time
    return blendedSections.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  }
}; 