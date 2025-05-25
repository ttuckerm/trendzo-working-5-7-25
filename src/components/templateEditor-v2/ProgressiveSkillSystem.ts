/**
 * ProgressiveSkillSystem - Tracks user skill progression and unlocks features progressively
 * Implements Feature #5 (Progressive Skill Unlocks)
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillCategory = 'text' | 'layout' | 'animation' | 'audio' | 'design';

interface SkillAction {
  type: string;
  category: SkillCategory;
  complexity: number;  // 1-10 scale of action complexity
  timestamp: number;
}

interface SkillProgress {
  level: SkillLevel;
  points: number;
  actionsPerformed: {
    [category: string]: number;
  };
  featuresUsed: string[];
  completedTutorials: string[];
  lastLevelUp: number | null;
}

const SKILL_THRESHOLDS = {
  beginner: 0,
  intermediate: 100,
  advanced: 300,
  expert: 600
};

// Local storage key for persisting skill progress
const STORAGE_KEY = 'template-editor-skill-progress';

export class ProgressiveSkillSystem {
  private static instance: ProgressiveSkillSystem;
  private progress: SkillProgress;
  private actionHistory: SkillAction[] = [];
  
  constructor() {
    // Initialize with default progress or load from storage
    this.progress = this.loadProgress() || {
      level: 'beginner',
      points: 0,
      actionsPerformed: {
        text: 0,
        layout: 0,
        animation: 0,
        audio: 0,
        design: 0
      },
      featuresUsed: [],
      completedTutorials: [],
      lastLevelUp: null
    };
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ProgressiveSkillSystem {
    if (!ProgressiveSkillSystem.instance) {
      ProgressiveSkillSystem.instance = new ProgressiveSkillSystem();
    }
    return ProgressiveSkillSystem.instance;
  }
  
  /**
   * Track a user action and update skill progress
   */
  public trackAction(actionType: string, category: SkillCategory, complexity: number = 1): void {
    const action: SkillAction = {
      type: actionType,
      category,
      complexity,
      timestamp: Date.now()
    };
    
    this.actionHistory.push(action);
    
    // Update action count for this category
    this.progress.actionsPerformed[category] = (this.progress.actionsPerformed[category] || 0) + 1;
    
    // Award points based on action complexity
    this.addPoints(complexity);
    
    // Save progress
    this.saveProgress();
  }
  
  /**
   * Track a feature use
   */
  public trackFeatureUse(featureId: string): void {
    if (!this.progress.featuresUsed.includes(featureId)) {
      this.progress.featuresUsed.push(featureId);
      this.addPoints(3); // Award points for trying new features
    }
    
    this.saveProgress();
  }
  
  /**
   * Track a completed tutorial
   */
  public completeTutorial(tutorialId: string): void {
    if (!this.progress.completedTutorials.includes(tutorialId)) {
      this.progress.completedTutorials.push(tutorialId);
      this.addPoints(10); // Award points for completing tutorials
    }
    
    this.saveProgress();
  }
  
  /**
   * Get current skill level
   */
  public getSkillLevel(): SkillLevel {
    return this.progress.level;
  }
  
  /**
   * Get skill level for a specific category
   */
  public getCategorySkillLevel(category: SkillCategory): SkillLevel {
    const actionsInCategory = this.progress.actionsPerformed[category] || 0;
    
    if (actionsInCategory >= 100) return 'expert';
    if (actionsInCategory >= 50) return 'advanced';
    if (actionsInCategory >= 20) return 'intermediate';
    return 'beginner';
  }
  
  /**
   * Get progress details
   */
  public getProgress(): SkillProgress {
    return { ...this.progress };
  }
  
  /**
   * Check if a specific feature should be introduced to the user
   * based on their skill level and actions
   */
  public shouldIntroduceFeature(featureId: string): boolean {
    // If user has already used this feature, don't re-introduce
    if (this.progress.featuresUsed.includes(featureId)) {
      return false;
    }
    
    // Different features have different unlocking criteria
    switch (featureId) {
      case 'advancedTextEditing':
        return this.progress.actionsPerformed.text >= 15;
        
      case 'advancedAnimations':
        return this.progress.level !== 'beginner' && 
               this.progress.actionsPerformed.animation >= 10;
        
      case 'beatSyncedAnimations':
        return this.progress.level === 'advanced' || 
               this.progress.actionsPerformed.audio >= 5;
        
      case 'layerEffects':
        return this.progress.level !== 'beginner' && 
               this.progress.actionsPerformed.design >= 8;
        
      case 'templateVariations':
        return this.progress.level === 'advanced' || 
               this.progress.points >= 200;
        
      default:
        // For other features, introduce them based on overall skill level
        return this.progress.level !== 'beginner';
    }
  }
  
  /**
   * Get next recommended feature to introduce
   */
  public getNextRecommendedFeature(): string | null {
    const potentialFeatures = [
      'advancedTextEditing',
      'advancedAnimations',
      'beatSyncedAnimations',
      'layerEffects',
      'templateVariations'
    ];
    
    for (const feature of potentialFeatures) {
      if (this.shouldIntroduceFeature(feature)) {
        return feature;
      }
    }
    
    return null;
  }
  
  /**
   * Get next recommended tutorial based on user actions
   */
  public getNextRecommendedTutorial(): string | null {
    const completedTutorials = this.progress.completedTutorials;
    
    // Basic progression of tutorials
    const tutorialProgression = [
      'basicEditor',
      'textEditing',
      'imageUpload',
      'animations',
      'audioSync',
      'advancedEffects'
    ];
    
    // Find the first tutorial that hasn't been completed
    for (const tutorial of tutorialProgression) {
      if (!completedTutorials.includes(tutorial)) {
        return tutorial;
      }
    }
    
    return null;
  }
  
  /**
   * Reset all progress data (mainly for testing)
   */
  public resetProgress(): void {
    this.progress = {
      level: 'beginner',
      points: 0,
      actionsPerformed: {
        text: 0,
        layout: 0,
        animation: 0,
        audio: 0,
        design: 0
      },
      featuresUsed: [],
      completedTutorials: [],
      lastLevelUp: null
    };
    
    this.actionHistory = [];
    this.saveProgress();
  }
  
  /**
   * Add skill points and check for level up
   */
  private addPoints(points: number): void {
    const oldLevel = this.progress.level;
    this.progress.points += points;
    
    // Check for level up
    const newLevel = this.calculateLevel();
    
    if (newLevel !== oldLevel) {
      this.progress.level = newLevel;
      this.progress.lastLevelUp = Date.now();
      
      // Trigger any level up actions
      this.onLevelUp(oldLevel, newLevel);
    }
  }
  
  /**
   * Calculate skill level based on points
   */
  private calculateLevel(): SkillLevel {
    const points = this.progress.points;
    
    if (points >= SKILL_THRESHOLDS.expert) return 'expert';
    if (points >= SKILL_THRESHOLDS.advanced) return 'advanced';
    if (points >= SKILL_THRESHOLDS.intermediate) return 'intermediate';
    return 'beginner';
  }
  
  /**
   * Handle level up events
   */
  private onLevelUp(oldLevel: SkillLevel, newLevel: SkillLevel): void {
    console.log(`User leveled up from ${oldLevel} to ${newLevel}!`);
    
    // This would trigger UI notifications, etc.
    const levelUpEvent = new CustomEvent('skill-level-up', { 
      detail: { oldLevel, newLevel } 
    });
    
    // Dispatch event for other components to react
    window.dispatchEvent(levelUpEvent);
  }
  
  /**
   * Save progress to localStorage
   */
  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (error) {
      console.error('Failed to save skill progress:', error);
    }
  }
  
  /**
   * Load progress from localStorage
   */
  private loadProgress(): SkillProgress | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as SkillProgress;
      }
    } catch (error) {
      console.error('Failed to load skill progress:', error);
    }
    
    return null;
  }
} 