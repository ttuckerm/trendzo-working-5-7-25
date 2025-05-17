/**
 * Test suite for ETL scheduling configuration
 */

const { validateETLScheduler, checkScheduleConfiguration } = require('../../lib/utils/etl-scheduler');

describe('ETL Scheduler Configuration', () => {
  test('should validate proper cron expressions', () => {
    const validConfigs = {
      soundETL: {
        schedule: '0 */6 * * *', // Every 6 hours
        enabled: true
      },
      templateStats: {
        schedule: '0 0 * * *', // Daily at midnight
        enabled: true
      }
    };
    
    const result = checkScheduleConfiguration(validConfigs);
    
    expect(result.isValid).toBe(true);
    expect(result.invalidSchedules).toEqual([]);
  });
  
  test('should identify invalid cron expressions', () => {
    const invalidConfigs = {
      soundETL: {
        schedule: '0 */6 * *', // Missing one field
        enabled: true
      },
      templateStats: {
        schedule: '0 25 * * *', // Invalid hour (>24)
        enabled: true
      }
    };
    
    const result = checkScheduleConfiguration(invalidConfigs);
    
    expect(result.isValid).toBe(false);
    expect(result.invalidSchedules).toContain('soundETL');
    expect(result.invalidSchedules).toContain('templateStats');
  });
  
  test('should validate the scheduler is properly configured', () => {
    // Mock configuration with all required elements
    const mockConfig = {
      soundETL: {
        schedule: '0 */6 * * *',
        enabled: true,
        handler: jest.fn()
      }
    };
    
    const result = validateETLScheduler(mockConfig);
    
    expect(result.isValid).toBe(true);
    expect(result.missingHandlers).toEqual([]);
  });
  
  test('should detect missing handlers in scheduler configuration', () => {
    // Mock configuration with missing handler
    const mockConfig = {
      soundETL: {
        schedule: '0 */6 * * *',
        enabled: true
        // Missing handler
      }
    };
    
    const result = validateETLScheduler(mockConfig);
    
    expect(result.isValid).toBe(false);
    expect(result.missingHandlers).toContain('soundETL');
  });
}); 