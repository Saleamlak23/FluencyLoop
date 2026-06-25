from time import time
from collections import defaultdict
from fastapi import Request, HTTPException

# ── Config ──────────────────────────────────────────────────────────────────

REQUESTS_PER_MINUTE: int = 30

# In-memory store: { ip_address: [timestamp, timestamp, ...] }
# Resets on server restart — sufficient for MVP pilot load.
_store: dict[str, list[float]] = defaultdict(list)


# ── Rate limit checker ──────────────────────────────────────────────────────

def check_rate_limit(request: Request) -> None:
    """
    Simple sliding-window IP rate limiter.
    Raises HTTP 429 if the caller exceeds REQUESTS_PER_MINUTE in a 60-second window.

    Usage in a router:
        from fastapi import Depends
        from services.rate_limiter import check_rate_limit

        @router.post("/endpoint")
        async def my_endpoint(request: Request, _=Depends(check_rate_limit)):
            ...
    """
    ip: str = request.client.host if request.client else "unknown"
    now: float = time()

    # Keep only timestamps from the last 60 seconds
    window = [t for t in _store[ip] if now - t < 60]

    if len(window) >= REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a moment before trying again.",
        )

    window.append(now)
    _store[ip] = window


# ── Cleanup helper (optional — call periodically to avoid memory growth) ────

def purge_stale_entries() -> None:
    """
    Remove IPs whose entire request history is older than 60 seconds.
    Not required for MVP (< 50 users), but good practice for longer sessions.
    """
    now = time()
    stale = [ip for ip, times in _store.items() if all(now - t >= 60 for t in times)]
    for ip in stale:
        del _store[ip]