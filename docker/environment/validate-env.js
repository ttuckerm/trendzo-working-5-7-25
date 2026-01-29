#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates all required environment variables for production deployment
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bright}🔍 TRENDZO ENVIRONMENT VALIDATION${colors.reset}\n`);

// Required environment variables by category
const requiredEnvVars = {
  'Application': {
    'NODE_ENV': { required: true, description: 'Environment (development/production)' },
    'NEXT_PUBLIC_APP_URL': { required: true, description: 'Application URL' },
    'NEXT_PUBLIC_ADMIN_EMAIL': { required: true, description: 'Admin email address' }
  },
  'Database': {
    'NEXT_PUBLIC_SUPABASE_URL': { required: true, description: 'Supabase project URL' },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': { required: true, description: 'Supabase anonymous key' },
    'SUPABASE_SERVICE_KEY': { required: true, description: 'Supabase service role key' }
  },
  'Authentication': {
    'NEXTAUTH_SECRET': { required: true, description: 'NextAuth.js secret (32+ characters)' },
    'NEXTAUTH_URL': { required: true, description: 'NextAuth.js URL' }
  },
  'AI Services': {
    'OPENAI_API_KEY': { required: false, description: 'OpenAI API key (optional if Anthropic is used)' },
    'ANTHROPIC_API_KEY': { required: false, description: 'Anthropic Claude API key (optional if OpenAI is used)' }
  },
  'Data Scraping': {
    'APIFY_API_TOKEN': { required: false, description: 'Apify API token for TikTok scraping' }
  }
};

// Optional but recommended variables
const recommendedEnvVars = {
  'GOOGLE_CLIENT_ID': 'Google OAuth client ID',
  'GOOGLE_CLIENT_SECRET': 'Google OAuth client secret',
  'GRAFANA_ADMIN_PASSWORD': 'Grafana admin password',
  'REDIS_PASSWORD': 'Redis password for production',
  'LOG_PREDICTIONS': 'Enable prediction logging',
  'RATE_LIMIT_MAX_REQUESTS': 'API rate limiting configuration'
};

let allValid = true;
let warnings = [];
let errors = [];

/**
 * Validate a single environment variable
 */
function validateEnvVar(name, config, value) {
  if (!value || value.trim() === '') {
    if (config.required) {
      errors.push(`❌ ${name}: ${config.description} (REQUIRED)`);
      return false;
    } else {
      warnings.push(`⚠️  ${name}: ${config.description} (optional but recommended)`);
      return true;
    }
  }

  // Specific validations
  switch (name) {
    case 'NEXTAUTH_SECRET':
      if (value.length < 32) {
        errors.push(`❌ ${name}: Must be at least 32 characters long (current: ${value.length})`);
        return false;
      }
      break;
    
    case 'NEXT_PUBLIC_SUPABASE_URL':
      if (!value.includes('supabase.co') && !value.includes('localhost')) {
        errors.push(`❌ ${name}: Should be a valid Supabase URL`);
        return false;
      }
      break;
    
    case 'NODE_ENV':
      if (!['development', 'production', 'staging', 'test'].includes(value)) {
        errors.push(`❌ ${name}: Must be development, production, staging, or test`);
        return false;
      }
      break;
    
    case 'NEXT_PUBLIC_APP_URL':
      if (!value.startsWith('http')) {
        errors.push(`❌ ${name}: Must start with http:// or https://`);
        return false;
      }
      break;
  }

  console.log(`${colors.green}✅ ${name}${colors.reset}: ${config.description}`);
  return true;
}

/**
 * Check if at least one AI service is configured
 */
function validateAIServices() {
  const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';
  const hasAnthropic = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '';
  
  if (!hasOpenAI && !hasAnthropic) {
    errors.push(`❌ AI Services: At least one AI service (OpenAI or Anthropic) must be configured`);
    return false;
  }
  
  if (hasOpenAI && hasAnthropic) {
    console.log(`${colors.green}✅ AI Services${colors.reset}: Both OpenAI and Anthropic configured (excellent!)`);
  } else if (hasOpenAI) {
    console.log(`${colors.green}✅ AI Services${colors.reset}: OpenAI configured`);
  } else {
    console.log(`${colors.green}✅ AI Services${colors.reset}: Anthropic configured`);
  }
  
  return true;
}

/**
 * Load environment variables from file if it exists
 */
function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    console.log(`${colors.blue}📁 Loading environment from: ${filename}${colors.reset}\n`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    });
    return true;
  }
  return false;
}

/**
 * Main validation function
 */
function validateEnvironment() {
  // Try to load environment file
  const envFiles = ['.env.production', '.env.local', '.env'];
  let envFileLoaded = false;
  
  for (const file of envFiles) {
    if (loadEnvFile(file)) {
      envFileLoaded = true;
      break;
    }
  }
  
  if (!envFileLoaded) {
    console.log(`${colors.yellow}⚠️  No environment file found. Using system environment variables.${colors.reset}\n`);
  }

  // Validate required variables by category
  for (const [category, variables] of Object.entries(requiredEnvVars)) {
    console.log(`${colors.magenta}${colors.bright}📋 ${category}:${colors.reset}`);
    
    for (const [name, config] of Object.entries(variables)) {
      const isValid = validateEnvVar(name, config, process.env[name]);
      if (!isValid) {
        allValid = false;
      }
    }
    console.log('');
  }

  // Special validation for AI services
  console.log(`${colors.magenta}${colors.bright}📋 AI Services Validation:${colors.reset}`);
  const aiValid = validateAIServices();
  if (!aiValid) {
    allValid = false;
  }
  console.log('');

  // Check recommended variables
  console.log(`${colors.magenta}${colors.bright}📋 Recommended (Optional):${colors.reset}`);
  for (const [name, description] of Object.entries(recommendedEnvVars)) {
    if (!process.env[name] || process.env[name].trim() === '') {
      warnings.push(`⚠️  ${name}: ${description}`);
    } else {
      console.log(`${colors.green}✅ ${name}${colors.reset}: ${description}`);
    }
  }
  console.log('');

  // Print summary
  console.log(`${colors.cyan}${colors.bright}📊 VALIDATION SUMMARY:${colors.reset}`);
  
  if (allValid) {
    console.log(`${colors.green}${colors.bright}✅ All required environment variables are valid!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ Validation failed. Please fix the following errors:${colors.reset}`);
    errors.forEach(error => console.log(`   ${error}`));
  }

  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  Warnings (recommended but optional):${colors.reset}`);
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  console.log(`\n${colors.blue}💡 Tips:${colors.reset}`);
  console.log(`   • Copy docker/environment/env.template to .env.production`);
  console.log(`   • Fill in your actual API keys and secrets`);
  console.log(`   • Never commit .env files to version control`);
  console.log(`   • Use strong, unique passwords and rotate them regularly`);

  return allValid;
}

// Run validation
const isValid = validateEnvironment();
process.exit(isValid ? 0 : 1);