#!/usr/bin/env node

/**
 * Create a mock environment configuration file for testing
 */

const fs = require('fs');
const path = require('path');

// Define the path to .env.local
const envPath = path.join(__dirname, '..', '.env.local');

// Create basic mock configuration
const mockEnv = `# Mock configuration for testing
APIFY_API_TOKEN=mock-token
APIFY_USE_MOCK=true

# Base URLs for API testing
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Feature flags
NEXT_PUBLIC_USE_SUPABASE=true
`;

// Write the file
fs.writeFileSync(envPath, mockEnv);

console.log(`Created mock environment configuration at ${envPath}`); 