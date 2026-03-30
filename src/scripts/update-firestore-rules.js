/**
 * Update Firestore rules for sound-related features
 * 
 * This script updates the firestore.rules file to add
 * the necessary security rules for the new sound-related collections.
 */

const fs = require('fs');
const path = require('path');

// Path to the firestore rules file
const rulesFilePath = path.join(process.cwd(), 'firestore.rules');

// Read the existing rules
let rulesContent;
try {
  rulesContent = fs.readFileSync(rulesFilePath, 'utf8');
  console.log('Successfully read existing Firestore rules.');
} catch (error) {
  console.error('Error reading Firestore rules file:', error);
  process.exit(1);
}

// Define new sound-related rules
const soundRules = `
    // Sound collection rules
    match /sounds/{soundId} {
      // Anyone can read sound data
      allow read: if true;
      
      // Only authenticated users with proper roles can create/update
      allow create, update: if isAuthenticated() && 
        (hasRole('admin') || hasRole('editor') || hasRole('analyst'));
        
      // Only admins can delete
      allow delete: if isAuthenticated() && hasRole('admin');
      
      // Sub-collections for sound data
      match /stats/{statsId} {
        allow read: if true;
        allow write: if isAuthenticated() && 
          (hasRole('admin') || hasRole('editor') || hasRole('analyst'));
      }
    }
    
    // Sound trends collection
    match /soundTrends/{trendId} {
      // Free users can only read basic trend data
      allow read: if true;
      
      // Premium users can read all trend data including predictions
      allow read: if isAuthenticated() && 
        (hasSubscription('premium') || hasSubscription('platinum') || hasRole('admin'));
        
      // Only admins and analysts can write trend data
      allow write: if isAuthenticated() && 
        (hasRole('admin') || hasRole('analyst'));
    }
    
    // Expert insights for sounds
    match /expertInsights/{insightId} {
      // Basic insights are readable by all users
      allow read: if resource.data.accessLevel == 'public';
      
      // Detailed insights require premium subscription
      allow read: if resource.data.accessLevel == 'premium' && 
        isAuthenticated() && 
        (hasSubscription('premium') || hasSubscription('platinum') || hasRole('admin'));
        
      // Advanced insights require platinum subscription
      allow read: if resource.data.accessLevel == 'platinum' && 
        isAuthenticated() && 
        (hasSubscription('platinum') || hasRole('admin'));
        
      // Only experts and admins can create/update insights
      allow create, update: if isAuthenticated() && 
        (hasRole('admin') || hasRole('expert') || hasRole('analyst'));
        
      // Only admins can delete insights
      allow delete: if isAuthenticated() && hasRole('admin');
    }
    
    // Sound-template correlations
    match /soundTemplateCorrelations/{correlationId} {
      // Anyone can read correlation data
      allow read: if true;
      
      // Only system and admins can write correlation data
      allow write: if isAuthenticated() && 
        (hasRole('admin') || hasRole('system'));
    }
`;

// Check if the rules already include sound-related rules
if (rulesContent.includes('match /sounds/{soundId}')) {
  console.log('Sound rules already exist in Firestore rules.');
  process.exit(0);
}

// Find the closing bracket of the service cloud.firestore block
const insertIndex = rulesContent.lastIndexOf('}');

if (insertIndex === -1) {
  console.error('Could not find the end of the service cloud.firestore block.');
  process.exit(1);
}

// Insert the sound rules before the closing bracket
const updatedRules = 
  rulesContent.substring(0, insertIndex) + 
  soundRules + 
  rulesContent.substring(insertIndex);

// Write the updated rules back to the file
try {
  fs.writeFileSync(rulesFilePath, updatedRules, 'utf8');
  console.log('Successfully updated Firestore rules.');
  console.log('To deploy these rules, run: firebase deploy --only firestore:rules');
} catch (error) {
  console.error('Error writing updated Firestore rules:', error);
  process.exit(1);
}

console.log('Firestore rules update completed.'); 