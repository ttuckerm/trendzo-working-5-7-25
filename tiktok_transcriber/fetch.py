# fetch.py  — drop-in replacement

from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import os
import yt_dlp

def _extract_user_videos(handle: str, days: int, limit: int) -> List[Dict[str, Any]]:
    """
    List recent TikTok videos for a creator WITHOUT downloading media.
    Requires the @ in profile URL. Adds UA header; optionally uses cookies.txt if present.
    """
    url = f"https://www.tiktok.com/@{handle.lstrip('@')}"
    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "extract_flat": "in_playlist",
        "dump_single_json": True,
        "http_headers": {
            # Stable desktop UA avoids some 403 / region walls
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        },
    }

    # If cookies.txt exists next to your script, use it (helps for private/region-limited profiles)
    cookies_path = os.path.join(os.getcwd(), "cookies.txt")
    if os.path.exists(cookies_path):
        ydl_opts["cookiefile"] = cookies_path

    out: List[Dict[str, Any]] = []
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        print(f"[fetch] failed for {handle}: {e}")
        return out

    entries = (info or {}).get("entries", [])
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    for e in entries[:limit]:
        # timestamps can be 'timestamp' (int) or 'upload_date' (YYYYMMDD)
        ts = None
        if e.get("timestamp"):
            ts = datetime.fromtimestamp(e["timestamp"], tz=timezone.utc)
        elif e.get("upload_date"):
            try:
                ts = datetime.strptime(e["upload_date"], "%Y%m%d").replace(tzinfo=timezone.utc)
            except Exception:
                ts = None

        if ts and ts < cutoff:
            continue

        out.append({
            "video_id": str(e.get("id")),
            "original_url": e.get("url") or e.get("webpage_url") or e.get("webpage_url_basename"),
            "caption": e.get("title") or "",
            "published_at": ts.isoformat() if ts else None,
            "views_count": e.get("view_count"),
            "likes_count": e.get("like_count"),
            "comments_count": e.get("comment_count"),
            "shares_count": e.get("repost_count"),
        })

    return out

def fetch_latest(handles: List[str], days: int = 30, limit: int = 100) -> List[Dict[str, Any]]:
    all_rows: List[Dict[str, Any]] = []
    for h in handles:
        vids = _extract_user_videos(h, days=days, limit=limit)
        for v in vids:
            v["creator_username"] = h.lstrip("@")
            v["platform"] = "tiktok"
        all_rows.extend(vids)
    return all_rows
