# TikTok Template Tracker - Database Schema

This document outlines the Supabase database schema for the TikTok Template Tracker application and provides instructions for setting up and using the database.

## Important: Supabase Configuration

Before setting up the database schema, you need a valid Supabase project. The current configuration in the environment files points to a Supabase project that may not be accessible due to DNS resolution issues.

**To resolve this issue:**

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Once created, get your project URL and API keys from the Supabase dashboard
3. Update your `.env.local` file with the correct values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   NEXT_PUBLIC_USE_SUPABASE=true
   ```

## Manual Schema Setup

If you're experiencing issues with the automated schema setup script, you can manually set up the schema:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `scripts/create-tables.sql`
4. Run the SQL script to create the tables

## Schema Overview

The TikTok Template Tracker database schema includes the following tables:

1. **tiktok_templates** - Stores template metadata, structure, engagement metrics, and growth data
2. **template_expert_insights** - Stores expert insights, tags, and manual adjustments for templates
3. **template_audit_logs** - Tracks changes to templates for auditing purposes

## Database Structure

### tiktok_templates

Stores TikTok template metadata and structure:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| title | TEXT | Template title |
| description | TEXT | Template description |
| category | TEXT | Template category |
| duration | INTEGER | Duration in seconds |
| thumbnail_url | TEXT | URL to template thumbnail |
| video_url | TEXT | URL to template video |
| structure | JSONB | Template structure with sections, transitions, etc. |
| engagement_metrics | JSONB | Views, likes, comments, shares |
| growth_data | JSONB | Velocity and acceleration of metrics |
| is_trending | BOOLEAN | Whether the template is currently trending |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### template_expert_insights

Stores expert insights and manual adjustments for templates:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| template_id | BIGINT | Foreign key to tiktok_templates |
| tags | TEXT[] | Array of tags applied to the template |
| notes | TEXT | Expert notes about the template |
| manual_adjustment | BOOLEAN | Whether expert manually adjusted values |
| adjustment_reason | TEXT | Reason for manual adjustment |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| created_by | TEXT | User who created the insight |

### template_audit_logs

Tracks changes to templates for auditing purposes:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| template_id | BIGINT | Foreign key to tiktok_templates |
| action | TEXT | Action performed (create, update, delete) |
| changes | JSONB | JSON describing changes made |
| created_at | TIMESTAMPTZ | Timestamp of the action |
| created_by | TEXT | User who performed the action |

## Setup Instructions

Follow these steps to set up the database schema:

1. Ensure you have Supabase credentials in your `.env.local` file
2. Run `npm run setup-test-env` to create the `.env.local` file if it doesn't exist
3. Run `npm run setup-supabase-schema` to create the database schema
4. Verify the schema by running `npm run test:supabase-schema`

If you encounter issues with the automated setup, use the manual setup method described above.

## Usage Examples

Here are some examples of how to interact with the database:

```javascript
// Get all trending templates
const { data: trendingTemplates } = await supabase
  .from('tiktok_templates')
  .select('*')
  .eq('is_trending', true);

// Get a template with its expert insights
const { data: template } = await supabase
  .from('tiktok_templates')
  .select(`
    *,
    template_expert_insights (*)
  `)
  .eq('id', templateId)
  .single();

// Create a new template
const { data: newTemplate, error } = await supabase
  .from('tiktok_templates')
  .insert({
    title: 'New Template',
    description: 'A new template for testing',
    category: 'test',
    structure: { sections: [] },
    engagement_metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
    growth_data: { velocity: 0, acceleration: 0 },
    is_trending: false
  })
  .select()
  .single();
```

## Testing

To run the TikTok template service tests:

```bash
npm run test:tiktok-template-service
```

## Integration with ETL Process

The database schema is designed to work with the ETL process that fetches data from the Apify TikTok scraper. After setting up the database schema, you can:

1. Configure the Apify TikTok scraper (see the ETL documentation)
2. Run the ETL process to populate the database
3. Use the TikTok template service to query and manipulate the data

## Data Model Visualization

```
+-------------------+       +--------------------------+       +----------------------+
| tiktok_templates  |       | template_expert_insights |       | template_audit_logs  |
+-------------------+       +--------------------------+       +----------------------+
| id                |<----->| template_id              |       | id                   |
| title             |       | tags                     |       | template_id          |
| description       |       | notes                    |       | action               |
| category          |       | manual_adjustment        |       | changes              |
| duration          |       | adjustment_reason        |       | created_at           |
| thumbnail_url     |       | created_at               |       | created_by           |
| video_url         |       | updated_at               |       +----------------------+
| structure         |       | created_by               |
| engagement_metrics|       +--------------------------+
| growth_data       |
| is_trending       |
| created_at        |
| updated_at        |
+-------------------+
``` 