/**
 * Platform State Management
 * 
 * Central state that follows users across the application.
 * Uses a simple observer pattern without external dependencies.
 */

// Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  hasCompletedOnboarding: boolean;
  videosCreated: number;
  avgDPS: number;
  successRate: number;
  level: 'beginner' | 'intermediate' | 'expert';
  createdAt: string;
}

export interface WorkflowData {
  // Research Phase
  niche?: string;
  targetAudience?: {
    age: string;
    interests: string[];
    painPoints: string[];
  };
  contentPurpose?: 'know' | 'like' | 'trust';
  
  // Plan Phase
  goldenPillar?: 'education' | 'entertainment' | 'inspiration' | 'validation';
  seoKeywords?: {
    primary: string;
    alternate: string[];
  };
  fourByFour?: {
    hook: string;
    proof: string;
    value: string;
    cta: string;
  };
  
  // Create Phase
  creationMethod?: 'ai' | 'film';
  videoTitle?: string;
  videoDescription?: string;
  selectedTemplate?: string;
  
  // Optimize Phase
  optimizationScore?: number;
  aiRecommendations?: string[];
  
  // Publish Phase
  scheduledPlatforms?: string[];
  scheduledTime?: string;
  
  // Meta
  currentPhase?: string;
  lastUpdated?: string;
}

export interface PredictionResult {
  dps: number;
  confidence: number;
  viralPotential: 'low' | 'medium' | 'high' | 'mega-viral';
  componentsUsed: string[];
  recommendations: string[];
  timestamp: string;
}

// Simple observable implementation
type Listener<T> = (value: T) => void;

class SimpleSubject<T> {
  private value: T;
  private listeners: Set<Listener<T>> = new Set();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  getValue(): T {
    return this.value;
  }

  next(value: T): void {
    this.value = value;
    this.listeners.forEach(listener => listener(value));
  }

  subscribe(listener: Listener<T>): { unsubscribe: () => void } {
    this.listeners.add(listener);
    // Immediately emit current value
    listener(this.value);
    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      }
    };
  }
}

// Singleton class for global state management
class PlatformStateManager {
  private static instance: PlatformStateManager;
  
  // Global state observables
  public currentDPS: SimpleSubject<number>;
  public workflowData: SimpleSubject<WorkflowData>;
  public userProfile: SimpleSubject<UserProfile | null>;
  public lastPrediction: SimpleSubject<PredictionResult | null>;
  public isLoading: SimpleSubject<boolean>;
  
  private constructor() {
    // Initialize with default values
    this.currentDPS = new SimpleSubject<number>(0);
    this.workflowData = new SimpleSubject<WorkflowData>({});
    this.userProfile = new SimpleSubject<UserProfile | null>(null);
    this.lastPrediction = new SimpleSubject<PredictionResult | null>(null);
    this.isLoading = new SimpleSubject<boolean>(false);
    
    // Restore from localStorage if available
    if (typeof window !== 'undefined') {
      this.restoreProgress();
    }
  }
  
  public static getInstance(): PlatformStateManager {
    if (!PlatformStateManager.instance) {
      PlatformStateManager.instance = new PlatformStateManager();
    }
    return PlatformStateManager.instance;
  }
  
  // Update DPS and trigger prediction if needed
  async updateDPS(data: Partial<WorkflowData>): Promise<void> {
    const merged = { ...this.workflowData.getValue(), ...data, lastUpdated: new Date().toISOString() };
    this.workflowData.next(merged);
    
    // Calculate DPS based on filled fields (simple heuristic)
    const filledFields = Object.values(merged).filter(v => v !== undefined && v !== '').length;
    const baseDPS = Math.min(100, filledFields * 5);
    
    // Add bonuses for key fields
    let bonus = 0;
    if (merged.fourByFour?.hook) bonus += 10;
    if (merged.goldenPillar) bonus += 5;
    if (merged.seoKeywords?.primary) bonus += 5;
    if (merged.contentPurpose) bonus += 5;
    
    const newDPS = Math.min(100, baseDPS + bonus);
    this.currentDPS.next(newDPS);
    
    // Auto-save
    this.saveProgress();
  }
  
  // Set full workflow data
  setWorkflowData(data: WorkflowData): void {
    this.workflowData.next({ ...data, lastUpdated: new Date().toISOString() });
    this.saveProgress();
  }
  
  // Update user profile
  setUserProfile(profile: UserProfile | null): void {
    this.userProfile.next(profile);
    if (profile && typeof window !== 'undefined') {
      localStorage.setItem('user_profile', JSON.stringify(profile));
    }
  }
  
  // Store prediction result
  setPrediction(prediction: PredictionResult): void {
    this.lastPrediction.next(prediction);
    this.currentDPS.next(prediction.dps);
    this.saveProgress();
  }
  
  // Reset workflow (start fresh)
  resetWorkflow(): void {
    this.workflowData.next({});
    this.currentDPS.next(0);
    this.lastPrediction.next(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('workflow_progress');
    }
  }
  
  // Persist progress to localStorage
  saveProgress(): void {
    if (typeof window === 'undefined') return;
    
    const state = {
      data: this.workflowData.getValue(),
      dps: this.currentDPS.getValue(),
      prediction: this.lastPrediction.getValue(),
      timestamp: Date.now()
    };
    
    localStorage.setItem('workflow_progress', JSON.stringify(state));
  }
  
  // Restore progress from localStorage
  restoreProgress(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('workflow_progress');
      if (saved) {
        const { data, dps, prediction } = JSON.parse(saved);
        if (data) this.workflowData.next(data);
        if (typeof dps === 'number') this.currentDPS.next(dps);
        if (prediction) this.lastPrediction.next(prediction);
      }
      
      const userSaved = localStorage.getItem('user_profile');
      if (userSaved) {
        this.userProfile.next(JSON.parse(userSaved));
      }
    } catch (e) {
      console.error('Failed to restore platform state:', e);
    }
  }
  
  // Get current experience level based on user activity
  getExperienceLevel(): 'beginner' | 'intermediate' | 'expert' {
    const profile = this.userProfile.getValue();
    if (!profile) return 'beginner';
    
    if (profile.videosCreated >= 20 && profile.avgDPS >= 70) return 'expert';
    if (profile.videosCreated >= 5) return 'intermediate';
    return 'beginner';
  }
  
  // Determine recommended workflow based on experience
  getRecommendedWorkflow(): string {
    const level = this.getExperienceLevel();
    const profile = this.userProfile.getValue();
    
    if (!profile?.hasCompletedOnboarding) return '/onboarding';
    if (profile.videosCreated === 0) return '/admin/workflows/quick-win';
    if (level === 'beginner') return '/admin/workflows/quick-win';
    if (level === 'intermediate') return '/studio/templates';
    return '/admin/studio';
  }
}

// Export singleton instance
export const platformState = PlatformStateManager.getInstance();

// React hook for using platform state
export function usePlatformState() {
  return platformState;
}

// Helper to subscribe to DPS changes
export function subscribeToDPS(callback: (dps: number) => void) {
  return platformState.currentDPS.subscribe(callback);
}

// Helper to subscribe to workflow changes
export function subscribeToWorkflow(callback: (data: WorkflowData) => void) {
  return platformState.workflowData.subscribe(callback);
}
