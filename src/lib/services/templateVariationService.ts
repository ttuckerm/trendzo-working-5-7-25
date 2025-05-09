import { v4 as uuidv4 } from 'uuid';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit as firestoreLimit,
  Firestore 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Template, TemplateVariation, VariationType } from '@/lib/types/template';

const VARIATIONS_COLLECTION = 'template_variations';

// In development mode, db might be null if Firebase failed to initialize
// We'll handle this by creating a type-safe reference
const firestore = db as Firestore | null;

// Helper function to get a safe Firestore instance
function getFirestore(): Firestore {
  if (!firestore) {
    throw new Error('Firestore is not initialized. This might happen in development mode.');
  }
  return firestore;
}

/**
 * Creates a new variation of a template
 */
export async function createTemplateVariation(
  originalTemplateId: string,
  template: Template,
  variationType: VariationType,
  userId: string,
  name?: string,
  description?: string
): Promise<string> {
  try {
    const db = getFirestore();
    // Get a reference to the original template to base the variation on
    const originalTemplateRef = doc(db, 'templates', originalTemplateId);
    const originalTemplateSnap = await getDoc(originalTemplateRef);
    
    if (!originalTemplateSnap.exists()) {
      throw new Error('Original template not found');
    }
    
    // Mark template as a variation and set parent reference
    template.isVariation = true;
    template.parentTemplateId = originalTemplateId;
    
    // Create variation document
    const variation: Omit<TemplateVariation, 'id'> = {
      originalTemplateId,
      name: name || `${template.name} Variation`,
      description: description || `${variationType} variation of ${template.name}`,
      variationType,
      template,
      createdAt: new Date().toISOString(),
      userId,
      isPublished: false,
      performancePrediction: {
        expectedEngagement: 0,
        confidenceScore: 0,
        improvedMetrics: []
      }
    };
    
    const docRef = await addDoc(collection(db, VARIATIONS_COLLECTION), variation);
    return docRef.id;
  } catch (error) {
    console.error('Error creating template variation:', error);
    throw error;
  }
}

/**
 * Gets all variations of a specific template
 */
export async function getTemplateVariations(
  originalTemplateId: string,
  userId?: string
): Promise<TemplateVariation[]> {
  try {
    const db = getFirestore();
    // Base query to get variations of a specific template
    let variationsQuery = query(
      collection(db, VARIATIONS_COLLECTION),
      where('originalTemplateId', '==', originalTemplateId),
      orderBy('createdAt', 'desc')
    );
    
    // If userId is provided, filter to only their variations
    if (userId) {
      variationsQuery = query(
        variationsQuery,
        where('userId', '==', userId)
      );
    }
    
    const variationsSnapshot = await getDocs(variationsQuery);
    
    return variationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TemplateVariation));
  } catch (error) {
    console.error('Error getting template variations:', error);
    throw error;
  }
}

/**
 * Gets all variations created by a specific user
 */
export async function getUserVariations(
  userId: string,
  limitCount = 100
): Promise<TemplateVariation[]> {
  try {
    const db = getFirestore();
    // Query to get variations for a specific user
    const variationsQuery = query(
      collection(db, VARIATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );
    
    const variationsSnapshot = await getDocs(variationsQuery);
    
    return variationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TemplateVariation));
  } catch (error) {
    console.error('Error getting user variations:', error);
    throw error;
  }
}

/**
 * Gets a specific template variation
 */
export async function getTemplateVariation(variationId: string): Promise<TemplateVariation | null> {
  try {
    const db = getFirestore();
    const variationDoc = await getDoc(doc(db, VARIATIONS_COLLECTION, variationId));
    
    if (!variationDoc.exists()) {
      return null;
    }
    
    return {
      id: variationDoc.id,
      ...variationDoc.data()
    } as TemplateVariation;
  } catch (error) {
    console.error('Error getting template variation:', error);
    throw error;
  }
}

/**
 * Updates an existing template variation
 */
export async function updateTemplateVariation(
  variationId: string,
  updates: Partial<TemplateVariation>
): Promise<void> {
  try {
    const db = getFirestore();
    await updateDoc(doc(db, VARIATIONS_COLLECTION, variationId), updates);
  } catch (error) {
    console.error('Error updating template variation:', error);
    throw error;
  }
}

/**
 * Deletes a template variation
 */
export async function deleteTemplateVariation(variationId: string): Promise<void> {
  try {
    const db = getFirestore();
    await deleteDoc(doc(db, VARIATIONS_COLLECTION, variationId));
  } catch (error) {
    console.error('Error deleting template variation:', error);
    throw error;
  }
}

/**
 * Generates performance prediction for a template variation
 */
export async function generatePerformancePrediction(
  originalTemplate: Template,
  variationTemplate: Template,
  variationType: VariationType
): Promise<TemplateVariation['performancePrediction']> {
  try {
    // In a real implementation, this would call an AI model or service
    // For now, we'll generate a simple mock prediction
    
    const baseEngagement = 0.15; // 15% base engagement rate
    const improvements: string[] = [];
    
    // Generate different predictions based on variation type
    let expectedEngagement = baseEngagement;
    let confidenceScore = 0.7; // Base confidence score
    
    switch (variationType) {
      case 'structure':
        expectedEngagement += 0.05; // Structure variations might improve by 5%
        improvements.push('Video pacing', 'Viewer retention');
        confidenceScore = 0.75;
        break;
      case 'tone':
        expectedEngagement += 0.03; // Tone adjustments might improve by 3%
        improvements.push('Viewer sentiment', 'Brand alignment');
        confidenceScore = 0.8;
        break;
      case 'optimize':
        expectedEngagement += 0.08; // Optimizations might improve by 8%
        improvements.push('Click-through rate', 'Conversion');
        confidenceScore = 0.85;
        break;
      default:
        expectedEngagement += 0.02;
        improvements.push('General performance');
        confidenceScore = 0.65;
    }
    
    // Add a little randomness to make predictions more varied
    expectedEngagement *= (0.9 + Math.random() * 0.2); // 90-110% of calculated value
    
    return {
      expectedEngagement,
      confidenceScore,
      improvedMetrics: improvements
    };
  } catch (error) {
    console.error('Error generating performance prediction:', error);
    throw error;
  }
}

/**
 * Promotes a variation to a standalone template
 */
export async function promoteVariationToTemplate(
  variationId: string,
  userId: string
): Promise<string> {
  try {
    // Get the variation
    const variation = await getTemplateVariation(variationId);
    
    if (!variation) {
      throw new Error('Variation not found');
    }
    
    const db = getFirestore();
    
    // Create a new template
    const newTemplate = { ...variation.template };
    newTemplate.isVariation = false; // No longer a variation
    newTemplate.parentTemplateId = undefined;
    newTemplate.createdAt = new Date().toISOString();
    newTemplate.updatedAt = new Date().toISOString();
    newTemplate.views = 0;
    newTemplate.usageCount = 0;
    
    // Add the template to the templates collection
    const docRef = await addDoc(collection(db, 'templates'), newTemplate);
    
    // Update the variation to mark it as promoted
    await updateTemplateVariation(variationId, {
      isPublished: true
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error promoting variation to template:', error);
    throw error;
  }
} 