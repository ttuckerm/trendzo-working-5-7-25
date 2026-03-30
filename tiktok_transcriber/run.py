from __future__ import annotations
import argparse, os
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
from fetch import fetch_latest
from transcribe import transcribe_video
from db import get_existing_ids, upsert_row

def main():
    load_dotenv(dotenv_path=".env", override=False)
    load_dotenv(dotenv_path=".env.local", override=False)

    parser = argparse.ArgumentParser()
    parser.add_argument("--handles", nargs="+", required=True)
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--min_chars", type=int, default=300)
    parser.add_argument("--max_workers", type=int, default=int(os.getenv("MAX_CONCURRENCY", "4")))
    args = parser.parse_args()

    print("Fetching recent videos…")
    videos = fetch_latest(args.handles, days=args.days, limit=args.limit)
    print(f"Fetched {len(videos)} candidates")

    existing = get_existing_ids()
    new_videos = [v for v in videos if v.get("video_id") and v["video_id"] not in existing]
    print(f"{len(new_videos)} new videos to process")

    results = []
    with ThreadPoolExecutor(max_workers=args.max_workers) as ex:
        futures = [ex.submit(process_one, v, args.min_chars) for v in new_videos]
        for fut in as_completed(futures):
            r = fut.result()
            if r:
                results.append(r)

    print(f"Upserting {len(results)} rows…")
    for row in results:
        upsert_row(row)
    print("Done.")

def process_one(v: dict, min_chars: int):
    try:
        t = transcribe_video(v["original_url"], v["video_id"])
        if (t["transcript_length"] or 0) < min_chars:
            return None
        v.update(t)
        v.setdefault("platform", "tiktok")
        return v
    except Exception as e:
        print(f"[skip] {v.get('video_id')} -> {e}")
        return None

if __name__ == "__main__":
    main()
