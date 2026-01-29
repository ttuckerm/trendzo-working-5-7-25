#!/usr/bin/env python3
"""
TikTok Video Transcription Script
==================================
Downloads videos from scraped_videos table and generates transcripts using OpenAI Whisper.

Usage:
    python scripts/transcribe-videos.py [--limit N] [--batch-size N]

Requirements:
    - SUPABASE_URL environment variable
    - SUPABASE_SERVICE_ROLE_KEY environment variable
    - OPENAI_API_KEY environment variable
"""

import os
import sys
import time
import tempfile
import requests
import subprocess
from pathlib import Path
from typing import List, Dict, Optional

# Try to import required packages
try:
    from supabase import create_client, Client
    from openai import OpenAI
except ImportError:
    print("❌ Missing required packages. Installing now...")
    os.system(f"{sys.executable} -m pip install supabase openai --quiet")
    from supabase import create_client, Client
    from openai import OpenAI

# Load environment variables
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('PROJECT_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SERVICE_ROLE_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Validate environment
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase credentials!")
    print("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
    sys.exit(1)

if not OPENAI_API_KEY:
    print("❌ Missing OpenAI API key!")
    print("   Set OPENAI_API_KEY environment variable")
    sys.exit(1)

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

print("✅ Connected to Supabase and OpenAI")


def get_videos_without_transcripts(limit: int = 10) -> List[Dict]:
    """Fetch videos that don't have transcripts yet."""
    print(f"\n📋 Fetching up to {limit} videos without transcripts...")
    
    response = supabase.table('scraped_videos') \
        .select('video_id, url, creator_username') \
        .is_('transcript_text', 'null') \
        .not_.is_('url', 'null') \
        .order('scraped_at', desc=True) \
        .limit(limit) \
        .execute()
    
    videos = response.data
    print(f"✅ Found {len(videos)} videos to transcribe")
    return videos


def download_video(video_url: str, output_path: Path) -> bool:
    """Download TikTok video using yt-dlp."""
    try:
        print(f"   📥 Downloading with yt-dlp...")
        
        # Use yt-dlp to download TikTok video
        result = subprocess.run([
            'yt-dlp',
            '--no-warnings',
            '--no-playlist',
            '--format', 'best',
            '--output', str(output_path),
            video_url
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode != 0:
            print(f"   ❌ yt-dlp failed: {result.stderr}")
            return False
        
        if not output_path.exists():
            print(f"   ❌ Video file not created")
            return False
        
        size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"   ✅ Downloaded: {size_mb:.2f} MB")
        return True
        
    except Exception as e:
        print(f"   ❌ Download failed: {e}")
        return False


def extract_audio(video_path: Path, audio_path: Path) -> bool:
    """Extract audio from video using FFmpeg."""
    try:
        print(f"   🔊 Extracting audio...")
        
        result = subprocess.run([
            'ffmpeg',
            '-i', str(video_path),
            '-vn',  # No video
            '-acodec', 'libmp3lame',  # MP3 codec
            '-ar', '16000',  # 16kHz sample rate (Whisper likes this)
            '-ac', '1',  # Mono
            '-b:a', '64k',  # 64kbps bitrate
            '-y',  # Overwrite output
            str(audio_path)
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"   ❌ FFmpeg failed: {result.stderr}")
            return False
        
        size_kb = audio_path.stat().st_size / 1024
        print(f"   ✅ Audio extracted: {size_kb:.2f} KB")
        return True
        
    except Exception as e:
        print(f"   ❌ Audio extraction failed: {e}")
        return False


def transcribe_audio(audio_path: Path) -> Optional[str]:
    """Transcribe audio using OpenAI Whisper."""
    try:
        print(f"   🎤 Transcribing audio with Whisper...")
        
        with open(audio_path, 'rb') as audio_file:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        transcript_text = transcript.strip() if isinstance(transcript, str) else transcript
        print(f"   ✅ Transcript: {transcript_text[:100]}...")
        return transcript_text
        
    except Exception as e:
        print(f"   ❌ Transcription failed: {e}")
        return None


def update_transcript(video_id: str, transcript: str) -> bool:
    """Update video transcript in database."""
    try:
        supabase.table('scraped_videos') \
            .update({'transcript_text': transcript}) \
            .eq('video_id', video_id) \
            .execute()
        
        print(f"   ✅ Database updated")
        return True
        
    except Exception as e:
        print(f"   ❌ Database update failed: {e}")
        return False


def process_video(video: Dict, temp_dir: Path) -> bool:
    """Process a single video: download, extract audio, transcribe, update."""
    video_id = video['video_id']
    video_url = video['url']
    username = video.get('creator_username', 'unknown')
    
    print(f"\n🎬 Processing: {video_id} (@{username})")
    print(f"   URL: {video_url}")
    
    # Download video
    video_path = temp_dir / f"{video_id}.mp4"
    if not download_video(video_url, video_path):
        return False
    
    # Extract audio
    audio_path = temp_dir / f"{video_id}.mp3"
    if not extract_audio(video_path, audio_path):
        video_path.unlink(missing_ok=True)
        return False
    
    # Transcribe audio
    transcript = transcribe_audio(audio_path)
    if not transcript:
        video_path.unlink(missing_ok=True)
        audio_path.unlink(missing_ok=True)
        return False
    
    # Update database
    success = update_transcript(video_id, transcript)
    
    # Cleanup
    video_path.unlink(missing_ok=True)
    audio_path.unlink(missing_ok=True)
    
    return success


def main():
    """Main transcription workflow."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Transcribe TikTok videos using OpenAI Whisper')
    parser.add_argument('--limit', type=int, default=5, help='Number of videos to process (default: 5)')
    parser.add_argument('--batch-size', type=int, default=5, help='Batch size (default: 5)')
    args = parser.parse_args()
    
    print("=" * 60)
    print("🎤 TikTok Video Transcription Script")
    print("=" * 60)
    
    # Get videos to process
    videos = get_videos_without_transcripts(limit=args.limit)
    
    if not videos:
        print("\n✅ All videos already have transcripts!")
        return
    
    # Process videos
    success_count = 0
    fail_count = 0
    
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        for i, video in enumerate(videos, 1):
            print(f"\n{'=' * 60}")
            print(f"Video {i}/{len(videos)}")
            print(f"{'=' * 60}")
            
            if process_video(video, temp_path):
                success_count += 1
            else:
                fail_count += 1
            
            # Rate limiting
            if i < len(videos):
                print("\n⏳ Waiting 2 seconds...")
                time.sleep(2)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TRANSCRIPTION COMPLETE")
    print("=" * 60)
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print(f"📈 Total: {len(videos)}")
    
    if success_count > 0:
        print("\n🎉 Check your Supabase database - transcripts are ready!")
        print(f"   Run this SQL query to see them:")
        print(f"   SELECT video_id, creator_username, LEFT(transcript_text, 100)")
        print(f"   FROM scraped_videos WHERE transcript_text IS NOT NULL")
        print(f"   ORDER BY updated_at DESC LIMIT {success_count};")


if __name__ == '__main__':
    main()

