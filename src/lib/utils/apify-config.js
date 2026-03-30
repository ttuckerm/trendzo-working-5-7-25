/**
 * Apify integration configuration validator
 * Ensures all required environment variables for Apify integration are properly set
 */

const { getEnvVariable } = require('./env');

/**
 * Validates the Apify integration configuration by checking for required
 * environment variables
 * 
 * @returns {Object} Result object with validation status and details
 */
function validateApifyConfig() {
  const missingVariables = [];
  const result = {
    isValid: true,
    missingVariables: [],
    suggestedActions: []
  };
  
  // Check for required Apify API token
  try {
    getEnvVariable('APIFY_API_TOKEN');
  } catch (error) {
    missingVariables.push('APIFY_API_TOKEN');
  }
  
  // If any required variables are missing, mark as invalid
  if (missingVariables.length > 0) {
    result.isValid = false;
    result.missingVariables = missingVariables;
    
    // Add suggested actions for fixing the configuration
    result.suggestedActions.push(
      'Add the missing environment variables to your .env.local file',
      'Ensure you have an active Apify account and API token',
      'For testing, you can use a mock token by setting APIFY_USE_MOCK=true'
    );
  }
  
  return result;
}

/**
 * Creates a mock Apify configuration for testing without real API calls
 * @returns {Object} Mock configuration object
 */
function createMockApifyConfig() {
  return {
    token: 'mock-apify-token',
    clientUrl: 'https://mock-api.apify.com',
    isMocked: true
  };
}

module.exports = {
  validateApifyConfig,
  createMockApifyConfig
}; 