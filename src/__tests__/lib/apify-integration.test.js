/**
 * Test suite for Apify integration and configuration
 */

const { validateApifyConfig } = require('../../lib/utils/apify-config');

describe('Apify Integration Configuration', () => {
  // Store original environment and restore after tests
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset the environment for each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should detect missing APIFY_API_TOKEN', () => {
    // Ensure token is not set
    delete process.env.APIFY_API_TOKEN;
    
    const result = validateApifyConfig();
    
    expect(result.isValid).toBe(false);
    expect(result.missingVariables).toContain('APIFY_API_TOKEN');
  });

  test('should validate configuration when all required variables are present', () => {
    // Set required environment variables
    process.env.APIFY_API_TOKEN = 'test-token';
    
    const result = validateApifyConfig();
    
    expect(result.isValid).toBe(true);
    expect(result.missingVariables).toEqual([]);
  });

  test('should include suggested actions when configuration is invalid', () => {
    // Ensure token is not set
    delete process.env.APIFY_API_TOKEN;
    
    const result = validateApifyConfig();
    
    expect(result.isValid).toBe(false);
    expect(result.suggestedActions).toBeInstanceOf(Array);
    expect(result.suggestedActions.length).toBeGreaterThan(0);
  });
}); 