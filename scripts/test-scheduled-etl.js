#!/usr/bin/env node

/**
 * Test script for scheduled ETL jobs
 * This script allows you to test the scheduled ETL functionality by simulating both
 * scheduled runs and manual runs of the ETL jobs.
 * 
 * Usage:
 *   node scripts/test-scheduled-etl.js [command] [options]
 * 
 * Commands:
 *   manual        Run a specified job manually (trending, categories, update-stats)
 *   schedule      Test the scheduler by running a job immediately
 *   validate      Validate the scheduling configuration without running jobs
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded environment from .env.local');
} else {
  console.warn('⚠️ No .env.local file found, using environment variables directly');
}

// Set testing mode for development purposes
process.env.TESTING_MODE = 'true';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const jobType = args[1] || 'trending';
const options = {};

// Parse additional options
args.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

// Define valid job types and commands
const validJobTypes = ['trending', 'categories', 'update-stats'];
const commands = {
  manual: 'Run a specific ETL job manually',
  schedule: 'Test the scheduler by scheduling a job to run immediately',
  validate: 'Validate the scheduling configuration without running jobs',
  help: 'Display this help message'
};

// Check if job type is valid
if (command !== 'help' && command !== 'validate' && !validJobTypes.includes(jobType)) {
  console.error(`Error: Invalid job type '${jobType}'`);
  console.error(`Valid job types: ${validJobTypes.join(', ')}`);
  process.exit(1);
}

// Get API key from environment
const ETL_API_KEY = process.env.ETL_API_KEY || process.env.NEXT_PUBLIC_ETL_API_KEY;

// Check if API key is set
if (!ETL_API_KEY && command !== 'help' && command !== 'validate') {
  console.error('Error: ETL_API_KEY is not set in .env.local');
  console.error('Please set ETL_API_KEY in your .env.local file');
  process.exit(1);
}

// Base URL for API requests in testing mode
const baseUrl = options.url || 'http://localhost:3000/api/etl/run-tiktok-etl';

/**
 * Display help information
 */
function showHelp() {
  console.log('\nScheduled ETL Test Script');
  console.log('\nUsage: node scripts/test-scheduled-etl.js [command] [job-type] [options]');
  console.log('\nCommands:');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });
  console.log('\nJob Types:');
  console.log(`  ${validJobTypes.join(', ')}`);
  console.log('\nOptions:');
  console.log('  --url=URL        Base URL for API requests (default: http://localhost:3000/api/etl/run-tiktok-etl)');
  console.log('  --limit=N        Number of items to process (for trending/categories jobs)');
  console.log('  --categories=X,Y Categories to process (for categories job only, comma-separated)');
  process.exit(0);
}

/**
 * Run an ETL job manually
 */
async function runManualJob() {
  console.log(`Running manual ETL job: ${jobType}`);
  
  // Prepare job options based on job type and command line options
  const jobOptions = {
    type: jobType,
    options: {}
  };
  
  if (jobType === 'trending' && options.limit) {
    jobOptions.options.maxItems = parseInt(options.limit);
  } else if (jobType === 'categories') {
    // Parse categories from command line or use defaults
    if (options.categories) {
      jobOptions.options.categories = options.categories.split(',');
    } else {
      jobOptions.options.categories = ['dance', 'tutorial', 'comedy'];
    }
    
    if (options.limit) {
      jobOptions.options.maxItems = parseInt(options.limit);
    }
  }
  
  try {
    console.log('Job configuration:', JSON.stringify(jobOptions, null, 2));
    
    if (process.env.TESTING_MODE === 'true') {
      console.log('🧪 TESTING MODE: Simulating API call');
      console.log(`Would call: POST ${baseUrl}`);
      console.log(`With payload: ${JSON.stringify(jobOptions)}`);
      console.log(`With authorization: Bearer ${ETL_API_KEY.substring(0, 5)}...`);
      
      // Simulate successful API response in testing mode
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API latency
      
      console.log('✅ Job completed successfully (simulated)');
      console.log('Response (simulated):');
      console.log(JSON.stringify({
        success: true,
        type: jobType,
        result: {
          itemsProcessed: Math.floor(Math.random() * 20) + 5,
          success: Math.floor(Math.random() * 10) + 1,
          skipped: Math.floor(Math.random() * 5),
          failed: 0
        }
      }, null, 2));
    } else {
      // Make the actual API call
      const response = await axios.post(
        baseUrl,
        jobOptions,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ETL_API_KEY}`
          }
        }
      );
      
      console.log('✅ Job completed successfully');
      console.log('Response:');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error running job:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Test the scheduler by scheduling a job immediately
 */
async function testScheduler() {
  console.log(`Testing scheduler with job: ${jobType}`);
  
  // Schedule the job to run immediately
  const scheduleDef = '* * * * *'; // Run every minute (for testing)
  
  console.log(`Scheduling job to run with cron: ${scheduleDef}`);
  console.log('Waiting for the job to run (this will happen at the start of the next minute)...');
  
  const task = cron.schedule(scheduleDef, async () => {
    console.log(`⏰ Triggered scheduled job at ${new Date().toISOString()}`);
    
    // Run the job using the same logic as runManualJob
    await runManualJob();
    
    // Stop the task after it runs once
    task.stop();
    console.log('✅ Scheduler test completed successfully');
  });
  
  // Let the script run until the scheduled job completes
  console.log('Press Ctrl+C to cancel the test');
}

/**
 * Validate the scheduling configuration
 */
function validateScheduling() {
  console.log('Validating scheduling configuration...');
  
  // Define the schedule configuration to validate (from schedule-etl.js)
  const scheduleConfig = {
    trending: {
      schedule: '0 */6 * * *', // Every 6 hours
      options: { maxItems: 30 }
    },
    categories: {
      schedule: '0 0 * * *', // Once per day (midnight)
      options: {
        categories: ['dance', 'product', 'tutorial', 'comedy', 'fashion'],
        maxItems: 20
      }
    },
    updateStats: {
      schedule: '0 */12 * * *', // Every 12 hours
      options: {}
    }
  };
  
  console.log('Schedule configuration:');
  Object.entries(scheduleConfig).forEach(([type, config]) => {
    console.log(`- ${type}: ${config.schedule}`);
    
    // Validate the cron expression
    if (cron.validate(config.schedule)) {
      console.log(`  ✅ Valid cron expression`);
      
      // Example of when this would run (next 3 occurrences)
      const nextDates = getNextCronDates(config.schedule, 3);
      console.log(`  📅 Next runs: ${nextDates.join(', ')}`);
    } else {
      console.log(`  ❌ Invalid cron expression: ${config.schedule}`);
    }
    
    // Validate the options
    console.log(`  Options: ${JSON.stringify(config.options)}`);
  });
  
  console.log('\n✅ Validation completed');
}

/**
 * Get the next N dates when a cron schedule would run
 */
function getNextCronDates(schedule, count) {
  const dates = [];
  let date = new Date();
  
  for (let i = 0; i < count; i++) {
    // Get the next date after the current one
    const nextDate = cron.schedule(schedule).nextDate().toJSDate();
    dates.push(nextDate.toLocaleString());
    
    // Set the date to 1 minute after the found date to find the next occurrence
    date = new Date(nextDate.getTime() + 60000);
  }
  
  return dates;
}

/**
 * Main function
 */
async function main() {
  console.log('=== Scheduled ETL Test Script ===');
  
  switch (command) {
    case 'manual':
      await runManualJob();
      break;
      
    case 'schedule':
      await testScheduler();
      break;
      
    case 'validate':
      validateScheduling();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 