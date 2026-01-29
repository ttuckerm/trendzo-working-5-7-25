// Deploy viral prediction database schema to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageeckeehyhj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8'
);

async function deployTables() {
  console.log('🚀 Starting database schema deployment...');

  // Core tables to create manually since we can't execute raw SQL
  const tables = [
    {
      name: 'predictions',
      sql: `
        CREATE TABLE IF NOT EXISTS predictions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          video_id UUID REFERENCES videos(id),
          predicted_viral_probability DECIMAL(5, 4),
          predicted_peak_time TIMESTAMP WITH TIME ZONE,
          confidence_level VARCHAR(10) CHECK (confidence_level IN ('high', 'medium', 'low')),
          recommended_actions TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'hook_detections',
      sql: `
        CREATE TABLE IF NOT EXISTS hook_detections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          video_id UUID REFERENCES videos(id),
          hook_type VARCHAR(100),
          confidence_score DECIMAL(5, 4),
          expected_success_rate DECIMAL(5, 4),
          hook_position_seconds INTEGER,
          detected_elements JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'psychological_engagement',
      sql: `
        CREATE TABLE IF NOT EXISTS psychological_engagement (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          video_id UUID REFERENCES videos(id),
          emotional_arousal_score DECIMAL(5, 2),
          arousal_type VARCHAR(50),
          social_currency_score DECIMAL(5, 2),
          parasocial_strength DECIMAL(5, 2),
          memory_stickiness DECIMAL(5, 2),
          shareability_triggers JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'production_quality',
      sql: `
        CREATE TABLE IF NOT EXISTS production_quality (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          video_id UUID REFERENCES videos(id),
          shot_pacing_score DECIMAL(5, 2),
          authenticity_balance DECIMAL(5, 2),
          calculated_spontaneity_score DECIMAL(5, 2),
          visual_complexity INTEGER,
          audio_quality_score DECIMAL(5, 2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'cultural_timing',
      sql: `
        CREATE TABLE IF NOT EXISTS cultural_timing (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          video_id UUID REFERENCES videos(id),
          trend_stage VARCHAR(20) CHECK (trend_stage IN ('emerging', 'growing', 'peak', 'declining')),
          hours_until_peak DECIMAL(6, 2),
          cultural_relevance_score DECIMAL(5, 2),
          trending_topics JSONB DEFAULT '[]',
          cultural_events JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];

  for (const table of tables) {
    try {
      console.log(`📊 Creating table: ${table.name}`);
      // Use a simple insert to test if table exists, then create if it doesn't
      const { error } = await supabase.from(table.name).select('*').limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log(`❌ Table ${table.name} doesn't exist, need to create manually in Supabase dashboard`);
        console.log(`SQL to run: ${table.sql}`);
      } else {
        console.log(`✅ Table ${table.name} already exists`);
      }
    } catch (err) {
      console.log(`❌ Error checking table ${table.name}:`, err.message);
    }
  }

  // Test all our required tables
  const requiredTables = ['videos', 'predictions', 'hook_detections', 'psychological_engagement', 'production_quality', 'cultural_timing'];
  
  console.log('\n📋 Table Status Check:');
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: EXISTS (${data.length} sample records)`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Connection error`);
    }
  }
}

deployTables().catch(console.error);