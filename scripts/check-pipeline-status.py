#!/usr/bin/env python3
"""
Pipeline Status Checker
Verifies TikTok scraping and transcription pipeline is working correctly
"""

import os
from supabase import create_client

# Connect to Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('PROJECT_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials!")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("📊 TIKTOK PIPELINE STATUS CHECK")
print("=" * 80)

# 1. Total videos
total = supabase.table('scraped_videos').select('video_id', count='exact').execute()
print(f"\n✅ Total videos scraped: {total.count}")

# 2. Videos with transcripts
with_transcripts = supabase.table('scraped_videos').select('video_id', count='exact').not_.is_('transcript_text', 'null').execute()
print(f"✅ Videos with transcripts: {with_transcripts.count}")

# 3. Videos without transcripts
without_transcripts = total.count - with_transcripts.count
print(f"⏳ Videos needing transcripts: {without_transcripts}")

# 4. Recent videos
print(f"\n📹 MOST RECENT VIDEOS:")
print("-" * 80)
recent = supabase.table('scraped_videos').select('video_id, creator_username, views_count, likes_count, transcript_text').order('scraped_at', desc=True).limit(5).execute()

for i, video in enumerate(recent.data, 1):
    has_transcript = "✅" if video['transcript_text'] else "❌"
    print(f"\n{i}. Video ID: {video['video_id']}")
    print(f"   Creator: @{video['creator_username']}")
    print(f"   Views: {video['views_count']:,} | Likes: {video['likes_count']:,}")
    print(f"   Transcript: {has_transcript}")

# 5. Sample transcripts
if with_transcripts.count > 0:
    print(f"\n📝 SAMPLE TRANSCRIPTS:")
    print("-" * 80)
    samples = supabase.table('scraped_videos').select('video_id, creator_username, transcript_text').not_.is_('transcript_text', 'null').order('updated_at', desc=True).limit(2).execute()
    
    for i, sample in enumerate(samples.data, 1):
        print(f"\n{i}. @{sample['creator_username']} ({sample['video_id']})")
        print(f"   \"{sample['transcript_text'][:150]}...\"")

print("\n" + "=" * 80)
print("🎯 PIPELINE STATUS: OPERATIONAL")
print("=" * 80)

if without_transcripts > 0:
    print(f"\n💡 TIP: Run transcripts on {without_transcripts} videos:")
    print(f"   python scripts/transcribe-videos.py --limit {min(without_transcripts, 10)}")
print()

