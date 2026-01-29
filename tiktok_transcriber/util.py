import hashlib
from tenacity import retry, stop_after_attempt, wait_exponential

def content_hash(video_id: str, text: str) -> str:
    return hashlib.sha256((str(video_id) + (text or "")).encode("utf-8")).hexdigest()

retry_net = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
