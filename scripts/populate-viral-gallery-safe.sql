-- =====================================================
-- CONSTRAINT-SAFE VIRAL VIDEO GALLERY POPULATION
-- =====================================================
-- This script safely populates viral_video_gallery while respecting foreign key constraints
-- Uses BMAD methodology: Build → Maintain → Audit → Deploy

-- AUDIT PHASE: Check existing constraints and dependencies
DO $$
DECLARE
    existing_videos_count INTEGER;
    existing_mappings_count INTEGER;
BEGIN
    -- Check what exists
    SELECT COUNT(*) INTO existing_videos_count FROM viral_video_gallery;
    SELECT COUNT(*) INTO existing_mappings_count FROM video_framework_mapping;
    
    RAISE NOTICE 'AUDIT: Found % existing videos, % existing mappings', existing_videos_count, existing_mappings_count;
END $$;

-- MAINTAIN PHASE: Safely remove dependencies before parent records
-- Step 1: Clear framework mappings first (child table)
DELETE FROM video_framework_mapping;
RAISE NOTICE 'MAINTAIN: Cleared video_framework_mapping table safely';

-- Step 2: Now safe to clear parent table
DELETE FROM viral_video_gallery;
RAISE NOTICE 'MAINTAIN: Cleared viral_video_gallery table safely';

-- BUILD PHASE: Insert new data with proper relationships
-- Insert viral video gallery data with consistent UUIDs
INSERT INTO viral_video_gallery (
    id, title, creator_name, thumbnail_url, view_count, viral_score, 
    platform, duration_seconds, is_featured, display_order
) VALUES 
-- Video 1: Authority Hook Example
(
    '550e8400-e29b-41d4-a716-446655440001',
    'How I Built a 7-Figure Business in 6 Months',
    'entrepreneurmindset',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop&auto=format',
    2400000,
    94.20,
    'tiktok',
    58,
    true,
    1
),
-- Video 2: Before/After Transformation Example
(
    '550e8400-e29b-41d4-a716-446655440002',
    'This Morning Routine Changed My Life',
    'productivityguru',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&auto=format',
    1800000,
    91.70,
    'tiktok',
    45,
    true,
    2
),
-- Video 3: Secret Knowledge Reveal Example
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Secret Productivity Hack Nobody Talks About',
    'lifehacker_official',
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=600&fit=crop&auto=format',
    1500000,
    89.30,
    'tiktok',
    32,
    true,
    3
),
-- Video 4: POV Relatability Example
(
    '550e8400-e29b-41d4-a716-446655440004',
    'POV: You Just Discovered Your Passion',
    'creativesoul',
    'https://images.unsplash.com/photo-1494790108755-2616c27de05c?w=400&h=600&fit=crop&auto=format',
    1200000,
    87.80,
    'tiktok',
    28,
    true,
    4
),
-- Video 5: Psychology Authority Example
(
    '550e8400-e29b-41d4-a716-446655440005',
    'Psychology Trick That Makes People Listen',
    'psychologyhacks',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop&auto=format',
    980000,
    85.40,
    'tiktok',
    41,
    true,
    5
),
-- Video 6: Challenge Documentation Example
(
    '550e8400-e29b-41d4-a716-446655440006',
    'Before vs After: 30 Days of This Habit',
    'transformationtuesday',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&auto=format',
    850000,
    83.90,
    'tiktok',
    52,
    true,
    6
);

RAISE NOTICE 'BUILD: Inserted % viral videos successfully', (SELECT COUNT(*) FROM viral_video_gallery);

-- BUILD PHASE: Create framework mappings (child table after parent)
-- Insert framework mappings with proper video-to-framework relationships
WITH video_recipe_pairs AS (
  SELECT 
    v.id as video_id,
    r.id as framework_id,
    v.title,
    v.duration_seconds,
    r.recipe_name,
    r.effectiveness_score
  FROM viral_video_gallery v
  CROSS JOIN viral_recipe_book r
  WHERE 
    (v.title LIKE '%Built a 7-Figure Business%' AND r.recipe_name = 'Authority Hook') OR
    (v.title LIKE '%Morning Routine%' AND r.recipe_name = 'Before/After Transformation') OR
    (v.title LIKE '%Secret Productivity%' AND r.recipe_name = 'Secret Knowledge Reveal') OR
    (v.title LIKE '%POV: You Just%' AND r.recipe_name = 'POV Relatability') OR
    (v.title LIKE '%Psychology Trick%' AND r.recipe_name = 'Authority Hook') OR
    (v.title LIKE '%Before vs After%' AND r.recipe_name = 'Before/After Transformation')
)
INSERT INTO video_framework_mapping (video_id, framework_id, mapping_confidence, workspace_config_cached)
SELECT 
  video_id,
  framework_id,
  LEAST(0.950, effectiveness_score), -- Use framework effectiveness as confidence
  jsonb_build_object(
    'workspaceId', 'ws_' || extract(epoch from now())::text || '_' || substring(video_id::text, 1, 8),
    'recommendedFramework', jsonb_build_object(
      'id', framework_id,
      'name', recipe_name,
      'confidence', LEAST(0.950, effectiveness_score),
      'description', 'ML-matched framework based on viral pattern analysis'
    ),
    'suggestedHooks', CASE 
      WHEN recipe_name = 'Authority Hook' THEN 
        '["Establish your credentials immediately", "Share specific results or numbers", "Use authoritative language"]'::jsonb
      WHEN recipe_name = 'Before/After Transformation' THEN 
        '["Show the dramatic change", "Reveal the simple method", "Connect with viewer struggle"]'::jsonb
      WHEN recipe_name = 'Secret Knowledge Reveal' THEN 
        '["Promise exclusive information", "Build curiosity gap", "Deliver surprising insight"]'::jsonb
      WHEN recipe_name = 'POV Relatability' THEN 
        '["Start with relatable scenario", "Build emotional connection", "Show transformation possibility"]'::jsonb
      ELSE '["Hook viewer attention", "Build curiosity", "Deliver on promise"]'::jsonb
    END,
    'viralDNA', jsonb_build_object(
      'emotionalTriggers', '["curiosity", "aspiration", "relatability"]'::jsonb,
      'contentPatterns', '["authority_building", "transformation_story", "value_delivery"]'::jsonb,
      'hookMechanisms', '["credibility_gap", "before_after", "secret_reveal"]'::jsonb,
      'viralCoefficients', jsonb_build_object(
        'curiosity', 0.85,
        'relatability', 0.78,
        'authority', 0.92,
        'transformation', 0.71
      )
    ),
    'performancePredictions', jsonb_build_object(
      'expectedViralScore', 85 + (effectiveness_score * 10)::int,
      'confidenceInterval', '[75, 95]'::jsonb,
      'optimalTiming', jsonb_build_object(
        'hook_seconds', 3,
        'peak_moment', duration_seconds * 0.4,
        'cta_placement', duration_seconds * 0.85
      )
    ),
    'optimizationTips', CASE 
      WHEN recipe_name = 'Authority Hook' THEN 
        '["Use specific numbers and metrics", "Show credentials early", "Provide immediate value"]'::jsonb
      WHEN recipe_name = 'Before/After Transformation' THEN 
        '["Document the journey visually", "Show struggle relatably", "Deliver clear transformation"]'::jsonb
      ELSE '["Focus on viewer benefit", "Create curiosity gaps", "Deliver on promises"]'::jsonb
    END
  )
FROM video_recipe_pairs;

-- DEPLOY PHASE: Verification and final checks
DO $$
DECLARE
    final_videos_count INTEGER;
    final_mappings_count INTEGER;
    frameworks_with_mappings INTEGER;
BEGIN
    -- Final verification
    SELECT COUNT(*) INTO final_videos_count FROM viral_video_gallery;
    SELECT COUNT(*) INTO final_mappings_count FROM video_framework_mapping;
    SELECT COUNT(DISTINCT framework_id) INTO frameworks_with_mappings FROM video_framework_mapping;
    
    -- Verification checks
    IF final_videos_count < 6 THEN
        RAISE EXCEPTION 'DEPLOY FAILED: Expected 6 videos, got %', final_videos_count;
    END IF;
    
    IF final_mappings_count < 6 THEN
        RAISE EXCEPTION 'DEPLOY FAILED: Expected 6+ mappings, got %', final_mappings_count;
    END IF;
    
    RAISE NOTICE 'DEPLOY SUCCESS: % videos, % mappings, % frameworks mapped', 
                 final_videos_count, final_mappings_count, frameworks_with_mappings;
END $$;

-- Final success report
SELECT 
    'Viral Video Gallery populated successfully! 🚀' as status,
    (SELECT COUNT(*) FROM viral_video_gallery) as viral_videos_count,
    (SELECT COUNT(*) FROM video_framework_mapping) as framework_mappings_count,
    (SELECT COUNT(DISTINCT framework_id) FROM video_framework_mapping) as unique_frameworks_mapped; 