/**
 * Script to create a new .env.local file with Supabase configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define file paths
const envExamplePath = path.join(process.cwd(), '.env.local.example');
const envLocalPath = path.join(process.cwd(), '.env.local');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask a question and get the user's response
 * @param {string} question - The question to ask
 * @returns {Promise<string>} The user's response
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Create a new .env.local file with Supabase configuration
 */
async function createEnvLocal() {
  console.log('Creating .env.local file for Supabase configuration');
  console.log('=================================================');
  console.log('');
  
  try {
    // Check if .env.local already exists
    if (fs.existsSync(envLocalPath)) {
      const overwrite = await askQuestion('.env.local already exists. Overwrite? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    // Check if .env.local.example exists
    let templateContent = '';
    if (fs.existsSync(envExamplePath)) {
      templateContent = fs.readFileSync(envExamplePath, 'utf8');
    } else {
      templateContent = `# Authentication Provider Control
NEXT_PUBLIC_USE_SUPABASE=true

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
`;
    }
    
    // Get Supabase configuration from user
    console.log('Please enter your Supabase project details:');
    console.log('(You can find these in your Supabase project settings -> API)');
    const supabaseUrl = await askQuestion('Supabase URL: ');
    const supabaseAnonKey = await askQuestion('Supabase Anon Key: ');
    const supabaseServiceKey = await askQuestion('Supabase Service Role Key: ');
    
    // Update the template with user-provided values
    templateContent = templateContent
      .replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`)
      .replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`)
      .replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`)
      .replace(/NEXT_PUBLIC_USE_SUPABASE=.*/, 'NEXT_PUBLIC_USE_SUPABASE=true');
    
    // Write the updated content to .env.local
    fs.writeFileSync(envLocalPath, templateContent);
    
    console.log('');
    console.log('✅ Successfully created .env.local file with Supabase configuration.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run npm run migrate-to-supabase to migrate your users');
    console.log('2. Restart your Next.js server to apply the changes');
  } catch (error) {
    console.error('Error creating .env.local file:', error);
  } finally {
    rl.close();
  }
}

// Run the script
createEnvLocal().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
}); 