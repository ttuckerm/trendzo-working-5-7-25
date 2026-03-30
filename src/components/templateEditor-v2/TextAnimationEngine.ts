import { Element, AnimationProperties } from "./types";

// Redefined animation properties to include all types
type ExtendedAnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'custom' | 'bounce' | 'flip' | 'zoom' | 'glitch' | 'wave' | 'shake' | 'pulse';

// Extended animation properties with additional fields
interface ExtendedAnimationProperties {
  type?: ExtendedAnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  trigger?: 'onLoad' | 'onClick' | 'onHover' | 'onScroll' | 'onBeat';
  keyframes?: Record<string, any>[];
  beatSync?: boolean;
  beatPoints?: number[];
  trendCategory?: string;
}

// Type for AI suggestion
interface AnimationSuggestion {
  type?: string;
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  trigger?: 'onLoad' | 'onClick' | 'onHover' | 'onScroll' | 'onBeat';
  keyframes?: any;
  beatSync?: boolean;
  beatPoints?: number[];
}

/**
 * TextAnimationEngine - Handles intelligent animation generation for text elements
 * 
 * Features:
 * - Generates appropriate default animations based on text content
 * - Synchronizes animations with audio beats
 * - Applies trending animation styles based on context
 * - Provides AI-suggested animations for platinum users
 */
export class TextAnimationEngine {
  
  /**
   * Generate a default animation based on the text element properties
   */
  static generateDefaultAnimation(element: Element): ExtendedAnimationProperties {
    // Base animation settings
    const animation: ExtendedAnimationProperties = {
      type: 'fade',
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      repeat: 0,
      direction: 'normal',
      trigger: 'onLoad',
    };
    
    // Adjust timing based on text length
    if (element.content) {
      const textLength = element.content.length;
      
      // Longer text gets longer duration
      if (textLength > 20) {
        animation.duration = 1500;
      } else if (textLength < 5) {
        animation.duration = 800;
      }
      
      // Choose animation type based on content characteristics
      if (element.content.includes('!')) {
        // Exclamation marks suggest emphasis - use scale
        animation.type = 'scale';
      } else if (element.content.toUpperCase() === element.content && element.content.length > 3) {
        // ALL CAPS suggests intensity - use slide
        animation.type = 'slide';
      }
    }
    
    // Adjust animation based on element size
    if (element.width > 300 || element.height > 150) {
      // Larger elements get slightly longer animations
      if (animation.duration) {
        animation.duration += 200;
      }
    }
    
    return animation;
  }
  
  /**
   * Synchronize animation with audio beat points
   * Note: In a real implementation, we would have actual audio analysis services.
   * This is a mock implementation for demonstration purposes.
   */
  static async syncWithAudio(element: Element, audioUrl: string): Promise<ExtendedAnimationProperties> {
    try {
      // Mock audio analysis service
      // In a real app, this would be an actual service module
      const mockBeats = [0.5, 1.2, 1.8, 2.4, 3.0, 3.6];
      const mockTempo = 120; // 120 BPM
      
      // Create animation based on audio characteristics
      const animation: ExtendedAnimationProperties = {
        type: 'fade',
        duration: Math.round((60 / mockTempo) * 1000), // Convert BPM to ms per beat
        delay: 0,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy easing for beat sync
        repeat: 'infinite',
        direction: 'normal',
        trigger: 'onBeat',
        beatSync: true,
        beatPoints: mockBeats,
      };
      
      return animation;
    } catch (error) {
      console.error('Error synchronizing with audio:', error);
      // Fallback to default animation if audio analysis fails
      return this.generateDefaultAnimation(element);
    }
  }
  
  /**
   * Apply a trending animation style based on template context
   */
  static applyTrendStyle(element: Element, context: {
    templateType?: string;
    trendCategory?: string;
  }): ExtendedAnimationProperties {
    const animation: ExtendedAnimationProperties = this.generateDefaultAnimation(element);
    
    // Apply different animation presets based on trend category
    if (context.trendCategory) {
      animation.trendCategory = context.trendCategory;
      
      switch (context.trendCategory) {
        case 'dance':
          animation.type = 'bounce';
          animation.easing = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          animation.repeat = 'infinite';
          animation.duration = 800;
          break;
          
        case 'tutorial':
          animation.type = 'slide';
          animation.easing = 'ease-in-out';
          animation.delay = 300;
          break;
          
        case 'comedy':
          animation.type = 'shake';
          animation.duration = 500;
          animation.repeat = 2;
          break;
          
        case 'product':
          animation.type = 'fade';
          animation.easing = 'ease';
          animation.duration = 1200;
          break;
          
        case 'storytelling':
          animation.type = 'scale';
          animation.easing = 'ease-in-out';
          animation.duration = 1500;
          break;
      }
    }
    
    return animation;
  }
  
  /**
   * Get AI-suggested animations based on text content and template context
   * Note: In a real implementation, we would have actual AI services.
   * This is a mock implementation for demonstration purposes.
   */
  static async getAISuggestions(element: Element, context: {
    templateType?: string;
    trendCategory?: string;
    audioTrack?: string;
  }): Promise<ExtendedAnimationProperties[]> {
    try {
      // Mock AI suggestions
      // In a real app, this would call an actual AI service
      const mockSuggestions: AnimationSuggestion[] = [
        {
          type: 'bounce',
          duration: 1200,
          delay: 0,
          easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          repeat: 'infinite',
          direction: 'normal',
          trigger: 'onLoad',
        },
        {
          type: 'fade',
          duration: 800,
          delay: 200,
          easing: 'ease-in-out',
          repeat: 0,
          direction: 'normal',
          trigger: 'onLoad',
        }
      ];
      
      return mockSuggestions.map((suggestion: AnimationSuggestion) => ({
        type: (suggestion.type || 'fade') as ExtendedAnimationType,
        duration: suggestion.duration || 1000,
        delay: suggestion.delay || 0,
        easing: suggestion.easing || 'ease',
        repeat: suggestion.repeat || 0,
        direction: suggestion.direction || 'normal',
        trigger: suggestion.trigger || 'onLoad',
        keyframes: suggestion.keyframes,
        beatSync: suggestion.beatSync,
        beatPoints: suggestion.beatPoints,
        trendCategory: context.trendCategory,
      }));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      // Fallback to trend style if AI fails
      return [this.applyTrendStyle(element, context)];
    }
  }
  
  /**
   * Apply animation to text with character-by-character effects
   */
  static generateCharacterAnimation(element: Element): ExtendedAnimationProperties {
    // Characters appear one by one
    return {
      type: 'custom',
      duration: 1500,
      delay: 0,
      easing: 'ease-out',
      repeat: 0,
      direction: 'normal',
      trigger: 'onLoad',
      keyframes: [
        { 
          selector: 'span', 
          properties: { 
            opacity: [0, 1],
            transform: ['translateY(10px)', 'translateY(0)']
          },
          options: {
            delay: (el: HTMLElement, i: number) => i * 50, // Staggered delay for each character
          }
        }
      ]
    };
  }
} 