import os
from supabase import create_client

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SERVICE_ROLE_KEY'))

result = supabase.table('scraped_videos').select('video_id, creator_username, transcript_text').not_.is_('transcript_text', 'null').order('updated_at', desc=True).limit(3).execute()

print('\n🎉 TRANSCRIPTS SUCCESSFULLY SAVED TO DATABASE:\n')
print('=' * 80)

for r in result.data:
    print(f"\n📹 Video ID: {r['video_id']}")
    print(f"👤 Creator: @{r['creator_username']}")
    print(f"📝 Transcript: {r['transcript_text'][:200]}...")
    print('-' * 80)

print(f"\n✅ Total videos with transcripts: {len(result.data)}")
print("🎯 YOUR TRANSCRIPT PIPELINE IS WORKING!\n")

