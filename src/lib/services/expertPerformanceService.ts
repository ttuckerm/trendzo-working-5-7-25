import { v4 as uuidv4 } from 'uuid';
import { 
  doc, 
  collection,
  getDoc, 
  getDocs,
  updateDoc, 
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  Firestore,
  arrayUnion,
  increment,
  FieldValue
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { 
  Expert, 
  ExpertPerformanceMetrics, 
  ExpertSpecializationArea,
  AdjustmentVerification,
  ExpertActivity 
} from '@/lib/types/expert';
import { ManualAdjustmentLog } from '@/lib/types/trendingTemplate';
import { logETLEvent, ETLLogLevel } from '@/lib/utils/etlLogger';

/**
 * Service for tracking and managing expert performance metrics
 */
export const expertPerformanceService = {
  /**
   * Get expert profile with performance metrics
   * @param expertId Expert ID
   * @returns Expert profile with performance metrics or null if not found
   */
  async getExpertProfile(expertId: string): Promise<Expert | null> {
    try {
      const expertRef = doc(db as Firestore, 'experts', expertId);
      const expertDoc = await getDoc(expertRef);
      
      if (!expertDoc.exists()) {
        return null;
      }
      
      return expertDoc.data() as Expert;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error fetching expert profile', {
        expertId,
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Create a new expert profile
   * @param expertData Basic expert information
   * @returns Created expert profile
   */
  async createExpertProfile(expertData: {
    userId: string;
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
    specializations: string[];
  }): Promise<Expert> {
    try {
      const expertId = `expert-${uuidv4()}`;
      const timestamp = new Date().toISOString();
      
      // Initialize empty performance metrics
      const initialMetrics: ExpertPerformanceMetrics = {
        totalAdjustments: 0,
        successfulAdjustments: 0,
        reliabilityScore: 0,
        averageImpactScore: 0,
        categoryPerformance: {},
        updatedAt: timestamp
      };
      
      // Initialize specialization areas from the provided specializations
      const specializationAreas: ExpertSpecializationArea[] = expertData.specializations.map(spec => ({
        id: `spec-${uuidv4()}`,
        name: spec,
        reliabilityScore: 0,
        adjustmentCount: 0,
        tags: [spec],
        confidenceLevel: 0.5, // Default confidence level
        createdAt: timestamp,
        updatedAt: timestamp
      }));
      
      // Create expert document
      const expert: Expert = {
        id: expertId,
        userId: expertData.userId,
        name: expertData.name,
        email: expertData.email,
        bio: expertData.bio || '',
        avatar: expertData.avatar || '',
        joinedAt: timestamp,
        isActive: true,
        specializations: expertData.specializations,
        expertiseLevel: 'junior', // Default level for new experts
        verificationStatus: 'pending',
        metrics: initialMetrics,
        specializationAreas,
        recentActivity: []
      };
      
      await setDoc(doc(db as Firestore, 'experts', expertId), expert);
      
      // Also set the user role to expert
      await updateDoc(doc(db as Firestore, 'users', expertData.userId), {
        isExpert: true,
        expertId: expertId,
        updatedAt: serverTimestamp()
      });
      
      return expert;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error creating expert profile', {
        userId: expertData.userId,
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Record an expert activity and update performance metrics
   * @param activity Activity data
   * @returns Updated activity with ID
   */
  async recordActivity(activity: Omit<ExpertActivity, 'id'>): Promise<ExpertActivity> {
    try {
      const activityId = `activity-${uuidv4()}`;
      const activityWithId: ExpertActivity = {
        ...activity,
        id: activityId
      };
      
      // Add to activities collection
      await addDoc(collection(db as Firestore, 'expertActivities'), activityWithId);
      
      // Update expert's recent activity list
      await updateDoc(doc(db as Firestore, 'experts', activity.expertId), {
        recentActivity: arrayUnion(activityWithId),
        'metrics.lastActivity': activity.timestamp
      });
      
      return activityWithId;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error recording expert activity', {
        expertId: activity.expertId,
        type: activity.type,
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Record a verification of an expert's adjustment and update their performance metrics
   * @param verification Verification data
   * @returns Updated expert performance metrics
   */
  async recordAdjustmentVerification(verification: AdjustmentVerification): Promise<ExpertPerformanceMetrics> {
    try {
      const { expertId, adjustmentId, isAccurate, improvementPercent, category } = verification;
      
      // Add to verifications collection
      await addDoc(collection(db as Firestore, 'adjustmentVerifications'), {
        ...verification,
        createdAt: serverTimestamp()
      });
      
      // Get the expert document
      const expertRef = doc(db as Firestore, 'experts', expertId);
      const expertDoc = await getDoc(expertRef);
      
      if (!expertDoc.exists()) {
        throw new Error(`Expert with ID ${expertId} not found`);
      }
      
      const expert = expertDoc.data() as Expert;
      const metrics = expert.metrics;
      
      // Update total and successful adjustments
      metrics.totalAdjustments += 1;
      if (isAccurate) {
        metrics.successfulAdjustments += 1;
      }
      
      // Calculate new reliability score (percentage of successful adjustments)
      metrics.reliabilityScore = (metrics.successfulAdjustments / metrics.totalAdjustments) * 100;
      
      // Update average impact score
      const newTotalImpact = (metrics.averageImpactScore * (metrics.totalAdjustments - 1)) + improvementPercent;
      metrics.averageImpactScore = newTotalImpact / metrics.totalAdjustments;
      
      // Update category performance
      if (category) {
        if (!metrics.categoryPerformance[category]) {
          metrics.categoryPerformance[category] = {
            totalAdjustments: 0,
            successfulAdjustments: 0,
            reliabilityScore: 0,
            averageImpactScore: 0,
            lastUpdated: new Date().toISOString()
          };
        }
        
        const categoryPerf = metrics.categoryPerformance[category];
        categoryPerf.totalAdjustments += 1;
        if (isAccurate) {
          categoryPerf.successfulAdjustments += 1;
        }
        
        categoryPerf.reliabilityScore = (categoryPerf.successfulAdjustments / categoryPerf.totalAdjustments) * 100;
        
        const newCategoryTotalImpact = (categoryPerf.averageImpactScore * (categoryPerf.totalAdjustments - 1)) + improvementPercent;
        categoryPerf.averageImpactScore = newCategoryTotalImpact / categoryPerf.totalAdjustments;
        categoryPerf.lastUpdated = new Date().toISOString();
      }
      
      // Update reliabilityTrend
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      if (!metrics.reliabilityTrend) {
        metrics.reliabilityTrend = {};
      }
      metrics.reliabilityTrend[today] = metrics.reliabilityScore;
      
      // Update timestamp
      metrics.updatedAt = new Date().toISOString();
      
      // Update expert document
      await updateDoc(expertRef, {
        metrics: metrics
      });
      
      // Update specialization areas if category matches any
      const matchingSpecIndex = expert.specializationAreas.findIndex(spec => 
        spec.name === category || spec.tags.includes(category)
      );
      
      if (matchingSpecIndex >= 0) {
        const specializationAreas = [...expert.specializationAreas];
        specializationAreas[matchingSpecIndex].adjustmentCount += 1;
        specializationAreas[matchingSpecIndex].reliabilityScore = 
          metrics.categoryPerformance[category].reliabilityScore;
        specializationAreas[matchingSpecIndex].updatedAt = new Date().toISOString();
        
        await updateDoc(expertRef, {
          specializationAreas: specializationAreas
        });
      }
      
      // Record the verification activity
      await this.recordActivity({
        expertId,
        type: 'verification',
        description: `Adjustment verification: ${isAccurate ? 'accurate' : 'inaccurate'} (${Math.round(improvementPercent)}% improvement)`,
        timestamp: new Date().toISOString(),
        category,
        impactScore: improvementPercent,
        metadata: {
          verificationId: verification.id,
          adjustmentId: verification.adjustmentId,
          templateId: verification.templateId,
          isAccurate
        }
      });
      
      return metrics;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error recording adjustment verification', {
        expertId: verification.expertId,
        adjustmentId: verification.adjustmentId,
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Add a new specialization area for an expert
   * @param expertId Expert ID
   * @param specialization Specialization data
   * @returns Updated list of specialization areas
   */
  async addSpecializationArea(
    expertId: string,
    specialization: Omit<ExpertSpecializationArea, 'id' | 'createdAt' | 'updatedAt' | 'reliabilityScore' | 'adjustmentCount'>
  ): Promise<ExpertSpecializationArea[]> {
    try {
      const timestamp = new Date().toISOString();
      
      const newSpecialization: ExpertSpecializationArea = {
        ...specialization,
        id: `spec-${uuidv4()}`,
        reliabilityScore: 0,
        adjustmentCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      const expertRef = doc(db as Firestore, 'experts', expertId);
      const expertDoc = await getDoc(expertRef);
      
      if (!expertDoc.exists()) {
        throw new Error(`Expert with ID ${expertId} not found`);
      }
      
      const expert = expertDoc.data() as Expert;
      
      // Add to specialization areas
      const specializationAreas = [...expert.specializationAreas, newSpecialization];
      
      // Update specializations list
      const specializations = [...expert.specializations];
      if (!specializations.includes(newSpecialization.name)) {
        specializations.push(newSpecialization.name);
      }
      
      await updateDoc(expertRef, {
        specializationAreas,
        specializations
      });
      
      return specializationAreas;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error adding specialization area', {
        expertId,
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Calculate reliability score for an expert based on their adjustment history
   * @param expertId Expert ID
   * @returns Updated reliability score
   */
  async calculateReliabilityScore(expertId: string): Promise<number> {
    try {
      // Get all verified adjustments for this expert
      const verificationsQuery = query(
        collection(db as Firestore, 'adjustmentVerifications'),
        where('expertId', '==', expertId),
        orderBy('verifiedAt', 'desc')
      );
      
      const verificationsSnapshot = await getDocs(verificationsQuery);
      const verifications = verificationsSnapshot.docs.map(doc => doc.data() as AdjustmentVerification);
      
      if (verifications.length === 0) {
        return 0; // No verifications yet
      }
      
      // Count accurate adjustments
      const accurateCount = verifications.filter(v => v.isAccurate).length;
      
      // Calculate reliability score (percentage of accurate adjustments)
      const reliabilityScore = (accurateCount / verifications.length) * 100;
      
      // Update expert document
      await updateDoc(doc(db as Firestore, 'experts', expertId), {
        'metrics.reliabilityScore': reliabilityScore,
        'metrics.totalAdjustments': verifications.length,
        'metrics.successfulAdjustments': accurateCount,
        'metrics.updatedAt': new Date().toISOString()
      });
      
      return reliabilityScore;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error calculating reliability score', {
        expertId,
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Detect and update expert specialization areas based on successful adjustments
   * @param expertId Expert ID
   * @returns Updated specialization areas
   */
  async updateSpecializationAreas(expertId: string): Promise<ExpertSpecializationArea[]> {
    try {
      // Get the expert document
      const expertRef = doc(db as Firestore, 'experts', expertId);
      const expertDoc = await getDoc(expertRef);
      
      if (!expertDoc.exists()) {
        throw new Error(`Expert with ID ${expertId} not found`);
      }
      
      const expert = expertDoc.data() as Expert;
      
      // Get all verified adjustments for this expert
      const verificationsQuery = query(
        collection(db as Firestore, 'adjustmentVerifications'),
        where('expertId', '==', expertId),
        where('isAccurate', '==', true)
      );
      
      const verificationsSnapshot = await getDocs(verificationsQuery);
      const verifications = verificationsSnapshot.docs.map(doc => doc.data() as AdjustmentVerification);
      
      if (verifications.length === 0) {
        return expert.specializationAreas; // No successful adjustments yet
      }
      
      // Count adjustments by category
      const categoryAdjustments: Record<string, {count: number, totalImpact: number}> = {};
      
      verifications.forEach(verification => {
        const category = verification.category || 'other';
        if (!categoryAdjustments[category]) {
          categoryAdjustments[category] = { count: 0, totalImpact: 0 };
        }
        categoryAdjustments[category].count += 1;
        categoryAdjustments[category].totalImpact += verification.improvementPercent;
      });
      
      // Update existing specialization areas
      const specializationAreas = [...expert.specializationAreas];
      
      Object.entries(categoryAdjustments).forEach(([category, data]) => {
        const existingSpecIndex = specializationAreas.findIndex(spec => 
          spec.name === category || spec.tags.includes(category)
        );
        
        const avgImpact = data.totalImpact / data.count;
        const reliabilityScore = (data.count / verifications.length) * 100;
        
        if (existingSpecIndex >= 0) {
          // Update existing specialization
          specializationAreas[existingSpecIndex].adjustmentCount = data.count;
          specializationAreas[existingSpecIndex].reliabilityScore = reliabilityScore;
          specializationAreas[existingSpecIndex].updatedAt = new Date().toISOString();
        } else if (data.count >= 3) {
          // Create new specialization if there are at least 3 successful adjustments
          specializationAreas.push({
            id: `spec-${uuidv4()}`,
            name: category,
            description: `Auto-detected specialization in ${category}`,
            reliabilityScore: reliabilityScore,
            adjustmentCount: data.count,
            tags: [category],
            confidenceLevel: 0.7,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          // Also add to specializations list
          if (!expert.specializations.includes(category)) {
            expert.specializations.push(category);
          }
        }
      });
      
      // Update expert document
      await updateDoc(expertRef, {
        specializationAreas,
        specializations: expert.specializations
      });
      
      return specializationAreas;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error updating specialization areas', {
        expertId,
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Get top performing experts by reliability score
   * @param limit Maximum number of experts to return
   * @returns List of top experts with their performance metrics
   */
  async getTopExperts(maxResults: number = 10): Promise<Expert[]> {
    try {
      const expertsQuery = query(
        collection(db as Firestore, 'experts'),
        where('isActive', '==', true),
        where('metrics.totalAdjustments', '>', 0),
        orderBy('metrics.reliabilityScore', 'desc'),
        limit(maxResults)
      );
      
      const expertsSnapshot = await getDocs(expertsQuery);
      return expertsSnapshot.docs.map(doc => doc.data() as Expert);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error getting top experts', {
        error: errorMsg
      });
      throw error;
    }
  },
  
  /**
   * Get experts specialized in a specific category
   * @param category Category to match against
   * @param minReliability Minimum reliability score (0-100)
   * @returns List of matching experts
   */
  async getExpertsBySpecialization(
    category: string, 
    minReliability: number = 0
  ): Promise<Expert[]> {
    try {
      const expertsQuery = query(
        collection(db as Firestore, 'experts'),
        where('specializations', 'array-contains', category),
        where('isActive', '==', true)
      );
      
      const expertsSnapshot = await getDocs(expertsQuery);
      let experts = expertsSnapshot.docs.map(doc => doc.data() as Expert);
      
      // Filter by reliability score if needed
      if (minReliability > 0) {
        experts = experts.filter(expert => {
          // Check if they have a specialization area for this category
          const specialization = expert.specializationAreas.find(spec => 
            spec.name === category || spec.tags.includes(category)
          );
          
          if (specialization) {
            return specialization.reliabilityScore >= minReliability;
          }
          
          // Fall back to overall reliability score
          return expert.metrics.reliabilityScore >= minReliability;
        });
      }
      
      // Sort by reliability score (higher first)
      experts.sort((a, b) => {
        const getReliability = (expert: Expert) => {
          const specialization = expert.specializationAreas.find(spec => 
            spec.name === category || spec.tags.includes(category)
          );
          return specialization ? specialization.reliabilityScore : expert.metrics.reliabilityScore;
        };
        
        return getReliability(b) - getReliability(a);
      });
      
      return experts;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logETLEvent(ETLLogLevel.ERROR, 'Error getting experts by specialization', {
        category,
        error: errorMsg
      });
      throw error;
    }
  }
}; 