/**
 * Utility for migrating non-auth data from Firebase to Supabase
 */

const SCRIPT_DISABLED_MSG = "data-migration.js: Firebase is being removed. This migration script is now disabled for Firebase operations.";
console.warn(SCRIPT_DISABLED_MSG);

const { createClient } = require('@supabase/supabase-js');
const { getEnvVariable } = require('./env');
// const { initializeApp, getApp } = require('firebase/app');
// const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

/**
 * Initialize Firebase if not already initialized
 * This function ensures Firebase is properly initialized before accessing Firestore
 * @returns {boolean} Whether initialization was successful
 */
function initializeFirebaseIfNeeded() {
  console.warn("initializeFirebaseIfNeeded called, but Firebase migration is disabled.");
  return false; // Firebase is disabled
  // try {
  //   // Try to get the default app, if it fails, initialize a new one
  //   try {
  //     getApp();
  //     console.log('Firebase app already initialized, using existing app');
  //   } catch (e) {
  //     const firebaseConfig = {
  //       apiKey: getEnvVariable('NEXT_PUBLIC_FIREBASE_API_KEY', ''),
  //       authDomain: getEnvVariable('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
  //       projectId: getEnvVariable('NEXT_PUBLIC_FIREBASE_PROJECT_ID', ''),
  //       storageBucket: getEnvVariable('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
  //       messagingSenderId: getEnvVariable('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', ''),
  //       appId: getEnvVariable('NEXT_PUBLIC_FIREBASE_APP_ID', ''),
  //     };
      
  //     // Validate required Firebase config values
  //     if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  //       throw new Error('Required Firebase configuration missing');
  //     }
      
  //     initializeApp(firebaseConfig);
  //     console.log('Firebase app initialized for data migration');
  //   }
  //   return true;
  // } catch (error) {
  //   console.error('Error initializing Firebase:', error);
  //   return false;
  // }
}

/**
 * Get a Supabase client with admin privileges for data operations
 * @returns {Object} Supabase client with admin access
 */
function getSupabaseAdminClient() {
  const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseServiceKey = getEnvVariable('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Required Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Migrate a single document from Firebase to Supabase
 * @param {string} collectionName - Name of the Firebase collection
 * @param {string} tableName - Name of the Supabase table
 * @param {Object} document - Document data from Firebase
 * @param {string} documentId - Document ID from Firebase
 * @param {Function} transformFn - Optional function to transform data before inserting
 * @returns {Promise<Object>} Result of the migration
 */
async function migrateDocument(collectionName, tableName, document, documentId, transformFn = null) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Apply transformation if provided
    const dataToInsert = transformFn ? transformFn(document, documentId) : {
      ...document,
      firebase_id: documentId,
      updated_at: new Date().toISOString()
    };
    
    // Insert data into Supabase
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert(dataToInsert)
      .select();
    
    if (error) {
      console.error(`Error migrating document ${documentId} to ${tableName}:`, error);
      return {
        success: false,
        id: documentId,
        collection: collectionName,
        table: tableName,
        error: error.message
      };
    }
    
    console.log(`Successfully migrated document ${documentId} to ${tableName}`);
    return {
      success: true,
      id: documentId,
      collection: collectionName,
      table: tableName,
      supabaseId: data[0]?.id
    };
  } catch (error) {
    console.error(`Unexpected error migrating document ${documentId}:`, error);
    return {
      success: false,
      id: documentId,
      collection: collectionName,
      table: tableName,
      error: error.message || 'Unexpected error during migration'
    };
  }
}

/**
 * Migrate all documents from a Firebase collection to a Supabase table
 * @param {string} collectionName - Name of the Firebase collection
 * @param {string} tableName - Name of the Supabase table 
 * @param {Function} transformFn - Optional function to transform data before inserting
 * @returns {Promise<Array>} Results of migrating each document
 */
async function migrateCollection(collectionName, tableName, transformFn = null) {
  try {
    console.log(`Migrating collection ${collectionName} to ${tableName}...`);
    
    // Initialize Firebase if needed
    if (!initializeFirebaseIfNeeded()) {
      throw new Error('Failed to initialize Firebase for data migration');
    }
    
    // Get all documents from Firebase collection
    const db = getFirestore();
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`No documents found in collection ${collectionName}`);
      return [];
    }
    
    console.log(`Found ${snapshot.size} documents to migrate from ${collectionName}`);
    
    // Migrate each document sequentially
    const migrationResults = [];
    for (const doc of snapshot.docs) {
      const result = await migrateDocument(
        collectionName,
        tableName,
        doc.data(),
        doc.id,
        transformFn
      );
      migrationResults.push(result);
    }
    
    // Report results
    const successCount = migrationResults.filter(r => r.success).length;
    console.log(`Migrated ${successCount}/${migrationResults.length} documents from ${collectionName} to ${tableName}`);
    
    return migrationResults;
  } catch (error) {
    console.error(`Error migrating collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Migrate a specific document by ID from Firebase to Supabase
 * @param {string} collectionName - Name of the Firebase collection
 * @param {string} tableName - Name of the Supabase table
 * @param {string} documentId - ID of the document to migrate
 * @param {Function} transformFn - Optional function to transform data before inserting
 * @returns {Promise<Object>} Result of the migration
 */
async function migrateDocumentById(collectionName, tableName, documentId, transformFn = null) {
  try {
    console.log(`Migrating document ${documentId} from ${collectionName} to ${tableName}...`);
    
    // Initialize Firebase if needed
    if (!initializeFirebaseIfNeeded()) {
      throw new Error('Failed to initialize Firebase for data migration');
    }
    
    // Get the document from Firebase
    const db = getFirestore();
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error(`Document ${documentId} not found in collection ${collectionName}`);
      return {
        success: false,
        id: documentId,
        collection: collectionName,
        table: tableName,
        error: 'Document not found'
      };
    }
    
    // Migrate the document
    return await migrateDocument(
      collectionName,
      tableName,
      docSnap.data(),
      documentId,
      transformFn
    );
  } catch (error) {
    console.error(`Error migrating document ${documentId}:`, error);
    return {
      success: false,
      id: documentId,
      collection: collectionName,
      table: tableName,
      error: error.message || 'Unexpected error during migration'
    };
  }
}

/**
 * Migrate multiple related collections from Firebase to Supabase
 * @param {Array<Object>} collectionMappings - Array of objects mapping collections to tables
 * @returns {Promise<Object>} Results of the migrations
 */
async function migrateCollections(collectionMappings) {
  try {
    console.log('Starting migration of multiple collections...');
    
    // Initialize Firebase if needed
    if (!initializeFirebaseIfNeeded()) {
      throw new Error('Failed to initialize Firebase for data migration');
    }
    
    const results = {};
    const failedCollections = [];
    let allSuccess = true;
    
    for (const mapping of collectionMappings) {
      const { firebaseCollection, supabaseTable, transform } = mapping;
      
      try {
        console.log(`Migrating ${firebaseCollection} to ${supabaseTable}...`);
        const collectionResults = await migrateCollection(
          firebaseCollection,
          supabaseTable,
          transform
        );
        
        // Calculate success metrics
        const totalCount = collectionResults.length;
        const successCount = collectionResults.filter(r => r.success).length;
        const collectionSuccess = collectionResults.length > 0 && successCount > 0;
        
        // Store results
        results[firebaseCollection] = {
          targetTable: supabaseTable,
          results: collectionResults,
          success: collectionSuccess,
          totalCount,
          successCount
        };
        
        // Update overall success
        if (!collectionSuccess) {
          allSuccess = false;
        }
      } catch (error) {
        console.error(`Failed to migrate collection ${firebaseCollection}:`, error);
        failedCollections.push(firebaseCollection);
        allSuccess = false;
      }
    }
    
    // Return combined results
    const returnValue = {
      success: allSuccess,
      collectionResults: results
    };
    
    // Add error information if there were failures
    if (!allSuccess) {
      returnValue.error = 'Some collections failed to migrate';
      if (failedCollections.length > 0) {
        returnValue.failedCollections = failedCollections;
      }
    }
    
    return returnValue;
  } catch (error) {
    console.error('Error during multi-collection migration:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error during multi-collection migration'
    };
  }
}

module.exports = {
  initializeFirebaseIfNeeded,
  getSupabaseAdminClient,
  migrateDocument,
  migrateCollection,
  migrateDocumentById,
  migrateCollections
}; 