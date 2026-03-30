import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { reportTemplateGeneration } from './omniscientDataFlow';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface GeneVector {
  video_id: string;
  genes: number[]; // 48-dimensional boolean/float array
}

export interface VideoCaption {
  video_id: string;
  caption: string;
}

export interface TemplateCluster {
  centroid: number[];
  members: string[]; // video_ids
  name: string;
  niche: string;
  success_rate: number;
}

export interface Template {
  template_id: string;
  name: string;
  centroid: number[];
  niche: string;
  videos: string[];
  success_rate: number;
  created_at: string;
  updated_at: string;
}

// Algorithm parameters
const MIN_CLUSTER_SIZE = 25;
const MIN_VIRAL_POOL_SIZE = 100;
const COSINE_DISTANCE_THRESHOLD = 0.10;
const PERFORMANCE_TARGET_MS = 90000; // 90 seconds

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate cosine distance (1 - cosine similarity)
 */
function cosineDistance(vecA: number[], vecB: number[]): number {
  return 1 - cosineSimilarity(vecA, vecB);
}

/**
 * Calculate centroid (mean) of a set of vectors
 */
function calculateCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  
  const dimensions = vectors[0].length;
  const centroid = new Array(dimensions).fill(0);
  
  for (const vector of vectors) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += vector[i];
    }
  }
  
  for (let i = 0; i < dimensions; i++) {
    centroid[i] /= vectors.length;
  }
  
  return centroid;
}

/**
 * Simple HDBSCAN implementation using density-based clustering
 * This is a simplified version - for production, consider using ml-hdbscan
 */
function simpleHDBSCAN(vectors: number[][], minClusterSize: number = MIN_CLUSTER_SIZE): number[] {
  const n = vectors.length;
  const labels = new Array(n).fill(-1); // -1 = noise
  let currentLabel = 0;
  
  // Calculate distance matrix
  const distances: number[][] = [];
  for (let i = 0; i < n; i++) {
    distances[i] = [];
    for (let j = 0; j < n; j++) {
      distances[i][j] = cosineDistance(vectors[i], vectors[j]);
    }
  }
  
  // Find core points and build clusters
  const eps = 0.3; // Distance threshold for core points
  const minPts = Math.max(3, Math.floor(minClusterSize / 8)); // Minimum points for core
  
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue; // Already processed
    
    // Find neighbors within eps distance
    const neighbors = [];
    for (let j = 0; j < n; j++) {
      if (distances[i][j] <= eps) {
        neighbors.push(j);
      }
    }
    
    if (neighbors.length < minPts) continue; // Not a core point
    
    // Start new cluster
    labels[i] = currentLabel;
    const queue = [...neighbors];
    
    while (queue.length > 0) {
      const point = queue.shift()!;
      
      if (labels[point] === -1) {
        labels[point] = currentLabel;
        
        // Find neighbors of this point
        const pointNeighbors = [];
        for (let k = 0; k < n; k++) {
          if (distances[point][k] <= eps) {
            pointNeighbors.push(k);
          }
        }
        
        // If this is also a core point, add its neighbors to queue
        if (pointNeighbors.length >= minPts) {
          for (const neighbor of pointNeighbors) {
            if (labels[neighbor] === -1 && !queue.includes(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      }
    }
    
    currentLabel++;
  }
  
  // Filter out clusters smaller than minClusterSize
  const clusterCounts = new Map<number, number>();
  for (const label of labels) {
    if (label !== -1) {
      clusterCounts.set(label, (clusterCounts.get(label) || 0) + 1);
    }
  }
  
  // Mark small clusters as noise
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label !== -1 && (clusterCounts.get(label) || 0) < minClusterSize) {
      labels[i] = -1; // Mark as noise
    }
  }
  
  return labels;
}

/**
 * Load framework genes to map gene indices to names
 */
async function loadFrameworkGenes(): Promise<any[]> {
  try {
    const genesPath = path.join(process.cwd(), 'framework_genes.json');
    const genesData = await fs.readFile(genesPath, 'utf8');
    const framework = JSON.parse(genesData);
    return framework.genes || [];
  } catch (error) {
    console.warn('Could not load framework_genes.json, using generic names');
    return [];
  }
}

/**
 * Generate human-readable template name from top genes using Script Intelligence
 */
async function generateTemplateName(centroid: number[], frameworkGenes: any[], clusterVideoIds: string[]): Promise<string> {
  try {
    // Try to enhance naming with Script Intelligence patterns
    const scriptIntelligenceResponse = await fetch('/api/admin/script-intelligence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'generate_template_name',
        centroid,
        video_ids: clusterVideoIds,
        gene_activations: centroid.map((value, index) => ({ 
          index, 
          value, 
          name: frameworkGenes[index]?.name || `Gene${index}` 
        }))
      })
    });

    if (scriptIntelligenceResponse.ok) {
      const data = await scriptIntelligenceResponse.json();
      if (data.success && data.template_name) {
        console.log('🧠 Script Intelligence generated template name:', data.template_name);
        return data.template_name;
      }
    }
  } catch (error) {
    console.warn('Script Intelligence template naming failed, using fallback:', error);
  }

  // Fallback to original gene-based naming
  const geneActivations = centroid.map((value, index) => ({ index, value, name: frameworkGenes[index]?.name || `Gene${index}` }));
  const topGenes = geneActivations
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  
  if (topGenes.length >= 2) {
    const name1 = topGenes[0].name.replace(/Hook|Gene\d+/, '').trim();
    const name2 = topGenes[1].name.replace(/Hook|Gene\d+/, '').trim();
    return `${name1} ${name2} Template`;
  } else if (topGenes.length === 1) {
    const name = topGenes[0].name.replace(/Hook|Gene\d+/, '').trim();
    return `${name} Template`;
  }
  
  return 'Generic Template';
}

/**
 * Extract primary niche from video caption using simple NLP
 */
function extractNiche(caption: string): string {
  if (!caption) return 'general';
  
  const text = caption.toLowerCase();
  
  // Define niche keywords
  const niches = {
    'fitness': ['workout', 'gym', 'fitness', 'exercise', 'muscle', 'training', 'bodybuilding'],
    'food': ['recipe', 'cooking', 'food', 'eat', 'delicious', 'cook', 'kitchen', 'meal'],
    'beauty': ['makeup', 'skincare', 'beauty', 'cosmetics', 'hair', 'style', 'fashion'],
    'business': ['business', 'entrepreneur', 'money', 'success', 'career', 'work', 'job'],
    'entertainment': ['funny', 'comedy', 'entertainment', 'fun', 'laugh', 'joke', 'humor'],
    'education': ['learn', 'education', 'tutorial', 'how to', 'teach', 'explain', 'knowledge'],
    'lifestyle': ['life', 'daily', 'routine', 'vlog', 'lifestyle', 'personal', 'day'],
    'technology': ['tech', 'technology', 'app', 'software', 'coding', 'programming', 'ai'],
    'travel': ['travel', 'trip', 'vacation', 'explore', 'adventure', 'destination', 'journey']
  };
  
  // Find best matching niche
  let bestNiche = 'general';
  let maxMatches = 0;
  
  for (const [niche, keywords] of Object.entries(niches)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestNiche = niche;
    }
  }
  
  return bestNiche;
}

/**
 * Fetch viral gene vectors from database
 */
async function fetchViralGeneVectors(): Promise<{ vectors: GeneVector[], captions: VideoCaption[] }> {
  try {
    // Get video IDs from viral pool
    const { data: viralPool, error: viralError } = await supabase
      .from('viral_pool')
      .select('video_id');
    
    if (viralError) throw viralError;
    if (!viralPool || viralPool.length === 0) {
      return { vectors: [], captions: [] };
    }
    
    const viralVideoIds = viralPool.map(v => v.video_id);
    
    // Fetch gene vectors for viral videos
    const { data: geneData, error: geneError } = await supabase
      .from('video_genes')
      .select('video_id, genes')
      .in('video_id', viralVideoIds);
    
    if (geneError) throw geneError;
    
    // Fetch captions for niche extraction
    const { data: captionData, error: captionError } = await supabase
      .from('raw_videos')
      .select('video_id, caption')
      .in('video_id', viralVideoIds);
    
    if (captionError) {
      console.warn('Could not fetch captions:', captionError.message);
    }
    
    // Convert to proper format
    const vectors: GeneVector[] = (geneData || []).map(item => ({
      video_id: item.video_id,
      genes: Array.isArray(item.genes) ? item.genes.map(Number) : []
    })).filter(v => v.genes.length === 48); // Only keep 48-dimensional vectors
    
    const captions: VideoCaption[] = (captionData || []).map(item => ({
      video_id: item.video_id,
      caption: item.caption || ''
    }));
    
    return { vectors, captions };
  } catch (error) {
    console.error('Error fetching viral gene vectors:', error);
    throw new Error('Failed to fetch viral gene vectors from database');
  }
}

/**
 * Insert or update templates in database
 */
async function upsertTemplates(clusters: TemplateCluster[]): Promise<void> {
  try {
    // Get existing templates for similarity comparison
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('template_library')
      .select('template_id, name, centroid');
    
    if (fetchError) throw fetchError;
    
    for (const cluster of clusters) {
      let shouldInsert = true;
      let updateTemplateId = null;
      
      // Check if similar template exists
      if (existingTemplates) {
        for (const existing of existingTemplates) {
          const existingCentroid = Array.isArray(existing.centroid) ? existing.centroid : [];
          const distance = cosineDistance(cluster.centroid, existingCentroid);
          
          if (distance < COSINE_DISTANCE_THRESHOLD) {
            shouldInsert = false;
            updateTemplateId = existing.template_id;
            break;
          }
        }
      }
      
      if (shouldInsert) {
        // Insert new template
        const { error: insertError } = await supabase
          .from('template_library')
          .insert({
            name: cluster.name,
            centroid: cluster.centroid,
            niche: cluster.niche,
            videos: cluster.members,
            success_rate: cluster.success_rate
          });
        
        if (insertError) throw insertError;
      } else if (updateTemplateId) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('template_library')
          .update({
            centroid: cluster.centroid,
            videos: cluster.members,
            success_rate: cluster.success_rate,
            updated_at: new Date().toISOString()
          })
          .eq('template_id', updateTemplateId);
        
        if (updateError) throw updateError;
      }
    }
  } catch (error) {
    console.error('Error upserting templates:', error);
    throw new Error('Failed to insert/update templates in database');
  }
}

/**
 * Update template membership table
 */
async function updateTemplateMembership(clusters: TemplateCluster[]): Promise<void> {
  try {
    // Get template IDs for the clusters we just inserted/updated
    const { data: templates, error: fetchError } = await supabase
      .from('template_library')
      .select('template_id, name, videos');
    
    if (fetchError) throw fetchError;
    if (!templates) return;
    
    // Clear existing memberships for videos in our clusters
    const allVideoIds = clusters.flatMap(c => c.members);
    if (allVideoIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('template_membership')
        .delete()
        .in('video_id', allVideoIds);
      
      if (deleteError) throw deleteError;
    }
    
    // Insert new memberships
    const memberships = [];
    for (const template of templates) {
      const videos = Array.isArray(template.videos) ? template.videos : [];
      for (const videoId of videos) {
        memberships.push({
          video_id: videoId,
          template_id: template.template_id
        });
      }
    }
    
    if (memberships.length > 0) {
      const { error: insertError } = await supabase
        .from('template_membership')
        .insert(memberships);
      
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating template membership:', error);
    throw new Error('Failed to update template membership table');
  }
}

/**
 * Store template patterns in Script Intelligence omniscient memory
 */
async function storeTemplateInScriptIntelligence(
  videoIds: string[], 
  centroid: number[], 
  templateName: string, 
  niche: string, 
  successRate: number, 
  combinedCaptions: string
): Promise<void> {
  try {
    console.log(`🧠 Storing template "${templateName}" in Script Intelligence memory...`);
    
    // Store the template pattern as a script memory
    const response = await fetch('/api/admin/script-intelligence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'store_memory',
        script_text: combinedCaptions,
        video_id: videoIds[0], // Representative video
        niche,
        performance_metrics: {
          template_name: templateName,
          success_rate: successRate,
          cluster_size: videoIds.length,
          gene_centroid: centroid,
          videos_in_cluster: videoIds.length,
          viral_probability: successRate,
          pattern_type: 'template_cluster'
        },
        cultural_context: {
          niche,
          template_type: 'viral_cluster',
          generation_method: 'hdbscan_clustering',
          script_intelligence_enhanced: true
        },
        platform: 'tiktok' // Assuming TikTok for now
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log(`✅ Template "${templateName}" stored in Script Intelligence omniscient memory`);
      } else {
        console.warn('Script Intelligence storage failed:', data.message);
      }
    } else {
      console.warn('Script Intelligence API error:', response.status);
    }
  } catch (error) {
    console.error('Error storing template in Script Intelligence:', error);
    // Don't throw - this is an enhancement, not critical
  }
}

/**
 * Log template generation run
 */
async function logTemplateRun(runId: string, status: string, templatesCreated: number, videosProcessed: number, duration: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('template_generation_runs')
      .insert({
        run_id: runId,
        status,
        templates_created: templatesCreated,
        videos_processed: videosProcessed,
        duration_ms: duration,
        run_timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.warn('Could not log template generation run:', error.message);
    }
  } catch (error) {
    console.warn('Error logging template run:', error);
  }
}

/**
 * Main template generation function
 */
export async function generateTemplates(run_id?: string): Promise<void> {
  const runId = run_id || crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    console.log(`TemplateGenerator starting run ${runId}`);
    
    // Fetch viral gene vectors and captions
    const { vectors, captions } = await fetchViralGeneVectors();
    
    console.log(`Fetched ${vectors.length} viral gene vectors`);
    
    // Check minimum viral pool size
    if (vectors.length < MIN_VIRAL_POOL_SIZE) {
      console.warn(`Insufficient data: ${vectors.length} vectors (minimum ${MIN_VIRAL_POOL_SIZE})`);
      await logTemplateRun(runId, 'insufficient_data', 0, vectors.length, Date.now() - startTime);
      return;
    }
    
    // Load framework genes for naming
    const frameworkGenes = await loadFrameworkGenes();
    
    // Prepare data for clustering
    const geneVectors = vectors.map(v => v.genes);
    const videoIds = vectors.map(v => v.video_id);
    
    console.log(`Running HDBSCAN clustering on ${geneVectors.length} 48-dimensional vectors...`);
    
    // Perform clustering
    const clusterLabels = simpleHDBSCAN(geneVectors, MIN_CLUSTER_SIZE);
    
    // Group vectors by cluster
    const clusterMap = new Map<number, { vectors: number[][], videoIds: string[] }>();
    
    for (let i = 0; i < clusterLabels.length; i++) {
      const label = clusterLabels[i];
      if (label === -1) continue; // Skip noise points
      
      if (!clusterMap.has(label)) {
        clusterMap.set(label, { vectors: [], videoIds: [] });
      }
      
      clusterMap.get(label)!.vectors.push(geneVectors[i]);
      clusterMap.get(label)!.videoIds.push(videoIds[i]);
    }
    
    console.log(`Found ${clusterMap.size} valid clusters`);
    
    // Create template clusters with Script Intelligence enhancement
    const templateClusters: TemplateCluster[] = [];
    
    for (const [label, cluster] of clusterMap) {
      if (cluster.vectors.length < MIN_CLUSTER_SIZE) continue;
      
      const centroid = calculateCentroid(cluster.vectors);
      
      // Extract niche from captions
      const clusterCaptions = captions.filter(c => cluster.videoIds.includes(c.video_id));
      const allCaptions = clusterCaptions.map(c => c.caption).join(' ');
      const niche = extractNiche(allCaptions);
      
      // Use Script Intelligence to generate enhanced template name
      const name = await generateTemplateName(centroid, frameworkGenes, cluster.videoIds);
      
      // Calculate success rate (for initial pass, use cluster size / total)
      const successRate = cluster.vectors.length / vectors.length;
      
      // Store template patterns in Script Intelligence memory
      try {
        await storeTemplateInScriptIntelligence(cluster.videoIds, centroid, name, niche, successRate, allCaptions);
      } catch (error) {
        console.warn('Failed to store template in Script Intelligence:', error);
      }
      
      templateClusters.push({
        centroid,
        members: cluster.videoIds,
        name,
        niche,
        success_rate: successRate
      });

      // Report template generation to omniscient learning system
      try {
        await reportTemplateGeneration({
          template_name: name,
          centroid,
          niche,
          success_rate: successRate,
          cluster_size: cluster.videoIds.length,
          video_ids: cluster.videoIds,
          template_type: 'hdbscan_cluster',
          viral_elements: centroid.map((value, index) => ({ index, value, name: frameworkGenes[index]?.name || `Gene${index}` }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map(gene => gene.name),
          script_intelligence_enhanced: true
        });
        console.log(`🧠 Reported template "${name}" to omniscient learning system`);
      } catch (error) {
        console.warn('Failed to report to omniscient learning:', error);
      }
    }
    
    console.log(`Created ${templateClusters.length} template clusters`);
    
    // Insert/update templates in database
    if (templateClusters.length > 0) {
      await upsertTemplates(templateClusters);
      await updateTemplateMembership(templateClusters);
    }
    
    const duration = Date.now() - startTime;
    
    // Log successful run
    await logTemplateRun(runId, 'completed', templateClusters.length, vectors.length, duration);
    
    console.log(`TemplateGenerator completed run ${runId} in ${duration}ms`);
    console.log(`- Processed: ${vectors.length} videos`);
    console.log(`- Created: ${templateClusters.length} templates`);
    
    // Performance check
    if (duration > PERFORMANCE_TARGET_MS) {
      console.warn(`Performance warning: TemplateGenerator took ${duration}ms (target: <${PERFORMANCE_TARGET_MS}ms)`);
    }
    
  } catch (error) {
    console.error(`TemplateGenerator run ${runId} failed:`, error);
    
    // Log failed run
    try {
      await logTemplateRun(runId, 'error', 0, 0, Date.now() - startTime);
    } catch (logError) {
      console.error('Failed to log error run:', logError);
    }
    
    throw error;
  }
}

/**
 * Test function for TemplateGenerator
 */
export async function testTemplateGenerator(): Promise<{
  success: boolean;
  templatesCreated: number;
  duration: number;
  clusters: number;
}> {
  console.log('Testing TemplateGenerator with synthetic data...');
  
  const startTime = Date.now();
  
  try {
    // Create synthetic gene vectors with obvious clusters
    const syntheticVectors: GeneVector[] = [];
    const syntheticCaptions: VideoCaption[] = [];
    
    // Cluster 1: Authority + Transformation (genes 0, 5 activated)
    for (let i = 0; i < 150; i++) {
      const genes = new Array(48).fill(0);
      genes[0] = Math.random() * 0.3 + 0.7; // Authority gene
      genes[5] = Math.random() * 0.3 + 0.7; // Transformation gene
      // Add some noise
      for (let j = 0; j < 48; j++) {
        if (j !== 0 && j !== 5) {
          genes[j] = Math.random() * 0.2;
        }
      }
      
      syntheticVectors.push({
        video_id: `authority_${i}`,
        genes
      });
      
      syntheticCaptions.push({
        video_id: `authority_${i}`,
        caption: 'fitness workout transformation before after'
      });
    }
    
    // Cluster 2: Controversy + Hook (genes 1, 3 activated)
    for (let i = 0; i < 150; i++) {
      const genes = new Array(48).fill(0);
      genes[1] = Math.random() * 0.3 + 0.7; // Controversy gene
      genes[3] = Math.random() * 0.3 + 0.7; // Hook gene
      // Add some noise
      for (let j = 0; j < 48; j++) {
        if (j !== 1 && j !== 3) {
          genes[j] = Math.random() * 0.2;
        }
      }
      
      syntheticVectors.push({
        video_id: `controversy_${i}`,
        genes
      });
      
      syntheticCaptions.push({
        video_id: `controversy_${i}`,
        caption: 'business entrepreneur controversial opinion'
      });
    }
    
    // Test with insufficient data (should exit early)
    if (syntheticVectors.length < MIN_VIRAL_POOL_SIZE) {
      return {
        success: false,
        templatesCreated: 0,
        duration: Date.now() - startTime,
        clusters: 0
      };
    }
    
    // Perform clustering on synthetic data
    const geneVectors = syntheticVectors.map(v => v.genes);
    const clusterLabels = simpleHDBSCAN(geneVectors, MIN_CLUSTER_SIZE);
    
    // Count clusters
    const uniqueClusters = new Set(clusterLabels.filter(l => l !== -1));
    const clustersFound = uniqueClusters.size;
    
    const duration = Date.now() - startTime;
    
    return {
      success: clustersFound >= 2, // Should find at least 2 obvious clusters
      templatesCreated: clustersFound,
      duration,
      clusters: clustersFound
    };
    
  } catch (error) {
    console.error('TemplateGenerator test failed:', error);
    return {
      success: false,
      templatesCreated: 0,
      duration: Date.now() - startTime,
      clusters: 0
    };
  }
}