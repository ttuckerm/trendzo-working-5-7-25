/**
 * Direct migration script that loads environment variables manually
 */

// Load environment variables using fs to ensure they're loaded correctly
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local file manually with better handling of line breaks
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  let currentKey = null;
  let currentValue = '';
  
  content.split('\n').forEach(line => {
    // Remove comments and trim whitespace
    const trimmedLine = line.split('#')[0].trim();
    if (!trimmedLine) return;
    
    if (currentKey && !trimmedLine.includes('=')) {
      // This line is a continuation of the previous value
      currentValue += trimmedLine;
      env[currentKey] = currentValue;
      return;
    }
    
    // Split by first = (to handle values with = in them)
    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex > 0) {
      currentKey = trimmedLine.substring(0, equalsIndex).trim();
      currentValue = trimmedLine.substring(equalsIndex + 1).trim();
      
      // Remove quotes if present
      if ((currentValue.startsWith('"') && currentValue.endsWith('"')) || 
          (currentValue.startsWith("'") && currentValue.endsWith("'"))) {
        currentValue = currentValue.substring(1, currentValue.length - 1);
      }
      
      env[currentKey] = currentValue;
    }
  });
  
  return env;
}

// Read the file directly for debugging
const envLocalPath = path.join(process.cwd(), '.env.local');
console.log(`Loading .env.local file from: ${envLocalPath}`);

// Read the file as a raw string to examine
const rawContent = fs.readFileSync(envLocalPath, 'utf8');
console.log('\nRaw file content for Supabase variables:');
const lines = rawContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('SUPABASE')) {
    console.log(`Line ${i+1}: ${line}`);
  }
}

// Manually extract Supabase variables with regex
console.log('\nExtracting variables with regex:');
const urlMatch = rawContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/);
const roleKeyMatch = rawContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\n]+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
const serviceRoleKey = roleKeyMatch ? roleKeyMatch[1].trim() : null;

console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Found' : 'Missing'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'Found' : 'Missing'}`);

// Now run the migration with manually extracted variables
async function runMigration() {
  console.log('\nTrendzo: Firebase to Supabase Migration Tool');
  console.log('============================================');
  console.log('');
  
  try {
    // Use our manually extracted variables
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Migration failed:');
      console.error('Could not extract Supabase configuration from .env.local file.');
      process.exit(1);
    }
    
    console.log('Supabase configuration found:');
    console.log(`- URL: ${supabaseUrl}`);
    console.log(`- Service Key: ${serviceRoleKey ? 'Present' : 'Missing'}`);
    
    // Initialize Supabase client with manually extracted variables
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Supabase client initialized successfully');
    
    // Create a test user in Supabase
    console.log('\nCreating test user in Supabase...');
    const testUser = {
      email: 'test@example.com',
      password: 'Test123!',
      user_metadata: {
        displayName: 'Test User',
        firebase_uid: 'firebase-test-user-123'
      }
    };
    
    console.log(`- Email: ${testUser.email}`);
    console.log(`- Firebase UID: ${testUser.user_metadata.firebase_uid}`);
    
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .limit(1);
      
    if (checkError) {
      console.error('Error checking for existing user:', checkError);
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists in Supabase:', existingUsers[0].id);
      console.log('✅ Migration completed successfully!');
      return;
    }
    
    // Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: testUser.user_metadata
    });
    
    if (error) {
      console.error('❌ Error creating user:', error);
      process.exit(1);
    }
    
    console.log('✅ User created successfully in Supabase!');
    console.log(`- Supabase User ID: ${data.user.id}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Test logging in with the migrated user in Supabase');
    console.log('2. Set the environment variable NEXT_PUBLIC_USE_SUPABASE=true in your .env.local file');
    console.log('3. Restart your Next.js server to apply the changes');
    
  } catch (error) {
    console.error('❌ Unexpected error during migration:');
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 