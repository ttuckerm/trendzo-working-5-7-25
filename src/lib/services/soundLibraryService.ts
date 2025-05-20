// import { 
//   collection, 
//   doc, 
//   getDocs, 
//   getDoc, 
//   setDoc, 
//   updateDoc, 
//   deleteDoc, 
//   query, 
//   where, 
//   orderBy, 
//   limit, 
//   startAfter,
//   Timestamp,
//   arrayUnion,
//   arrayRemove,
//   increment,
//   Firestore,
//   writeBatch
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
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

const SERVICE_DISABLED_MSG = "soundLibraryService: Firebase backend has been removed. Method called but will not perform DB operations. TODO: Implement with Supabase.";

// Collection names (kept for context)
// const SAVED_SOUNDS_COLLECTION = 'savedSounds';
// const USAGE_HISTORY_COLLECTION = 'soundUsageHistory';
// const PERFORMANCE_COLLECTION = 'soundPerformance';
// const CATEGORIES_COLLECTION = 'soundCategories';
// const SOUNDS_COLLECTION = 'sounds';

// Helper function to check if Firestore is initialized
function getFirestore(): any { // Changed return type to any to avoid Firestore type issues
  // if (!db) {
  //   throw new Error('Firestore is not initialized');
  // }
  // return db as Firestore;
  console.warn(`getFirestore: ${SERVICE_DISABLED_MSG}. Returning null.`);
  return null;
}

// Helper function to generate unique IDs
const generateId = () => {
  // const firestore = getFirestore();
  // return doc(collection(firestore, 'temp')).id;
  console.warn(`generateId: ${SERVICE_DISABLED_MSG}. Using fallback ID generation.`);
  return 'mock-' + Math.random().toString(36).substring(2, 11); // Fallback ID
};

/**
 * Save a sound to user's library
 */
export async function saveSound(userId: string, data: SaveSoundRequest): Promise<SavedSound> {
  console.warn(`saveSound (userId: ${userId}, soundId: ${data.soundId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for saveSound");
    
  //   // Check if sound exists
  //   const soundRef = doc(firestore, SOUNDS_COLLECTION, data.soundId);
  //   const soundDoc = await getDoc(soundRef);
    
  //   if (!soundDoc.exists()) {
  //     throw new Error(`Sound with ID ${data.soundId} not found`);
  //   }
    
  //   const soundData = soundDoc.data() as Sound;
    
  //   // Check if sound is already saved by user
  //   const savedSoundsRef = collection(firestore, SAVED_SOUNDS_COLLECTION);
  //   const q = query(
  //     savedSoundsRef, 
  //     where('userId', '==', userId),
  //     where('soundId', '==', data.soundId)
  //   );
    
  //   const savedSoundsSnapshot = await getDocs(q);
    
  //   // If sound already exists, update it
  //   if (!savedSoundsSnapshot.empty) {
  //     const savedSoundDoc = savedSoundsSnapshot.docs[0];
  //     const savedSoundId = savedSoundDoc.id;
      
  //     const updateData: Partial<SavedSound> = {
  //       updatedAt: Timestamp.now(), // Firebase Timestamp
  //     };
      
  //     if (data.isFavorite !== undefined) {
  //       updateData.isFavorite = data.isFavorite;
  //     }
      
  //     if (data.customCategories !== undefined) {
  //       updateData.customCategories = data.customCategories;
  //     }
      
  //     if (data.notes !== undefined) {
  //       updateData.notes = data.notes;
  //     }
      
  //     await updateDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, savedSoundId), updateData);
      
  //     // Get updated document
  //     const updatedDoc = await getDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, savedSoundId));
  //     const updatedData = updatedDoc.data();
  //     return { ...updatedData, id: savedSoundId } as SavedSound;
  //   }
    
  //   // Create new saved sound
  //   const now = Timestamp.now(); // Firebase Timestamp
  //   const newSavedSoundId = generateId();

  //   // Create a clean sound object without the id property
  //   const { id: soundDocId, ...soundDataWithoutId } = soundData;
  //   const soundObj = { 
  //     id: soundDocId, 
  //     ...soundDataWithoutId 
  //   };

  //   const newSavedSound: SavedSound = {
  //     id: newSavedSoundId,
  //     soundId: data.soundId,
  //     userId,
  //     sound: soundObj,
  //     isFavorite: data.isFavorite ?? false,
  //     customCategories: data.customCategories ?? [],
  //     notes: data.notes,
  //     createdAt: now,
  //     updatedAt: now
  //   };
    
  //   await setDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, newSavedSoundId), newSavedSound);
    
  //   // Update category counts if applicable
  //   if (data.customCategories && data.customCategories.length > 0) {
  //     for (const categoryName of data.customCategories) {
  //       // Find the category
  //       const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
  //       const categoryQuery = query(
  //         categoriesRef,
  //         where('userId', '==', userId),
  //         where('name', '==', categoryName)
  //       );
        
  //       const categorySnapshot = await getDocs(categoryQuery);
        
  //       // If category exists, increment count
  //       if (!categorySnapshot.empty) {
  //         const categoryDoc = categorySnapshot.docs[0];
  //         await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
  //           soundCount: increment(1), // Firebase increment
  //           updatedAt: Timestamp.now() // Firebase Timestamp
  //         });
  //       }
  //     }
  //   }
    
  //   return newSavedSound;
  // } catch (error) {
  //   console.error('Error saving sound:', error);
  //   throw error;
  // }
  const now = new Date().toISOString();
  const mockSound: Sound = {
    id: data.soundId,
    name: 'Mock Sound',
    url: 'mock_url',
    userId: 'mock_sound_user',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
    duration: 30,
  };
  const mockSavedSound: SavedSound = {
    id: generateId(),
    soundId: data.soundId,
    userId,
    sound: mockSound,
    isFavorite: data.isFavorite ?? false,
    customCategories: data.customCategories ?? [],
    notes: data.notes,
    createdAt: now as any, // Cast to any to satisfy FirestoreTimestamp for now
    updatedAt: now as any, // Cast to any
  };
  return Promise.resolve(mockSavedSound);
}

/**
 * Update a saved sound
 */
export async function updateSavedSound(userId: string, data: UpdateSavedSoundRequest): Promise<SavedSound> {
  console.warn(`updateSavedSound (userId: ${userId}, savedSoundId: ${data.savedSoundId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for updateSavedSound");
    
  //   // Get the saved sound doc
  //   const savedSoundRef = doc(firestore, SAVED_SOUNDS_COLLECTION, data.savedSoundId);
  //   const savedSoundDoc = await getDoc(savedSoundRef);
    
  //   if (!savedSoundDoc.exists()) {
  //     throw new Error(`Saved sound with ID ${data.savedSoundId} not found`);
  //   }
    
  //   const savedSound = savedSoundDoc.data() as SavedSound;
    
  //   // Check if user owns this saved sound
  //   if (savedSound.userId !== userId) {
  //     throw new Error('You do not have permission to update this saved sound');
  //   }
    
  //   // Get old categories for comparison
  //   const oldCategories = savedSound.customCategories || [];
  //   const newCategories = data.customCategories;
    
  //   // Update the document
  //   const updateData: Partial<SavedSound> = {
  //     updatedAt: Timestamp.now(), // Firebase Timestamp
  //   };
    
  //   if (data.isFavorite !== undefined) {
  //     updateData.isFavorite = data.isFavorite;
  //   }
    
  //   if (data.customCategories !== undefined) {
  //     updateData.customCategories = data.customCategories;
  //   }
    
  //   if (data.notes !== undefined) {
  //     updateData.notes = data.notes;
  //   }
    
  //   await updateDoc(savedSoundRef, updateData);
    
  //   // Update category counts if categories changed
  //   if (newCategories) {
  //     // Categories that were added (not in old, but in new)
  //     const addedCategories = newCategories.filter(cat => !oldCategories.includes(cat));
      
  //     // Categories that were removed (in old, but not in new)
  //     const removedCategories = oldCategories.filter(cat => !newCategories.includes(cat));
      
  //     // Handle category counts
  //     for (const categoryName of addedCategories) {
  //       const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
  //       const categoryQuery = query(
  //         categoriesRef,
  //         where('userId', '==', userId),
  //         where('name', '==', categoryName)
  //       );
        
  //       const categorySnapshot = await getDocs(categoryQuery);
        
  //       if (!categorySnapshot.empty) {
  //         const categoryDoc = categorySnapshot.docs[0];
  //         await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
  //           soundCount: increment(1), // Firebase increment
  //           updatedAt: Timestamp.now() // Firebase Timestamp
  //         });
  //       }
  //     }
      
  //     for (const categoryName of removedCategories) {
  //       const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
  //       const categoryQuery = query(
  //         categoriesRef,
  //         where('userId', '==', userId),
  //         where('name', '==', categoryName)
  //       );
        
  //       const categorySnapshot = await getDocs(categoryQuery);
        
  //       if (!categorySnapshot.empty) {
  //         const categoryDoc = categorySnapshot.docs[0];
  //         await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
  //           soundCount: increment(-1), // Firebase increment
  //           updatedAt: Timestamp.now() // Firebase Timestamp
  //         });
  //       }
  //     }
  //   }
    
  //   // Get the updated document
  //   const updatedDoc = await getDoc(savedSoundRef);
  //   const updatedData = updatedDoc.data();
  //   return { ...updatedData, id: data.savedSoundId } as SavedSound;
  // } catch (error) {
  //   console.error('Error updating saved sound:', error);
  //   throw error;
  // }
  const mockSound: Sound = {
    id: 'mock-sound-for-update',
    name: 'Mock Sound for Update',
    url: 'mock_url_updated',
    userId: 'mock_sound_user',
    createdAt: Date.now() - 200000,
    updatedAt: Date.now(),
    duration: 45,
  };
  const mockUpdatedSavedSound: SavedSound = {
    id: data.savedSoundId,
    soundId: 'mock-sound-for-update',
    userId,
    sound: mockSound,
    isFavorite: data.isFavorite ?? false,
    customCategories: data.customCategories ?? [],
    notes: data.notes,
    createdAt: new Date(Date.now() - 200000).toISOString() as any, // Cast to any
    updatedAt: new Date().toISOString() as any, // Cast to any
  };
  return Promise.resolve(mockUpdatedSavedSound);
}

/**
 * Remove a saved sound from user's library
 */
export async function removeSavedSound(userId: string, savedSoundId: string): Promise<void> {
  console.warn(`removeSavedSound (userId: ${userId}, savedSoundId: ${savedSoundId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for removeSavedSound");

  //   const savedSoundRef = doc(firestore, SAVED_SOUNDS_COLLECTION, savedSoundId);
  //   const savedSoundDoc = await getDoc(savedSoundRef);

  //   if (!savedSoundDoc.exists()) {
  //     throw new Error(`Saved sound with ID ${savedSoundId} not found`);
  //   }

  //   const savedSound = savedSoundDoc.data() as SavedSound;

  //   if (savedSound.userId !== userId) {
  //     throw new Error('User does not have permission to delete this saved sound');
  //   }
    
  //   // Decrement category counts
  //   if (savedSound.customCategories && savedSound.customCategories.length > 0) {
  //     for (const categoryName of savedSound.customCategories) {
  //       const categoriesRef = collection(firestore, CATEGORIES_COLLECTION);
  //       const categoryQuery = query(
  //         categoriesRef,
  //         where('userId', '==', userId),
  //         where('name', '==', categoryName)
  //       );
        
  //       const categorySnapshot = await getDocs(categoryQuery);
        
  //       if (!categorySnapshot.empty) {
  //         const categoryDoc = categorySnapshot.docs[0];
  //         await updateDoc(doc(firestore, CATEGORIES_COLLECTION, categoryDoc.id), {
  //           soundCount: increment(-1), // Firebase increment
  //           updatedAt: Timestamp.now() // Firebase Timestamp
  //         });
  //       }
  //     }
  //   }

  //   await deleteDoc(savedSoundRef);
  // } catch (error) {
  //   console.error('Error removing saved sound:', error);
  //   throw error;
  // }
  return Promise.resolve();
}

/**
 * Get user's saved sounds with pagination and filtering
 */
export async function getSavedSounds(
  userId: string, 
  pageSize: number = 20, 
  lastVisibleId: string | null = null, // Changed to ID string for mock pagination
  filterOptions?: {
    categoryId?: string;
    isFavorite?: boolean;
  }
): Promise<{ savedSounds: SavedSound[]; lastVisible: string | null; hasMore: boolean }> {
  console.warn(`getSavedSounds (userId: ${userId}): ${SERVICE_DISABLED_MSG}`, { pageSize, lastVisibleId, filterOptions });
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for getSavedSounds");

  //   let q = query(
  //     collection(firestore, SAVED_SOUNDS_COLLECTION),
  //     where('userId', '==', userId),
  //     orderBy('createdAt', 'desc'),
  //     limit(pageSize)
  //   );

  //   if (filterOptions?.categoryId) {
  //     // This requires categories to be denormalized or a different query structure
  //     // For now, assuming categoryId is a direct field if used for filtering this way.
  //     // Or, more realistically, customCategories array-contains categoryId if categoryId refers to an ID of a SoundCategory doc.
  //     // The original code did not show how categoryId filter was implemented with Firestore.
  //     console.warn("Filtering by categoryId in getSavedSounds with Firestore is complex and not fully implemented in original snippet.")
  //     // q = query(q, where('customCategoryIds', 'array-contains', filterOptions.categoryId)); // Example if storing IDs
  //   }

  //   if (filterOptions?.isFavorite !== undefined) {
  //     q = query(q, where('isFavorite', '==', filterOptions.isFavorite));
  //   }

  //   if (lastVisibleId) {
  //     const lastDoc = await getDoc(doc(firestore, SAVED_SOUNDS_COLLECTION, lastVisibleId));
  //     if (lastDoc.exists()) {
  //        q = query(q, startAfter(lastDoc)); // Firebase startAfter
  //     }
  //   }

  //   const querySnapshot = await getDocs(q);
  //   const savedSounds = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedSound));
    
  //   const newLastVisible = querySnapshot.docs.length === pageSize ? querySnapshot.docs[querySnapshot.docs.length - 1].id : null;
  //   const hasMore = querySnapshot.docs.length === pageSize;

  //   return { savedSounds, lastVisible: newLastVisible, hasMore };
  // } catch (error) {
  //   console.error('Error getting saved sounds:', error);
  //   throw error;
  // }
  return Promise.resolve({ savedSounds: [], lastVisible: null, hasMore: false });
}

/**
 * Create a custom category for sounds
 */
export async function createCategory(userId: string, data: CreateCategoryRequest): Promise<SoundCategory> {
  console.warn(`createCategory (userId: ${userId}, name: ${data.name}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for createCategory");

  //   const now = Timestamp.now(); // Firebase Timestamp
  //   const newCategoryId = generateId();
    
  //   const newCategory: SoundCategory = {
  //     id: newCategoryId,
  //     userId,
  //     name: data.name,
  //     description: data.description,
  //     color: data.color,
  //     soundCount: 0,
  //     createdAt: now,
  //     updatedAt: now
  //   };
    
  //   await setDoc(doc(firestore, CATEGORIES_COLLECTION, newCategoryId), newCategory);
  //   return newCategory;
  // } catch (error) {
  //   console.error('Error creating category:', error);
  //   throw error;
  // }
  const now = new Date().toISOString();
  const mockCategory: SoundCategory = {
    id: generateId(),
    userId,
    name: data.name,
    description: data.description,
    color: data.color,
    soundCount: 0,
    createdAt: now as any, // Cast to any
    updatedAt: now as any, // Cast to any
  };
  return Promise.resolve(mockCategory);
}

/**
 * Update a custom category
 */
export async function updateCategory(userId: string, data: UpdateCategoryRequest): Promise<SoundCategory> {
  console.warn(`updateCategory (userId: ${userId}, categoryId: ${data.categoryId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for updateCategory");

  //   const categoryRef = doc(firestore, CATEGORIES_COLLECTION, data.categoryId);
  //   const categoryDoc = await getDoc(categoryRef);

  //   if (!categoryDoc.exists() || (categoryDoc.data() as SoundCategory).userId !== userId) {
  //     throw new Error('Category not found or permission denied');
  //   }

  //   const updatePayload: Partial<SoundCategory> = {
  //     updatedAt: Timestamp.now(), // Firebase Timestamp
  //   };

  //   if (data.name) updatePayload.name = data.name;
  //   if (data.description !== undefined) updatePayload.description = data.description;
  //   if (data.color !== undefined) updatePayload.color = data.color;

  //   await updateDoc(categoryRef, updatePayload);

  //   const updatedDoc = await getDoc(categoryRef);
  //   return { ...updatedDoc.data(), id: data.categoryId } as SoundCategory;

  // } catch (error) {
  //   console.error('Error updating category:', error);
  //   throw error;
  // }
  const now = new Date().toISOString();
  const mockUpdatedCategory: SoundCategory = {
    id: data.categoryId,
    userId,
    name: data.name || 'Mock Updated Category',
    description: data.description,
    color: data.color,
    soundCount: 0, // Assuming count is not updated here in mock
    createdAt: new Date(Date.now() - 100000).toISOString() as any, // Cast to any
    updatedAt: now as any, // Cast to any
  };
  return Promise.resolve(mockUpdatedCategory);
}

/**
 * Delete a custom category
 */
export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  console.warn(`deleteCategory (userId: ${userId}, categoryId: ${categoryId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for deleteCategory");

  //   const categoryRef = doc(firestore, CATEGORIES_COLLECTION, categoryId);
  //   const categoryDoc = await getDoc(categoryRef);

  //   if (!categoryDoc.exists() || (categoryDoc.data() as SoundCategory).userId !== userId) {
  //     throw new Error('Category not found or permission denied');
  //   }

  //   // Potentially remove this category from all saved sounds that use it.
  //   // This requires a batch write or multiple updates.
  //   const savedSoundsQuery = query(
  //     collection(firestore, SAVED_SOUNDS_COLLECTION),
  //     where('userId', '==', userId),
  //     where('customCategories', 'array-contains', (categoryDoc.data() as SoundCategory).name) // Assuming name is used in array
  //   );
  //   const savedSoundsSnapshot = await getDocs(savedSoundsQuery);
  //   const batch = writeBatch(firestore); // Firebase writeBatch
  //   savedSoundsSnapshot.forEach(doc => {
  //     batch.update(doc.ref, { 
  //       customCategories: arrayRemove((categoryDoc.data() as SoundCategory).name) // Firebase arrayRemove
  //     });
  //   });
  //   await batch.commit();

  //   await deleteDoc(categoryRef);
  // } catch (error) {
  //   console.error('Error deleting category:', error);
  //   throw error;
  // }
  return Promise.resolve();
}

/**
 * Get all custom categories for a user
 */
export async function getCategories(userId: string): Promise<SoundCategory[]> {
  console.warn(`getCategories (userId: ${userId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for getCategories");

  //   const q = query(
  //     collection(firestore, CATEGORIES_COLLECTION),
  //     where('userId', '==', userId),
  //     orderBy('name', 'asc')
  //   );
  //   const querySnapshot = await getDocs(q);
  //   return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SoundCategory));
  // } catch (error) {
  //   console.error('Error getting categories:', error);
  //   throw error;
  // }
  return Promise.resolve([]);
}

/**
 * Track sound usage (play, download, use in template, share)
 */
export async function trackSoundUsage(userId: string, data: TrackSoundUsageRequest): Promise<void> {
  console.warn(`trackSoundUsage (userId: ${userId}, soundId: ${data.soundId}, action: ${data.actionType}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for trackSoundUsage");

  //   const now = Timestamp.now(); // Firebase Timestamp
  //   const usageId = generateId();

  //   const usageHistoryEntry: SoundUsageHistory = {
  //     id: usageId,
  //     soundId: data.soundId,
  //     userId,
  //     templateId: data.templateId,
  //     templateName: data.templateName,
  //     timestamp: now,
  //     usageDuration: data.usageDuration,
  //     actionType: data.actionType
  //   };

  //   await setDoc(doc(firestore, USAGE_HISTORY_COLLECTION, usageId), usageHistoryEntry);

  //   // Update sound performance stats
  //   const performanceRef = doc(firestore, PERFORMANCE_COLLECTION, data.soundId + '_' + userId); // Composite ID
  //   const performanceDoc = await getDoc(performanceRef);

  //   const updatePayload: Partial<SoundPerformance> = {
  //     lastUsed: now,
  //   };

  //   switch(data.actionType) {
  //     case 'played': 
  //       updatePayload.plays = increment(1); // Firebase increment
  //       break;
  //     case 'downloaded': 
  //       updatePayload.downloads = increment(1); // Firebase increment
  //       break;
  //     case 'used_in_template': 
  //       updatePayload.templateUses = increment(1); // Firebase increment
  //       break;
  //     case 'shared': 
  //       updatePayload.shares = increment(1); // Firebase increment
  //       break;
  //   }

  //   if (performanceDoc.exists()) {
  //     await updateDoc(performanceRef, updatePayload);
  //   } else {
  //     // Initialize performance doc if it doesn't exist
  //     const initialPerformance: SoundPerformance = {
  //       soundId: data.soundId,
  //       userId,
  //       plays: data.actionType === 'played' ? 1 : 0,
  //       downloads: data.actionType === 'downloaded' ? 1 : 0,
  //       shares: data.actionType === 'shared' ? 1 : 0,
  //       favorites: 0, // Assuming favorites are tracked elsewhere or initialized to 0
  //       templateUses: data.actionType === 'used_in_template' ? 1 : 0,
  //       lastUsed: now,
  //     };
  //     await setDoc(performanceRef, initialPerformance);
  //   }

  // } catch (error) {
  //   console.error('Error tracking sound usage:', error);
  //   throw error;
  // }
  return Promise.resolve();
}

/**
 * Get sound usage history for a user, optionally filtered by sound
 */
export async function getSoundUsageHistory(
  userId: string,
  soundId?: string,
  limitCount: number = 50
): Promise<SoundUsageHistory[]> {
  console.warn(`getSoundUsageHistory (userId: ${userId}, soundId: ${soundId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for getSoundUsageHistory");

  //   let q = query(
  //     collection(firestore, USAGE_HISTORY_COLLECTION),
  //     where('userId', '==', userId),
  //     orderBy('timestamp', 'desc'),
  //     limit(limitCount)
  //   );

  //   if (soundId) {
  //     q = query(q, where('soundId', '==', soundId));
  //   }

  //   const querySnapshot = await getDocs(q);
  //   return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SoundUsageHistory));
  // } catch (error) {
  //   console.error('Error getting sound usage history:', error);
  //   throw error;
  // }
  return Promise.resolve([]);
}

/**
 * Get performance data for a specific sound for a user
 */
export async function getSoundPerformance(userId: string, soundId: string): Promise<SoundPerformance | null> {
  console.warn(`getSoundPerformance (userId: ${userId}, soundId: ${soundId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for getSoundPerformance");

  //   const performanceRef = doc(firestore, PERFORMANCE_COLLECTION, soundId + '_' + userId);
  //   const docSnap = await getDoc(performanceRef);

  //   return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as SoundPerformance : null;
  // } catch (error) {
  //   console.error('Error getting sound performance:', error);
  //   throw error;
  // }
  return Promise.resolve(null);
}

/**
 * Get all sound performance data for a user
 */
export async function getAllSoundPerformance(userId: string): Promise<SoundPerformance[]> {
  console.warn(`getAllSoundPerformance (userId: ${userId}): ${SERVICE_DISABLED_MSG}`);
  // try {
  //   const firestore = getFirestore();
  //   if (!firestore) throw new Error("Firestore not available for getAllSoundPerformance");

  //   const q = query(
  //     collection(firestore, PERFORMANCE_COLLECTION),
  //     where('userId', '==', userId)
  //   );
  //   const querySnapshot = await getDocs(q);
  //   return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SoundPerformance));
  // } catch (error) {
  //   console.error('Error getting all sound performance data:', error);
  //   throw error;
  // }
  return Promise.resolve([]);
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