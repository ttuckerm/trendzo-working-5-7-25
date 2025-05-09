# TikTok Templates ETL Process

This directory contains the Extract, Transform, Load (ETL) process for trending TikTok templates. The ETL process scrapes popular TikTok videos, analyzes them for template structures, and stores the results in Firebase.

## Overview

The ETL process is broken down into several key components:

1. **Extraction**: Using the Apify TikTok Scraper to fetch trending videos
2. **Transformation**: Analyzing videos to extract template sections and text overlays
3. **Loading**: Storing processed templates in Firebase for use in the application

## Components

### TikTok Template ETL Coordinator (`tiktokTemplateEtl.ts`)

The main coordinator that orchestrates the entire ETL process. It provides methods for:

- Processing trending videos (`processHotTrends`)
- Processing videos by categories (`processByCategories`)
- Updating statistics for existing templates (`updateTemplateStats`)

### AI Template Analysis ETL (`aiTemplateAnalysisEtl.ts`)

An advanced ETL coordinator that uses Claude AI for deep template analysis:

- Process trending videos with AI-enhanced analysis (`processTrendingWithAI`)
- Process category videos with AI-enhanced analysis (`processCategoryWithAI`)
- Update template analytics and velocity metrics (`updateTemplateAnalysisAndMetrics`)
- Update metrics for all templates (`updateAllTemplateMetrics`)

### Apify Service (`apifyService.ts`)

A service wrapper for the Apify API, specifically for the TikTok Scraper. It provides:

- Methods to scrape trending videos
- Methods to search by hashtag or category
- Customizable scraping parameters

### Template Analysis Service (`templateAnalysisService.ts`)

A service that analyzes TikTok videos to extract template data:

- Analyzes video structure and content
- Extracts sections (intro, content, outro)
- Identifies text overlays and their styles
- Categorizes videos based on content

### Advanced Template Analysis Service (`advancedTemplateAnalysisService.ts`)

A service that uses Claude AI to perform advanced analysis of TikTok videos:

- Enhanced template section detection with AI
- Content and engagement pattern analysis
- Template similarity calculations
- Engagement velocity tracking

### Trending Template Service (`trendingTemplateService.ts`)

A service for managing trending templates in Firebase:

- Create, read, update, and delete templates
- Filter templates by category or engagement
- Update template statistics

## Usage

### Via API

The ETL process can be triggered via the API endpoints:

```
POST /api/etl/run-tiktok-etl     # Basic ETL
POST /api/etl/ai-template-analysis   # AI-powered analysis
```

These endpoints require authentication via the `ETL_API_KEY` environment variable.

Example request body for basic ETL:

```json
{
  "type": "trending",
  "options": {
    "maxItems": 30
  }
}
```

Example request body for AI template analysis:

```json
{
  "type": "trending",
  "options": {
    "maxItems": 20
  }
}
```

Available types for AI template analysis:
- `trending`: Process trending videos with AI analysis
- `category`: Process videos by category with AI analysis (requires `options.category`)
- `update-metrics`: Update metrics for existing templates (optional `options.templateId` or `options.limit`)

### Via Admin Dashboard

The admin dashboard at `/admin/etl-dashboard` provides a user interface for:

- Running the ETL process for trending videos
- Running the ETL process for specific categories
- Updating template statistics

## Authentication

The ETL process and admin dashboard are restricted to admin users:

- API calls require the `ETL_API_KEY` for authentication
- The admin dashboard requires a user with admin privileges (email matches `NEXT_PUBLIC_ADMIN_EMAIL`)

## Environment Variables

The ETL process requires the following environment variables:

- `APIFY_API_TOKEN`: Your Apify API token for the TikTok scraper
- `ETL_API_KEY`: Secret key for authenticating API calls
- `NEXT_PUBLIC_ADMIN_EMAIL`: Email address of the admin user
- `NEXT_PUBLIC_ETL_API_KEY`: Client-side ETL API key for admin dashboard

For the AI-powered template analysis, you also need:
- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude AI

## Custom Deployment

To run the ETL process on a schedule, consider setting up a cron job or using a service like Vercel Cron to call the ETL API endpoint at regular intervals.

Example cron expression for running daily:

```
0 0 * * * curl -X POST https://your-app.com/api/etl/run-tiktok-etl -H "Authorization: Bearer YOUR_ETL_API_KEY" -H "Content-Type: application/json" -d '{"type":"trending"}'
```

## Testing the ETL System

We've added scripts to test all components of the ETL system:

### Prerequisites

1. Ensure your `.env.local` file has the required environment variables:
   - `APIFY_API_TOKEN`: Your Apify API token
   - `ETL_API_KEY`: Secret key for authenticating ETL API requests
   - `NEXT_PUBLIC_ETL_API_KEY`: Client-side version of the ETL API key
   - `NEXT_PUBLIC_ADMIN_EMAIL`: Email of the admin user who can access the ETL dashboard

2. Make sure your Firebase project is properly configured

### Running Tests

We provide several testing scripts to verify different components of the ETL system:

```bash
# Test entire ETL system
npm run test-etl

# Test only the Apify scraper
npm run test-etl apify

# Test only the Firebase storage
npm run test-etl firebase

# Test only the scheduled job functionality
npm run test-etl scheduled

# Show help information
npm run test-etl --help
```

### Scheduling ETL Jobs

You can use the scheduler script to set up regular ETL jobs:

```bash
# Start the scheduler (runs in background)
npm run schedule-etl

# Run a trending ETL job manually
npm run schedule-etl run-trending

# Run a categories ETL job manually
npm run schedule-etl run-categories

# Run a template stats update job manually
npm run schedule-etl run-update-stats

# Show help information
npm run schedule-etl --help
```

The scheduler uses the following default schedules:
- Trending ETL: Every 6 hours
- Categories ETL: Once per day at midnight
- Template Stats Update: Every 12 hours

You can modify these schedules in the `scripts/schedule-etl.js` file.

## Troubleshooting

If you encounter issues with the ETL process, try these steps:

1. **Apify Integration Issues:**
   - Verify your Apify API token is valid
   - Check the Apify console to see if the scraper is running correctly
   - Inspect the Apify dataset to ensure data is being collected

2. **Firebase Storage Issues:**
   - Check Firebase console for any permission errors
   - Verify your service account has proper permissions
   - Look for quota limitations or restrictions

3. **Scheduled Job Issues:**
   - Ensure the server running the jobs remains active
   - Check for network connectivity issues
   - Verify that the ETL API endpoint is accessible 