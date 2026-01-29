#!/bin/bash

# Deploy Trendzo Schema to Supabase
echo "🚀 Deploying Trendzo Database Schema to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Run the migration
echo "📦 Running database migration..."
supabase db push

# If direct SQL execution is needed (alternative method)
# supabase db execute -f scripts/create-trendzo-schema.sql

echo "✅ Schema deployment complete!"
echo ""
echo "📊 To verify the deployment, run these queries in Supabase SQL Editor:"
echo ""
echo "-- Check module health data:"
echo "SELECT * FROM module_health ORDER BY module_name;"
echo ""
echo "-- Count viral templates:"
echo "SELECT COUNT(*) FROM viral_templates;"
echo ""
echo "-- Check if video_predictions table exists:"
echo "SELECT COUNT(*) FROM video_predictions;"
echo ""
echo "-- List all created tables:"
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('viral_templates', 'prediction_accuracy', 'module_health', 'script_patterns', 'recipe_book_daily');"