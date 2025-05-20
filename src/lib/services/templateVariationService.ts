import { v4 as uuidv4 } from 'uuid';
// import { 
//   collection, 
//   addDoc, 
//   getDocs, 
//   doc, 
//   getDoc, 
//   updateDoc, 
//   deleteDoc, 
//   query, 
//   where, 
//   orderBy,
//   limit as firestoreLimit,
//   Firestore 
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase/firebase'; // db will be null
import { Template, TemplateVariation, VariationType } from '@/lib/types/template';

const VARIATIONS_COLLECTION = 'template_variations';
const SERVICE_DISABLED_MSG = "templateVariationService: Firebase backend is removed. Method called but will not perform DB operations. TODO: Implement with Supabase.";

// In development mode, db might be null if Firebase failed to initialize
// We'll handle this by creating a type-safe reference
// const firestore = db as Firestore | null; // db is null

// Helper function to get a safe Firestore instance
// function getFirestore(): Firestore {
//   if (!firestore) {
//     throw new Error('Firestore is not initialized. This might happen in development mode.');
//   }
//   return firestore;
// }

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
  console.warn(`createTemplateVariation: ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const db = getFirestore();
  //   // Get a reference to the original template to base the variation on
  //   const originalTemplateRef = doc(db, 'templates', originalTemplateId);
  //   const originalTemplateSnap = await getDoc(originalTemplateRef);
    
  //   if (!originalTemplateSnap.exists()) {
  //     throw new Error('Original template not found');
  //   }
    
  //   // Mark template as a variation and set parent reference
  //   template.isVariation = true;
  //   template.parentTemplateId = originalTemplateId;
    
  //   // Create variation document
  //   const variation: Omit<TemplateVariation, 'id'> = {
  //     originalTemplateId,
  //     name: name || `${template.name} Variation`,
  //     description: description || `${variationType} variation of ${template.name}`,
  //     variationType,
  //     template,
  //     createdAt: new Date().toISOString(),
  //     userId,
  //     isPublished: false,
  //     performancePrediction: {
  //       expectedEngagement: 0,
  //       confidenceScore: 0,
  //       improvedMetrics: []
  //     }
  //   };
    
  //   const docRef = await addDoc(collection(db, VARIATIONS_COLLECTION), variation);
  //   return docRef.id;
  // } catch (error) {
  //   console.error('Error creating template variation:', error);
  //   throw error;
  // }
  return Promise.resolve(`mock-variation-id-${uuidv4()}`);
}

/**
 * Gets all variations of a specific template
 */
export async function getTemplateVariations(
  originalTemplateId: string,
  userId?: string
): Promise<TemplateVariation[]> {
  console.warn(`getTemplateVariations for ${originalTemplateId}: ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const db = getFirestore();
  //   // Base query to get variations of a specific template
  //   let variationsQuery = query(
  //     collection(db, VARIATIONS_COLLECTION),
  //     where('originalTemplateId', '==', originalTemplateId),
  //     orderBy('createdAt', 'desc')
  //   );
    
  //   // If userId is provided, filter to only their variations
  //   if (userId) {
  //     variationsQuery = query(
  //       variationsQuery,
  //       where('userId', '==', userId)
  //     );
  //   }
    
  //   const variationsSnapshot = await getDocs(variationsQuery);
    
  //   return variationsSnapshot.docs.map(doc => ({
  //     id: doc.id,
  //     ...doc.data()
  //   } as TemplateVariation));
  // } catch (error) {
  //   console.error('Error getting template variations:', error);
  //   throw error;
  // }
  return Promise.resolve([]);
}

/**
 * Gets all variations created by a specific user
 */
export async function getUserVariations(
  userId: string,
  limitCount = 100
): Promise<TemplateVariation[]> {
  console.warn(`getUserVariations for user ${userId}: ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const db = getFirestore();
  //   // Query to get variations for a specific user
  //   const variationsQuery = query(
  //     collection(db, VARIATIONS_COLLECTION),
  //     where('userId', '==', userId),
  //     orderBy('createdAt', 'desc'),
  //     firestoreLimit(limitCount)
  //   );
    
  //   const variationsSnapshot = await getDocs(variationsQuery);
    
  //   return variationsSnapshot.docs.map(doc => ({
  //     id: doc.id,
  //     ...doc.data()
  //   } as TemplateVariation));
  // } catch (error) {
  //   console.error('Error getting user variations:', error);
  //   throw error;
  // }
  return Promise.resolve([]);
}

/**
 * Gets a specific template variation
 */
export async function getTemplateVariation(variationId: string): Promise<TemplateVariation | null> {
  console.warn(`getTemplateVariation for ${variationId}: ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const db = getFirestore();
  //   const variationDoc = await getDoc(doc(db, VARIATIONS_COLLECTION, variationId));
    
  //   if (!variationDoc.exists()) {
  //     return null;
  //   }
    
  //   return {
  //     id: variationDoc.id,
  //     ...variationDoc.data()
  //   } as TemplateVariation;
  // } catch (error) {
  //   console.error('Error getting template variation:', error);
  //   throw error;
  // }
  return Promise.resolve(null);
}

/**
 * Updates an existing template variation
 */
export async function updateTemplateVariation(
  variationId: string,
  updates: Partial<TemplateVariation>
): Promise<void> {
  console.warn(`updateTemplateVariation for ${variationId}: ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const db = getFirestore();
  //   await updateDoc(doc(db, VARIATIONS_COLLECTION, variationId), updates);
  // } catch (error) {
  //   console.error('Error updating template variation:', error);
  //   throw error;
  // }
  return Promise.resolve();
}

/**
 * Deletes a template variation
 */
export async function deleteTemplateVariation(variationId: string): Promise<void> {
  console.warn(`deleteTemplateVariation for ${variationId}: ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const db = getFirestore();
  //   await deleteDoc(doc(db, VARIATIONS_COLLECTION, variationId));
  // } catch (error) {
  //   console.error('Error deleting template variation:', error);
  //   throw error;
  // }
  return Promise.resolve();
}

/**
 * Generates performance prediction for a template variation
 */
export async function generatePerformancePrediction(
  originalTemplate: Template,
  variationTemplate: Template,
  variationType: VariationType
): Promise<TemplateVariation['performancePrediction']> {
  // This function is a MOCK and does not use Firebase. It can be left as is.
  try {
    // In a real implementation, this would call an AI model or service
    // For now, we'll generate a simple mock prediction
    
    const baseScore = 0.15; // 15% base engagement score
    const improvements: string[] = [];
    
    // Generate different predictions based on variation type
    let score = baseScore;
    let confidence = 0.7; // Base confidence score
    
    switch (variationType) {
      case 'layout': // Changed from 'structure'
        score += 0.05; // Structure variations might improve by 5%
        improvements.push('Video pacing', 'Viewer retention');
        confidence = 0.75;
        break;
      case 'content': // Changed from 'tone'
        score += 0.03; // Tone adjustments might improve by 3%
        improvements.push('Viewer sentiment', 'Brand alignment');
        confidence = 0.8;
        break;
      case 'remix': // Changed from 'optimize' as an example, could also be 'timing' or other valid types
        score += 0.08; // Optimizations might improve by 8%
        improvements.push('Click-through rate', 'Conversion');
        confidence = 0.85;
        break;
      default: // Handles 'color', 'text', 'timing', and any other valid VariationType not explicitly cased
        score += 0.02;
        improvements.push('General performance');
        confidence = 0.65;
    }
    
    // Add a little randomness to make predictions more varied
    score *= (0.9 + Math.random() * 0.2); // 90-110% of calculated value
    
    return {
      score, // Changed from expectedEngagement
      confidence, // Changed from confidenceScore
      improvedMetrics: improvements
    };
  } catch (error) {
    console.error('Error generating performance prediction:', error);
    throw error;
  }
}

/**
 * Promotes a variation to a new main template
 * Copies the variation data to the main templates collection
 * Optionally deletes the original variation
 */
export async function promoteVariationToTemplate(
  variationId: string,
  userId: string // Assuming userId is needed for the new template ownership
  // deleteOriginalVariation = false // Optional: to delete the variation after promotion
): Promise<string> {
  console.warn(`promoteVariationToTemplate for variation ${variationId}: ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const db = getFirestore();
    
  //   // 1. Get the variation data
  //   const variationRef = doc(db, VARIATIONS_COLLECTION, variationId);
  //   const variationSnap = await getDoc(variationRef);
    
  //   if (!variationSnap.exists()) {
  //     throw new Error(`Variation with ID ${variationId} not found.`);
  //   }
    
  //   const variationData = variationSnap.data() as TemplateVariation;
    
  //   // 2. Prepare data for the new template
  //   //    This would involve taking variationData.template and ensuring it conforms to the main Template structure
  //   //    For simplicity, let's assume variationData.template is already a valid Template object.
  //   const newTemplateData: Template = {
  //     ...variationData.template,
  //     isVariation: false, // It's now a main template
  //     parentTemplateId: undefined, // No longer has a parent in the same way
  //     // originalVariationId: variationId, // Optional: to trace back to its origin
  //     createdAt: new Date().toISOString(), // Set new creation date
  //     updatedAt: new Date().toISOString(),
  //     createdBy: userId, // Assign ownership
  //     // Reset or re-evaluate any metrics like stats, trendData etc.
  //     stats: { views: 0, likes: 0, usageCount: 0 },
  //     trendData: { /* initial trend data */ }, 
  //   };

  //   // 3. Add the new template to the 'templates' collection
  //   const newTemplateRef = await addDoc(collection(db, 'templates'), newTemplateData);
    
  //   // 4. Optionally, delete the original variation
  //   // if (deleteOriginalVariation) {
  //   //   await deleteDoc(variationRef);
  //   // }
    
  //   return newTemplateRef.id;
  // } catch (error) {
  //   console.error(`Error promoting variation ${variationId} to template:`, error);
  //   throw error;
  // }
  return Promise.resolve(`mock-new-template-from-variation-${uuidv4()}`);
} 