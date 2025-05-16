/**
 * Script to fix .env.local file by ensuring Supabase variables are properly formatted
 */

const fs = require('fs');
const path = require('path');

// Define the correct Supabase configuration
const correctSupabaseConfig = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://vyeiyccrageeckeehyhj.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MjE2MTEsImV4cCI6MjA2MjQ5NzYxMX0.DAEyNYSuqddMrbnoBTsQFjDhJGsgj4f0_Nk2a76ZV2U',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8',
  NEXT_PUBLIC_USE_SUPABASE: 'true'
};

// Path to .env.local file
const envFilePath = path.join(process.cwd(), '.env.local');
const backupPath = path.join(process.cwd(), '.env.local.backup');

try {
  // Check if file exists
  if (!fs.existsSync(envFilePath)) {
    console.error(`.env.local file not found at ${envFilePath}`);
    process.exit(1);
  }
  
  // Create backup of original file
  console.log(`Creating backup of .env.local to ${backupPath}`);
  fs.copyFileSync(envFilePath, backupPath);
  
  // Read the current file content
  const currentContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Process the file line by line
  const lines = currentContent.split('\n');
  const newLines = [];
  const updatedKeys = new Set();
  
  // Process each line to update or keep
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      // Keep comment lines and empty lines
      newLines.push(line);
      return;
    }
    
    // Check if this line starts with any of our target keys
    const key = Object.keys(correctSupabaseConfig).find(k => 
      trimmedLine.startsWith(`${k}=`) || trimmedLine === k);
    
    if (key) {
      // This line is for one of our target keys, replace it
      newLines.push(`${key}=${correctSupabaseConfig[key]}`);
      updatedKeys.add(key);
    } else {
      // Keep other lines unchanged
      newLines.push(line);
    }
  });
  
  // Add any missing keys at the end
  Object.keys(correctSupabaseConfig).forEach(key => {
    if (!updatedKeys.has(key)) {
      newLines.push(`${key}=${correctSupabaseConfig[key]}`);
      console.log(`Added missing key: ${key}`);
    }
  });
  
  // Write the updated content back to the file
  fs.writeFileSync(envFilePath, newLines.join('\n'));
  
  console.log('✅ .env.local file updated successfully!');
  console.log('The following Supabase variables have been configured:');
  Object.keys(correctSupabaseConfig).forEach(key => {
    console.log(`- ${key}`);
  });
  
  console.log('\nYou can now run the migration script again.');
} catch (error) {
  console.error('❌ Error updating .env.local file:', error);
  process.exit(1);
} 