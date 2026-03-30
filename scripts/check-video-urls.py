import os
import json
from supabase import create_client

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SERVICE_ROLE_KEY'))

result = supabase.table('scraped_videos').select('video_id, raw_scraping_data').limit(1).execute()

data = result.data[0]['raw_scraping_data']

print("Available keys in raw_scraping_data:")
for k in sorted(data.keys()):
    if 'video' in k.lower() or 'url' in k.lower() or 'download' in k.lower():
        value = str(data[k])[:150]
        print(f"  {k}: {value}")

