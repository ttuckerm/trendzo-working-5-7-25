/**
 * Supabase Schema Setup
 * 
 * This script creates the necessary tables in Supabase for TikTok template tracking.
 * It implements the schema requirements specified in the development plan.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Need the service key for schema modifications

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Execute SQL queries to set up the schema
 */
async function setupSchema() {
  console.log('Setting up Supabase schema...');
  
  // Use axios for API calls
  const axios = require('axios');
  
  try {
    // Create tiktok_templates table
    try {
      await axios.post(`${supabaseUrl}/rest/v1/rpc/create_tiktok_templates`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      console.log('✅ Successfully created tiktok_templates table');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message &&
          error.response.data.message.includes('already exists')) {
        console.log('✅ tiktok_templates table already exists');
      } else {
        console.error('Failed to create tiktok_templates table:', error.message);
        if (error.response) {
          console.error('Error details:', error.response.data);
        }
        return false;
      }
    }
    
    // Create template_expert_insights table
    try {
      await axios.post(`${supabaseUrl}/rest/v1/rpc/create_template_expert_insights`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      console.log('✅ Successfully created template_expert_insights table');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message &&
          error.response.data.message.includes('already exists')) {
        console.log('✅ template_expert_insights table already exists');
      } else {
        console.error('Failed to create template_expert_insights table:', error.message);
        if (error.response) {
          console.error('Error details:', error.response.data);
        }
        return false;
      }
    }
    
    // Create template_audit_logs table
    try {
      await axios.post(`${supabaseUrl}/rest/v1/rpc/create_template_audit_logs`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      console.log('✅ Successfully created template_audit_logs table');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message &&
          error.response.data.message.includes('already exists')) {
        console.log('✅ template_audit_logs table already exists');
      } else {
        console.error('Failed to create template_audit_logs table:', error.message);
        if (error.response) {
          console.error('Error details:', error.response.data);
        }
        return false;
      }
    }
    
    console.log('Schema setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Schema setup failed:', error.message);
    return false;
  }
}

// Create the SQL functions that will set up our tables
async function createDatabaseFunctions() {
  console.log('Creating database functions...');
  
  // Function to create tiktok_templates table
  const createTikTokTemplatesSQL = `
    CREATE OR REPLACE FUNCTION create_tiktok_templates()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Create the table if it doesn't exist
      CREATE TABLE IF NOT EXISTS tiktok_templates (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        duration INTEGER,
        thumbnail_url TEXT,
        video_url TEXT,
        structure JSONB NOT NULL DEFAULT '{"sections": []}',
        engagement_metrics JSONB NOT NULL DEFAULT '{"views": 0, "likes": 0, "comments": 0, "shares": 0}',
        growth_data JSONB NOT NULL DEFAULT '{"velocity": 0, "acceleration": 0}',
        is_trending BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Add comment to the table
      COMMENT ON TABLE tiktok_templates IS 'Stores TikTok template metadata and structure';
    END;
    $$;
  `;
  
  // Function to create template_expert_insights table
  const createTemplateExpertInsightsSQL = `
    CREATE OR REPLACE FUNCTION create_template_expert_insights()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Create the table if it doesn't exist
      CREATE TABLE IF NOT EXISTS template_expert_insights (
        id BIGSERIAL PRIMARY KEY,
        template_id BIGINT REFERENCES tiktok_templates(id) ON DELETE CASCADE,
        tags TEXT[] DEFAULT '{}',
        notes TEXT,
        manual_adjustment BOOLEAN DEFAULT false,
        adjustment_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_by TEXT
      );
      
      -- Add comment to the table
      COMMENT ON TABLE template_expert_insights IS 'Stores expert insights and manual adjustments for templates';
    END;
    $$;
  `;
  
  // Function to create template_audit_logs table
  const createTemplateAuditLogsSQL = `
    CREATE OR REPLACE FUNCTION create_template_audit_logs()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Create the table if it doesn't exist
      CREATE TABLE IF NOT EXISTS template_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        template_id BIGINT REFERENCES tiktok_templates(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        changes JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_by TEXT
      );
      
      -- Add comment to the table
      COMMENT ON TABLE template_audit_logs IS 'Tracks changes to templates for auditing purposes';
    END;
    $$;
  `;
  
  try {
    // Use axios for API calls
    const axios = require('axios');
    let success = true;
    
    // Create the tiktok_templates function
    try {
      const response1 = await axios.post(`${supabaseUrl}/rest/v1/rpc/create_sql_function`, {
        function_name: 'create_tiktok_templates',
        function_definition: createTikTokTemplatesSQL
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      console.log('✅ Successfully created tiktok_templates function');
    } catch (error) {
      console.error('Failed to create tiktok_templates function:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      success = false;
    }
    
    // Create the template_expert_insights function
    try {
      const response2 = await axios.post(`${supabaseUrl}/rest/v1/rpc/create_sql_function`, {
        function_name: 'create_template_expert_insights',
        function_definition: createTemplateExpertInsightsSQL
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      console.log('✅ Successfully created template_expert_insights function');
    } catch (error) {
      console.error('Failed to create template_expert_insights function:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      success = false;
    }
    
    // Create the template_audit_logs function
    try {
      const response3 = await axios.post(`${supabaseUrl}/rest/v1/rpc/create_sql_function`, {
        function_name: 'create_template_audit_logs',
        function_definition: createTemplateAuditLogsSQL
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      console.log('✅ Successfully created template_audit_logs function');
    } catch (error) {
      console.error('Failed to create template_audit_logs function:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      success = false;
    }
    
    return success;
  } catch (error) {
    console.error('Failed to create database functions:', error.message);
    return false;
  }
}

// Create function to create SQL functions (meta!)
async function createMetaFunction() {
  console.log('Creating meta function for SQL function creation...');
  
  const createSqlFunctionSQL = `
    CREATE OR REPLACE FUNCTION create_sql_function(function_name TEXT, function_definition TEXT)
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      EXECUTE function_definition;
    END;
    $$;
  `;
  
  try {
    // Use axios instead of supabase client
    const axios = require('axios');
    
    const response = await axios.post(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      sql: createSqlFunctionSQL
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
    console.log('✅ Successfully created meta function');
    return true;
  } catch (error) {
    console.error('Failed to create meta function:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Network issue?');
    }
    return false;
  }
}

// Function to execute arbitrary SQL
async function createExecSqlFunction() {
  console.log('Creating exec_sql function using axios...');
  
  // Use axios for the HTTP request
  const axios = require('axios');
  
  try {
    const response = await axios.post(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      sql: `
        CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
    console.log('✅ Successfully created exec_sql function');
    return true;
  } catch (error) {
    // If the function already exists, that's fine
    console.error('Failed to create exec_sql function:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Network issue?');
    }
    console.log('Attempting to continue anyway...');
    return true;
  }
}

// Main function to run everything
async function main() {
  // Check if we have access to supabase.rpc - if not, we need to create our helper functions
  try {
    // Step 1: Create the exec_sql function if we don't have it
    await createExecSqlFunction();
    
    // Step 2: Create the meta function that lets us create other functions
    const metaSuccess = await createMetaFunction();
    
    if (!metaSuccess) {
      console.error('Failed to create fundamental database functions. Exiting.');
      process.exit(1);
    }
    
    // Step 3: Create our specific table creation functions
    const functionsCreated = await createDatabaseFunctions();
    
    if (!functionsCreated) {
      console.error('Failed to create database table functions. Exiting.');
      process.exit(1);
    }
    
    // Step 4: Execute the functions to create the actual tables
    const success = await setupSchema();
    
    if (success) {
      console.log('All schema setup completed successfully! 🎉');
      process.exit(0);
    } else {
      console.error('Schema setup failed. 😢');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during schema setup:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 