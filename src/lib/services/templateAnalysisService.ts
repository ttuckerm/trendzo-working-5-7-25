import { TikTokVideo, TemplateSection, TextOverlay } from '@/lib/types/trendingTemplate';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for analyzing TikTok videos and extracting template data
 */
export const templateAnalysisService = {
  /**
   * Analyze a TikTok video to extract template sections
   * This is a simplified version - in a real application, you would use
   * machine learning or computer vision to detect sections more accurately
   */
  analyzeVideoForTemplates(video: TikTokVideo): TemplateSection[] {
    try {
      // Get video duration
      const totalDuration = video.videoMeta.duration || 0;
      
      if (totalDuration <= 0) {
        console.warn('Invalid video duration for analysis');
        return [];
      }
      
      // Extract hashtags
      const hashtags = video.hashtags || [];
      
      // Extract potential text from the description
      const descriptions = video.text.split(/[.!?] /g).filter(s => s.length > 10);
      
      // Simple heuristic to estimate sections in the video
      // In a real application, this would be more sophisticated using AI
      const sections: TemplateSection[] = [];
      
      // Most TikTok videos have a recognizable structure:
      // 1. Intro/Hook (first ~20% of the video)
      const introSection: TemplateSection = {
        id: uuidv4(),
        startTime: 0,
        duration: Math.round(totalDuration * 0.2 * 10) / 10, // Round to 1 decimal
        type: 'intro',
        textOverlays: []
      };
      
      // Add a text overlay for the intro if we have a description
      if (descriptions.length > 0) {
        introSection.textOverlays.push(this.createTextOverlay(
          descriptions[0].substring(0, 50),
          { x: 50, y: 30 }
        ));
      }
      
      // 2. Main content (middle ~60% of video)
      const contentSection: TemplateSection = {
        id: uuidv4(),
        startTime: introSection.duration,
        duration: Math.round(totalDuration * 0.6 * 10) / 10,
        type: 'content',
        textOverlays: []
      };
      
      // Add text overlays for the main content
      if (descriptions.length > 1) {
        contentSection.textOverlays.push(this.createTextOverlay(
          descriptions[1].substring(0, 50),
          { x: 50, y: 50 }
        ));
      }
      
      // Add hashtag overlay
      if (hashtags.length > 0) {
        contentSection.textOverlays.push(this.createTextOverlay(
          hashtags.slice(0, 3).map(tag => `#${tag}`).join(' '),
          { x: 50, y: 80 },
          { fontSize: 18, fontWeight: 'normal', color: '#ffffff' }
        ));
      }
      
      // 3. Outro/CTA (last ~20% of video)
      const outroSection: TemplateSection = {
        id: uuidv4(),
        startTime: introSection.duration + contentSection.duration,
        duration: Math.round(totalDuration * 0.2 * 10) / 10,
        type: 'outro',
        textOverlays: []
      };
      
      // Add CTA text
      outroSection.textOverlays.push(this.createTextOverlay(
        'Follow for more!',
        { x: 50, y: 50 },
        { fontSize: 24, fontWeight: 'bold', color: '#ffffff' }
      ));
      
      // Add author info
      outroSection.textOverlays.push(this.createTextOverlay(
        `@${video.authorMeta.nickname}`,
        { x: 50, y: 75 },
        { fontSize: 20, fontWeight: 'normal', color: '#ffffff' }
      ));
      
      // Add sections to the array
      sections.push(introSection, contentSection, outroSection);
      
      return sections;
    } catch (error) {
      console.error('Error analyzing video for templates:', error);
      return [];
    }
  },
  
  /**
   * Helper method to create a text overlay
   */
  createTextOverlay(
    text: string, 
    position = { x: 50, y: 50 },
    style = { fontSize: 22, fontWeight: 'bold', color: '#ffffff' }
  ): TextOverlay {
    return {
      id: uuidv4(),
      text,
      position,
      style
    };
  },
  
  /**
   * Categorize a TikTok video based on its content
   * This is a simple implementation - in a real application, 
   * you would use AI to categorize videos more accurately
   */
  categorizeVideo(video: TikTokVideo): string {
    // Extract hashtags and text for categorization
    const hashtags = video.hashtags || [];
    const text = video.text.toLowerCase();
    
    // Define category keywords
    const categories = {
      'product': ['product', 'unboxing', 'review', 'haul', 'shopping'],
      'tutorial': ['tutorial', 'how to', 'diy', 'learn', 'step by step', 'tips'],
      'dance': ['dance', 'choreography', 'challenge', 'trending dance'],
      'comedy': ['comedy', 'funny', 'joke', 'humor', 'prank'],
      'lifestyle': ['lifestyle', 'day in the life', 'routine', 'vlog'],
      'fashion': ['fashion', 'outfit', 'style', 'clothing', 'accessories'],
      'beauty': ['beauty', 'makeup', 'skincare', 'haircare', 'cosmetics'],
      'food': ['food', 'recipe', 'cooking', 'baking', 'meal prep'],
      'fitness': ['fitness', 'workout', 'exercise', 'gym', 'training'],
      'educational': ['facts', 'learn', 'education', 'knowledge', 'science']
    };
    
    // Check hashtags first
    for (const [category, keywords] of Object.entries(categories)) {
      for (const hashtag of hashtags) {
        if (keywords.some(keyword => hashtag.toLowerCase().includes(keyword))) {
          return category;
        }
      }
    }
    
    // Then check the text
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    // Default category
    return 'other';
  }
}; 