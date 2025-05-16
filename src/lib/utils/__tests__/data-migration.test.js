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
    it('reuses existing Firebase app if available', async () => {
      // Mock successful app retrieval
      getApp.mockImplementationOnce(() => ({ name: 'existing-app' }));
      
      const result = initializeFirebaseIfNeeded();
      
      expect(result).toBe(true);
      expect(getApp).toHaveBeenCalled();
      expect(initializeApp).not.toHaveBeenCalled();
    });
    
    it('initializes a new Firebase app if none exists', async () => {
      // Mock app retrieval failure
      getApp.mockImplementationOnce(() => {
        throw new Error('No app found');
      });
      
      const result = initializeFirebaseIfNeeded();
      
      expect(result).toBe(true);
      expect(getApp).toHaveBeenCalled();
      expect(initializeApp).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'test-firebase-key',
        projectId: 'test-project'
      }));
    });
    
    it('handles initialization errors', async () => {
      // Mock app retrieval and initialization failure
      getApp.mockImplementationOnce(() => {
        throw new Error('No app found');
      });
      initializeApp.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });
      
      const result = initializeFirebaseIfNeeded();
      
      expect(result).toBe(false);
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
    it('migrates all documents in a collection', async () => {
      const collectionName = 'test-collection';
      const tableName = 'test_table';
      
      const results = await migrateCollection(collectionName, tableName);
      
      // Verify Firebase app was initialized or reused
      expect(getApp).toHaveBeenCalled();
      
      // Verify all documents were processed
      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(mockFirebaseData.documents.length);
      expect(results.length).toBe(mockFirebaseData.documents.length);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    it('handles empty collections', async () => {
      // Mock empty collection
      getDocs.mockResolvedValueOnce({
        empty: true,
        size: 0,
        docs: []
      });
      
      const results = await migrateCollection('empty-collection', 'empty_table');
      
      expect(results).toEqual([]);
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
    
    it('handles Firebase initialization failure', async () => {
      // Mock Firebase initialization failure
      getApp.mockImplementationOnce(() => {
        throw new Error('No app found');
      });
      initializeApp.mockImplementationOnce(() => {
        throw new Error('Firebase initialization failed');
      });
      
      await expect(migrateCollection('test-collection', 'test_table'))
        .rejects
        .toThrow('Failed to initialize Firebase for data migration');
      
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
    
    it('applies a transform function to all documents when provided', async () => {
      const transformFn = jest.fn((doc, id) => ({
        ...doc,
        migrated: true,
        firebase_id: id
      }));
      
      await migrateCollection('test-collection', 'test_table', transformFn);
      
      // Verify transform was called for each document
      expect(transformFn).toHaveBeenCalledTimes(mockFirebaseData.documents.length);
      mockFirebaseData.documents.forEach((doc, index) => {
        expect(transformFn).toHaveBeenNthCalledWith(index + 1, doc.data, doc.id);
      });
    });
  });
  
  describe('migrateDocumentById', () => {
    it('migrates a specific document by ID', async () => {
      const result = await migrateDocumentById('test-collection', 'test_table', 'doc1');
      
      // Verify document was fetched
      expect(doc).toHaveBeenCalledWith('mock-db', 'test-collection', 'doc1');
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      
      // Verify document was inserted
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      
      // Verify result
      expect(result).toEqual({
        success: true,
        id: 'doc1',
        collection: 'test-collection',
        table: 'test_table',
        supabaseId: 'supabase-id-1'
      });
    });
    
    it('handles document not found errors', async () => {
      // Mock document not found
      getDoc.mockResolvedValueOnce({
        exists: jest.fn().mockReturnValue(false)
      });
      
      const result = await migrateDocumentById('test-collection', 'test_table', 'nonexistent');
      
      expect(result).toEqual({
        success: false,
        id: 'nonexistent',
        collection: 'test-collection',
        table: 'test_table',
        error: 'Document not found'
      });
      
      // Verify no insertion attempt was made
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
    });
    
    it('applies a transform function when provided', async () => {
      const transformFn = jest.fn((doc, id) => ({
        ...doc,
        transformed: true,
        original_id: id
      }));
      
      await migrateDocumentById('test-collection', 'test_table', 'doc1', transformFn);
      
      // Verify transform was called
      expect(transformFn).toHaveBeenCalledWith(
        mockFirebaseData.documents[0].data,
        'doc1'
      );
    });
  });
  
  describe('migrateCollections', () => {
    it('migrates multiple collections with mappings', async () => {
      const mappings = [
        {
          firebaseCollection: 'users',
          supabaseTable: 'profiles',
          transform: (data, id) => ({ ...data, user_id: id })
        },
        {
          firebaseCollection: 'posts',
          supabaseTable: 'articles',
          transform: (data, id) => ({ ...data, post_id: id })
        }
      ];
      
      // Mock migrateCollection to return success for all collections
      jest.spyOn(global, 'migrateCollection').mockImplementation((coll, table) => {
        return Promise.resolve([
          { success: true, id: 'id1', collection: coll, table, supabaseId: 'sup1' },
          { success: true, id: 'id2', collection: coll, table, supabaseId: 'sup2' }
        ]);
      });
      
      const result = await migrateCollections(mappings);
      
      // Verify each collection was migrated
      expect(global.migrateCollection).toHaveBeenCalledTimes(mappings.length);
      mappings.forEach((mapping, index) => {
        expect(global.migrateCollection).toHaveBeenNthCalledWith(
          index + 1,
          mapping.firebaseCollection,
          mapping.supabaseTable,
          mapping.transform
        );
      });
      
      // Verify result format
      expect(result).toEqual({
        success: true,
        collectionResults: {
          users: {
            targetTable: 'profiles',
            results: expect.any(Array),
            success: true,
            totalCount: 2,
            successCount: 2
          },
          posts: {
            targetTable: 'articles',
            results: expect.any(Array),
            success: true,
            totalCount: 2,
            successCount: 2
          }
        }
      });
    });
    
    it('reports partial success when some collections fail', async () => {
      const mappings = [
        { firebaseCollection: 'users', supabaseTable: 'profiles' },
        { firebaseCollection: 'posts', supabaseTable: 'articles' }
      ];
      
      // First collection succeeds, second fails
      jest.spyOn(global, 'migrateCollection')
        .mockImplementationOnce(() => Promise.resolve([
          { success: true, id: 'u1', collection: 'users', table: 'profiles' }
        ]))
        .mockImplementationOnce(() => Promise.reject(new Error('Database error')));
      
      const result = await migrateCollections(mappings);
      
      // Verify result contains the successful collection and reports failure
      expect(result).toEqual({
        success: false,
        error: 'Some collections failed to migrate',
        collectionResults: {
          users: {
            targetTable: 'profiles',
            results: expect.any(Array),
            success: true,
            totalCount: 1,
            successCount: 1
          }
        },
        failedCollections: ['posts']
      });
    });
    
    it('handles errors in individual documents', async () => {
      const mappings = [
        { firebaseCollection: 'mixed', supabaseTable: 'mixed_data' }
      ];
      
      // Collection with mix of success and failure
      jest.spyOn(global, 'migrateCollection')
        .mockImplementationOnce(() => Promise.resolve([
          { success: true, id: 'doc1', collection: 'mixed', table: 'mixed_data' },
          { success: false, id: 'doc2', collection: 'mixed', table: 'mixed_data', error: 'Validation error' }
        ]));
      
      const result = await migrateCollections(mappings);
      
      // Verify partial success is reported
      expect(result).toEqual({
        success: true, // Overall process succeeded even with document failures
        collectionResults: {
          mixed: {
            targetTable: 'mixed_data',
            results: expect.any(Array),
            success: true, // Collection process completed
            totalCount: 2,
            successCount: 1 // But only one document succeeded
          }
        }
      });
    });
  });
}); 