import { TikTokVideo, TemplateSection } from '@/lib/types/trendingTemplate';
import { advancedTemplateAnalysisService } from '@/lib/services/advancedTemplateAnalysisService';
import { templateAnalysisService } from '@/lib/services/templateAnalysisService';
import { apifyService } from '@/lib/services/apifyService';
import { aiTemplateAnalysisEtl } from './aiTemplateAnalysisEtl';
import { trendingTemplateService } from '@/lib/services/trendingTemplateService';

/**
 * Test script to verify template analyzer functionality
 */

/**
 * Test 1: Verify that the analyzer can process scraped videos
 * This test will:
 * 1. Fetch a small sample of videos from Apify
 * 2. Verify they can be processed by the analyzer
 * 3. Log the results
 */
export async function testVideoProcessing(sampleSize = 3) {
  console.log('\n========== Testing Video Processing ==========\n');
  console.log(`Fetching ${sampleSize} sample videos from Apify...`);
  
  try {
    // 1. Get sample videos from Apify
    const rawVideos = await apifyService.scrapeTrending({ maxItems: sampleSize });
    console.log(`Successfully fetched ${rawVideos.length} videos from Apify.`);
    
    if (rawVideos.length === 0) {
      console.error('Error: No videos returned from Apify.');
      return false;
    }
    
    // 2. Validate and process each video
    let processedCount = 0;
    
    for (let i = 0; i < rawVideos.length; i++) {
      const rawVideo = rawVideos[i];
      console.log(`\nTesting video ${i + 1}/${rawVideos.length}`);
      
      // 2.1. Validate video structure
      if (!aiTemplateAnalysisEtl.validateTikTokVideo(rawVideo)) {
        console.warn(`Video validation failed. Skipping video ${i + 1}.`);
        continue;
      }
      
      // Safe cast after validation
      const video = rawVideo as unknown as TikTokVideo;
      console.log(`Video ID: ${video.id}`);
      console.log(`Author: @${video.authorMeta.nickname}`);
      console.log(`Description: ${video.text.substring(0, 50)}${video.text.length > 50 ? '...' : ''}`);
      
      // 2.2. Run the video through the analyzer
      try {
        console.log('Running AI analysis...');
        const startTime = Date.now();
        
        const { templateSections, category, analysis } = 
          await advancedTemplateAnalysisService.analyzeVideoWithAI(video);
        
        const endTime = Date.now();
        
        // 2.3. Log results
        console.log(`Analysis completed in ${(endTime - startTime) / 1000} seconds.`);
        console.log(`Category: ${category}`);
        console.log(`Template sections: ${templateSections.length}`);
        console.log(`Section types: ${templateSections.map(s => s.type).join(', ')}`);
        
        if (analysis.detectedElements) {
          console.log('Detected elements:');
          Object.entries(analysis.detectedElements).forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}`);
          });
        }
        
        if (analysis.engagementInsights) {
          console.log(`Engagement insights: ${analysis.engagementInsights.substring(0, 100)}...`);
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error analyzing video ${video.id}:`, error);
      }
    }
    
    // 3. Report success rate
    const successRate = (processedCount / rawVideos.length) * 100;
    console.log(`\nProcessed ${processedCount}/${rawVideos.length} videos (${successRate.toFixed(2)}% success rate).`);
    
    return processedCount > 0;
  } catch (error) {
    console.error('Error testing video processing:', error);
    return false;
  }
}

/**
 * Test 2: Confirm templates are properly categorized
 * This test will:
 * 1. Test a sample video with both basic and AI categorization
 * 2. Compare the results between basic and AI-enhanced categorization
 * 3. Test categorization consistency
 */
export async function testTemplateCategorization(sampleSize = 3) {
  console.log('\n========== Testing Template Categorization ==========\n');
  console.log(`Fetching ${sampleSize} sample videos from Apify...`);
  
  try {
    // 1. Get sample videos from Apify
    const rawVideos = await apifyService.scrapeTrending({ maxItems: sampleSize });
    console.log(`Successfully fetched ${rawVideos.length} videos from Apify.`);
    
    if (rawVideos.length === 0) {
      console.error('Error: No videos returned from Apify.');
      return false;
    }
    
    // 2. Compare basic and AI categorization for each video
    let successCount = 0;
    const categories = new Set<string>();
    
    for (let i = 0; i < rawVideos.length; i++) {
      const rawVideo = rawVideos[i];
      console.log(`\nTesting categorization for video ${i + 1}/${rawVideos.length}`);
      
      if (!aiTemplateAnalysisEtl.validateTikTokVideo(rawVideo)) {
        console.warn(`Video validation failed. Skipping video ${i + 1}.`);
        continue;
      }
      
      const video = rawVideo as unknown as TikTokVideo;
      console.log(`Video ID: ${video.id}`);
      console.log(`Description: ${video.text.substring(0, 50)}${video.text.length > 50 ? '...' : ''}`);
      
      try {
        // 2.1. Basic categorization
        console.log('Running basic categorization...');
        const basicCategory = templateAnalysisService.categorizeVideo(video);
        console.log(`Basic category: ${basicCategory}`);
        
        // 2.2. AI-enhanced categorization
        console.log('Running AI-enhanced categorization...');
        const { category: aiCategory } = await advancedTemplateAnalysisService.analyzeVideoWithAI(video);
        console.log(`AI category: ${aiCategory}`);
        
        // 2.3. Compare results
        console.log(`Categorization comparison: ${basicCategory === aiCategory ? 'MATCH' : 'DIFFERENT'}`);
        
        if (basicCategory) categories.add(basicCategory);
        if (aiCategory) categories.add(aiCategory);
        
        successCount++;
      } catch (error) {
        console.error(`Error testing categorization for video ${video.id}:`, error);
      }
    }
    
    // 3. Report results
    const successRate = (successCount / rawVideos.length) * 100;
    console.log(`\nSuccessfully categorized ${successCount}/${rawVideos.length} videos (${successRate.toFixed(2)}% success rate).`);
    console.log(`Detected categories: ${Array.from(categories).join(', ')}`);
    
    return successCount > 0;
  } catch (error) {
    console.error('Error testing template categorization:', error);
    return false;
  }
}

/**
 * Test 3: Verify template structure extraction works correctly
 * This test will:
 * 1. Test basic section extraction on a sample video
 * 2. Test AI-enhanced section extraction on the same video
 * 3. Verify each section has expected properties
 */
export async function testTemplateStructureExtraction(sampleSize = 2) {
  console.log('\n========== Testing Template Structure Extraction ==========\n');
  console.log(`Fetching ${sampleSize} sample videos from Apify...`);
  
  try {
    // 1. Get sample videos from Apify
    const rawVideos = await apifyService.scrapeTrending({ maxItems: sampleSize });
    console.log(`Successfully fetched ${rawVideos.length} videos from Apify.`);
    
    if (rawVideos.length === 0) {
      console.error('Error: No videos returned from Apify.');
      return false;
    }
    
    // 2. Test structure extraction for each video
    let successCount = 0;
    
    for (let i = 0; i < rawVideos.length; i++) {
      const rawVideo = rawVideos[i];
      console.log(`\nTesting structure extraction for video ${i + 1}/${rawVideos.length}`);
      
      if (!aiTemplateAnalysisEtl.validateTikTokVideo(rawVideo)) {
        console.warn(`Video validation failed. Skipping video ${i + 1}.`);
        continue;
      }
      
      const video = rawVideo as unknown as TikTokVideo;
      console.log(`Video ID: ${video.id}`);
      console.log(`Duration: ${video.videoMeta.duration}s`);
      
      try {
        // 2.1. Basic structure extraction
        console.log('\nRunning basic structure extraction...');
        const basicSections = templateAnalysisService.analyzeVideoForTemplates(video);
        console.log(`Basic extracted ${basicSections.length} sections:`);
        logSectionSummary(basicSections);
        validateSections(basicSections, video.videoMeta.duration);
        
        // 2.2. AI-enhanced structure extraction
        console.log('\nRunning AI-enhanced structure extraction...');
        const { templateSections: aiSections } = await advancedTemplateAnalysisService.analyzeVideoWithAI(video);
        console.log(`AI extracted ${aiSections.length} sections:`);
        logSectionSummary(aiSections);
        validateSections(aiSections, video.videoMeta.duration);
        
        // 2.3. Compare results
        console.log('\nStructure comparison:');
        console.log(`- Basic sections: ${basicSections.length}`);
        console.log(`- AI sections: ${aiSections.length}`);
        
        const basicTypes = basicSections.map(s => s.type);
        const aiTypes = aiSections.map(s => s.type);
        
        console.log(`- Basic section types: ${basicTypes.join(', ')}`);
        console.log(`- AI section types: ${aiTypes.join(', ')}`);
        
        successCount++;
      } catch (error) {
        console.error(`Error testing structure extraction for video ${video.id}:`, error);
      }
    }
    
    // 3. Report results
    const successRate = (successCount / rawVideos.length) * 100;
    console.log(`\nSuccessfully extracted structure from ${successCount}/${rawVideos.length} videos (${successRate.toFixed(2)}% success rate).`);
    
    return successCount > 0;
  } catch (error) {
    console.error('Error testing template structure extraction:', error);
    return false;
  }
}

/**
 * Helper function to log section summary
 */
function logSectionSummary(sections: TemplateSection[]): void {
  sections.forEach((section, index) => {
    console.log(`  ${index + 1}. ${section.type} (${section.startTime}s-${section.startTime + section.duration}s, ${section.duration}s)`);
    if (section.textOverlays.length > 0) {
      console.log(`     ${section.textOverlays.length} text overlays`);
    }
  });
}

/**
 * Helper function to validate sections
 */
function validateSections(sections: TemplateSection[], totalDuration: number): void {
  // Check if sections span the entire video
  const coveredDuration = sections.reduce((sum, section) => sum + section.duration, 0);
  const coveragePercent = (coveredDuration / totalDuration) * 100;
  
  console.log(`  - Sections cover ${coveragePercent.toFixed(1)}% of video duration`);
  
  // Check for overlapping sections
  let hasOverlap = false;
  
  for (let i = 0; i < sections.length - 1; i++) {
    const currentEnd = sections[i].startTime + sections[i].duration;
    const nextStart = sections[i + 1].startTime;
    
    if (currentEnd > nextStart) {
      console.warn(`  - WARNING: Sections ${i + 1} and ${i + 2} overlap by ${(currentEnd - nextStart).toFixed(1)}s`);
      hasOverlap = true;
    }
  }
  
  if (!hasOverlap) {
    console.log('  - No overlapping sections detected');
  }
  
  // Check for valid section types
  const validTypes = ['intro', 'content', 'outro', 'transition', 'cta', 'other'];
  const invalidTypes = sections.filter(s => !validTypes.includes(s.type));
  
  if (invalidTypes.length > 0) {
    console.warn(`  - WARNING: Found ${invalidTypes.length} sections with invalid types`);
  } else {
    console.log('  - All sections have valid types');
  }
}

/**
 * Test 4: Test template similarity detection
 * This test will:
 * 1. Get existing templates from Firebase
 * 2. Test similarity detection between templates
 */
export async function testTemplateSimilarity() {
  console.log('\n========== Testing Template Similarity Detection ==========\n');
  
  try {
    // 1. Get existing templates from Firebase
    console.log('Fetching templates from Firebase...');
    const templates = await trendingTemplateService.getAllTrendingTemplates(10);
    
    if (templates.length < 2) {
      console.warn('Not enough templates in Firebase to test similarity. Need at least 2.');
      return false;
    }
    
    console.log(`Found ${templates.length} templates in Firebase.`);
    
    // 2. Test similarity for a sample template
    const testTemplate = templates[0];
    console.log(`\nTesting similarity for template: ${testTemplate.id}`);
    console.log(`Title: ${testTemplate.title}`);
    console.log(`Category: ${testTemplate.category}`);
    
    // 3. Find similar templates
    console.log('\nFinding similar templates...');
    const similarTemplates = await advancedTemplateAnalysisService.findSimilarTemplates(testTemplate.id, 5);
    
    if (similarTemplates.length === 0) {
      console.warn('No similar templates found.');
    } else {
      console.log(`Found ${similarTemplates.length} similar templates:`);
      
      for (let i = 0; i < similarTemplates.length; i++) {
        const template = similarTemplates[i];
        console.log(`  ${i + 1}. ${template.title} (ID: ${template.id})`);
        console.log(`     Category: ${template.category}`);
        console.log(`     Duration: ${template.metadata.duration}s`);
        console.log(`     Engagement rate: ${template.stats.engagementRate.toFixed(2)}%`);
      }
    }
    
    // 4. Test direct similarity calculation
    if (templates.length >= 2) {
      const template1 = templates[0];
      const template2 = templates[1];
      
      console.log('\nCalculating direct similarity between two templates:');
      console.log(`Template 1: ${template1.title} (${template1.id})`);
      console.log(`Template 2: ${template2.title} (${template2.id})`);
      
      const similarityScore = advancedTemplateAnalysisService.calculateTemplateSimilarity(template1, template2);
      console.log(`Similarity score: ${similarityScore.toFixed(2)}/100`);
    }
    
    return true;
  } catch (error) {
    console.error('Error testing template similarity:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllAnalyzerTests() {
  console.log('Starting template analyzer tests...');
  
  // Test 1: Video Processing
  const videoProcessingResult = await testVideoProcessing();
  if (videoProcessingResult) {
    console.log('\n✅ Video processing test PASSED');
  } else {
    console.error('\n❌ Video processing test FAILED');
  }
  
  // Test 2: Template Categorization
  const categorizationResult = await testTemplateCategorization();
  if (categorizationResult) {
    console.log('\n✅ Template categorization test PASSED');
  } else {
    console.error('\n❌ Template categorization test FAILED');
  }
  
  // Test 3: Template Structure Extraction
  const structureResult = await testTemplateStructureExtraction();
  if (structureResult) {
    console.log('\n✅ Template structure extraction test PASSED');
  } else {
    console.error('\n❌ Template structure extraction test FAILED');
  }
  
  // Test 4: Template Similarity Detection (only if we have templates)
  try {
    const templates = await trendingTemplateService.getAllTrendingTemplates(1);
    if (templates.length > 0) {
      const similarityResult = await testTemplateSimilarity();
      if (similarityResult) {
        console.log('\n✅ Template similarity test PASSED');
      } else {
        console.error('\n❌ Template similarity test FAILED');
      }
    } else {
      console.log('\n⚠️ Skipping template similarity test (no templates in Firebase)');
    }
  } catch (error) {
    console.error('\n⚠️ Skipping template similarity test due to error:', error);
  }
  
  console.log('\nAll tests completed.');
}

// If this file is run directly, execute the tests
if (require.main === module) {
  runAllAnalyzerTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
} 