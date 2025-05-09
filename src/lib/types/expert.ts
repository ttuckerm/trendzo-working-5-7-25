import { Timestamp } from 'firebase/firestore';

/**
 * Expert profile interface with performance metrics
 */
export interface Expert {
  id: string;
  userId: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  joinedAt: string;
  isActive: boolean;
  specializations: string[];
  expertiseLevel: 'junior' | 'intermediate' | 'senior' | 'principal';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  
  // Performance metrics
  metrics: ExpertPerformanceMetrics;
  
  // Specialization areas with individual reliability scores
  specializationAreas: ExpertSpecializationArea[];
  
  // Record of recent activities
  recentActivity?: ExpertActivity[];
}

/**
 * Performance metrics for an expert
 */
export interface ExpertPerformanceMetrics {
  // Overall metrics
  totalAdjustments: number;
  successfulAdjustments: number;
  reliabilityScore: number; // 0-100 scale
  averageImpactScore: number; // Average impact of adjustments
  
  // Time-based metrics
  lastActivity?: string;
  activityFrequency?: number; // Average adjustments per week
  
  // Category performance
  categoryPerformance: Record<string, CategoryPerformance>;
  
  // Historical trend data
  reliabilityTrend?: Record<string, number>; // Date string -> score
  
  // Updated timestamp
  updatedAt: string;
}

/**
 * Performance for a specific category
 */
export interface CategoryPerformance {
  totalAdjustments: number;
  successfulAdjustments: number;
  reliabilityScore: number;
  averageImpactScore: number;
  lastUpdated: string;
}

/**
 * Expert specialization area with reliability score
 */
export interface ExpertSpecializationArea {
  id: string;
  name: string;
  description?: string;
  reliabilityScore: number; // 0-100 scale
  adjustmentCount: number;
  tags: string[];
  confidenceLevel: number; // 0-1 scale, expert's self-assessed confidence
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Expert activity record
 */
export interface ExpertActivity {
  id: string;
  expertId: string;
  type: 'adjustment' | 'verification' | 'review' | 'tag' | 'note';
  description: string;
  timestamp: string;
  templateId?: string;
  templateTitle?: string;
  category?: string;
  impactScore?: number;
  metadata?: Record<string, any>;
}

/**
 * Verification result for an expert adjustment
 */
export interface AdjustmentVerification {
  id: string;
  adjustmentId: string;
  templateId: string;
  expertId: string;
  verifiedAt: string;
  verifiedBy: string; // User ID or 'system'
  originalValue: any;
  adjustedValue: any;
  actualValue: any;
  improvementPercent: number;
  isAccurate: boolean;
  notes?: string;
  category?: string; // Category of the adjustment
} 