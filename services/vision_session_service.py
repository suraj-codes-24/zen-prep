import time
from collections import defaultdict, deque
from threading import Lock


_METRIC_TTL_SECONDS = 30 * 60
_MAX_METRICS_PER_KEY = 120
_metrics_store = defaultdict(deque)
_store_lock = Lock()


def _safe_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _prune_locked(now: float) -> None:
    expired_keys = []
    for key, bucket in _metrics_store.items():
        while bucket and (now - bucket[0]["captured_at"]) > _METRIC_TTL_SECONDS:
            bucket.popleft()
        if not bucket:
            expired_keys.append(key)

    for key in expired_keys:
        _metrics_store.pop(key, None)


def record_face_metrics(user_id: int, session_id: int, question_id: int, metrics: dict) -> None:
    if not user_id or not session_id or not question_id or not metrics or metrics.get("error"):
        return

    entry = {
        "captured_at": time.time(),
        "face_detected": bool(metrics.get("face_detected")),
        "face_score": _safe_float(metrics.get("face_score")),
        "eye_contact": _safe_float(metrics.get("eye_contact")),
        "head_stability": _safe_float(metrics.get("head_stability")),
        "engagement_score": _safe_float(metrics.get("engagement_score")),
        "emotion": metrics.get("emotion") or "undetected",
    }

    key = (user_id, session_id, question_id)
    with _store_lock:
        _prune_locked(entry["captured_at"])
        bucket = _metrics_store[key]
        bucket.append(entry)
        while len(bucket) > _MAX_METRICS_PER_KEY:
            bucket.popleft()


def consume_average_face_score(user_id: int, session_id: int, question_id: int):
    key = (user_id, session_id, question_id)
    now = time.time()

    with _store_lock:
        _prune_locked(now)
        bucket = _metrics_store.pop(key, None)

    if not bucket:
        return None

    scores = [item["face_score"] for item in bucket if item["face_detected"]]
    if not scores:
        return None

    return round(sum(scores) / len(scores), 2)
