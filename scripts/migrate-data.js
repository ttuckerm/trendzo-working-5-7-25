// Firebase to Supabase migration script
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (requires service account JSON)
try {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')
    ),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration logs directory
const logDir = path.join(__dirname, '../migration-logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Create log file
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(logDir, `migration-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// ID mapping to track Firebase IDs to Supabase IDs
const idMap = {};

async function migrateFeatureFlags() {
  log('Starting feature flags migration...');
  const flagsSnapshot = await admin.firestore().collection('feature_flags').get();
  
  for (const doc of flagsSnapshot.docs) {
    const flag = doc.data();
    const { error } = await supabase
      .from('feature_flags')
      .insert([{
        name: flag.name,
        description: flag.description || `Feature flag for ${flag.name}`,
        enabled: flag.enabled || false,
        created_at: flag.created_at ? new Date(flag.created_at) : new Date(),
        updated_at: flag.updated_at ? new Date(flag.updated_at) : new Date()
      }]);
    
    if (error) {
      log(`Failed to migrate feature flag ${flag.name}: ${error.message}`);
    } else {
      log(`Migrated feature flag: ${flag.name}`);
    }
  }
  
  log('Feature flags migration completed');
}

async function migrateUsers() {
  log('Starting users migration...');
  // Get all Firebase users
  const usersResult = await admin.auth().listUsers();
  const users = usersResult.users;
  
  log(`Found ${users.length} users to migrate`);
  
  for (const firebaseUser of users) {
    try {
      log(`Processing user: ${firebaseUser.email}`);
      
      // Create user in Supabase (admin-level operation using service role)
      const { data: supabaseUser, error: createError } = await supabase.auth.admin.createUser({
        email: firebaseUser.email,
        email_confirm: true,
        password: generateTempPassword(), // You might want to use a secure method to generate passwords
        user_metadata: {
          migrated_from_firebase: true,
          firebase_uid: firebaseUser.uid
        }
      });
      
      if (createError) {
        log(`Failed to create user ${firebaseUser.email}: ${createError.message}`);
        continue;
      }
      
      log(`Created Supabase user for ${firebaseUser.email}`);
      
      // Store ID mapping
      idMap[firebaseUser.uid] = supabaseUser.id;
      
      // Fetch user profile from Firebase
      const profileDoc = await admin.firestore().collection('user_profiles')
        .where('user_id', '==', firebaseUser.uid).get();
      
      if (!profileDoc.empty) {
        const profile = profileDoc.docs[0].data();
        
        // Create user profile in Supabase
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: supabaseUser.id,
            tier: profile.tier || 'free',
            created_at: profile.created_at ? new Date(profile.created_at) : new Date(),
            updated_at: profile.updated_at ? new Date(profile.updated_at) : new Date(),
            settings: profile.settings || {}
          }]);
        
        if (profileError) {
          log(`Failed to create profile for ${firebaseUser.email}: ${profileError.message}`);
        } else {
          log(`Created profile for ${firebaseUser.email}`);
        }
      } else {
        // Create default profile
        const { error: defaultProfileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: supabaseUser.id,
            tier: 'free',
            created_at: new Date(),
            updated_at: new Date()
          }]);
        
        if (defaultProfileError) {
          log(`Failed to create default profile for ${firebaseUser.email}: ${defaultProfileError.message}`);
        } else {
          log(`Created default profile for ${firebaseUser.email}`);
        }
      }
    } catch (error) {
      log(`Error processing user ${firebaseUser.email}: ${error.message}`);
    }
  }
  
  // Save ID mapping to file for reference
  fs.writeFileSync(
    path.join(logDir, `id-mapping-${timestamp}.json`), 
    JSON.stringify(idMap, null, 2)
  );
  
  log('Users migration completed');
}

async function migrateTemplates() {
  log('Starting templates migration...');
  const templatesSnapshot = await admin.firestore().collection('templates').get();
  
  log(`Found ${templatesSnapshot.size} templates to migrate`);
  
  for (const doc of templatesSnapshot.docs) {
    const template = doc.data();
    
    try {
      // Map creator ID if available
      const creatorId = template.creator_id && idMap[template.creator_id] 
        ? idMap[template.creator_id] 
        : null;
      
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          name: template.name,
          description: template.description || '',
          content: template.content,
          category: template.category || 'general',
          is_public: template.is_public ?? true,
          creator_id: creatorId,
          created_at: template.created_at ? new Date(template.created_at) : new Date(),
          updated_at: template.updated_at ? new Date(template.updated_at) : new Date()
        }])
        .select()
        .single();
      
      if (error) {
        log(`Failed to migrate template ${template.name}: ${error.message}`);
        continue;
      }
      
      // Store template ID mapping
      idMap[doc.id] = data.id;
      log(`Migrated template: ${template.name}`);
      
      // Migrate template tags if any
      if (template.tags && Array.isArray(template.tags)) {
        for (const tag of template.tags) {
          const { error: tagError } = await supabase
            .from('template_tags')
            .insert([{
              template_id: data.id,
              tag: tag
            }]);
          
          if (tagError) {
            log(`Failed to add tag ${tag} to template ${template.name}: ${tagError.message}`);
          }
        }
      }
    } catch (error) {
      log(`Error migrating template ${template.name}: ${error.message}`);
    }
  }
  
  log('Templates migration completed');
}

async function migrateSounds() {
  log('Starting sounds migration...');
  const soundsSnapshot = await admin.firestore().collection('sounds').get();
  
  log(`Found ${soundsSnapshot.size} sounds to migrate`);
  
  for (const doc of soundsSnapshot.docs) {
    const sound = doc.data();
    
    try {
      const { data, error } = await supabase
        .from('sounds')
        .insert([{
          name: sound.name,
          url: sound.url,
          category: sound.category || 'general',
          duration: sound.duration || 0,
          created_at: sound.created_at ? new Date(sound.created_at) : new Date(),
          updated_at: sound.updated_at ? new Date(sound.updated_at) : new Date()
        }])
        .select()
        .single();
      
      if (error) {
        log(`Failed to migrate sound ${sound.name}: ${error.message}`);
        continue;
      }
      
      // Store sound ID mapping
      idMap[doc.id] = data.id;
      log(`Migrated sound: ${sound.name}`);
    } catch (error) {
      log(`Error migrating sound ${sound.name}: ${error.message}`);
    }
  }
  
  log('Sounds migration completed');
}

async function migrateSoundTemplateMappings() {
  log('Starting sound-template mappings migration...');
  const mappingsSnapshot = await admin.firestore().collection('sound_template_mappings').get();
  
  log(`Found ${mappingsSnapshot.size} mappings to migrate`);
  
  for (const doc of mappingsSnapshot.docs) {
    const mapping = doc.data();
    
    try {
      // Get mapped IDs from the ID mapping
      const templateId = idMap[mapping.template_id];
      const soundId = idMap[mapping.sound_id];
      
      if (!templateId || !soundId) {
        log(`Missing template or sound ID mapping for mapping ${doc.id}`);
        continue;
      }
      
      const { error } = await supabase
        .from('sound_template_mappings')
        .insert([{
          template_id: templateId,
          sound_id: soundId,
          position: mapping.position || 0,
          created_at: mapping.created_at ? new Date(mapping.created_at) : new Date()
        }]);
      
      if (error) {
        log(`Failed to migrate mapping: ${error.message}`);
      } else {
        log(`Migrated mapping between template ${templateId} and sound ${soundId}`);
      }
    } catch (error) {
      log(`Error migrating mapping ${doc.id}: ${error.message}`);
    }
  }
  
  log('Sound-template mappings migration completed');
}

async function migrateUserSavedTemplates() {
  log('Starting user saved templates migration...');
  const savedTemplatesSnapshot = await admin.firestore().collection('user_saved_templates').get();
  
  log(`Found ${savedTemplatesSnapshot.size} saved templates to migrate`);
  
  for (const doc of savedTemplatesSnapshot.docs) {
    const savedTemplate = doc.data();
    
    try {
      // Get mapped IDs
      const userId = idMap[savedTemplate.user_id];
      const templateId = idMap[savedTemplate.template_id];
      
      if (!userId || !templateId) {
        log(`Missing user or template ID mapping for saved template ${doc.id}`);
        continue;
      }
      
      const { error } = await supabase
        .from('user_saved_templates')
        .insert([{
          user_id: userId,
          template_id: templateId,
          saved_at: savedTemplate.saved_at ? new Date(savedTemplate.saved_at) : new Date()
        }]);
      
      if (error) {
        log(`Failed to migrate saved template: ${error.message}`);
      } else {
        log(`Migrated saved template for user ${userId}`);
      }
    } catch (error) {
      log(`Error migrating saved template ${doc.id}: ${error.message}`);
    }
  }
  
  log('User saved templates migration completed');
}

// Generate a temporary password for migrated users
function generateTempPassword() {
  return 'Temp' + Math.random().toString(36).substring(2, 10) + '!';
}

// Main migration function
async function runMigration() {
  log('Starting Firebase to Supabase migration...');
  
  try {
    // Migration order matters due to dependencies
    await migrateFeatureFlags();
    await migrateUsers();
    await migrateTemplates();
    await migrateSounds();
    await migrateSoundTemplateMappings();
    await migrateUserSavedTemplates();
    
    log('Migration completed successfully!');
  } catch (error) {
    log(`Migration failed: ${error.message}`);
  } finally {
    logStream.end();
  }
}

// Run the migration
runMigration();