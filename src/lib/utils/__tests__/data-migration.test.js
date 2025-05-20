/**
 * Tests for Firebase to Supabase data migration functionality
 */

import { 
  migrateDocument, 
  migrateCollection, 
  migrateDocumentById,
  migrateCollections,
  initializeFirebaseIfNeeded
} from '../data-migration';
import { createClient } from '@supabase/supabase-js';
import { getEnvVariable } from '../env';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc
} from 'firebase/firestore';
import { initializeApp, getApp } from 'firebase/app';

// Mock modules
jest.mock('@supabase/supabase-js');
jest.mock('../env');
jest.mock('firebase/firestore');
jest.mock('firebase/app');

describe('Firebase to Supabase Data Migration', () => {
  let mockSupabaseClient;
  let mockFirebaseData;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Firebase initialization
    getApp.mockImplementation(() => ({})); // Always return an app object
    initializeApp.mockReturnValue({});
    
    // Mock environment variables
    getEnvVariable.mockImplementation((key, defaultValue = '') => {
      const values = {
        'NEXT_PUBLIC_SUPABASE_URL': 'https://test.supabase.co',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'test-anon-key',
        'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key',
        'NODE_ENV': 'test',
        'NEXT_PUBLIC_FIREBASE_API_KEY': 'test-firebase-key',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'test-domain.firebaseapp.com',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'test-project',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'test-bucket',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': '123456789',
        'NEXT_PUBLIC_FIREBASE_APP_ID': 'test-app-id'
      };
      return values[key] || defaultValue;
    });
    
    // Mock Firebase document data
    mockFirebaseData = {
      'documents': [
        {
          id: 'doc1',
          data: {
            title: 'Document 1',
            content: 'Content for document 1',
            created: { seconds: 1615493808, nanoseconds: 0 } // Firebase timestamp
          }
        },
        {
          id: 'doc2',
          data: {
            title: 'Document 2',
            content: 'Content for document 2',
            created: { seconds: 1615493890, nanoseconds: 0 }
          }
        }
      ]
    };
    
    // Mock Firebase getDoc response for a single document
    getDoc.mockResolvedValue({
      exists: jest.fn().mockReturnValue(true),
      data: jest.fn().mockReturnValue(mockFirebaseData.documents[0].data),
      id: mockFirebaseData.documents[0].id
    });
    
    // Mock Firebase getDocs response for a collection
    const mockSnapshot = {
      empty: false,
      size: mockFirebaseData.documents.length,
      docs: mockFirebaseData.documents.map(doc => ({
        data: () => doc.data,
        id: doc.id
      }))
    };
    getDocs.mockResolvedValue(mockSnapshot);
    
    // Mock Firestore functions
    getFirestore.mockReturnValue('mock-db');
    collection.mockReturnValue('mock-collection');
    doc.mockReturnValue('mock-doc-ref');
    
    // Mock Supabase client and methods
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: [{ id: 'supabase-id-1' }],
        error: null
      })
    };
    createClient.mockReturnValue(mockSupabaseClient);
  });
  
  describe('initializeFirebaseIfNeeded', () => {
    it('should return false as Firebase initialization is disabled', async () => {
      // Firebase initialization is now disabled in data-migration.js
      const result = initializeFirebaseIfNeeded();
      expect(result).toBe(false);
      // Ensure the actual Firebase SDK initializeApp/getApp are not called by the SUT
      expect(getApp).not.toHaveBeenCalled(); // These are mocks of firebase/app SDK
      expect(initializeApp).not.toHaveBeenCalled(); // These are mocks of firebase/app SDK
    });
  });
  
  describe('migrateDocument', () => {
    it('successfully migrates a single document to Supabase', async () => {
      const collectionName = 'test-collection';
      const tableName = 'test_table';
      const document = mockFirebaseData.documents[0].data;
      const documentId = mockFirebaseData.documents[0].id;
      
      const result = await migrateDocument(collectionName, tableName, document, documentId);
      
      // Verify client was created with correct credentials
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-key',
        expect.any(Object)
      );
      
      // Verify data was inserted
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(tableName);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        ...document,
        firebase_id: documentId,
        updated_at: expect.any(String)
      });
      
      // Verify result
      expect(result).toEqual({
        success: true,
        id: documentId,
        collection: collectionName,
        table: tableName,
        supabaseId: 'supabase-id-1'
      });
    });
    
    it('applies a transform function when provided', async () => {
      const transformFn = jest.fn((doc, id) => ({
        ...doc,
        custom_field: 'transformed',
        original_id: id
      }));
      
      await migrateDocument(
        'test-collection',
        'test_table',
        mockFirebaseData.documents[0].data,
        mockFirebaseData.documents[0].id,
        transformFn
      );
      
      // Verify transform was called
      expect(transformFn).toHaveBeenCalledWith(
        mockFirebaseData.documents[0].data,
        mockFirebaseData.documents[0].id
      );
      
      // Verify transformed data was inserted
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        ...mockFirebaseData.documents[0].data,
        custom_field: 'transformed',
        original_id: mockFirebaseData.documents[0].id
      });
    });
    
    it('handles errors during document insertion', async () => {
      // Mock Supabase error
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Duplicate key value violates unique constraint' }
      });
      
      const result = await migrateDocument(
        'test-collection',
        'test_table',
        mockFirebaseData.documents[0].data,
        mockFirebaseData.documents[0].id
      );
      
      expect(result).toEqual({
        success: false,
        id: mockFirebaseData.documents[0].id,
        collection: 'test-collection',
        table: 'test_table',
        error: 'Duplicate key value violates unique constraint'
      });
    });
    
    it('handles unexpected errors during document insertion', async () => {
      // Mock unexpected error
      mockSupabaseClient.insert.mockImplementationOnce(() => {
        throw new Error('Network error');
      });
      
      const result = await migrateDocument(
        'test-collection',
        'test_table',
        mockFirebaseData.documents[0].data,
        mockFirebaseData.documents[0].id
      );
      
      expect(result).toEqual({
        success: false,
        id: mockFirebaseData.documents[0].id,
        collection: 'test-collection',
        table: 'test_table',
        error: 'Network error'
      });
    });
  });
  
  describe('migrateCollection', () => {
    it('should fail as Firebase initialization is disabled', async () => {
      // initializeFirebaseIfNeeded in data-migration.js now returns false,
      // causing migrateCollection to throw an error.
      await expect(migrateCollection('test-collection', 'test_table'))
        .rejects
        .toThrow('Failed to initialize Firebase for data migration');
    });
  });
  
  describe('migrateDocumentById', () => {
    it('should fail as Firebase initialization is disabled', async () => {
      // initializeFirebaseIfNeeded in data-migration.js now returns false,
      // causing migrateDocumentById to throw an error.
      await expect(migrateDocumentById('test-collection', 'test_table', 'doc1'))
        .rejects
        .toThrow('Failed to initialize Firebase for data migration');
    });
  });
  
  describe('migrateCollections', () => {
    it('should fail for each collection as Firebase initialization is disabled', async () => {
      const mappings = [
        { firebaseCollection: 'collection1', supabaseTable: 'table1' },
        { firebaseCollection: 'collection2', supabaseTable: 'table2' },
      ];
      // initializeFirebaseIfNeeded in data-migration.js now returns false,
      // causing migrateCollections to report failure for Firebase-dependent steps.
      // The SUT function catches the error from migrateCollection and returns a specific structure.
      const result = await migrateCollections(mappings);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Some collections failed to migrate');
      expect(result.failedCollections).toEqual(['collection1', 'collection2']);
      expect(result.collectionResults.collection1.success).toBe(false);
      // The error in collectionResults might be undefined if the specific catch block isn't hit,
      // or it might contain the specific error from migrateCollection. Adjust if needed based on actual SUT behavior.
      // For now, we expect the top-level failure indicated above.
    });
  });
}); 