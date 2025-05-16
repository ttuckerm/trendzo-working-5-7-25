/**
 * Tests for Firebase initialization functionality
 */

import { initializeTestFirebase } from '../firebase-init';
import { getEnvVariable } from '../env';
import { initializeApp, getApp } from 'firebase/app';

// Mock modules
jest.mock('../env');
jest.mock('firebase/app');

describe('Firebase initialization for tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock environment variables
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
  
  it('should initialize Firebase with test configuration', () => {
    // Mock app retrieval failure to ensure new initialization
    getApp.mockImplementationOnce(() => {
      throw new Error('No app found');
    });
    
    const result = initializeTestFirebase();
    
    expect(result.success).toBe(true);
    expect(getApp).toHaveBeenCalled();
    expect(initializeApp).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: 'test-firebase-key',
      projectId: 'test-project'
    }));
  });
  
  it('should reuse existing Firebase app if available', () => {
    // Mock successful app retrieval
    const mockApp = { name: 'test-app' };
    getApp.mockImplementationOnce(() => mockApp);
    
    const result = initializeTestFirebase();
    
    expect(result.success).toBe(true);
    expect(result.app).toBe(mockApp);
    expect(getApp).toHaveBeenCalled();
    expect(initializeApp).not.toHaveBeenCalled();
  });
  
  it('should fail with missing Firebase configuration', () => {
    // Mock app retrieval failure
    getApp.mockImplementationOnce(() => {
      throw new Error('No app found');
    });
    
    // Mock missing required config
    getEnvVariable.mockImplementation((key) => {
      if (key === 'NEXT_PUBLIC_FIREBASE_API_KEY') return '';
      if (key === 'NEXT_PUBLIC_FIREBASE_PROJECT_ID') return '';
      return 'some-value';
    });
    
    const result = initializeTestFirebase();
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Required Firebase configuration missing/);
  });
  
  it('should handle initialization errors', () => {
    // Mock app retrieval failure
    getApp.mockImplementationOnce(() => {
      throw new Error('No app found');
    });
    
    // Mock initialization failure
    initializeApp.mockImplementationOnce(() => {
      throw new Error('Initialization failed');
    });
    
    const result = initializeTestFirebase();
    
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Initialization failed/);
  });
}); 