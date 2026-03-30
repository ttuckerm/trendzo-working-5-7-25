#!/usr/bin/env node

/**
 * TRENDZO MVP - Data Seeding Script
 * Seeds the database with realistic test data for development and testing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility functions
const log = (message) => console.log(`🌱 ${message}`);
const error = (message) => console.error(`❌ ${message}`);
const success = (message) => console.log(`✅ ${message}`);

// Generate realistic visitor data
function generateVisitorId() {
  return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Sample data generators
const niches = ['business', 'creator', 'fitness', 'education'];
const platforms = ['linkedin', 'twitter', 'facebook', 'instagram'];
const locations = ['New York', 'California', 'Texas', 'Florida', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
const sources = ['google', 'facebook', 'instagram', 'twitter', 'direct', 'youtube'];
const devices = ['desktop', 'mobile', 'tablet'];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomTimestamp(daysAgo = 7) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (Math.random() * daysAgo * 24 * 60 * 60 * 1000));
  return pastDate.toISOString();
}

async function createUsers() {
  log('Creating sample users...');
  
  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@trendzo.com',
      role: 'admin',
      subscription_tier: 'admin',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'creator1@example.com',
      role: 'user',
      subscription_tier: 'premium',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'business@example.com',
      role: 'user',
      subscription_tier: 'business',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'fitness@example.com',
      role: 'user',
      subscription_tier: 'free',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      email: 'educator@example.com',
      role: 'user',
      subscription_tier: 'premium',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      email: 'viral.creator@example.com',
      role: 'user',
      subscription_tier: 'business',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      email: 'newbie@example.com',
      role: 'user',
      subscription_tier: 'free',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { error: usersError } = await supabase
    .from('users')
    .upsert(users);

  if (usersError) {
    error(`Failed to create users: ${usersError.message}`);
    return false;
  }

  success(`Created ${users.length} sample users`);
  return true;
}

async function createLandingPages() {
  log('Creating landing pages for all niche/platform combinations...');
  
  const landingPages = [];
  let idCounter = 1001;

  for (const niche of niches) {
    for (const platform of platforms) {
      landingPages.push({
        id: `550e8400-e29b-41d4-a716-446655441${idCounter.toString().padStart(3, '0')}`,
        niche,
        platform,
        ab_variant: 'control',
        content: {
          headline: `${niche.charAt(0).toUpperCase() + niche.slice(1)} Success on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
          subheadline: `Create viral ${platform} content in 60 seconds`,
          cta: 'Start Creating Now'
        },
        performance_data: {
          visitors: Math.floor(Math.random() * 2000) + 500,
          conversions: Math.floor(Math.random() * 300) + 50,
          conversionRate: Math.floor(Math.random() * 10) + 10
        },
        created_at: getRandomTimestamp(30)
      });
      idCounter++;
    }
  }

  const { error: landingError } = await supabase
    .from('landing_pages')
    .upsert(landingPages);

  if (landingError) {
    error(`Failed to create landing pages: ${landingError.message}`);
    return false;
  }

  success(`Created ${landingPages.length} landing pages`);
  return true;
}

async function createTemplates() {
  log('Creating sample templates...');
  
  const templates = [
    {
      id: '550e8400-e29b-41d4-a716-446655442001',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'LinkedIn Authority Builder',
      niche: 'business',
      platform: 'linkedin',
      script: 'Hook: The ONE mistake 90% of professionals make on LinkedIn...',
      viral_score: 92,
      usage_count: 245,
      is_public: true,
      metadata: { tags: ['authority', 'professional'], duration: 30 }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655442002',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Twitter Thread Template',
      niche: 'business',
      platform: 'twitter',
      script: 'Thread starter: I made $50k from one Twitter thread. Here\'s the exact formula: [1/8]',
      viral_score: 89,
      usage_count: 567,
      is_public: true,
      metadata: { tags: ['thread', 'monetization'], duration: 45 }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655442003',
      user_id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Viral Fitness Transformation',
      niche: 'fitness',
      platform: 'instagram',
      script: 'Hook: 30 days ago I couldn\'t do a single push-up. Today...',
      viral_score: 94,
      usage_count: 1203,
      is_public: true,
      metadata: { tags: ['transformation', 'motivation'], duration: 15 }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655442004',
      user_id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Educational Explainer',
      niche: 'education',
      platform: 'instagram',
      script: 'Hook: Your teacher never told you this math trick...',
      viral_score: 87,
      usage_count: 834,
      is_public: true,
      metadata: { tags: ['education', 'tutorial'], duration: 60 }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655442005',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Creator Economy Insights',
      niche: 'creator',
      platform: 'twitter',
      script: 'Hook: The creator economy is broken. Here\'s how to fix it...',
      viral_score: 76,
      usage_count: 156,
      is_public: true,
      metadata: { tags: ['creator', 'economy'], duration: 90 }
    }
  ];

  const { error: templatesError } = await supabase
    .from('templates')
    .upsert(templates);

  if (templatesError) {
    error(`Failed to create templates: ${templatesError.message}`);
    return false;
  }

  success(`Created ${templates.length} sample templates`);
  return true;
}

async function generateRealisticAnalytics() {
  log('Generating realistic analytics events...');
  
  const events = [];
  const eventTypes = ['page_view', 'exit_intent_trigger', 'exit_intent_convert', 'editor_entry', 'template_select', 'template_complete'];
  
  // Generate events for the last 7 days
  for (let i = 0; i < 500; i++) {
    const visitorId = generateVisitorId();
    const sessionId = generateSessionId();
    const niche = getRandomItem(niches);
    const platform = getRandomItem(platforms);
    const eventType = getRandomItem(eventTypes);
    const location = getRandomItem(locations);
    const source = getRandomItem(sources);
    const device = getRandomItem(devices);
    
    events.push({
      id: `550e8400-e29b-41d4-a716-446655445${String(i + 1).padStart(3, '0')}`,
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: eventType,
      metadata: {
        niche,
        platform,
        location,
        ...(eventType === 'template_complete' && {
          templateId: '550e8400-e29b-41d4-a716-446655442001',
          viralScore: Math.floor(Math.random() * 40) + 60,
          completionTime: Math.floor(Math.random() * 300) + 60
        }),
        ...(eventType === 'exit_intent_trigger' && {
          trigger: getRandomItem(['mouse', 'scroll', 'time']),
          timeOnPage: Math.floor(Math.random() * 120) + 10
        })
      },
      device_type: device,
      utm_source: source,
      utm_medium: source === 'direct' ? 'direct' : 'social',
      utm_campaign: `${niche}_${platform}`,
      created_at: getRandomTimestamp(7)
    });
  }

  // Insert in batches to avoid hitting limits
  const batchSize = 100;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const { error: analyticsError } = await supabase
      .from('campaign_analytics')
      .upsert(batch);

    if (analyticsError) {
      error(`Failed to create analytics batch ${i}: ${analyticsError.message}`);
      return false;
    }
  }

  success(`Generated ${events.length} analytics events`);
  return true;
}

async function createEmailCaptures() {
  log('Creating email captures...');
  
  const captures = [
    {
      id: '550e8400-e29b-41d4-a716-446655443001',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      landing_page_id: '550e8400-e29b-41d4-a716-446655441001',
      template_id: '550e8400-e29b-41d4-a716-446655442001',
      source: 'landing_exit',
      metadata: { exitTrigger: 'mouse', timeOnPage: 47 },
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655443002',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      landing_page_id: '550e8400-e29b-41d4-a716-446655441008',
      template_id: '550e8400-e29b-41d4-a716-446655442003',
      source: 'template_complete',
      metadata: { viralScore: 94, completionTime: 180 },
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655443003',
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      landing_page_id: '550e8400-e29b-41d4-a716-446655441012',
      source: 'landing_exit',
      metadata: { exitTrigger: 'scroll', timeOnPage: 23 },
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { error: capturesError } = await supabase
    .from('email_captures')
    .upsert(captures);

  if (capturesError) {
    error(`Failed to create email captures: ${capturesError.message}`);
    return false;
  }

  success(`Created ${captures.length} email captures`);
  return true;
}

async function runSQLSeed() {
  log('Running SQL seed file...');
  
  try {
    const sqlPath = path.join(__dirname, 'seed-mvp-data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Note: This is a simplified approach. In production, you'd want to
    // parse and execute SQL statements properly
    success('SQL seed file ready (execute manually in Supabase dashboard)');
    log(`SQL file location: ${sqlPath}`);
    
    return true;
  } catch (err) {
    error(`Failed to read SQL file: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🌱 Starting TRENDZO MVP data seeding...\n');
  
  try {
    // Test connection
    const { data, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      error(`Failed to connect to Supabase: ${testError.message}`);
      process.exit(1);
    }
    
    success('Connected to Supabase successfully');
    
    // Run seeding functions
    const results = await Promise.all([
      createUsers(),
      createLandingPages(),
      createTemplates(),
      createEmailCaptures(),
      generateRealisticAnalytics()
    ]);
    
    if (results.every(Boolean)) {
      success('\n🎉 All seed data created successfully!');
      log('\nNext steps:');
      log('1. Run the SQL seed file in your Supabase dashboard');
      log('2. Verify data in your database tables');
      log('3. Test the analytics functions');
      log('4. Set up your Beehiiv integration');
    } else {
      error('\n❌ Some seeding operations failed. Check the logs above.');
      process.exit(1);
    }
    
  } catch (err) {
    error(`Seeding failed: ${err.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createUsers,
  createLandingPages,
  createTemplates,
  createEmailCaptures,
  generateRealisticAnalytics
};