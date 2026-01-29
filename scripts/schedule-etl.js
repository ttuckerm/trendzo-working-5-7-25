#!/usr/bin/env node

/**
 * ETL Job Scheduler
 * 
 * This script schedules and runs ETL jobs for the TikTok Template Tracker application.
 * Enhanced with error handling, monitoring, and alerting capabilities.
 */

const cron = require('node-cron');
const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// ETL API key for authentication
const ETL_API_KEY = process.env.ETL_API_KEY || process.env.NEXT_PUBLIC_ETL_API_KEY;

// Email configuration for alerts
const EMAIL_CONFIG = {
  enabled: process.env.ETL_ALERT_EMAIL_ENABLED === 'true',
  from: process.env.ETL_ALERT_EMAIL_FROM || 'etl-alerts@example.com',
  to: process.env.ETL_ALERT_EMAIL_TO || 'admin@example.com',
  smtpHost: process.env.ETL_ALERT_SMTP_HOST || 'smtp.example.com',
  smtpPort: parseInt(process.env.ETL_ALERT_SMTP_PORT || '587'),
  smtpUser: process.env.ETL_ALERT_SMTP_USER,
  smtpPass: process.env.ETL_ALERT_SMTP_PASS
};

// Log directory for ETL job logs
const LOG_DIR = path.join(__dirname, '../logs');

// Make sure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Check for testing mode
const TESTING_MODE = process.env.TESTING_MODE === 'true' || process.argv.includes('--test');

// Schedule configuration for different ETL jobs
const scheduleConfig = {
  trending: {
    schedule: '0 */6 * * *', // Every 6 hours
    options: { maxItems: 30 },
    alertThreshold: 3 // Alert after 3 consecutive failures
  },
  categories: {
    schedule: '0 0 * * *', // Once per day (midnight)
    options: {
      categories: ['dance', 'product', 'tutorial', 'comedy', 'fashion'],
      maxItems: 20
    },
    alertThreshold: 2 // Alert after 2 consecutive failures
  },
  updateStats: {
    schedule: '0 */12 * * *', // Every 12 hours
    options: {},
    alertThreshold: 3 // Alert after 3 consecutive failures
  }
};

// Base URL for API requests
const baseUrl = process.env.ETL_API_BASE_URL || 'http://localhost:3000/api/etl/run-tiktok-etl';

// Track job failures for alerting
const jobFailures = {
  trending: 0,
  categories: 0,
  updateStats: 0
};

/**
 * Format a date for logging
 * @returns {string} Formatted date
 */
function getFormattedDate() {
  return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

/**
 * Write to log file
 * @param {string} type Type of log entry
 * @param {string} message Log message
 * @param {object} data Additional data to log
 */
function logToFile(type, message, data = {}) {
  const logFile = path.join(LOG_DIR, `etl-${new Date().toISOString().split('T')[0]}.log`);
  const timestamp = getFormattedDate();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`;
  
  fs.appendFileSync(logFile, logEntry);
  
  // Also log to console
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  if (Object.keys(data).length > 0) {
    console.log(data);
  }
}

/**
 * Send an alert email
 * @param {string} subject Email subject
 * @param {string} body Email body
 */
async function sendAlertEmail(subject, body) {
  if (!EMAIL_CONFIG.enabled) {
    logToFile('warn', 'Email alerts disabled, skipping alert email', { subject });
    return;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.smtpHost,
      port: EMAIL_CONFIG.smtpPort,
      secure: EMAIL_CONFIG.smtpPort === 465,
      auth: {
        user: EMAIL_CONFIG.smtpUser,
        pass: EMAIL_CONFIG.smtpPass
      }
    });
    
    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject: `[ETL Alert] ${subject}`,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };
    
    const info = await transporter.sendMail(mailOptions);
    logToFile('info', 'Alert email sent', { messageId: info.messageId });
  } catch (error) {
    logToFile('error', 'Failed to send alert email', {
      error: error.message,
      subject
    });
  }
}

/**
 * Check if alerting threshold has been reached for a job type
 * @param {string} jobType Type of ETL job
 * @returns {boolean} Whether an alert should be sent
 */
function shouldSendAlert(jobType) {
  const threshold = scheduleConfig[jobType]?.alertThreshold || 3;
  return jobFailures[jobType] >= threshold;
}

/**
 * Reset failure counter for a job type
 * @param {string} jobType Type of ETL job
 */
function resetFailureCounter(jobType) {
  jobFailures[jobType] = 0;
}

/**
 * Increment failure counter for a job type and send alert if threshold reached
 * @param {string} jobType Type of ETL job
 * @param {Error} error The error that occurred
 */
async function handleJobFailure(jobType, error) {
  jobFailures[jobType]++;
  
  logToFile('error', `Job ${jobType} failed (failure #${jobFailures[jobType]})`, { 
    error: error.message,
    stack: error.stack
  });
  
  if (shouldSendAlert(jobType)) {
    const subject = `ETL Job '${jobType}' failed ${jobFailures[jobType]} times consecutively`;
    const body = `
ETL Job '${jobType}' has failed ${jobFailures[jobType]} times consecutively.

Last error: ${error.message}

Error details:
${error.stack || 'No stack trace available'}

Job configuration:
${JSON.stringify(scheduleConfig[jobType], null, 2)}

Time: ${getFormattedDate()}

Please check the ETL logs for more details.
    `;
    
    await sendAlertEmail(subject, body);
    
    // Reset counter after sending alert to avoid alert spam
    resetFailureCounter(jobType);
  }
}

/**
 * Run an ETL job
 * @param {object} jobConfig Configuration for the ETL job
 * @returns {Promise<object>} Result of the API call
 */
async function runETL(jobConfig) {
  const { type, options } = jobConfig;
  logToFile('info', `Running ${type} ETL job...`, { options });
  
  if (TESTING_MODE) {
    logToFile('info', `[TESTING] Simulating ${type} ETL job instead of making actual API call`);
    // Simulate a delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      type,
      result: {
        itemsProcessed: Math.floor(Math.random() * 20) + 5,
        timeElapsed: Math.floor(Math.random() * 5000) + 1000
      }
    };
  }
  
  try {
    // Make the API call with timeout
    const response = await axios.post(
      baseUrl,
      { type, options },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ETL_API_KEY}`
        },
        timeout: 5 * 60 * 1000 // 5 minute timeout
      }
    );
    
    logToFile('success', `${type} ETL job completed successfully`, response.data);
    
    // Reset failure counter
    resetFailureCounter(type);
    
    return response.data;
  } catch (error) {
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logToFile('error', `ETL job failed with status ${error.response.status}`, {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      logToFile('error', 'ETL job failed - no response received', {
        request: error.request.path || error.request.host
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      logToFile('error', 'ETL job failed during request setup', {
        message: error.message
      });
    }
    
    // Handle the failure
    await handleJobFailure(type, error);
    
    throw error;
  }
}

/**
 * Schedule all ETL jobs
 */
function scheduleAllJobs() {
  logToFile('info', 'Scheduling ETL jobs with the following configuration:', scheduleConfig);
  
  Object.entries(scheduleConfig).forEach(([type, config]) => {
    const { schedule, options } = config;
    logToFile('info', `Scheduling job ${type} with cron schedule: ${schedule}`);
    
    // Schedule the job using node-cron
    cron.schedule(schedule, async () => {
      try {
        logToFile('info', `Starting scheduled ETL job: ${type}`);
        await runETL({ type, options });
        logToFile('info', `Completed scheduled ETL job: ${type}`);
      } catch (err) {
        logToFile('error', `Scheduled ${type} job failed`, { error: err.message });
        // Error is already handled in runETL
      }
    });
  });
  
  logToFile('info', 'ETL scheduler is running. Press Ctrl+C to exit.');
}

/**
 * Run a job manually
 * @param {string} jobType Type of job to run
 */
async function runManualJob(jobType) {
  if (!scheduleConfig[jobType]) {
    logToFile('error', `Unknown job type '${jobType}'`);
    console.error('Available job types: ' + Object.keys(scheduleConfig).join(', '));
    process.exit(1);
  }
  
  try {
    logToFile('info', `Running manual job: ${jobType}`);
    const result = await runETL({
      type: jobType,
      options: scheduleConfig[jobType].options
    });
    
    logToFile('success', `Manual ${jobType} job completed`, result);
  } catch (error) {
    logToFile('error', 'Manual job failed', { jobType, error: error.message });
    process.exit(1);
  }
}

/**
 * Check system health
 * @returns {Promise<object>} Health check results
 */
async function checkSystemHealth() {
  logToFile('info', 'Running system health check');
  
  const health = {
    timestamp: getFormattedDate(),
    system: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    },
    api: {
      status: 'unknown'
    },
    jobs: {}
  };
  
  // Check API health
  try {
    const response = await axios.get(
      baseUrl.replace('/run-tiktok-etl', '/health'),
      {
        headers: {
          'Authorization': `Bearer ${ETL_API_KEY}`
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    health.api = {
      status: 'ok',
      details: response.data
    };
  } catch (error) {
    health.api = {
      status: 'error',
      error: error.message
    };
  }
  
  // Check job statuses
  for (const [jobType, failures] of Object.entries(jobFailures)) {
    health.jobs[jobType] = {
      consecutiveFailures: failures,
      config: scheduleConfig[jobType]
    };
  }
  
  logToFile('info', 'Health check completed', health);
  return health;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'start') {
    // Start the scheduler
    scheduleAllJobs();
    
    // Schedule daily health check
    cron.schedule('0 0 * * *', async () => {
      try {
        await checkSystemHealth();
      } catch (error) {
        logToFile('error', 'Health check failed', { error: error.message });
      }
    });
  } else if (args[0] === 'run' && args[1]) {
    // Run a specific job
    await runManualJob(args[1]);
    process.exit(0);
  } else if (args[0] === 'health') {
    // Run health check
    await checkSystemHealth();
    process.exit(0);
  } else if (args[0] === 'test-alert') {
    // Test alert system
    await sendAlertEmail('Test Alert', 'This is a test alert from the ETL scheduler.');
    process.exit(0);
  } else {
    console.log(`
ETL Scheduler Usage:
  node ${path.basename(__filename)} [command]

Commands:
  start               Start the scheduler (default)
  run <job-type>      Run a specific job
  health              Run system health check
  test-alert          Test the alert system

Job Types:
  ${Object.keys(scheduleConfig).join(', ')}

Examples:
  node ${path.basename(__filename)}                   # Start the scheduler
  node ${path.basename(__filename)} run trending      # Run trending job
  node ${path.basename(__filename)} health            # Run health check
    `);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logToFile('critical', 'Unhandled error in main process', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
}); 