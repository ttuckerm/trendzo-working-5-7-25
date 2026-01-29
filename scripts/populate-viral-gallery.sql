-- =====================================================
-- POPULATE VIRAL VIDEO GALLERY FOR VALUE TEMPLATE EDITOR
-- =====================================================
-- This script specifically populates the viral_video_gallery table
-- which is required for the Value Template Editor to work

-- Clear existing data and insert fresh viral video gallery data
DELETE FROM viral_video_gallery;

-- Insert viral video gallery data with proper UUIDs
INSERT INTO viral_video_gallery (
    id, title, creator_name, thumbnail_url, view_count, viral_score, 
    platform, duration_seconds, is_featured, display_order, transcript, viral_elements
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
    1,
    'Everyone told me I was crazy when I quit my $200k job to start this business. But in 6 months, I built a 7-figure company. Here''s exactly how I did it...',
    '{"framework": "authority", "hook_type": "credibility_gap", "emotional_triggers": ["curiosity", "aspiration"], "proof_elements": ["specific_numbers", "transformation"]}'::jsonb
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
    2,
    'I used to wake up at 11am feeling terrible. Then I discovered this 5-step morning routine that completely transformed my life. Now I wake up at 5am energized...',
    '{"framework": "storytelling", "hook_type": "transformation", "emotional_triggers": ["relatability", "hope"], "proof_elements": ["before_after", "specific_steps"]}'::jsonb
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
    3,
    'I''ve tried every productivity hack out there. But this one secret method increased my output by 300%. It''s so simple yet nobody talks about it...',
    '{"framework": "authority", "hook_type": "secret_knowledge", "emotional_triggers": ["curiosity", "exclusivity"], "proof_elements": ["percentage_improvement", "social_proof"]}'::jsonb
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
    4,
    'POV: You''ve been working a job you hate for 5 years. Then one random Tuesday, you try something new and everything clicks. This is that moment...',
    '{"framework": "storytelling", "hook_type": "pov_relatable", "emotional_triggers": ["relatability", "hope", "inspiration"], "proof_elements": ["shared_experience", "emotional_journey"]}'::jsonb
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
    5,
    'Want people to actually listen when you speak? Use this psychology trick that makes anyone pay attention to every word you say. It''s backed by science...',
    '{"framework": "authority", "hook_type": "psychology_authority", "emotional_triggers": ["curiosity", "social_improvement"], "proof_elements": ["science_backing", "immediate_application"]}'::jsonb
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
    6,
    'I challenged myself to do this one thing every day for 30 days. The transformation was insane. Day 1 vs Day 30 will shock you...',
    '{"framework": "hero", "hook_type": "challenge_documentation", "emotional_triggers": ["inspiration", "possibility"], "proof_elements": ["visual_proof", "time_progression"]}'::jsonb
);

-- Update framework mappings to use the correct UUIDs
-- First clear existing mappings
DELETE FROM video_framework_mapping;

-- Insert framework mappings with correct video IDs
WITH video_recipe_pairs AS (
  SELECT 
    v.id as video_id,
    r.id as framework_id,
    v.title,
    v.duration_seconds,
    r.recipe_name
  FROM viral_video_gallery v
  CROSS JOIN viral_recipe_book r
  WHERE 
    (v.title LIKE '%Built a 7-Figure Business%' AND r.recipe_name = 'Authority Hook') OR
    (v.title LIKE '%Morning Routine%' AND r.recipe_name = 'Before/After Transformation') OR
    (v.title LIKE '%Secret Productivity%' AND r.recipe_name = 'Secret Knowledge Reveal') OR
    (v.title LIKE '%POV: You Just%' AND r.recipe_name = 'POV Relatability') OR
    (v.title LIKE '%Psychology Trick%' AND r.recipe_name = 'Authority Hook') OR
    (v.title LIKE '%Before vs After%' AND r.recipe_name = 'Challenge Documentation')
)
INSERT INTO video_framework_mapping (video_id, framework_id, mapping_confidence, workspace_config_cached)
SELECT 
  video_id,
  framework_id,
  0.950,
  jsonb_build_object(
    'workspaceId', 'ws_' || extract(epoch from now())::text || '_' || substring(video_id::text, 1, 8),
    'suggestedHooks', CASE 
      WHEN recipe_name = 'Authority Hook' THEN 
        '["Establish your credentials immediately", "Share specific results or numbers", "Use authoritative language"]'::jsonb
      WHEN recipe_name = 'Before/After Transformation' THEN 
        '["Show the dramatic change", "Reveal the simple method", "Connect with viewer struggle"]'::jsonb
      WHEN recipe_name = 'Secret Knowledge Reveal' THEN 
        '["Promise exclusive information", "Build curiosity gap", "Deliver surprising insight"]'::jsonb
      WHEN recipe_name = 'POV Relatability' THEN 
        '["Start with relatable scenario", "Build emotional connection", "Show transformation possibility"]'::jsonb
      WHEN recipe_name = 'Quick Tutorial Format' THEN 
        '["Identify common problem", "Promise quick solution", "Deliver step-by-step value"]'::jsonb
      ELSE '["Hook viewer attention", "Build curiosity", "Deliver on promise"]'::jsonb
    END,
    'timingGuidance', jsonb_build_object(
      'optimal_duration', duration_seconds,
      'hook_timing_seconds', 3,
      'peak_moment_seconds', duration_seconds * 0.5,
      'call_to_action_timing', duration_seconds * 0.8
    ),
    'visualElements', jsonb_build_object(
      'recommended_colors', '["#1f2937", "#3b82f6", "#10b981"]'::jsonb,
      'visual_style', 'authentic',
      'camera_angles', '["close-up", "medium-shot"]'::jsonb,
      'transition_suggestions', '["cut", "fade"]'::jsonb
    ),
    'scriptGuidance', jsonb_build_object(
      'tone', 'conversational',
      'style_hints', '["be authentic", "tell a story", "provide value"]'::jsonb
    )
  )
FROM video_recipe_pairs;

-- Verify the data was inserted
SELECT 'Viral Video Gallery populated successfully! 🚀' as status,
       (SELECT COUNT(*) FROM viral_video_gallery) as viral_videos_count,
       (SELECT COUNT(*) FROM video_framework_mapping) as framework_mappings_count; 