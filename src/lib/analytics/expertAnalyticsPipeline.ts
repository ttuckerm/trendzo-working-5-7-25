import { db } from '@/lib/firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';

/**
 * ExpertContentMetrics represents analytics data for expert-created content
 */
export interface ExpertContentMetrics {
  templateId: string;
  linkId: string;
  expertId: string;
  expertName?: string;
  createdAt: string;
  impressions: number;
  clicks: number;
  views: number;
  edits: number;
  saves: number;
  shares: number;
  avgEngagementTime?: number;
  conversionRate: number;
  clickToEditRate: number;
  editToSaveRate: number;
  campaign?: string;
  industry?: string;
  audience?: string[];
  expertNotes?: string;
  performance?: 'high' | 'medium' | 'low';
}

/**
 * AutomatedContentMetrics represents analytics data for AI-generated content
 */
export interface AutomatedContentMetrics {
  templateId: string;
  linkId: string;
  generatorId: string;
  generatorVersion?: string;
  createdAt: string;
  impressions: number;
  clicks: number;
  views: number;
  edits: number;
  saves: number;
  shares: number;
  avgEngagementTime?: number;
  conversionRate: number;
  clickToEditRate: number;
  editToSaveRate: number;
  campaign?: string;
  industry?: string;
  audience?: string[];
  promptTemplate?: string;
  modelParams?: Record<string, any>;
  performance?: 'high' | 'medium' | 'low';
}

/**
 * ContentPerformanceComparison holds comparative data between expert and automated content
 */
export interface ContentPerformanceComparison {
  period: string;
  expertCount: number;
  automatedCount: number;
  metrics: {
    clickRate: { expert: number; automated: number; delta: number };
    viewToEditRate: { expert: number; automated: number; delta: number };
    editToSaveRate: { expert: number; automated: number; delta: number };
    conversionRate: { expert: number; automated: number; delta: number };
    shareRate: { expert: number; automated: number; delta: number };
    avgEngagementTime: { expert: number; automated: number; delta: number };
  };
  topPerformers: {
    expert: Array<{ templateId: string; score: number; campaign?: string }>;
    automated: Array<{ templateId: string; score: number; campaign?: string }>;
  };
  insightSummary: string[];
  lastUpdated: string;
}

/**
 * Calculate performance metrics for expert-created content
 * 
 * @param linkId - The newsletter link ID
 * @param expertId - The ID of the expert who created the content
 * @param period - Time period for calculation ('7d', '30d', '90d', 'all')
 */
export async function calculateExpertContentMetrics(
  linkId: string,
  expertId: string,
  period: string = '30d'
): Promise<ExpertContentMetrics | null> {
  try {
    // Get link data to find the templateId
    const linkDoc = await getDoc(doc(db, 'newsletterLinks', linkId));
    if (!linkDoc.exists()) {
      console.error(`Link ${linkId} not found`);
      return null;
    }

    const linkData = linkDoc.data();
    const templateId = linkData.templateId;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Far in the past
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get all analytics events for this link
    const clicksQuery = query(
      collection(db, 'newsletterClicks'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const clicksSnapshot = await getDocs(clicksQuery);
    const clicks = clicksSnapshot.size;
    
    // Get view data
    const viewsQuery = query(
      collection(db, 'templateViews'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const viewsSnapshot = await getDocs(viewsQuery);
    const views = viewsSnapshot.size;
    
    // Get edit and save data
    const editsQuery = query(
      collection(db, 'templateEdits'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const editsSnapshot = await getDocs(editsQuery);
    const edits = editsSnapshot.docs.filter(doc => doc.data().action === 'open_editor').length;
    const saves = editsSnapshot.docs.filter(doc => doc.data().action === 'save_template').length;
    
    // Get shares data
    const sharesQuery = query(
      collection(db, 'templateShares'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const sharesSnapshot = await getDocs(sharesQuery);
    const shares = sharesSnapshot.size;
    
    // Calculate rates
    const clickToEditRate = clicks > 0 ? (edits / clicks) * 100 : 0;
    const editToSaveRate = edits > 0 ? (saves / edits) * 100 : 0;
    const conversionRate = clicks > 0 ? (saves / clicks) * 100 : 0;
    
    // Get expert data
    const expertDoc = await getDoc(doc(db, 'experts', expertId));
    const expertName = expertDoc.exists() ? expertDoc.data().name : 'Unknown Expert';
    
    // Create metrics object
    const metrics: ExpertContentMetrics = {
      templateId,
      linkId,
      expertId,
      expertName,
      createdAt: linkData.createdAt,
      impressions: clicks, // For newsletter links, impressions = clicks for now
      clicks,
      views,
      edits,
      saves,
      shares,
      conversionRate,
      clickToEditRate,
      editToSaveRate,
      campaign: linkData.utm_campaign,
      performance: determinePerformance(conversionRate)
    };
    
    // Store the metrics for historical tracking
    await addDoc(collection(db, 'expertContentMetrics'), {
      ...metrics,
      calculatedAt: serverTimestamp(),
      period
    });
    
    return metrics;
  } catch (error) {
    console.error('Error calculating expert content metrics:', error);
    return null;
  }
}

/**
 * Calculate performance metrics for AI-generated content
 * 
 * @param linkId - The newsletter link ID
 * @param generatorId - The ID of the AI generator
 * @param period - Time period for calculation ('7d', '30d', '90d', 'all')
 */
export async function calculateAutomatedContentMetrics(
  linkId: string,
  generatorId: string,
  period: string = '30d'
): Promise<AutomatedContentMetrics | null> {
  try {
    // Get link data to find the templateId
    const linkDoc = await getDoc(doc(db, 'newsletterLinks', linkId));
    if (!linkDoc.exists()) {
      console.error(`Link ${linkId} not found`);
      return null;
    }

    const linkData = linkDoc.data();
    const templateId = linkData.templateId;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Far in the past
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get all analytics events for this link (same queries as expert metrics)
    const clicksQuery = query(
      collection(db, 'newsletterClicks'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const clicksSnapshot = await getDocs(clicksQuery);
    const clicks = clicksSnapshot.size;
    
    // Get view data
    const viewsQuery = query(
      collection(db, 'templateViews'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const viewsSnapshot = await getDocs(viewsQuery);
    const views = viewsSnapshot.size;
    
    // Get edit and save data
    const editsQuery = query(
      collection(db, 'templateEdits'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const editsSnapshot = await getDocs(editsQuery);
    const edits = editsSnapshot.docs.filter(doc => doc.data().action === 'open_editor').length;
    const saves = editsSnapshot.docs.filter(doc => doc.data().action === 'save_template').length;
    
    // Get shares data
    const sharesQuery = query(
      collection(db, 'templateShares'),
      where('linkId', '==', linkId),
      where('timestamp', '>=', Timestamp.fromDate(startDate))
    );
    
    const sharesSnapshot = await getDocs(sharesQuery);
    const shares = sharesSnapshot.size;
    
    // Calculate rates
    const clickToEditRate = clicks > 0 ? (edits / clicks) * 100 : 0;
    const editToSaveRate = edits > 0 ? (saves / edits) * 100 : 0;
    const conversionRate = clicks > 0 ? (saves / clicks) * 100 : 0;
    
    // Get generator data
    const generatorDoc = await getDoc(doc(db, 'contentGenerators', generatorId));
    const generatorData = generatorDoc.exists() ? generatorDoc.data() : null;
    const generatorVersion = generatorData?.version || '1.0';
    
    // Create metrics object
    const metrics: AutomatedContentMetrics = {
      templateId,
      linkId,
      generatorId,
      generatorVersion,
      createdAt: linkData.createdAt,
      impressions: clicks, // For newsletter links, impressions = clicks for now
      clicks,
      views,
      edits,
      saves,
      shares,
      conversionRate,
      clickToEditRate,
      editToSaveRate,
      campaign: linkData.utm_campaign,
      promptTemplate: generatorData?.promptTemplate,
      modelParams: generatorData?.parameters,
      performance: determinePerformance(conversionRate)
    };
    
    // Store the metrics for historical tracking
    await addDoc(collection(db, 'automatedContentMetrics'), {
      ...metrics,
      calculatedAt: serverTimestamp(),
      period
    });
    
    return metrics;
  } catch (error) {
    console.error('Error calculating automated content metrics:', error);
    return null;
  }
}

/**
 * Generate a comparison between expert and automated content performance
 * 
 * @param period - Time period for comparison ('7d', '30d', '90d', 'all')
 */
export async function generateContentComparison(period: string = '30d'): Promise<ContentPerformanceComparison | null> {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Far in the past
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get expert metrics
    const expertQuery = query(
      collection(db, 'expertContentMetrics'),
      where('calculatedAt', '>=', Timestamp.fromDate(startDate))
    );
    
    const expertSnapshot = await getDocs(expertQuery);
    const expertMetrics: ExpertContentMetrics[] = expertSnapshot.docs.map(doc => doc.data() as ExpertContentMetrics);
    
    // Get automated metrics
    const automatedQuery = query(
      collection(db, 'automatedContentMetrics'),
      where('calculatedAt', '>=', Timestamp.fromDate(startDate))
    );
    
    const automatedSnapshot = await getDocs(automatedQuery);
    const automatedMetrics: AutomatedContentMetrics[] = automatedSnapshot.docs.map(doc => doc.data() as AutomatedContentMetrics);
    
    // If no data, return null
    if (expertMetrics.length === 0 && automatedMetrics.length === 0) {
      console.log('No metrics data found for comparison');
      return null;
    }
    
    // Calculate averages for expert content
    const expertClicks = expertMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const expertViews = expertMetrics.reduce((sum, m) => sum + m.views, 0);
    const expertEdits = expertMetrics.reduce((sum, m) => sum + m.edits, 0);
    const expertSaves = expertMetrics.reduce((sum, m) => sum + m.saves, 0);
    const expertShares = expertMetrics.reduce((sum, m) => sum + m.shares, 0);
    const expertEngagementTime = expertMetrics
      .filter(m => m.avgEngagementTime !== undefined)
      .reduce((sum, m) => sum + (m.avgEngagementTime || 0), 0);
    
    const expertAvgClickRate = expertClicks > 0 ? (expertViews / expertClicks) * 100 : 0;
    const expertAvgViewToEditRate = expertViews > 0 ? (expertEdits / expertViews) * 100 : 0;
    const expertAvgEditToSaveRate = expertEdits > 0 ? (expertSaves / expertEdits) * 100 : 0;
    const expertAvgConversionRate = expertClicks > 0 ? (expertSaves / expertClicks) * 100 : 0;
    const expertAvgShareRate = expertViews > 0 ? (expertShares / expertViews) * 100 : 0;
    const expertAvgEngagementTime = expertMetrics.filter(m => m.avgEngagementTime !== undefined).length > 0 
      ? expertEngagementTime / expertMetrics.filter(m => m.avgEngagementTime !== undefined).length 
      : 0;
    
    // Calculate averages for automated content
    const automatedClicks = automatedMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const automatedViews = automatedMetrics.reduce((sum, m) => sum + m.views, 0);
    const automatedEdits = automatedMetrics.reduce((sum, m) => sum + m.edits, 0);
    const automatedSaves = automatedMetrics.reduce((sum, m) => sum + m.saves, 0);
    const automatedShares = automatedMetrics.reduce((sum, m) => sum + m.shares, 0);
    const automatedEngagementTime = automatedMetrics
      .filter(m => m.avgEngagementTime !== undefined)
      .reduce((sum, m) => sum + (m.avgEngagementTime || 0), 0);
    
    const automatedAvgClickRate = automatedClicks > 0 ? (automatedViews / automatedClicks) * 100 : 0;
    const automatedAvgViewToEditRate = automatedViews > 0 ? (automatedEdits / automatedViews) * 100 : 0;
    const automatedAvgEditToSaveRate = automatedEdits > 0 ? (automatedSaves / automatedEdits) * 100 : 0;
    const automatedAvgConversionRate = automatedClicks > 0 ? (automatedSaves / automatedClicks) * 100 : 0;
    const automatedAvgShareRate = automatedViews > 0 ? (automatedShares / automatedViews) * 100 : 0;
    const automatedAvgEngagementTime = automatedMetrics.filter(m => m.avgEngagementTime !== undefined).length > 0 
      ? automatedEngagementTime / automatedMetrics.filter(m => m.avgEngagementTime !== undefined).length 
      : 0;
    
    // Calculate deltas (expert - automated)
    const clickRateDelta = expertAvgClickRate - automatedAvgClickRate;
    const viewToEditRateDelta = expertAvgViewToEditRate - automatedAvgViewToEditRate;
    const editToSaveRateDelta = expertAvgEditToSaveRate - automatedAvgEditToSaveRate;
    const conversionRateDelta = expertAvgConversionRate - automatedAvgConversionRate;
    const shareRateDelta = expertAvgShareRate - automatedAvgShareRate;
    const engagementTimeDelta = expertAvgEngagementTime - automatedAvgEngagementTime;
    
    // Find top performers
    const expertScores = expertMetrics.map(m => ({
      templateId: m.templateId,
      score: calculatePerformanceScore(m),
      campaign: m.campaign
    })).sort((a, b) => b.score - a.score).slice(0, 5);
    
    const automatedScores = automatedMetrics.map(m => ({
      templateId: m.templateId,
      score: calculatePerformanceScore(m),
      campaign: m.campaign
    })).sort((a, b) => b.score - a.score).slice(0, 5);
    
    // Generate insights
    const insights = generateInsights(
      expertMetrics.length,
      automatedMetrics.length,
      clickRateDelta,
      viewToEditRateDelta,
      editToSaveRateDelta,
      conversionRateDelta,
      shareRateDelta,
      engagementTimeDelta
    );
    
    // Create comparison object
    const comparison: ContentPerformanceComparison = {
      period,
      expertCount: expertMetrics.length,
      automatedCount: automatedMetrics.length,
      metrics: {
        clickRate: { 
          expert: expertAvgClickRate, 
          automated: automatedAvgClickRate, 
          delta: clickRateDelta 
        },
        viewToEditRate: { 
          expert: expertAvgViewToEditRate, 
          automated: automatedAvgViewToEditRate, 
          delta: viewToEditRateDelta 
        },
        editToSaveRate: { 
          expert: expertAvgEditToSaveRate, 
          automated: automatedAvgEditToSaveRate, 
          delta: editToSaveRateDelta 
        },
        conversionRate: { 
          expert: expertAvgConversionRate, 
          automated: automatedAvgConversionRate, 
          delta: conversionRateDelta 
        },
        shareRate: { 
          expert: expertAvgShareRate, 
          automated: automatedAvgShareRate, 
          delta: shareRateDelta 
        },
        avgEngagementTime: { 
          expert: expertAvgEngagementTime, 
          automated: automatedAvgEngagementTime, 
          delta: engagementTimeDelta 
        }
      },
      topPerformers: {
        expert: expertScores,
        automated: automatedScores
      },
      insightSummary: insights,
      lastUpdated: new Date().toISOString()
    };
    
    // Store comparison for historical reference
    await addDoc(collection(db, 'contentPerformanceComparisons'), {
      ...comparison,
      createdAt: serverTimestamp()
    });
    
    return comparison;
  } catch (error) {
    console.error('Error generating content comparison:', error);
    return null;
  }
}

/**
 * Calculate a performance score based on metrics
 * 
 * @param metrics - Either expert or automated content metrics
 */
function calculatePerformanceScore(metrics: ExpertContentMetrics | AutomatedContentMetrics): number {
  // This is a simplified scoring algorithm - in production, this would be more sophisticated
  const viewWeight = 0.1;
  const editWeight = 0.2;
  const saveWeight = 0.4;
  const shareWeight = 0.3;
  
  // Calculate relative rates
  const viewRate = metrics.views / metrics.clicks;
  const editRate = metrics.edits / metrics.views;
  const saveRate = metrics.saves / metrics.edits;
  const shareRate = metrics.shares / metrics.views;
  
  // Calculate score (0-100)
  return Math.min(100, Math.round(
    (viewRate * viewWeight * 100) +
    (editRate * editWeight * 100) +
    (saveRate * saveWeight * 100) +
    (shareRate * shareWeight * 100)
  ));
}

/**
 * Determine a qualitative performance rating based on conversion rate
 * 
 * @param conversionRate - The conversion rate percentage
 */
function determinePerformance(conversionRate: number): 'high' | 'medium' | 'low' {
  if (conversionRate >= 20) {
    return 'high';
  } else if (conversionRate >= 10) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate insights based on comparison data
 */
function generateInsights(
  expertCount: number,
  automatedCount: number,
  clickRateDelta: number,
  viewToEditRateDelta: number,
  editToSaveRateDelta: number,
  conversionRateDelta: number,
  shareRateDelta: number,
  engagementTimeDelta: number
): string[] {
  const insights: string[] = [];
  
  // Sample size insight
  insights.push(`Analysis based on ${expertCount} expert-created templates and ${automatedCount} AI-generated templates.`);
  
  // Conversion rate insight
  if (conversionRateDelta > 5) {
    insights.push(`Expert-created content shows ${conversionRateDelta.toFixed(1)}% higher overall conversion rates.`);
  } else if (conversionRateDelta < -5) {
    insights.push(`AI-generated content shows ${Math.abs(conversionRateDelta).toFixed(1)}% higher overall conversion rates.`);
  } else {
    insights.push(`Expert and AI-created content show similar overall conversion rates (${Math.abs(conversionRateDelta).toFixed(1)}% difference).`);
  }
  
  // Engagement insight
  if (viewToEditRateDelta > 5) {
    insights.push(`Users are ${viewToEditRateDelta.toFixed(1)}% more likely to edit a template after viewing expert-created content.`);
  } else if (viewToEditRateDelta < -5) {
    insights.push(`Users are ${Math.abs(viewToEditRateDelta).toFixed(1)}% more likely to edit a template after viewing AI-generated content.`);
  }
  
  // Completion insight
  if (editToSaveRateDelta > 5) {
    insights.push(`Users are ${editToSaveRateDelta.toFixed(1)}% more likely to save after editing expert-created templates.`);
  } else if (editToSaveRateDelta < -5) {
    insights.push(`Users are ${Math.abs(editToSaveRateDelta).toFixed(1)}% more likely to save after editing AI-generated templates.`);
  }
  
  // Sharing insight
  if (shareRateDelta > 3) {
    insights.push(`Expert-created content is shared ${shareRateDelta.toFixed(1)}% more frequently than AI-generated content.`);
  } else if (shareRateDelta < -3) {
    insights.push(`AI-generated content is shared ${Math.abs(shareRateDelta).toFixed(1)}% more frequently than expert-created content.`);
  }
  
  // Time engagement insight
  if (engagementTimeDelta > 10) {
    insights.push(`Users spend ${engagementTimeDelta.toFixed(0)} seconds longer on average with expert-created content.`);
  } else if (engagementTimeDelta < -10) {
    insights.push(`Users spend ${Math.abs(engagementTimeDelta).toFixed(0)} seconds longer on average with AI-generated content.`);
  }
  
  return insights;
}

/**
 * Tag a template as expert or automated content
 * 
 * @param templateId - The template ID
 * @param isExpert - Whether this is expert-created content
 * @param creatorId - The ID of the creator (expert or AI model)
 */
export async function tagTemplateSource(
  templateId: string,
  isExpert: boolean,
  creatorId: string,
  notes?: string
): Promise<boolean> {
  try {
    const templateRef = doc(db, 'templates', templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      console.error(`Template ${templateId} not found`);
      return false;
    }
    
    await updateDoc(templateRef, {
      isExpertCreated: isExpert,
      creatorId: creatorId,
      creatorNotes: notes || null,
      sourceType: isExpert ? 'expert' : 'automated',
      metadata: {
        ...templateDoc.data().metadata,
        sourceTaggedAt: serverTimestamp(),
        sourceTaggedBy: 'system'
      }
    });
    
    // Add to the appropriate collection for optimization
    if (isExpert) {
      await addDoc(collection(db, 'expertContentIndex'), {
        templateId,
        expertId: creatorId,
        createdAt: serverTimestamp(),
        notes
      });
    } else {
      await addDoc(collection(db, 'automatedContentIndex'), {
        templateId,
        generatorId: creatorId,
        createdAt: serverTimestamp(),
        notes
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error tagging template source:', error);
    return false;
  }
} 