import { migrateUsers, migrateUser, cleanupAfterMigration } from '../migration';
import { createClient } from '@supabase/supabase-js';
import { getEnvVariable } from '../env';

// Mock modules
jest.mock('@supabase/supabase-js');
jest.mock('../env');
jest.mock('../../firebase/client', () => ({
  getFirebaseApp: jest.fn(),
  getAuth: jest.fn().mockReturnValue({
    currentUser: {
      uid: 'firebase-user-123',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User'
    },
    listUsers: jest.fn().mockResolvedValue({
      users: [{
        uid: 'firebase-user-123',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
        metadata: {
          creationTime: '2023-01-01T00:00:00Z',
          lastSignInTime: '2023-06-01T00:00:00Z'
        }
      }]
    })
  })
}));

describe('Firebase to Supabase Migration', () => {
  let mockFirebaseUser;
  let mockSupabaseClient;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock environment variables
    getEnvVariable.mockImplementation((key) => {
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') return 'test-anon-key';
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-service-key';
      return '';
    });
    
    // Mock Firebase user
    mockFirebaseUser = {
      uid: 'firebase-user-123',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      metadata: {
        creationTime: '2023-01-01T00:00:00Z',
        lastSignInTime: '2023-06-01T00:00:00Z'
      }
    };
    
    // Mock Supabase client and methods
    mockSupabaseClient = {
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({ 
            data: { id: 'supabase-user-123' }, 
            error: null 
          }),
          listUsers: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }
      }
    };
    createClient.mockReturnValue(mockSupabaseClient);
  });
  
  describe('migrateUser', () => {
    it('migrates a single user from Firebase to Supabase', async () => {
      const result = await migrateUser(mockFirebaseUser);
      
      // Should create user in Supabase
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        email_confirm: true,
        user_metadata: {
          displayName: 'Test User',
          firebase_uid: 'firebase-user-123',
        }
      });
      
      // Should return success
      expect(result.success).toBe(true);
      expect(result.supabaseUserId).toBe('supabase-user-123');
    });
    
    it('handles errors during user migration', async () => {
      // Mock Supabase error
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'User already exists' }
      });
      
      const result = await migrateUser(mockFirebaseUser);
      
      // Should return failure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('migrateUsers', () => {
    it('migrates all users from Firebase to Supabase', async () => {
      const results = await migrateUsers();
      
      // Should create user in Supabase
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalled();
      
      // Should return results for all users
      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
    });
  });
  
  describe('cleanupAfterMigration', () => {
    it('performs cleanup tasks after migration is complete', async () => {
      // In a real implementation, this might revoke Firebase tokens
      // or update database records to reflect the migration
      
      const result = await cleanupAfterMigration();
      expect(result.success).toBe(true);
    });
  });
}); 