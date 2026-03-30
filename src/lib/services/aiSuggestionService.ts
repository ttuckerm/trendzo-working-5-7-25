"use client";

import { Template, TemplateSection, TemplateElement } from '@/lib/types/templateEditor.types';
import { 
  TextSuggestion, 
  LayoutSuggestion, 
  PerformanceTip,
  AIServiceResponse,
  SuggestionCategory
} from '@/lib/types/mlSuggestions';

/**
 * AI Suggestion Service
 * 
 * This service handles communication with AI backends for generating suggestions
 * for template content, layout, and performance improvements.
 */

// Mock data for development
const MOCK_TEXT_SUGGESTIONS: TextSuggestion[] = [
  { id: 'text-1', text: 'Discover our latest collection of premium products designed for your lifestyle.' },
  { id: 'text-2', text: 'Limited time offer: Get 20% off on all items with code SUMMER20.' },
  { id: 'text-3', text: 'Join our exclusive community for early access to new releases and special discounts.' },
  { id: 'text-4', text: 'Transform your experience with our award-winning designs and innovative features.' },
  { id: 'text-5', text: 'Trusted by over 10,000 customers worldwide. See why they love our products.' }
];

const MOCK_LAYOUT_SUGGESTIONS: LayoutSuggestion[] = [
  { 
    id: 'layout-1', 
    name: 'Hero Focus', 
    description: 'Emphasizes your main message with a large hero section and minimal distractions.' 
  },
  { 
    id: 'layout-2', 
    name: 'Grid Gallery', 
    description: 'Displays multiple images in a grid layout for visual impact.' 
  },
  { 
    id: 'layout-3', 
    name: 'Split Content', 
    description: 'Divides the section into two columns for balanced text and media.' 
  },
  { 
    id: 'layout-4', 
    name: 'Testimonial Showcase', 
    description: 'Highlights customer reviews with a clean, focused design.' 
  }
];

const MOCK_PERFORMANCE_TIPS: PerformanceTip[] = [
  { 
    id: 'perf-1', 
    tip: 'Reduce the number of sections to improve load time and focus user attention.', 
    impact: 'medium',
    category: 'engagement'
  },
  { 
    id: 'perf-2', 
    tip: 'Increase contrast between text and background for better readability.', 
    impact: 'high',
    category: 'accessibility'
  },
  { 
    id: 'perf-3', 
    tip: 'Add a clear call-to-action in the first section to improve conversion rates.', 
    impact: 'high',
    category: 'conversion'
  },
  { 
    id: 'perf-4', 
    tip: 'Optimize image sizes to reduce loading time and improve user experience.', 
    impact: 'medium',
    category: 'engagement'
  }
];

class AISuggestionService {
  private apiKey?: string;
  private baseUrl: string;
  private enabled: boolean = false;
  private useMockData: boolean = true;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'https://api.trendzo.ai/suggestions';
  }

  /**
   * Enable or disable the AI suggestion service
   */
  public enableService(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Configure the AI suggestion service
   */
  public configure(apiKey?: string, baseUrl?: string): void {
    if (apiKey) this.apiKey = apiKey;
    if (baseUrl) this.baseUrl = baseUrl;
  }

  /**
   * Set whether to use mock data for development
   */
  public setUseMockData(useMockData: boolean): void {
    this.useMockData = useMockData;
  }

  /**
   * Get text suggestions for a text element
   */
  public async getTextSuggestions(
    section: TemplateSection, 
    element: TemplateElement
  ): Promise<AIServiceResponse<TextSuggestion[]>> {
    if (!this.enabled) {
      return { success: false, error: 'AI suggestion service is not enabled' };
    }

    try {
      // Use mock data in development mode
      if (this.useMockData) {
        return { 
          success: true, 
          data: MOCK_TEXT_SUGGESTIONS 
        };
      }

      // In production, call the actual API
      const response = await fetch(`${this.baseUrl}/text-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          sectionId: section.id,
          elementId: element.id,
          currentText: element.properties?.text || '',
          elementType: element.type,
          sectionType: section.type
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.suggestions
      };
    } catch (error) {
      console.error('Error fetching text suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get layout suggestions for a section
   */
  public async getLayoutSuggestions(
    section: TemplateSection
  ): Promise<AIServiceResponse<LayoutSuggestion[]>> {
    if (!this.enabled) {
      return { success: false, error: 'AI suggestion service is not enabled' };
    }

    try {
      // Use mock data in development mode
      if (this.useMockData) {
        return { 
          success: true, 
          data: MOCK_LAYOUT_SUGGESTIONS 
        };
      }

      // In production, call the actual API
      const response = await fetch(`${this.baseUrl}/layout-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          sectionId: section.id,
          sectionType: section.type,
          elements: section.elements,
          currentLayout: section.layout
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.suggestions
      };
    } catch (error) {
      console.error('Error fetching layout suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get performance tips for a template
   */
  public async getPerformanceTips(
    template: Template
  ): Promise<AIServiceResponse<PerformanceTip[]>> {
    if (!this.enabled) {
      return { success: false, error: 'AI suggestion service is not enabled' };
    }

    try {
      // Use mock data in development mode
      if (this.useMockData) {
        return { 
          success: true, 
          data: MOCK_PERFORMANCE_TIPS 
        };
      }

      // In production, call the actual API
      const response = await fetch(`${this.baseUrl}/performance-tips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          templateId: template.id,
          templateType: template.type,
          sections: template.sections,
          duration: template.duration
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.tips
      };
    } catch (error) {
      console.error('Error fetching performance tips:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export as singleton
export const aiSuggestionService = new AISuggestionService();
export default aiSuggestionService; 