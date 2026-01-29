from __future__ import annotations
import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase URL/Service Key not found in env")

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_existing_ids() -> set[str]:
    res = sb.table("scraped_videos").select("video_id").execute()
    return {row["video_id"] for row in (res.data or [])}

def upsert_row(row: dict):
    sb.table("scraped_videos").upsert(row, on_conflict="video_id").execute()
