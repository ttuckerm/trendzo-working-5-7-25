/**
 * Tests for Firebase initialization functionality
 */

import { initializeTestFirebase } from '../firebase-init';
import { getEnvVariable } from '../env';
import { initializeApp, getApp } from 'firebase/app';

// Mock modules
jest.mock('../env');
jest.mock('firebase/app');

describe('Firebase initialization for tests (neutralized behavior)', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock environment variables - still needed by the SUT for debug logs, but not for functionality
    getEnvVariable.mockImplementation((key, defaultValue = '') => {
      const values = {
        'NEXT_PUBLIC_FIREBASE_API_KEY': 'test-firebase-key',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'test-domain.firebaseapp.com',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'test-project',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'test-bucket',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': '123456789',
        'NEXT_PUBLIC_FIREBASE_APP_ID': 'test-app-id'
      };
      return values[key] || defaultValue;
    });
  });
  
  it('should return success with null app as Firebase is disabled', () => {
    const result = initializeTestFirebase(); // SUT function from firebase-init.js
    
    expect(result.success).toBe(true);
    expect(result.app).toBeNull();
    expect(result.message).toMatch(/Firebase initialization skipped/);
    // Ensure the SUT does not call the (mocked) Firebase SDK functions
    expect(getApp).not.toHaveBeenCalled(); 
    expect(initializeApp).not.toHaveBeenCalled();
  });
  
  it('should return the same success and null app even if (mocked) getApp implies an existing app', () => {
    const mockApp = { name: 'test-app' };
    getApp.mockImplementationOnce(() => mockApp); // This mock won't be called by the SUT
    
    const result = initializeTestFirebase();
    
    expect(result.success).toBe(true);
    expect(result.app).toBeNull();
    expect(result.message).toMatch(/Firebase initialization skipped/);
    expect(getApp).not.toHaveBeenCalled();
    expect(initializeApp).not.toHaveBeenCalled();
  });
  
  it('should still return success with null app even if env vars for config are missing', () => {
    getEnvVariable.mockImplementation((key) => {
      if (key === 'NEXT_PUBLIC_FIREBASE_API_KEY') return '';
      if (key === 'NEXT_PUBLIC_FIREBASE_PROJECT_ID') return '';
      return 'some-value';
    });
    
    const result = initializeTestFirebase();
    
    expect(result.success).toBe(true);
    expect(result.app).toBeNull();
    expect(result.message).toMatch(/Firebase initialization skipped/);
    expect(result.error).toBeUndefined(); // No error should be reported by the SUT
  });
  
  it('should still return success with null app even if (mocked) initializeApp throws', () => {
    getApp.mockImplementationOnce(() => { // This mock won't be called by the SUT
      throw new Error('No app found');
    });
    initializeApp.mockImplementationOnce(() => { // This mock won't be called by the SUT
      throw new Error('Initialization failed');
    });
    
    const result = initializeTestFirebase();
    
    expect(result.success).toBe(true);
    expect(result.app).toBeNull();
    expect(result.message).toMatch(/Firebase initialization skipped/);
    expect(result.error).toBeUndefined();
  });
}); 