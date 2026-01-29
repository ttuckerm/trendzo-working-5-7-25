import { ViralFrameworkEngine, ViralFramework } from './viralFrameworkEngine';
import { TemplatePersonalizationEngine } from './templatePersonalizationEngine';
import { templateService } from './templateService';
import { Niche, Platform } from '@/lib/types/database';
import { Template } from '@/lib/types/template';

export interface TemplateGenerationRequest {
  niche: Niche;
  platform: Platform;
  userId?: string;
  customization?: {
    brand?: string;
    style?: 'professional' | 'casual' | 'creative';
    target_audience?: string;
  };
}

export interface GeneratedTemplate {
  id: string;
  template: Template;
  viralScore: number;
  framework: ViralFramework;
  personalizedContent: any;
  recommendations: string[];
}

export class TemplateEngineIntegration {
  private viralEngine: ViralFrameworkEngine;
  private personalizationEngine: TemplatePersonalizationEngine;

  constructor() {
    this.viralEngine = ViralFrameworkEngine.getInstance();
    this.personalizationEngine = TemplatePersonalizationEngine.getInstance();
  }

  async generateTemplate(request: TemplateGenerationRequest): Promise<GeneratedTemplate> {
    try {
      // 1. Get optimal viral framework for niche/platform
      const framework = await this.viralEngine.getOptimalFramework(
        request.niche,
        request.platform,
        'viral_growth'
      );

      // 2. Generate personalized content
      const personalizationRequest = {
        niche: request.niche,
        platform: request.platform,
        tier: request.userId ? 'premium' : 'free',
        customization: request.customization
      };

      const personalizedContent = await this.personalizationEngine.personalizeTemplate(
        framework.id,
        personalizationRequest
      );

      // 3. Calculate viral score
      const viralScore = await this.viralEngine.calculateViralScore({
        viewCount: 0, // New template
        followerCount: 1000, // Assumed baseline
        platform: request.platform,
        timeElapsed: 0
      });

      // 4. Create template object
      const template: Template = {
        id: this.generateTemplateId(),
        userId: request.userId || 'anonymous',
        name: personalizedContent.title || framework.name,
        industry: request.niche,
        category: framework.category,
        frameworkId: framework.id,
        sections: this.convertToTemplateSections(personalizedContent.sections),
        metadata: {
          viralScore: viralScore.score,
          platform: request.platform,
          framework: framework.name,
          personalizedAt: new Date().toISOString()
        },
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 5. Generate recommendations
      const recommendations = await this.generateRecommendations(
        framework,
        personalizedContent,
        request.platform
      );

      // 6. Save template if user is authenticated
      if (request.userId) {
        await templateService.createTemplate(request.userId, template);
      }

      return {
        id: template.id,
        template,
        viralScore: viralScore.score,
        framework,
        personalizedContent,
        recommendations
      };

    } catch (error) {
      console.error('Template generation error:', error);
      throw new Error('Failed to generate template. Please try again.');
    }
  }

  async getTemplateVariations(templateId: string, count: number = 3): Promise<GeneratedTemplate[]> {
    try {
      const baseTemplate = await templateService.getTemplate(templateId);
      if (!baseTemplate) {
        throw new Error('Template not found');
      }

      const variations: GeneratedTemplate[] = [];
      
      for (let i = 0; i < count; i++) {
        const request: TemplateGenerationRequest = {
          niche: baseTemplate.industry as Niche,
          platform: baseTemplate.metadata?.platform as Platform || 'instagram',
          userId: baseTemplate.userId,
          customization: {
            style: ['professional', 'casual', 'creative'][i] as any
          }
        };

        const variation = await this.generateTemplate(request);
        variations.push(variation);
      }

      return variations;
    } catch (error) {
      console.error('Template variation error:', error);
      throw new Error('Failed to generate template variations.');
    }
  }

  async analyzeTemplatePerformance(templateId: string): Promise<{
    viralPotential: number;
    improvements: string[];
    platformOptimizations: Record<Platform, string[]>;
  }> {
    try {
      const template = await templateService.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const framework = await this.viralEngine.getFrameworkById(template.frameworkId || '');
      const analysis = await this.viralEngine.analyzeContent(
        template.sections?.map(s => s.content).join(' ') || '',
        template.metadata?.platform as Platform || 'instagram'
      );

      return {
        viralPotential: analysis.viralPotential,
        improvements: analysis.improvements,
        platformOptimizations: analysis.platformOptimizations
      };
    } catch (error) {
      console.error('Template analysis error:', error);
      return {
        viralPotential: 0,
        improvements: ['Analysis unavailable'],
        platformOptimizations: {} as Record<Platform, string[]>
      };
    }
  }

  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private convertToTemplateSections(personalizedSections: any[]): any[] {
    return personalizedSections.map((section, index) => ({
      id: `section_${index}`,
      type: section.type || 'text',
      content: section.content || section.text || '',
      position: { x: 0, y: index * 100 },
      style: section.style || {},
      animations: section.animations || []
    }));
  }

  private async generateRecommendations(
    framework: ViralFramework,
    content: any,
    platform: Platform
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Framework-specific recommendations
    recommendations.push(`Using ${framework.name} framework - proven ${framework.effectiveness[platform]}/5 effectiveness on ${platform}`);
    
    // Platform-specific recommendations
    const platformTips = {
      instagram: ['Use vertical 9:16 format', 'Add trending audio', 'Post during peak hours (6-8 PM)'],
      linkedin: ['Professional tone', 'Industry-relevant hashtags', 'Post on weekdays'],
      twitter: ['Keep under 280 characters', 'Use trending hashtags', 'Thread for longer content'],
      facebook: ['Engagement-focused copy', 'Use Facebook-native video', 'Post when audience is active']
    };

    recommendations.push(...platformTips[platform]);

    // Content-specific recommendations
    if (content.sections?.length > 3) {
      recommendations.push('Consider shorter format for better retention');
    }

    return recommendations;
  }
}

// Singleton instance
export const templateEngineIntegration = new TemplateEngineIntegration();