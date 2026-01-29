/**
 * Tests for the complete migration process from Firebase to Supabase
 * Tests the integration of auth migration and data migration
 */

// Mock the imported modules
jest.mock('../migration', () => ({
  runMigration: jest.fn().mockResolvedValue({
    success: true,
    userResults: [
      {
        success: true,
        email: 'test1@example.com',
        firebaseUid: 'firebase-user-123',
        supabaseUserId: 'supabase-user-abc123'
      },
      {
        success: true,
        email: 'test2@example.com',
        firebaseUid: 'firebase-user-456',
        supabaseUserId: 'supabase-user-def456'
      }
    ],
    cleanupResult: {
      success: true,
      message: 'Migration cleanup completed successfully',
      nextSteps: [
        'Update NEXT_PUBLIC_USE_SUPABASE=true in your .env.local file',
        'Restart your Next.js server to apply the changes'
      ]
    }
  })
}));

jest.mock('../data-migration', () => ({
  migrateCollections: jest.fn().mockResolvedValue({
    success: true,
    collectionResults: {
      users: {
        targetTable: 'profiles',
        results: [
          { success: true, id: 'firebase-user-123', supabaseId: 'supabase-user-abc123' },
          { success: true, id: 'firebase-user-456', supabaseId: 'supabase-user-def456' }
        ],
        success: true,
        totalCount: 2,
        successCount: 2
      },
      templates: {
        targetTable: 'templates',
        results: [
          { success: true, id: 'template1', supabaseId: 'template-1-uuid' },
          { success: true, id: 'template2', supabaseId: 'template-2-uuid' }
        ],
        success: true,
        totalCount: 2,
        successCount: 2
      }
    }
  })
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('SOME_VAR=value\nNEXT_PUBLIC_USE_SUPABASE=false'),
  writeFileSync: jest.fn()
}));

// Import the modules we're testing
const { runMigration } = require('../migration');
const { migrateCollections } = require('../data-migration');
const fs = require('fs');

// Mock console methods to prevent test output clutter
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Complete Firebase to Supabase Migration Process', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Silence console output during tests
    console.log = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Import the module fresh for each test (to reset any internal state)
  let completeMigration;
  beforeEach(() => {
    jest.isolateModules(() => {
      completeMigration = require('../../../../../../complete-migration');
    });
  });
  
  it('should perform auth migration and data migration successfully', async () => {
    // This will trigger the main function in complete-migration.js
    // which is automatically executed when the module is imported
    
    // Verify that the auth migration was called
    expect(runMigration).toHaveBeenCalled();
    
    // Verify that the data migration was called with the correct mappings
    expect(migrateCollections).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          firebaseCollection: 'users',
          supabaseTable: 'profiles'
        }),
        expect.objectContaining({
          firebaseCollection: 'templates',
          supabaseTable: 'templates'
        }),
        expect.objectContaining({
          firebaseCollection: 'sounds',
          supabaseTable: 'sounds'
        })
      ])
    );
    
    // Verify that the .env.local file was updated
    expect(fs.existsSync).toHaveBeenCalledWith('.env.local');
    expect(fs.readFileSync).toHaveBeenCalledWith('.env.local', 'utf8');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '.env.local',
      expect.stringContaining('NEXT_PUBLIC_USE_SUPABASE=true')
    );
  });
  
  it('should handle auth migration failure gracefully', async () => {
    // Mock auth migration failure
    runMigration.mockResolvedValueOnce({
      success: false,
      error: 'Authentication migration failed',
      userResults: [
        {
          success: false,
          email: 'test1@example.com',
          error: 'User creation failed'
        }
      ]
    });
    
    // Re-import to trigger main function with updated mocks
    jest.isolateModules(() => {
      completeMigration = require('../../../../../../complete-migration');
    });
    
    // Should still proceed with data migration despite auth failure
    expect(migrateCollections).toHaveBeenCalled();
    
    // Should show error messages for the auth failure
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Authentication migration failed')
    );
  });
  
  it('should handle data migration failure gracefully', async () => {
    // Mock data migration failure
    migrateCollections.mockResolvedValueOnce({
      success: false,
      error: 'Some collections failed to migrate',
      collectionResults: {
        users: {
          targetTable: 'profiles',
          results: [],
          success: false,
          totalCount: 0,
          successCount: 0
        }
      },
      failedCollections: ['templates', 'sounds']
    });
    
    // Re-import to trigger main function with updated mocks
    jest.isolateModules(() => {
      completeMigration = require('../../../../../../complete-migration');
    });
    
    // Should show error messages for the data failure
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Data migration failed')
    );
  });
  
  it('should update the environment variables correctly', async () => {
    // Test that the function correctly updates the environment variable
    // regardless of whether it exists or not
    
    // Test existing variable being updated
    fs.readFileSync.mockReturnValueOnce('NEXT_PUBLIC_USE_SUPABASE=false');
    
    // Re-import to trigger enableSupabaseInEnv function
    jest.isolateModules(() => {
      completeMigration = require('../../../../../../complete-migration');
    });
    
    // Should replace existing variable
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '.env.local',
      'NEXT_PUBLIC_USE_SUPABASE=true'
    );
    
    jest.clearAllMocks();
    
    // Test variable being added when it doesn't exist
    fs.readFileSync.mockReturnValueOnce('OTHER_VAR=something');
    
    // Re-import to trigger enableSupabaseInEnv function again
    jest.isolateModules(() => {
      completeMigration = require('../../../../../../complete-migration');
    });
    
    // Should add new variable
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '.env.local',
      expect.stringContaining('OTHER_VAR=something\nNEXT_PUBLIC_USE_SUPABASE=true')
    );
  });
}); 