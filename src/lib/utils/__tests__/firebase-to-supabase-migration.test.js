/**
 * Enhanced tests for Firebase to Supabase migration functionality
 */

import { migrateUser, migrateUsers, cleanupAfterMigration, runMigration } from '../migration';
import { createClient } from '@supabase/supabase-js';
import { getEnvVariable } from '../env';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Mock modules
jest.mock('@supabase/supabase-js');
jest.mock('../env');
jest.mock('firebase/firestore');
jest.mock('../../firebase/client', () => ({
  getFirebaseApp: jest.fn(),
  getAuth: jest.fn().mockReturnValue({
    currentUser: {
      uid: 'firebase-user-123',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User'
    }
  })
}));

describe('Firebase to Supabase Migration Integration Tests', () => {
  let mockFirebaseUsers;
  let mockSupabaseClient;
  let mockSupabaseAdminData;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock environment variables
    getEnvVariable.mockImplementation((key, defaultValue = '') => {
      const values = {
        'NEXT_PUBLIC_SUPABASE_URL': 'https://test.supabase.co',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'test-anon-key',
        'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key',
        'NODE_ENV': 'test'
      };
      return values[key] || defaultValue;
    });
    
    // Mock Firebase users data
    mockFirebaseUsers = [
      {
        uid: 'firebase-user-123',
        email: 'test1@example.com',
        emailVerified: true,
        displayName: 'Test User 1',
        photoURL: 'https://example.com/photo1.jpg'
      },
      {
        uid: 'firebase-user-456',
        email: 'test2@example.com',
        emailVerified: false,
        displayName: 'Test User 2',
        photoURL: null
      }
    ];
    
    // Mock Firestore getDocs to return our test users
    const mockQuerySnapshot = {
      forEach: jest.fn(callback => {
        mockFirebaseUsers.forEach((user, index) => {
          callback({
            id: user.uid,
            data: () => user
          });
        });
      })
    };
    getDocs.mockResolvedValue(mockQuerySnapshot);
    
    // Mock Supabase admin client responses
    mockSupabaseAdminData = {
      user: { id: 'supabase-user-abc123' }
    };
    
    // Mock Supabase client and methods
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({
        data: [], // No existing users by default
        error: null
      }),
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({ 
            data: mockSupabaseAdminData, 
            error: null 
          })
        }
      }
    };
    createClient.mockReturnValue(mockSupabaseClient);
  });
  
  describe('migrateUser', () => {
    it('successfully migrates a user with complete profile data', async () => {
      const user = mockFirebaseUsers[0]; // Complete profile
      
      const result = await migrateUser(user);
      
      // Verify the right data was passed to Supabase
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-key',
        expect.any(Object)
      );
      
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: user.email,
        email_confirm: user.emailVerified,
        password: expect.any(String),
        user_metadata: {
          displayName: user.displayName,
          firebase_uid: user.uid,
          photoURL: user.photoURL
        }
      });
      
      // Verify the result has the expected structure
      expect(result).toEqual({
        success: true,
        email: user.email,
        firebaseUid: user.uid,
        supabaseUserId: mockSupabaseAdminData.user.id
      });
    });
    
    it('successfully migrates a user with minimal profile data', async () => {
      const user = {
        uid: 'minimal-user',
        email: 'minimal@example.com',
        emailVerified: false
      };
      
      await migrateUser(user);
      
      // Verify default values are used for missing fields
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: user.email,
        email_confirm: user.emailVerified,
        password: expect.any(String),
        user_metadata: {
          displayName: '',
          firebase_uid: user.uid,
          photoURL: ''
        }
      });
    });
    
    it('handles errors during user creation in Supabase', async () => {
      // Mock Supabase error response
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already registered' }
      });
      
      const user = mockFirebaseUsers[0];
      const result = await migrateUser(user);
      
      expect(result).toEqual({
        success: false,
        email: user.email,
        error: 'Email already registered'
      });
    });
    
    it('skips users that already exist in Supabase', async () => {
      // Mock Supabase response for existing user
      mockSupabaseClient.limit.mockResolvedValueOnce({
        data: [{ id: 'existing-supabase-id' }],
        error: null
      });
      
      const user = mockFirebaseUsers[0];
      const result = await migrateUser(user);
      
      // Should not try to create the user
      expect(mockSupabaseClient.auth.admin.createUser).not.toHaveBeenCalled();
      
      // Should return success with existing user ID
      expect(result).toEqual({
        success: true,
        email: user.email,
        firebaseUid: user.uid,
        supabaseUserId: 'existing-supabase-id',
        message: 'User already exists in Supabase'
      });
    });
  });
  
  describe('migrateUsers', () => {
    it('migrates all Firebase users to Supabase', async () => {
      // Mock getFirebaseUsers to return our test data directly
      getFirestore.mockReturnValue('mock-db');
      collection.mockReturnValue('mock-collection');
      
      const results = await migrateUsers();
      
      // Should have called createUser for each Firebase user
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledTimes(mockFirebaseUsers.length);
      
      // Should return results for all users
      expect(results.length).toBe(mockFirebaseUsers.length);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    it('handles mixed success and failure during migration', async () => {
      // First user succeeds, second fails
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: mockSupabaseAdminData,
        error: null
      }).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid email format' }
      });
      
      const results = await migrateUsers();
      
      expect(results.length).toBe(mockFirebaseUsers.length);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });
  
  describe('runMigration', () => {
    it('completes the entire migration process successfully', async () => {
      const result = await runMigration();
      
      // Check the overall success
      expect(result.success).toBe(true);
      
      // Check the user results
      expect(result.userResults).toHaveLength(mockFirebaseUsers.length);
      
      // Check the cleanup result
      expect(result.cleanupResult.success).toBe(true);
      expect(result.cleanupResult.nextSteps).toContain(
        'Update NEXT_PUBLIC_USE_SUPABASE=true in your .env.local file'
      );
    });
    
    it('fails migration if Supabase configuration is missing', async () => {
      // Mock missing Supabase configuration
      getEnvVariable.mockImplementation(() => '');
      
      const result = await runMigration();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Supabase configuration is incomplete');
      
      // Shouldn't attempt to migrate users
      expect(mockSupabaseClient.auth.admin.createUser).not.toHaveBeenCalled();
    });
  });
}); 