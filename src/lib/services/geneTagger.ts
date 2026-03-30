import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { supabaseClient } from '@/lib/supabase/client';

// Types
interface GeneDefinition {
  id: number;
  name: string;
  description: string;
  type: 'text' | 'visual' | 'ocr' | 'visual_text' | 'audio_visual';
  detection_method: string;
  pattern?: string;
  text_pattern?: string;
  visual_check?: string;
  text_condition?: string;
  threshold?: number;
  frames_to_check?: number;
  coverage_threshold?: number;
  min_length?: number;
}

interface FrameworkGenes {
  genes: GeneDefinition[];
}

interface VideoFeatures {
  frames_path: string;
  audio_path: string;
  ocr_text: string;
  transcript: string;
  caption: string;
}

// Cache for framework genes
let genesCache: GeneDefinition[] | null = null;

/**
 * Load framework genes from JSON file
 */
async function loadFrameworkGenes(): Promise<GeneDefinition[]> {
  if (genesCache) return genesCache;
  
  try {
    const genesPath = path.join(process.cwd(), 'framework_genes.json');
    const genesData = await fs.readFile(genesPath, 'utf8');
    const framework: FrameworkGenes = JSON.parse(genesData);
    genesCache = framework.genes;
    return genesCache;
  } catch (error) {
    console.error('Failed to load framework genes:', error);
    throw new Error('Framework genes file not found or invalid');
  }
}

/**
 * Analyze text using regex patterns
 */
function analyzeTextWithRegex(text: string, pattern: string): boolean {
  if (!text || !pattern) return false;
  
  try {
    const regex = new RegExp(pattern, 'gi');
    return regex.test(text);
  } catch (error) {
    console.error('Regex analysis failed:', error);
    return false;
  }
}

/**
 * Analyze visual content using image processing
 */
async function analyzeVisualContent(framesPath: string, gene: GeneDefinition): Promise<boolean> {
  try {
    if (!framesPath || !(await fs.stat(framesPath).catch(() => false))) {
      return false;
    }

    const frameFiles = await fs.readdir(framesPath);
    const imageFiles = frameFiles.filter(f => /\.(jpg|jpeg|png)$/i.test(f))
                                 .slice(0, gene.frames_to_check || 5);

    if (imageFiles.length === 0) return false;

    switch (gene.detection_method) {
      case 'color_analysis':
        return await analyzeGreenScreen(framesPath, imageFiles, gene.threshold || 0.25);
      
      case 'face_detection':
        return await analyzeFaceContent(framesPath, imageFiles, gene.coverage_threshold || 0.6);
      
      case 'visual_complexity':
        return await analyzeComplexity(framesPath, imageFiles, gene.threshold || 0.3);
      
      case 'cut_frequency':
        return await analyzeCutFrequency(framesPath, imageFiles, gene.threshold || 5);
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Visual analysis failed:', error);
    return false;
  }
}

/**
 * Analyze green screen content
 */
async function analyzeGreenScreen(framesPath: string, imageFiles: string[], threshold: number): Promise<boolean> {
  try {
    let greenPixelRatio = 0;
    
    for (const file of imageFiles.slice(0, 5)) {
      const imagePath = path.join(framesPath, file);
      const { data, info } = await sharp(imagePath)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      let greenPixels = 0;
      const totalPixels = info.width * info.height;
      
      // Analyze RGB values for green dominance
      for (let i = 0; i < data.length; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Green screen detection: high green, low red/blue
        if (g > 100 && g > r * 1.5 && g > b * 1.5) {
          greenPixels++;
        }
      }
      
      greenPixelRatio += greenPixels / totalPixels;
    }
    
    return (greenPixelRatio / imageFiles.length) > threshold;
  } catch (error) {
    console.error('Green screen analysis failed:', error);
    return false;
  }
}

/**
 * Analyze face content coverage
 */
async function analyzeFaceContent(framesPath: string, imageFiles: string[], threshold: number): Promise<boolean> {
  try {
    // Simplified face detection using edge detection as proxy
    let faceFrames = 0;
    
    for (const file of imageFiles) {
      const imagePath = path.join(framesPath, file);
      const { width, height } = await sharp(imagePath).metadata();
      
      // Use center region analysis as face proxy
      const centerRegion = await sharp(imagePath)
        .extract({
          left: Math.floor(width! * 0.25),
          top: Math.floor(height! * 0.25),
          width: Math.floor(width! * 0.5),
          height: Math.floor(height! * 0.5)
        })
        .greyscale()
        .raw()
        .toBuffer();
      
      // Simple edge detection for face-like features
      const edgePixels = await detectEdges(centerRegion, Math.floor(width! * 0.5), Math.floor(height! * 0.5));
      
      if (edgePixels > 0.1) { // 10% edge pixels suggests face-like features
        faceFrames++;
      }
    }
    
    return (faceFrames / imageFiles.length) > threshold;
  } catch (error) {
    console.error('Face analysis failed:', error);
    return false;
  }
}

/**
 * Simple edge detection
 */
async function detectEdges(buffer: Buffer, width: number, height: number): Promise<number> {
  let edgePixels = 0;
  const totalPixels = width * height;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const current = buffer[idx];
      const right = buffer[idx + 1];
      const down = buffer[idx + width];
      
      if (Math.abs(current - right) > 30 || Math.abs(current - down) > 30) {
        edgePixels++;
      }
    }
  }
  
  return edgePixels / totalPixels;
}

/**
 * Analyze visual complexity
 */
async function analyzeComplexity(framesPath: string, imageFiles: string[], threshold: number): Promise<boolean> {
  try {
    let totalComplexity = 0;
    
    for (const file of imageFiles.slice(0, 3)) {
      const imagePath = path.join(framesPath, file);
      const stats = await sharp(imagePath).stats();
      
      // Calculate complexity based on color variance
      const complexity = stats.channels.reduce((sum, channel) => sum + channel.stdev, 0) / stats.channels.length;
      totalComplexity += complexity / 255; // Normalize to 0-1
    }
    
    const avgComplexity = totalComplexity / Math.min(3, imageFiles.length);
    return avgComplexity < threshold; // Lower complexity = minimalist
  } catch (error) {
    console.error('Complexity analysis failed:', error);
    return false;
  }
}

/**
 * Analyze cut frequency (frame differences)
 */
async function analyzeCutFrequency(framesPath: string, imageFiles: string[], threshold: number): Promise<boolean> {
  try {
    if (imageFiles.length < 2) return false;
    
    let cuts = 0;
    
    for (let i = 1; i < Math.min(imageFiles.length, 10); i++) {
      const prev = path.join(framesPath, imageFiles[i - 1]);
      const curr = path.join(framesPath, imageFiles[i]);
      
      try {
        // Compare histograms as proxy for scene changes
        const [prevHist, currHist] = await Promise.all([
          getImageHistogram(prev),
          getImageHistogram(curr)
        ]);
        
        const difference = calculateHistogramDifference(prevHist, currHist);
        if (difference > 0.3) { // 30% difference indicates cut
          cuts++;
        }
      } catch (error) {
        // Skip problematic frames
        continue;
      }
    }
    
    const cutsPerSecond = cuts / 2; // Assuming 0.5s intervals
    return cutsPerSecond > threshold;
  } catch (error) {
    console.error('Cut frequency analysis failed:', error);
    return false;
  }
}

/**
 * Get image histogram
 */
async function getImageHistogram(imagePath: string): Promise<number[]> {
  const { data } = await sharp(imagePath)
    .resize(100, 100) // Reduce size for performance
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i++) {
    histogram[data[i]]++;
  }
  
  return histogram;
}

/**
 * Calculate histogram difference
 */
function calculateHistogramDifference(hist1: number[], hist2: number[]): number {
  let difference = 0;
  const total1 = hist1.reduce((a, b) => a + b, 0);
  const total2 = hist2.reduce((a, b) => a + b, 0);
  
  for (let i = 0; i < 256; i++) {
    const norm1 = hist1[i] / total1;
    const norm2 = hist2[i] / total2;
    difference += Math.abs(norm1 - norm2);
  }
  
  return difference / 2; // Normalize to 0-1
}

/**
 * Analyze OCR text density
 */
function analyzeOCRDensity(ocrText: string, threshold: number): boolean {
  if (!ocrText) return false;
  
  // Count text density (characters per estimated frame)
  const textLength = ocrText.replace(/\s+/g, '').length;
  return textLength > threshold;
}

/**
 * Analyze story structure
 */
function analyzeStoryStructure(transcript: string, minLength: number): boolean {
  if (!transcript || transcript.length < minLength) return false;
  
  // Look for narrative markers
  const storyMarkers = [
    /\b(once|then|finally|after|before|when|while)\b/gi,
    /\b(first|second|third|next|last)\b/gi,
    /\b(because|so|therefore|however|but)\b/gi
  ];
  
  let markerCount = 0;
  storyMarkers.forEach(regex => {
    const matches = transcript.match(regex);
    if (matches) markerCount += matches.length;
  });
  
  // Story structure if multiple narrative markers
  return markerCount >= 3;
}

/**
 * Analyze hybrid visual-text genes
 */
async function analyzeHybridGene(
  gene: GeneDefinition,
  features: VideoFeatures
): Promise<boolean> {
  switch (gene.name) {
    case 'TransformationBeforeAfter':
      // Check text pattern AND visual comparison at 8s mark
      const hasTextPattern = gene.text_pattern ? 
        analyzeTextWithRegex(features.transcript + ' ' + features.caption, gene.text_pattern) : false;
      
      if (!hasTextPattern) return false;
      
      // Visual comparison at 8s mark (frame 16 if 0.5s intervals)
      if (features.frames_path) {
        try {
          const frameFiles = await fs.readdir(features.frames_path);
          const imageFiles = frameFiles.filter(f => /\.(jpg|jpeg|png)$/i.test(f)).sort();
          
          if (imageFiles.length >= 16) {
            const frame1Path = path.join(features.frames_path, imageFiles[0]);
            const frame16Path = path.join(features.frames_path, imageFiles[15]);
            
            const [hist1, hist16] = await Promise.all([
              getImageHistogram(frame1Path),
              getImageHistogram(frame16Path)
            ]);
            
            const difference = calculateHistogramDifference(hist1, hist16);
            return difference > 0.5; // 50% difference for transformation
          }
        } catch (error) {
          console.error('Transformation analysis failed:', error);
        }
      }
      
      return hasTextPattern; // Fallback to text only
    
    case 'WalkingWisdom':
      // Check transcript length AND optical flow
      const shortTranscript = features.transcript.split(' ').length < 20;
      
      if (!shortTranscript) return false;
      
      // Simple optical flow proxy using first few frames
      if (features.frames_path) {
        try {
          const frameFiles = await fs.readdir(features.frames_path);
          const imageFiles = frameFiles.filter(f => /\.(jpg|jpeg|png)$/i.test(f)).slice(0, 4);
          
          if (imageFiles.length >= 2) {
            let motionDetected = false;
            
            for (let i = 1; i < imageFiles.length; i++) {
              const prev = path.join(features.frames_path, imageFiles[i - 1]);
              const curr = path.join(features.frames_path, imageFiles[i]);
              
              const [prevHist, currHist] = await Promise.all([
                getImageHistogram(prev),
                getImageHistogram(curr)
              ]);
              
              const motion = calculateHistogramDifference(prevHist, currHist);
              if (motion > 0.1 && motion < 0.4) { // Moderate motion suggests walking
                motionDetected = true;
                break;
              }
            }
            
            return motionDetected;
          }
        } catch (error) {
          console.error('Walking analysis failed:', error);
        }
      }
      
      return shortTranscript; // Fallback to text condition only
    
    default:
      return false;
  }
}

/**
 * Main gene tagging function
 */
export async function tagGenes(video_id: string): Promise<boolean[]> {
  console.log(`Starting gene tagging for video: ${video_id}`);
  const startTime = Date.now();
  
  try {
    // Load framework genes
    const genes = await loadFrameworkGenes();
    console.log(`Loaded ${genes.length} gene definitions`);
    
    // Get video features from scraped_videos table
    const { data: videoData, error } = await supabaseClient
      .from('scraped_videos')
      .select('video_id, transcript_text, caption, description')
      .eq('video_id', video_id)
      .single();
    
    if (error || !videoData) {
      throw new Error(`Video not found for ${video_id}: ${error?.message}`);
    }
    
    // Map to VideoFeatures format
    const processedFeatures: VideoFeatures = {
      frames_path: null, // Not available in scraped_videos
      audio_path: null, // Not available in scraped_videos
      ocr_text: '', // Not available in scraped_videos
      transcript: videoData.transcript_text || '',
      caption: videoData.caption || videoData.description || ''
    };
    
    // Initialize results array
    const results: boolean[] = new Array(genes.length).fill(false);
    
    // Process each gene
    for (let i = 0; i < genes.length; i++) {
      const gene = genes[i];
      
      try {
        switch (gene.type) {
          case 'text':
            if (gene.pattern) {
              const combinedText = `${processedFeatures.transcript} ${processedFeatures.caption}`;
              results[i] = analyzeTextWithRegex(combinedText, gene.pattern);
            }
            break;
          
          case 'visual':
            if (processedFeatures.frames_path) {
              results[i] = await analyzeVisualContent(processedFeatures.frames_path, gene);
            }
            break;
          
          case 'ocr':
            if (gene.detection_method === 'text_density' && gene.threshold) {
              results[i] = analyzeOCRDensity(processedFeatures.ocr_text, gene.threshold);
            }
            break;
          
          case 'visual_text':
            results[i] = await analyzeHybridGene(gene, processedFeatures);
            break;
          
          case 'audio_visual':
            // TODO: Implement audio-visual analysis
            results[i] = false;
            break;
          
          default:
            // Handle special cases
            switch (gene.detection_method) {
              case 'story_structure':
                results[i] = analyzeStoryStructure(processedFeatures.transcript, gene.min_length || 100);
                break;
              
              case 'brand_recognition':
              case 'location_detection':
              case 'age_indicators':
              case 'celebrity_recognition':
              case 'controversy_keywords':
              case 'meme_detection':
              case 'production_quality':
                // TODO: Implement specialized detection methods
                results[i] = false;
                break;
            }
        }
      } catch (error) {
        console.error(`Gene ${gene.name} analysis failed:`, error);
        results[i] = false;
      }
    }
    
    // Store results in database
    const { error: insertError } = await supabaseClient
      .from('video_genes')
      .upsert({
        video_id,
        genes: results,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Failed to store gene results:', insertError);
      throw insertError;
    }
    
    const duration = Date.now() - startTime;
    console.log(`Gene tagging completed in ${duration}ms. Results:`, results.filter(Boolean).length, 'genes detected');
    
    return results;
    
  } catch (error) {
    console.error('Gene tagging failed:', error);
    throw error;
  }
}

/**
 * Test function with mock data
 */
export async function testGeneTagger(): Promise<void> {
  console.log('🧬 Testing GeneTagger with mock data');
  
  const mockFeatures = {
    frames_path: '/mnt/c/Projects/CleanCopy/data/test-frames',
    audio_path: '/mnt/c/Projects/CleanCopy/data/test-audio.wav',
    ocr_text: 'Hot take: Nobody talks about this shocking truth! I\'m a doctor with 10 years of experience.',
    transcript: 'Hot take: Nobody talks about this shocking truth! I\'m a doctor with 10 years of experience.',
    caption: 'Doctor reveals shocking health secret'
  };
  
  // Load genes
  const genes = await loadFrameworkGenes();
  console.log(`Loaded ${genes.length} genes`);
  
  // Test specific genes with mock data
  const testResults: { [key: string]: boolean } = {};
  
  // Test AuthorityHook
  const authorityGene = genes.find(g => g.name === 'AuthorityHook');
  if (authorityGene && authorityGene.pattern) {
    testResults.AuthorityHook = analyzeTextWithRegex(mockFeatures.transcript, authorityGene.pattern);
  }
  
  // Test ControversyHook
  const controversyGene = genes.find(g => g.name === 'ControversyHook');
  if (controversyGene && controversyGene.pattern) {
    testResults.ControversyHook = analyzeTextWithRegex(mockFeatures.transcript, controversyGene.pattern);
  }
  
  // Test GreenScreen if frames exist
  const greenScreenGene = genes.find(g => g.name === 'GreenScreen');
  if (greenScreenGene) {
    try {
      testResults.GreenScreen = await analyzeVisualContent(mockFeatures.frames_path, greenScreenGene);
    } catch (error) {
      testResults.GreenScreen = false;
    }
  }
  
  console.log('Test Results:', testResults);
}