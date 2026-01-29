/**
 * Real Estate Viral Generator Mini App
 * Generates property walkthrough scripts optimized for viral TikTok/Instagram content
 */

import { MiniAppPlugin, MiniAppContext } from '../../sdk';

export interface RealEstateParams {
  propertyType: 'house' | 'apartment' | 'condo' | 'luxury' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price: number;
  location: string;
  uniqueFeatures: string[];
  targetAudience: 'first-time-buyers' | 'investors' | 'luxury' | 'renters';
}

export interface RealEstateResult {
  script: {
    hook: string;
    context: string;
    value: string;
    cta: string;
    fullScript: string;
  };
  predictedDps: number;
  cinematicPrompt: string;
  tips: string[];
}

/**
 * Real Estate Generator Plugin
 */
export const realEstateGenerator: MiniAppPlugin = async (context: MiniAppContext) => {
  return async (params: RealEstateParams): Promise<RealEstateResult> => {
    try {
      // Track usage
      await context.analytics.track('generate_real_estate_script', {
        propertyType: params.propertyType,
        price: params.price,
      });

      // Build real estate-specific concept
      const concept = buildRealEstateConcept(params);

      // Generate script using CleanCopy DPS predictor
      const videoResult = await context.apis.generateVideo({
        concept,
        platform: 'tiktok',
        length: 30,
        niche: 'Real Estate',
        style: 'property-walkthrough',
      });

      // Generate cinematic prompt for the walkthrough
      const cinematicPrompt = await context.apis.generatePrompt(
        videoResult.script.fullScript,
        'documentary' // Real estate walkthroughs work best with documentary style
      );

      // Get DPS prediction
      const dpsResult = await context.apis.predictDps({
        transcript: videoResult.script.fullScript,
        platform: 'tiktok',
      });

      // Generate real estate-specific tips
      const tips = generateRealEstateTips(params, dpsResult.score);

      // Store last generated script for user
      await context.storage.set('last_property', {
        params,
        script: videoResult.script,
        dps: dpsResult.score,
        generatedAt: new Date().toISOString(),
      });

      return {
        script: videoResult.script,
        predictedDps: dpsResult.score,
        cinematicPrompt,
        tips,
      };
    } catch (error: any) {
      console.error('Real estate generator error:', error);
      throw new Error(`Failed to generate real estate script: ${error.message}`);
    }
  };
};

/**
 * Build compelling real estate concept
 */
function buildRealEstateConcept(params: RealEstateParams): string {
  const priceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(params.price);

  let hook = '';
  let uniqueFeaturesList = '';

  // Create attention-grabbing hook based on property type and price
  if (params.propertyType === 'luxury' || params.price > 1000000) {
    hook = `LUXURY ALERT: ${priceFormatted} ${params.propertyType} in ${params.location}`;
  } else if (params.price < 300000) {
    hook = `STEAL ALERT: ${priceFormatted} ${params.propertyType} you won't believe exists`;
  } else {
    hook = `${priceFormatted} ${params.propertyType} in ${params.location}`;
  }

  // Highlight unique features
  if (params.uniqueFeatures.length > 0) {
    uniqueFeaturesList = params.uniqueFeatures.slice(0, 3).join(', ');
  }

  const concept = `
${hook}.
${params.bedrooms} bed, ${params.bathrooms} bath, ${params.sqft} sqft property walkthrough.
${uniqueFeaturesList ? `Special features: ${uniqueFeaturesList}.` : ''}
Show the best angles of the property.
Target audience: ${params.targetAudience}.
Make them imagine living here.
Create urgency - this won't last long.
  `.trim();

  return concept;
}

/**
 * Generate tips based on DPS score and property type
 */
function generateRealEstateTips(params: RealEstateParams, dpsScore: number): string[] {
  const tips: string[] = [];

  // DPS-based tips
  if (dpsScore < 60) {
    tips.push('💡 Try adding a number in the first 3 seconds (e.g., "$500K saved!"');
    tips.push('🎥 Start with the most impressive room to hook viewers');
  } else if (dpsScore < 75) {
    tips.push('✅ Good hook! Consider adding a pattern interrupt (unexpected feature)');
  } else {
    tips.push('🔥 Excellent viral potential! This script is ready to record');
  }

  // Property-specific tips
  if (params.propertyType === 'luxury') {
    tips.push('📸 Film during golden hour for stunning natural light');
    tips.push('🎬 Use slow pans to showcase high-end finishes');
  } else if (params.price < 400000) {
    tips.push('💰 Emphasize VALUE and affordability in every shot');
    tips.push('🏠 Show how space is maximized');
  }

  // Unique feature tips
  if (params.uniqueFeatures.includes('pool')) {
    tips.push('🏊 Always end pool videos with a wide shot at sunset');
  }
  if (params.uniqueFeatures.includes('view')) {
    tips.push('🌆 Capture the view in multiple lighting conditions');
  }

  // Target audience tips
  if (params.targetAudience === 'first-time-buyers') {
    tips.push('👥 Include move-in ready features and low maintenance highlights');
  } else if (params.targetAudience === 'investors') {
    tips.push('💼 Mention rental potential and ROI opportunities');
  }

  return tips;
}

/**
 * Example usage of the real estate generator
 */
export async function exampleUsage(context: MiniAppContext) {
  const generator = await realEstateGenerator(context);

  const result = await generator({
    propertyType: 'house',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2500,
    price: 675000,
    location: 'Austin, TX',
    uniqueFeatures: ['pool', 'modern kitchen', 'smart home'],
    targetAudience: 'first-time-buyers',
  });

  console.log('Generated Script:', result.script.fullScript);
  console.log('Predicted DPS:', result.predictedDps);
  console.log('Cinematic Prompt:', result.cinematicPrompt);
  console.log('Tips:', result.tips);

  return result;
}

export default realEstateGenerator;
