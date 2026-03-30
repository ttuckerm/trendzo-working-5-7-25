-- Add delivery baseline to user_channels
-- Stores hybrid FFmpeg + Gemini audio analysis results
ALTER TABLE user_channels
  ADD COLUMN IF NOT EXISTS delivery_baseline JSONB DEFAULT NULL;

COMMENT ON COLUMN user_channels.delivery_baseline IS 'Delivery analysis: speakingRateWpm, speakingRateVariance, energyLevel, silenceRatio, sampleCount, analyzedAt';
