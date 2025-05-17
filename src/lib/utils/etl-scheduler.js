/**
 * ETL Scheduler configuration validator
 * Ensures ETL jobs are properly configured with valid cron expressions and handlers
 */

const cron = require('node-cron');

/**
 * Validates cron expressions in ETL schedule configuration
 * 
 * @param {Object} config - ETL schedule configuration object
 * @returns {Object} Result object with validation status and details
 */
function checkScheduleConfiguration(config) {
  const result = {
    isValid: true,
    invalidSchedules: []
  };
  
  // Check each scheduled job configuration
  for (const [jobName, jobConfig] of Object.entries(config)) {
    // Skip disabled jobs
    if (jobConfig.enabled === false) continue;
    
    // Validate the cron expression using node-cron
    if (!jobConfig.schedule || !cron.validate(jobConfig.schedule)) {
      result.isValid = false;
      result.invalidSchedules.push(jobName);
    }
  }
  
  return result;
}

/**
 * Validates that all enabled ETL jobs have proper handler functions
 * 
 * @param {Object} config - ETL schedule configuration object
 * @returns {Object} Result object with validation status and details
 */
function validateETLScheduler(config) {
  const result = {
    isValid: true,
    missingHandlers: []
  };
  
  // First validate cron expressions
  const scheduleResult = checkScheduleConfiguration(config);
  if (!scheduleResult.isValid) {
    result.isValid = false;
    result.invalidSchedules = scheduleResult.invalidSchedules;
  }
  
  // Check that each enabled job has a handler function
  for (const [jobName, jobConfig] of Object.entries(config)) {
    // Skip disabled jobs
    if (jobConfig.enabled === false) continue;
    
    // Check for a handler function
    if (!jobConfig.handler || typeof jobConfig.handler !== 'function') {
      result.isValid = false;
      result.missingHandlers = result.missingHandlers || [];
      result.missingHandlers.push(jobName);
    }
  }
  
  return result;
}

/**
 * Creates a default ETL schedule configuration with sound ETL
 * 
 * @param {Object} options - Optional configuration options
 * @returns {Object} Default ETL schedule configuration
 */
function createDefaultScheduleConfig(options = {}) {
  const useMock = options.useMock || false;
  
  return {
    soundETL: {
      schedule: '0 */6 * * *', // Every 6 hours
      enabled: true,
      handler: useMock ? 
        async () => ({ success: true, message: 'Mock sound ETL executed', results: { processed: 10 } }) : 
        null // Will be populated by the actual implementation
    }
  };
}

module.exports = {
  checkScheduleConfiguration,
  validateETLScheduler,
  createDefaultScheduleConfig
}; 