/**
 * Script to enable Supabase authentication
 * Updates .env.local file to set NEXT_PUBLIC_USE_SUPABASE=true
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define the .env file path
const envFilePath = path.join(process.cwd(), '.env.local');

async function updateEnvFile() {
  console.log('Enabling Supabase authentication...');
  
  try {
    // Check if .env.local exists
    if (!fs.existsSync(envFilePath)) {
      console.error('Error: .env.local file not found. Please create it first.');
      console.log('You can copy .env.local.example to .env.local as a starting point.');
      return false;
    }
    
    // Read the current .env.local file
    const fileContent = fs.readFileSync(envFilePath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Check if NEXT_PUBLIC_USE_SUPABASE is already set to true
    const supabaseEnabledRegex = /^NEXT_PUBLIC_USE_SUPABASE\s*=\s*true/;
    if (lines.some(line => supabaseEnabledRegex.test(line))) {
      console.log('Supabase is already enabled in .env.local.');
      return true;
    }
    
    // Update or add the NEXT_PUBLIC_USE_SUPABASE=true line
    let updated = false;
    const updatedLines = lines.map(line => {
      if (line.startsWith('NEXT_PUBLIC_USE_SUPABASE=')) {
        updated = true;
        return 'NEXT_PUBLIC_USE_SUPABASE=true';
      }
      return line;
    });
    
    // If the variable wasn't found, add it
    if (!updated) {
      updatedLines.push('NEXT_PUBLIC_USE_SUPABASE=true');
    }
    
    // Write the updated content back to .env.local
    fs.writeFileSync(envFilePath, updatedLines.join('\n'));
    
    console.log('Successfully updated .env.local to use Supabase authentication.');
    console.log('Please restart your Next.js server for the changes to take effect.');
    return true;
  } catch (error) {
    console.error('Error updating .env.local file:', error);
    return false;
  }
}

async function confirmAndUpdate() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    const answer = await new Promise(resolve => {
      rl.question('This will enable Supabase authentication in your app. Continue? (y/n) ', resolve);
    });
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await updateEnvFile();
    } else {
      console.log('Operation cancelled.');
    }
  } finally {
    rl.close();
  }
}

// Run the script
confirmAndUpdate().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
}); 