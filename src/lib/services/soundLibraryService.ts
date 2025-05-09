import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Firestore,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { 
  Sound, 
  SavedSound, 
  SoundUsageHistory, 
  SoundPerformance, 
  SoundCategory,
  SaveSoundRequest,
  UpdateSavedSoundRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  TrackSoundUsageRequest
} from '@/lib/types/sound';

// Collection names
const SAVED_SOUNDS_COLLECTION = 'savedSounds';
const USAGE_HISTORY_COLLECTION = 'soundUsageHistory';
const PERFORMANCE_COLLECTION = 'soundPerformance';
const CATEGORIES_COLLECTION = 'soundCategories';
const SOUNDS_COLLECTION = 'sounds';

// Helper function to check if Firestore is initialized
function getFirestore(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db as Firestore;
}

// Helper function to generate unique IDs
const generateId = () => {
  const firestore = getFirestore();
  return doc(collection(firestore, 'temp')).id;
};

/**
 * Save a sound to user's library
 */
export async function saveSound(userId: string, data: SaveSoundRequest): Promise<SavedSound> {
  try {
    const firestore = getFirestore();
    
    // Check if sound exists
    const soundRef = doc(firestore, SOUNDS_COLLECTION, data.soundId);
    const soundDoc = await getDoc(soundRef);
    
    if (!soundDoc.exists()) {
      throw new Error(`Sound with ID ${data.soundId} not found`);
    }
    
    const soundData = soundDoc.data() as Sound;
    
    // Check if sound is already saved by user
    const savedSoundsRef = collection(firestore, SAVED_SOUNDS_COLLECTION);
    const q = query(
      savedSoundsRef, 
      where('userId', '==', userId),
      where('soundId', '==', data.soundId)
    );
    
    const savedSoundsSnapshot = await getDocs(q);
    
    // If sound already exists, update it
    if (!savedSoundsSnapshot.empty) {
      const savedSoundDoc = savedSoundsSnapshot.docs[0];
      const savedSoundId = savedSoundDoc.id;
      
      const updateData: Partial<SavedSound> = {
        updatedAt: Timestamp.now(),
      };
      
      if (data.isFavorite !== undefined) {
        updateData.isFavorite = data.isFavorite;
      }
      
      if (data.customCategories !== undefined) {
        updateData.customCategories = data.customCategories;
      }
      
      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }
      
      await updateDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, savedSoundId), updateData);
      
      // Get updated document
      const updatedDoc = await getDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, savedSoundId));
      const updatedData = updatedDoc.data();
      return { ...updatedData, id: savedSoundId } as SavedSound;
    }
    
    // Create new saved sound
    const now = Timestamp.now();
    const newSavedSoundId = generateId();

    // Create a clean sound object without the id property
    const { id: soundDocId, ...soundDataWithoutId } = soundData;
    const soundObj = { 
      id: soundDocId, 
      ...soundDataWithoutId 
    };

    const newSavedSound: SavedSound = {
      id: newSavedSoundId,
      soundId: data.soundId,
      userId,
      sound: soundObj,
      isFavorite: data.isFavorite ?? false,
      customCategories: data.customCategories ?? [],
      notes: data.notes,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, newSavedSoundId), newSavedSound);
    
    // Update category counts if applicable
    if (data.customCategories && data.customCategories.length > 0) {
      for (const categoryName of data.customCategories) {
        // Find the category
        const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
        const categoryQuery = query(
          categoriesRef,
          where('userId', '==', userId),
          where('name', '==', categoryName)
        );
        
        const categorySnapshot = await getDocs(categoryQuery);
        
        // If category exists, increment count
        if (!categorySnapshot.empty) {
          const categoryDoc = categorySnapshot.docs[0];
          await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
            soundCount: increment(1),
            updatedAt: Timestamp.now()
          });
        }
      }
    }
    
    return newSavedSound;
  } catch (error) {
    console.error('Error saving sound:', error);
    throw error;
  }
}

/**
 * Update a saved sound
 */
export async function updateSavedSound(userId: string, data: UpdateSavedSoundRequest): Promise<SavedSound> {
  try {
    const firestore = getFirestore();
    
    // Get the saved sound doc
    const savedSoundRef = doc(firestore, SAVED_SOUNDS_COLLECTION, data.savedSoundId);
    const savedSoundDoc = await getDoc(savedSoundRef);
    
    if (!savedSoundDoc.exists()) {
      throw new Error(`Saved sound with ID ${data.savedSoundId} not found`);
    }
    
    const savedSound = savedSoundDoc.data() as SavedSound;
    
    // Check if user owns this saved sound
    if (savedSound.userId !== userId) {
      throw new Error('You do not have permission to update this saved sound');
    }
    
    // Get old categories for comparison
    const oldCategories = savedSound.customCategories || [];
    const newCategories = data.customCategories;
    
    // Update the document
    const updateData: Partial<SavedSound> = {
      updatedAt: Timestamp.now(),
    };
    
    if (data.isFavorite !== undefined) {
      updateData.isFavorite = data.isFavorite;
    }
    
    if (data.customCategories !== undefined) {
      updateData.customCategories = data.customCategories;
    }
    
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    
    await updateDoc(savedSoundRef, updateData);
    
    // Update category counts if categories changed
    if (newCategories) {
      // Categories that were added (not in old, but in new)
      const addedCategories = newCategories.filter(cat => !oldCategories.includes(cat));
      
      // Categories that were removed (in old, but not in new)
      const removedCategories = oldCategories.filter(cat => !newCategories.includes(cat));
      
      // Handle category counts
      for (const categoryName of addedCategories) {
        const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
        const categoryQuery = query(
          categoriesRef,
          where('userId', '==', userId),
          where('name', '==', categoryName)
        );
        
        const categorySnapshot = await getDocs(categoryQuery);
        
        if (!categorySnapshot.empty) {
          const categoryDoc = categorySnapshot.docs[0];
          await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
            soundCount: increment(1),
            updatedAt: Timestamp.now()
          });
        }
      }
      
      for (const categoryName of removedCategories) {
        const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
        const categoryQuery = query(
          categoriesRef,
          where('userId', '==', userId),
          where('name', '==', categoryName)
        );
        
        const categorySnapshot = await getDocs(categoryQuery);
        
        if (!categorySnapshot.empty) {
          const categoryDoc = categorySnapshot.docs[0];
          await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
            soundCount: increment(-1),
            updatedAt: Timestamp.now()
          });
        }
      }
    }
    
    // Get updated document
    const updatedDoc = await getDoc(savedSoundRef);
    const updatedData = updatedDoc.data();
    return { ...updatedData, id: data.savedSoundId } as SavedSound;
  } catch (error) {
    console.error('Error updating saved sound:', error);
    throw error;
  }
}

/**
 * Remove a sound from user's library
 */
export async function removeSavedSound(userId: string, savedSoundId: string): Promise<void> {
  try {
    const firestore = getFirestore();
    
    // Get the saved sound doc
    const savedSoundRef = doc(firestore, SAVED_SOUNDS_COLLECTION, savedSoundId);
    const savedSoundDoc = await getDoc(savedSoundRef);
    
    if (!savedSoundDoc.exists()) {
      throw new Error(`Saved sound with ID ${savedSoundId} not found`);
    }
    
    const savedSound = savedSoundDoc.data() as SavedSound;
    
    // Check if user owns this saved sound
    if (savedSound.userId !== userId) {
      throw new Error('You do not have permission to remove this saved sound');
    }
    
    // Update category counts
    const categories = savedSound.customCategories || [];
    
    for (const categoryName of categories) {
      const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
      const categoryQuery = query(
        categoriesRef,
        where('userId', '==', userId),
        where('name', '==', categoryName)
      );
      
      const categorySnapshot = await getDocs(categoryQuery);
      
      if (!categorySnapshot.empty) {
        const categoryDoc = categorySnapshot.docs[0];
        await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
          soundCount: increment(-1),
          updatedAt: Timestamp.now()
        });
      }
    }
    
    // Delete the saved sound
    await deleteDoc(savedSoundRef);
  } catch (error) {
    console.error('Error removing saved sound:', error);
    throw error;
  }
}

/**
 * Get user's saved sounds with pagination
 */
export async function getSavedSounds(
  userId: string, 
  pageSize: number = 20, 
  lastVisible: string | null = null,
  filterOptions?: {
    categoryId?: string;
    isFavorite?: boolean;
  }
): Promise<{ savedSounds: SavedSound[]; lastVisible: string | null; hasMore: boolean }> {
  try {
    const firestore = getFirestore();
    
    const savedSoundsRef = collection(firestore, SAVED_SOUNDS_COLLECTION);
    let queryConstraints: any[] = [
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    ];
    
    // Add filter for favorites
    if (filterOptions?.isFavorite !== undefined) {
      queryConstraints.push(where('isFavorite', '==', filterOptions.isFavorite));
    }
    
    // Add filter for category (needs to be handled separately due to array contains)
    if (filterOptions?.categoryId) {
      // First get the category to get its name
      const categoryRef = doc(firestore, CATEGORIES_COLLECTION, filterOptions.categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (categoryDoc.exists()) {
        const category = categoryDoc.data() as SoundCategory;
        queryConstraints.push(where('customCategories', 'array-contains', category.name));
      }
    }
    
    // Handle pagination
    if (lastVisible) {
      const lastDoc = await getDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, lastVisible));
      if (lastDoc.exists()) {
        queryConstraints.push(startAfter(lastDoc));
      }
    }
    
    // Add limit
    queryConstraints.push(limit(pageSize));
    
    // Execute query
    const q = query(savedSoundsRef, ...queryConstraints);
    const savedSoundsSnapshot = await getDocs(q);
    
    // Format results
    const savedSounds = savedSoundsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, id: doc.id } as SavedSound;
    });
    
    const newLastVisible = savedSoundsSnapshot.docs.length > 0 
      ? savedSoundsSnapshot.docs[savedSoundsSnapshot.docs.length - 1].id 
      : null;
    
    const hasMore = savedSoundsSnapshot.docs.length === pageSize;
    
    return {
      savedSounds,
      lastVisible: newLastVisible,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching saved sounds:', error);
    throw error;
  }
}

/**
 * Create a new sound category
 */
export async function createCategory(userId: string, data: CreateCategoryRequest): Promise<SoundCategory> {
  try {
    const firestore = getFirestore();
    
    // Check if category with same name already exists
    const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
    const categoryQuery = query(
      categoriesRef,
      where('userId', '==', userId),
      where('name', '==', data.name)
    );
    
    const categorySnapshot = await getDocs(categoryQuery);
    
    if (!categorySnapshot.empty) {
      throw new Error(`A category with the name ${data.name} already exists`);
    }
    
    // Create the category
    const now = Timestamp.now();
    const newCategoryId = generateId();
    const newCategory: SoundCategory = {
      id: newCategoryId,
      userId,
      name: data.name,
      description: data.description || '',
      color: data.color || '#3B82F6', // Default to blue
      soundCount: 0,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(doc(firestore, CATEGORIES_COLLECTION, newCategoryId), newCategory);
    
    return newCategory;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update a sound category
 */
export async function updateCategory(userId: string, data: UpdateCategoryRequest): Promise<SoundCategory> {
  try {
    const firestore = getFirestore();
    
    // Get the category doc
    const categoryRef = doc(firestore, CATEGORIES_COLLECTION, data.categoryId);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      throw new Error(`Category with ID ${data.categoryId} not found`);
    }
    
    const category = categoryDoc.data() as SoundCategory;
    
    // Check if user owns this category
    if (category.userId !== userId) {
      throw new Error('You do not have permission to update this category');
    }
    
    // Check if the new name conflicts with another category
    if (data.name && data.name !== category.name) {
      const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
      const categoryQuery = query(
        categoriesRef,
        where('userId', '==', userId),
        where('name', '==', data.name)
      );
      
      const categorySnapshot = await getDocs(categoryQuery);
      
      if (!categorySnapshot.empty) {
        throw new Error(`A category with the name ${data.name} already exists`);
      }
      
      // If name is changing, we need to update all saved sounds with this category
      const savedSoundsRef = collection(firestore, SAVED_SOUNDS_COLLECTION);
      const savedSoundsQuery = query(
        savedSoundsRef,
        where('userId', '==', userId),
        where('customCategories', 'array-contains', category.name)
      );
      
      const savedSoundsSnapshot = await getDocs(savedSoundsQuery);
      
      // Update each saved sound with the new category name
      const batch = writeBatch(firestore);
      savedSoundsSnapshot.docs.forEach(doc => {
        const savedSound = doc.data() as SavedSound;
        const updatedCategories = savedSound.customCategories.map(cat => 
          cat === category.name ? data.name! : cat
        );
        
        batch.update(doc.ref, { 
          customCategories: updatedCategories,
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    }
    
    // Update the category
    const updateData: Partial<SoundCategory> = {
      updatedAt: Timestamp.now()
    };
    
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color) updateData.color = data.color;
    
    await updateDoc(categoryRef, updateData);
    
    // Get updated document
    const updatedDoc = await getDoc(categoryRef);
    const updatedData = updatedDoc.data();
    return { ...updatedData, id: data.categoryId } as SoundCategory;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete a sound category
 */
export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  try {
    const firestore = getFirestore();
    
    // Get the category doc
    const categoryRef = doc(firestore, CATEGORIES_COLLECTION, categoryId);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }
    
    const category = categoryDoc.data() as SoundCategory;
    
    // Check if user owns this category
    if (category.userId !== userId) {
      throw new Error('You do not have permission to delete this category');
    }
    
    // Remove this category from all saved sounds
    const savedSoundsRef = collection(firestore, SAVED_SOUNDS_COLLECTION);
    const savedSoundsQuery = query(
      savedSoundsRef,
      where('userId', '==', userId),
      where('customCategories', 'array-contains', category.name)
    );
    
    const savedSoundsSnapshot = await getDocs(savedSoundsQuery);
    
    // Update each saved sound to remove the category
    const batch = writeBatch(firestore);
    savedSoundsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        customCategories: arrayRemove(category.name),
        updatedAt: Timestamp.now()
      });
    });
    
    await batch.commit();
    
    // Delete the category
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

/**
 * Get user's sound categories
 */
export async function getCategories(userId: string): Promise<SoundCategory[]> {
  try {
    const firestore = getFirestore();
    
    const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
    const q = query(
      categoriesRef,
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    
    const categoriesSnapshot = await getDocs(q);
    
    return categoriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, id: doc.id } as SoundCategory;
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Track sound usage
 */
export async function trackSoundUsage(userId: string, data: TrackSoundUsageRequest): Promise<void> {
  try {
    const firestore = getFirestore();
    
    // Create a usage history record
    const now = Timestamp.now();
    const historyId = generateId();
    
    const historyRecord: SoundUsageHistory = {
      id: historyId,
      soundId: data.soundId,
      userId,
      templateId: data.templateId,
      templateName: data.templateName,
      timestamp: now,
      usageDuration: data.usageDuration,
      actionType: data.actionType
    };
    
    await setDoc(doc(firestore, USAGE_HISTORY_COLLECTION, historyId), historyRecord);
    
    // Update or create performance metrics
    const performanceRef = collection(firestore, PERFORMANCE_COLLECTION);
    const performanceQuery = query(
      performanceRef,
      where('userId', '==', userId),
      where('soundId', '==', data.soundId)
    );
    
    const performanceSnapshot = await getDocs(performanceQuery);
    
    if (performanceSnapshot.empty) {
      // Create new performance record
      const newPerformanceId = generateId();
      const newPerformance: SoundPerformance = {
        id: newPerformanceId,
        soundId: data.soundId,
        userId,
        playCount: data.actionType === 'played' ? 1 : 0,
        downloadCount: data.actionType === 'downloaded' ? 1 : 0,
        templateUsageCount: data.actionType === 'used_in_template' ? 1 : 0,
        shareCount: data.actionType === 'shared' ? 1 : 0,
        lastUsed: now,
        firstUsed: now,
        usageByTemplate: {}
      };
      
      // Add template usage if applicable
      if (data.templateId && data.actionType === 'used_in_template') {
        newPerformance.usageByTemplate[data.templateId] = {
          count: 1,
          lastUsed: now
        };
      }
      
      await setDoc(doc(firestore, PERFORMANCE_COLLECTION, newPerformanceId), newPerformance);
    } else {
      // Update existing performance record
      const performanceDoc = performanceSnapshot.docs[0];
      const performanceData = performanceDoc.data() as SoundPerformance;
      
      // Update counts based on action type
      const updateData: any = {
        lastUsed: now
      };
      
      if (data.actionType === 'played') {
        updateData.playCount = increment(1);
      } else if (data.actionType === 'downloaded') {
        updateData.downloadCount = increment(1);
      } else if (data.actionType === 'used_in_template') {
        updateData.templateUsageCount = increment(1);
      } else if (data.actionType === 'shared') {
        updateData.shareCount = increment(1);
      }
      
      // Update template usage if applicable
      if (data.templateId && data.actionType === 'used_in_template') {
        const templatePath = `usageByTemplate.${data.templateId}`;
        
        if (performanceData.usageByTemplate?.[data.templateId]) {
          updateData[`${templatePath}.count`] = increment(1);
          updateData[`${templatePath}.lastUsed`] = now;
        } else {
          updateData[templatePath] = {
            count: 1,
            lastUsed: now
          };
        }
      }
      
      await updateDoc(doc(firestore, PERFORMANCE_COLLECTION, performanceDoc.id), updateData);
    }
  } catch (error) {
    console.error('Error tracking sound usage:', error);
    throw error;
  }
}

/**
 * Get sound usage history
 */
export async function getSoundUsageHistory(
  userId: string,
  soundId?: string,
  limitCount: number = 50
): Promise<SoundUsageHistory[]> {
  try {
    const firestore = getFirestore();
    
    const historyRef = collection(firestore, USAGE_HISTORY_COLLECTION);
    let queryConstraints: any[] = [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ];
    
    // Add filter for specific sound if provided
    if (soundId) {
      queryConstraints.push(where('soundId', '==', soundId));
    }
    
    const q = query(historyRef, ...queryConstraints);
    const historySnapshot = await getDocs(q);
    
    return historySnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, id: doc.id } as SoundUsageHistory;
    });
  } catch (error) {
    console.error('Error fetching sound usage history:', error);
    throw error;
  }
}

/**
 * Get sound performance metrics
 */
export async function getSoundPerformance(userId: string, soundId: string): Promise<SoundPerformance | null> {
  try {
    const firestore = getFirestore();
    
    const performanceRef = collection(firestore, PERFORMANCE_COLLECTION);
    const performanceQuery = query(
      performanceRef,
      where('userId', '==', userId),
      where('soundId', '==', soundId)
    );
    
    const performanceSnapshot = await getDocs(performanceQuery);
    
    if (performanceSnapshot.empty) {
      return null;
    }
    
    const performanceDoc = performanceSnapshot.docs[0];
    const perfData = performanceDoc.data();
    return { ...perfData, id: performanceDoc.id } as SoundPerformance;
  } catch (error) {
    console.error('Error fetching sound performance:', error);
    throw error;
  }
}

/**
 * Get all user's sound performance metrics
 */
export async function getAllSoundPerformance(userId: string): Promise<SoundPerformance[]> {
  try {
    const firestore = getFirestore();
    
    const performanceRef = collection(firestore, PERFORMANCE_COLLECTION);
    const performanceQuery = query(
      performanceRef,
      where('userId', '==', userId),
      orderBy('lastUsed', 'desc')
    );
    
    const performanceSnapshot = await getDocs(performanceQuery);
    
    return performanceSnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, id: doc.id } as SoundPerformance;
    });
  } catch (error) {
    console.error('Error fetching all sound performance:', error);
    throw error;
  }
}

export const soundLibraryService = {
  saveSound,
  updateSavedSound,
  removeSavedSound,
  getSavedSounds,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  trackSoundUsage,
  getSoundUsageHistory,
  getSoundPerformance,
  getAllSoundPerformance
}; 