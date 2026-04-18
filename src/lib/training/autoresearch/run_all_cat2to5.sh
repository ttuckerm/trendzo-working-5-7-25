#!/usr/bin/env bash
# Categories 2-5 queue runner. Runs 22 experiments through the bridge
# sequentially — sandbox lock forces serial execution anyway, this script
# just orchestrates the hand-off.
#
# On any experiment failure: log the error and CONTINUE to the next
# experiment (per prompt). The leaderboard compiler handles missing
# results.json gracefully.

set -u
cd "$(dirname "$0")/../../../.."

LOG_DIR="results-autoresearch/_queue_logs"
mkdir -p "$LOG_DIR"

run() {
  local id="$1"
  local hyp="$2"
  shift 2
  echo ""
  echo "================================================================================"
  echo ">>> $(date +%T) — starting ${id}: ${hyp}"
  echo "    args: $*"
  echo "================================================================================"

  # Don't blow away a successfully-finished experiment — skip if results.json
  # already exists (lets us resume if the queue is restarted).
  if [ -f "results-autoresearch/${id}/results.json" ]; then
    echo "    SKIP: results.json already present"
    return 0
  fi

  rm -rf "results-autoresearch/${id}"
  mkdir -p "results-autoresearch/${id}"

  npx tsx -r dotenv/config \
    src/lib/training/autoresearch/bridge_results_to_db.ts \
    --experiment-id "${id}" \
    --hypothesis "${hyp}" \
    --output-dir "results-autoresearch/${id}" \
    "$@" \
    dotenv_config_path=.env.local \
    2>&1 | tee "$LOG_DIR/${id}.log"
  local rc=${PIPESTATUS[0]}
  echo ">>> $(date +%T) — ${id} exit=${rc}"
  # Continue on failure — the prompt says "do NOT halt the queue"
  return 0
}

# ─── CATEGORY 2: Feature Subsets ──────────────────────────────────────────────
run "auto-010" \
  "Content-only ceiling: remove all context features (creator, timing, hashtags, sound)" \
  --drop-features "music_is_original,sound_type,creator_followers,creator_followers_count,creator_followers_log,creator_followers_log_computed,meta_creator_followers,meta_creator_followers_log,creator_verified,posted_hour_utc,posted_day_of_week,post_hour_utc,post_day_of_week,hashtag_count,meta_hashtag_count,has_fyp_hashtag,meta_has_viral_hashtag,sound_is_original,is_original_sound"

run "auto-011" \
  "Context-only: remove all content features, keep only creator/timing/hashtag/sound" \
  --drop-features "ffmpeg_duration,ffmpeg_duration_seconds,duration_seconds,ffmpeg_resolution_height,ffmpeg_resolution_width,ffmpeg_fps,ffmpeg_bitrate,ffmpeg_codec,ffmpeg_scene_changes,ffmpeg_cuts_per_second,ffmpeg_avg_motion,ffmpeg_color_variance,ffmpeg_brightness_avg,ffmpeg_contrast_score,ffmpeg_avg_scene_duration,audio_loudness_integrated,audio_loudness_mean_lufs,audio_loudness_range,audio_loudness_peak,audio_loudness_variance,audio_pitch_mean_hz,audio_pitch_variance,audio_pitch_range,audio_pitch_std_dev,audio_pitch_contour_slope,audio_silence_ratio,audio_silence_count,audio_tempo,audio_spectral_centroid,audio_energy_buildup,speaking_rate_wpm,hook_score,hook_confidence,hook_text_score,hook_type_encoded,hook_motion_ratio,hook_audio_intensity,hook_face_present,hook_text_overlay,hook_composition_score,hook_emotion_intensity,hook_first_frame_score,hook_opening_line_score,hook_pattern_match_score,hook_curiosity_gap_score,hook_visual_hook_score,text_word_count,text_sentence_count,text_question_mark_count,text_exclamation_count,text_transcript_length,text_avg_sentence_length,text_unique_word_ratio,text_avg_word_length,text_syllable_count,text_flesch_reading_ease,text_has_cta,text_negative_word_count,text_emoji_count,text_readability_score,text_sentiment_score,text_question_count,text_cta_count,text_hashtag_count_in_text,text_caption_length,text_language,thumb_brightness,thumb_contrast,thumb_colorfulness,thumb_overall_score,thumb_confidence,thumbnail_brightness,thumbnail_contrast,thumbnail_saturation,thumbnail_dominant_color_r,thumbnail_dominant_color_g,thumbnail_dominant_color_b,thumbnail_face_count,thumbnail_text_present,segment_count,segment_avg_duration,segment_shortest,segment_longest,segment_std_dev,visual_scene_count,visual_avg_scene_duration,visual_score,visual_variety_score,visual_complexity_score,visual_proof_ratio,visual_to_verbal_ratio,talking_head_ratio,text_overlay_density,scene_rate_first_half_vs_second,pacing_score,retention_open_loop_count,share_relatability_score,share_utility_score,psych_curiosity_gap_score,psych_power_word_density,psych_direct_address_ratio,psych_social_proof_count,specificity_score,instructional_density,has_step_structure,hedge_word_density,vocal_confidence_composite,meta_duration_seconds,meta_words_per_second,meta_has_viral_hashtag,gemini_overall_score,gemini_hook_effectiveness,gemini_visual_quality,gemini_audio_quality,gemini_content_originality,gemini_engagement_potential,gemini_trend_alignment,gemini_production_value"

run "auto-012" \
  "Top-20 features only — simpler model may generalize better" \
  --keep-only-features "sound_type,ffmpeg_resolution_height,audio_silence_count,visual_avg_scene_duration,meta_hashtag_count,ffmpeg_resolution_width,hashtag_count,talking_head_ratio,meta_creator_followers,has_fyp_hashtag,hook_score,ffmpeg_duration_seconds,creator_followers_log_computed,ffmpeg_fps,audio_loudness_mean_lufs,hook_composition_score,text_word_count,thumb_contrast,scene_rate_first_half_vs_second,ffmpeg_bitrate"

run "auto-013" \
  "Top-40 features — middle ground between full set and minimal model" \
  --keep-only-features "sound_type,ffmpeg_resolution_height,audio_silence_count,visual_avg_scene_duration,meta_hashtag_count,ffmpeg_resolution_width,hashtag_count,talking_head_ratio,meta_creator_followers,has_fyp_hashtag,hook_score,ffmpeg_duration_seconds,creator_followers_log_computed,ffmpeg_fps,audio_loudness_mean_lufs,hook_composition_score,text_word_count,thumb_contrast,scene_rate_first_half_vs_second,ffmpeg_bitrate,text_flesch_reading_ease,audio_loudness_range,visual_scene_count,ffmpeg_scene_changes,thumb_brightness,text_positive_word_count,hook_text_score,hook_visual_score,visual_variety_score,text_transcript_length,thumb_colorfulness,hook_face_present,visual_proof_ratio,text_has_cta,hook_type_encoded,audio_loudness_variance,thumb_overall_score,hook_emotion_intensity,ffmpeg_avg_motion,vocal_confidence_composite"

run "auto-014" \
  "Drop resolution (ffmpeg_resolution_height + width) — proxy for phone quality" \
  --drop-features "music_is_original,ffmpeg_resolution_height,ffmpeg_resolution_width"

run "auto-015" \
  "Drop all thumbnail features — test whether thumbnail analysis adds signal" \
  --drop-features "music_is_original,thumb_brightness,thumb_contrast,thumb_colorfulness,thumb_overall_score,thumb_confidence,thumbnail_brightness,thumbnail_contrast,thumbnail_saturation,thumbnail_dominant_color_r,thumbnail_dominant_color_g,thumbnail_dominant_color_b,thumbnail_face_count,thumbnail_text_present"

run "auto-016" \
  "Drop Gemini LLM-scored features — test whether AI scoring adds signal beyond raw metrics" \
  --drop-features "music_is_original,gemini_overall_score,gemini_hook_effectiveness,gemini_visual_quality,gemini_audio_quality,gemini_content_originality,gemini_engagement_potential,gemini_trend_alignment,gemini_production_value,hook_composition_score,hook_face_present,hook_text_overlay,hook_emotion_intensity,visual_proof_ratio,talking_head_ratio,text_overlay_density"

run "auto-017" \
  "Drop text/caption features — test whether text analysis matters for TikTok" \
  --drop-features "music_is_original,text_word_count,text_sentence_count,text_question_mark_count,text_exclamation_count,text_transcript_length,text_avg_sentence_length,text_unique_word_ratio,text_avg_word_length,text_syllable_count,text_flesch_reading_ease,text_has_cta,text_negative_word_count,text_positive_word_count,text_emoji_count,text_readability_score,text_sentiment_score,text_question_count,text_cta_count,text_hashtag_count_in_text,text_caption_length,text_language,hook_text_score"

# ─── CATEGORY 3: Data Quality Filters ─────────────────────────────────────────
run "auto-020" \
  "Remove DPS outliers (>95 or <5) — extreme tails may hurt generalization" \
  --drop-features "music_is_original" \
  --exclude-rows-where "dps_lt_5_or_gt_95"

run "auto-021" \
  "Higher-quality rows only — exclude videos where >30% of content features are NaN" \
  --drop-features "music_is_original" \
  --exclude-rows-where "content_nan_gt_30pct"

run "auto-022" \
  "Minimum creator quality — exclude creators with <5K followers" \
  --drop-features "music_is_original" \
  --exclude-rows-where "followers_lt_5000"

run "auto-023" \
  "Temporal relevance — exclude videos older than 12 months (TikTok algorithm may have changed)" \
  --drop-features "music_is_original" \
  --exclude-rows-where "older_than_12_months"

# ─── CATEGORY 4: Hyperparameters ──────────────────────────────────────────────
run "auto-030" \
  "Doubling Optuna trials from 100 to 200" \
  --drop-features "music_is_original" \
  --optuna-trials "200"

run "auto-031" \
  "Shallower trees — constrain max_depth to 3-4" \
  --drop-features "music_is_original" \
  --max-depth-range "3,4"

run "auto-032" \
  "Deeper trees — allow max_depth 8-10" \
  --drop-features "music_is_original" \
  --max-depth-range "8,10"

run "auto-033" \
  "1000 estimators with early stopping (patience 50)" \
  --drop-features "music_is_original" \
  --n-estimators "1000" \
  --early-stopping-rounds "50"

run "auto-034" \
  "Half the learning rate (0.003-0.007) — slower learning" \
  --drop-features "music_is_original" \
  --learning-rate-range "0.003,0.007"

# ─── CATEGORY 5: Derived Features ─────────────────────────────────────────────
run "auto-040" \
  "Interaction: hook_score * creator_followers_log" \
  --drop-features "music_is_original" \
  --add-features "hook_x_followers_log"

run "auto-041" \
  "Cyclical posting hour — sin/cos encoding" \
  --drop-features "music_is_original" \
  --add-features "posted_hour_sin,posted_hour_cos"

run "auto-042" \
  "Duration as category — short/medium/long buckets" \
  --drop-features "music_is_original" \
  --add-features "duration_bucket"

run "auto-043" \
  "Creator size as category — small/medium/large/huge buckets" \
  --drop-features "music_is_original" \
  --add-features "creator_size_bucket"

run "auto-044" \
  "Composite content quality index" \
  --drop-features "music_is_original" \
  --add-features "content_quality_index"

echo ""
echo "================================================================================"
echo ">>> $(date +%T) — Categories 2-5 queue COMPLETE (22 experiments)"
echo "================================================================================"
