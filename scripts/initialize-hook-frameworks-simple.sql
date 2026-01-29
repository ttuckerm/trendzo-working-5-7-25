-- ============================================
-- INITIALIZE 24+ HOOK FRAMEWORKS (SIMPLE VERSION)
-- Based on viral content research
-- ============================================

-- Insert all 24+ proven hook frameworks
INSERT INTO hook_frameworks (name, category, pattern_rules, success_rate, description) VALUES

-- STORYTELLING HOOKS (100% above baseline)
('Personal Story Hook', 'storytelling', 
 '{"keywords": ["story time", "this happened", "let me tell you", "when I", "yesterday"], 
   "visual_patterns": ["close_up_face", "emotional_expression"], 
   "audio_patterns": ["voice_over", "emotional_music"],
   "structure_patterns": ["narrative_arc", "chronological"]}',
 30, 'Personal narrative that creates emotional connection'),

('Before/After Story', 'storytelling',
 '{"keywords": ["before", "after", "transformation", "changed my life", "used to be"],
   "visual_patterns": ["split_screen", "comparison_shots"],
   "audio_patterns": ["uplifting_music", "voice_over"],
   "structure_patterns": ["contrast", "progression"]}',
 28, 'Transformation narrative showing dramatic change'),

('Day in the Life', 'storytelling',
 '{"keywords": ["day in", "morning routine", "typical day", "follow me"],
   "visual_patterns": ["pov_shots", "time_lapse", "quick_cuts"],
   "audio_patterns": ["upbeat_music", "voice_over"],
   "structure_patterns": ["chronological", "lifestyle"]}',
 25, 'Lifestyle storytelling that builds parasocial connection'),

-- AUTHORITY HOOKS (85% of storytelling effectiveness)
('Expert Revelation', 'authority',
 '{"keywords": ["expert", "professional", "years experience", "certified", "doctor", "lawyer"],
   "visual_patterns": ["professional_setting", "credentials_shown"],
   "audio_patterns": ["confident_voice", "factual_tone"],
   "structure_patterns": ["credibility_first", "insight_delivery"]}',
 25, 'Leveraging expertise for trust and attention'),

('Industry Insider', 'authority',
 '{"keywords": ["insider", "secret", "industry", "behind the scenes", "what they dont tell you"],
   "visual_patterns": ["workplace_footage", "documentation"],
   "audio_patterns": ["revealing_tone", "voice_over"],
   "structure_patterns": ["revelation", "expose"]}',
 24, 'Behind-the-scenes knowledge from industry insider'),

('Data-Driven Hook', 'authority',
 '{"keywords": ["study shows", "research", "statistics", "data", "survey", "% of people"],
   "visual_patterns": ["graphs", "charts", "numbers_overlay"],
   "audio_patterns": ["analytical_tone", "voice_over"],
   "structure_patterns": ["fact_first", "evidence_based"]}',
 22, 'Using data and research to establish credibility'),

-- CHALLENGE HOOKS (Drive participation)
('Try This Challenge', 'challenge',
 '{"keywords": ["challenge", "try this", "can you", "dare", "attempt", "30 days"],
   "visual_patterns": ["demonstration", "results_shown"],
   "audio_patterns": ["energetic_music", "encouraging_voice"],
   "structure_patterns": ["challenge_setup", "participation_invite"]}',
 26, 'Interactive challenge that invites participation'),

('Skill Challenge', 'challenge',
 '{"keywords": ["tutorial", "how to", "learn this", "master", "skill", "technique"],
   "visual_patterns": ["step_by_step", "close_up_demonstration"],
   "audio_patterns": ["instructional_voice", "clear_audio"],
   "structure_patterns": ["educational", "progressive_difficulty"]}',
 23, 'Teaching a skill with challenge element'),

-- EMOTIONAL AROUSAL HOOKS
('Shock Value Hook', 'emotional',
 '{"keywords": ["shocking", "cant believe", "mind blown", "wait for it", "plot twist"],
   "visual_patterns": ["surprise_reveal", "dramatic_timing"],
   "audio_patterns": ["suspense_music", "gasp_sounds"],
   "structure_patterns": ["buildup", "revelation"]}',
 28, 'Creating surprise and shock for viral sharing'),

('Inspirational Hook', 'emotional',
 '{"keywords": ["inspiring", "motivation", "never give up", "believe", "possible"],
   "visual_patterns": ["uplifting_imagery", "success_moments"],
   "audio_patterns": ["inspirational_music", "motivational_voice"],
   "structure_patterns": ["struggle_to_success", "emotional_arc"]}',
 24, 'Motivational content that triggers positive emotions'),

('Humor Hook', 'emotional',
 '{"keywords": ["funny", "hilarious", "joke", "prank", "fail", "lol", "comedy"],
   "visual_patterns": ["comedic_timing", "reaction_shots"],
   "audio_patterns": ["comedic_sounds", "laugh_track"],
   "structure_patterns": ["setup_punchline", "unexpected_twist"]}',
 27, 'Comedy that triggers joy and sharing'),

-- CURIOSITY HOOKS
('Question Hook', 'curiosity',
 '{"keywords": ["what if", "have you ever", "did you know", "why does", "how come"],
   "visual_patterns": ["question_overlay", "thinking_expression"],
   "audio_patterns": ["questioning_tone", "mysterious_music"],
   "structure_patterns": ["question_first", "answer_reveal"]}',
 22, 'Posing intriguing questions that demand answers'),

('Cliffhanger Hook', 'curiosity',
 '{"keywords": ["wait till end", "you wont believe", "part 2", "continued", "find out"],
   "visual_patterns": ["teaser_clips", "incomplete_action"],
   "audio_patterns": ["suspenseful_music", "dramatic_pause"],
   "structure_patterns": ["incomplete_narrative", "tension_building"]}',
 25, 'Creating suspense that demands completion'),

('Secret/Hack Hook', 'curiosity',
 '{"keywords": ["secret", "hack", "trick", "nobody knows", "hidden", "discovered"],
   "visual_patterns": ["reveal_moment", "insider_view"],
   "audio_patterns": ["whisper_tone", "revelation_music"],
   "structure_patterns": ["secret_reveal", "exclusive_knowledge"]}',
 26, 'Revealing hidden knowledge or shortcuts'),

-- SOCIAL PROOF HOOKS
('Trending Topic Hook', 'social',
 '{"keywords": ["everyone", "viral", "trending", "popular", "famous", "celebrity"],
   "visual_patterns": ["trending_indicator", "mass_appeal"],
   "audio_patterns": ["trending_sound", "popular_music"],
   "structure_patterns": ["bandwagon", "social_validation"]}',
 24, 'Leveraging current trends and social proof'),

('Celebrity/Influencer Hook', 'social',
 '{"keywords": ["celebrity name", "influencer", "famous", "collab", "met"],
   "visual_patterns": ["celebrity_appearance", "collaboration"],
   "audio_patterns": ["excitement", "name_drop"],
   "structure_patterns": ["association", "borrowed_authority"]}',
 23, 'Using celebrity association for attention'),

-- CONTROVERSY HOOKS
('Controversial Opinion', 'controversy',
 '{"keywords": ["unpopular opinion", "hot take", "disagree", "controversial", "debate"],
   "visual_patterns": ["bold_statement", "reaction_bait"],
   "audio_patterns": ["assertive_voice", "dramatic_music"],
   "structure_patterns": ["opinion_first", "justification"]}',
 21, 'Sparking debate with controversial viewpoints'),

('Myth Busting', 'controversy',
 '{"keywords": ["myth", "actually", "wrong", "truth", "debunked", "real story"],
   "visual_patterns": ["fact_checking", "evidence_shown"],
   "audio_patterns": ["corrective_tone", "revelation_music"],
   "structure_patterns": ["myth_then_truth", "educational"]}',
 20, 'Correcting common misconceptions'),

-- FEAR/URGENCY HOOKS
('FOMO Hook', 'urgency',
 '{"keywords": ["last chance", "limited", "ending soon", "dont miss", "only"],
   "visual_patterns": ["countdown", "scarcity_indicator"],
   "audio_patterns": ["urgent_music", "time_pressure"],
   "structure_patterns": ["urgency_first", "action_push"]}',
 19, 'Creating fear of missing out'),

('Warning Hook', 'urgency',
 '{"keywords": ["warning", "danger", "stop doing", "careful", "alert", "important"],
   "visual_patterns": ["warning_signs", "serious_expression"],
   "audio_patterns": ["alert_sound", "serious_tone"],
   "structure_patterns": ["warning_first", "explanation"]}',
 18, 'Important warnings that demand attention'),

-- TRANSFORMATION HOOKS
('Glow Up Hook', 'transformation',
 '{"keywords": ["glow up", "transformation", "evolved", "journey", "progress"],
   "visual_patterns": ["before_after", "time_lapse"],
   "audio_patterns": ["uplifting_music", "proud_voice"],
   "structure_patterns": ["progression", "achievement"]}',
 22, 'Showing dramatic personal transformation'),

('Tutorial Transformation', 'transformation',
 '{"keywords": ["transform", "makeover", "upgrade", "renovate", "change"],
   "visual_patterns": ["process_shots", "final_reveal"],
   "audio_patterns": ["building_music", "explanatory_voice"],
   "structure_patterns": ["process_focused", "result_reveal"]}',
 21, 'Showing transformation of objects/spaces'),

-- RELATABILITY HOOKS
('Relatable Moment', 'relatability',
 '{"keywords": ["anyone else", "just me", "we all", "relate", "same", "mood"],
   "visual_patterns": ["everyday_situation", "facial_expression"],
   "audio_patterns": ["casual_voice", "relatable_music"],
   "structure_patterns": ["shared_experience", "validation"]}',
 23, 'Highlighting universal experiences'),

('POV Hook', 'relatability',
 '{"keywords": ["pov", "when you", "that moment", "imagine", "you are"],
   "visual_patterns": ["first_person", "immersive_view"],
   "audio_patterns": ["narrative_voice", "atmospheric_sound"],
   "structure_patterns": ["perspective_taking", "immersion"]}',
 24, 'Creating immersive point-of-view experiences'),

-- EDUCATIONAL HOOKS
('Quick Tip Hook', 'educational',
 '{"keywords": ["tip", "trick", "quick", "easy", "simple", "life hack"],
   "visual_patterns": ["demonstration", "clear_steps"],
   "audio_patterns": ["clear_instruction", "helpful_tone"],
   "structure_patterns": ["problem_solution", "quick_delivery"]}',
 20, 'Delivering valuable tips quickly'),

('Mind-Blowing Fact', 'educational',
 '{"keywords": ["fact", "didnt know", "mind blown", "science", "history", "truth"],
   "visual_patterns": ["visual_proof", "demonstration"],
   "audio_patterns": ["amazed_tone", "educational_music"],
   "structure_patterns": ["fact_first", "explanation"]}',
 21, 'Sharing surprising educational content'),

-- META HOOKS
('Behind the Scenes', 'meta',
 '{"keywords": ["behind the scenes", "making of", "how I", "process", "bts"],
   "visual_patterns": ["production_footage", "raw_content"],
   "audio_patterns": ["casual_voice", "authentic_sound"],
   "structure_patterns": ["process_reveal", "transparency"]}',
 19, 'Showing the creation process'),

('Breaking Fourth Wall', 'meta',
 '{"keywords": ["you watching", "yes you", "stop scrolling", "pay attention", "listen"],
   "visual_patterns": ["direct_eye_contact", "pointing"],
   "audio_patterns": ["direct_address", "attention_grabbing"],
   "structure_patterns": ["direct_engagement", "awareness"]}',
 18, 'Directly addressing the viewer'),

-- NOSTALGIA HOOKS
('Nostalgia Trip', 'nostalgia',
 '{"keywords": ["remember when", "back in", "nostalgia", "throwback", "90s kids"],
   "visual_patterns": ["retro_style", "old_footage"],
   "audio_patterns": ["nostalgic_music", "reminiscent_voice"],
   "structure_patterns": ["past_reference", "memory_trigger"]}',
 20, 'Triggering nostalgic memories'),

-- SERIES HOOKS
('Series Continuation', 'series',
 '{"keywords": ["part 2", "episode", "continued", "next", "series", "follow for more"],
   "visual_patterns": ["episode_number", "continuation_indicator"],
   "audio_patterns": ["series_music", "recap_voice"],
   "structure_patterns": ["episodic", "cliffhanger_ending"]}',
 22, 'Building audience through series content');

-- Initialize default one-click optimizations for Inception Mode
INSERT INTO one_click_optimizations (optimization_name, optimization_type, before_pattern, after_pattern, expected_improvement) VALUES
('Power Word Swap - Tips to Secrets', 'word_swap', 'tips', 'secrets', 5.2),
('Power Word Swap - Learn to Discover', 'word_swap', 'learn', 'discover', 4.8),
('Power Word Swap - Best to Ultimate', 'word_swap', 'best', 'ultimate', 6.1),
('Power Word Swap - Guide to Blueprint', 'word_swap', 'guide', 'blueprint', 7.3),
('Power Word Swap - Tricks to Hacks', 'word_swap', 'tricks', 'hacks', 5.9),
('Hook Enhancement - Add Wait For It', 'hook_enhance', '^(.{0,50})', 'Wait for it... $1', 8.2),
('Hook Enhancement - Add Question', 'hook_enhance', '^(.{0,50})', 'Did you know that $1', 7.5),
('Timing Optimization - Shorten to 30s', 'timing_adjust', 'duration:([4-9][0-9]|[1-9][0-9]{2})', 'duration:30', 12.3),
('Platform Specific - TikTok CTA', 'platform_specific', 'follow me', 'follow for part 2', 9.7),
('Platform Specific - Instagram Save', 'platform_specific', 'like this', 'save this for later', 11.2);