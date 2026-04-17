import cv2
import mediapipe as mp
import numpy as np
import base64
import math
from core.logger import logger

# ─────────────────────────────────────────────
# FACE ANALYZER (Mediapipe FaceMesh)
# ─────────────────────────────────────────────
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Frame-to-frame history for head stability tracking
_head_history = []
_MAX_HISTORY = 30


def _safe_round(value, decimals=2):
    """Return 0 if value is NaN/inf, else round it."""
    if value is None or math.isnan(value) or math.isinf(value):
        return 0
    return round(value, decimals)


def compute_face_score(eye_contact: float, head_stability: float, engagement_score: float) -> float:
    """Blend the main visual cues into a single on-camera score."""
    weighted_score = (
        (eye_contact * 0.45)
        + (head_stability * 0.25)
        + (engagement_score * 0.30)
    )
    return max(0.0, min(100.0, weighted_score))


def analyze_frame(image_b64: str) -> dict:
    """Analyzes a single frame for eye contact, head stability, and engagement."""
    try:
        if "," in image_b64:
            header, encoded = image_b64.split(",", 1)
        else:
            encoded = image_b64

        data = base64.b64decode(encoded)
        np_arr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Invalid image format"}

        h, w, _ = img.shape
        results = face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

        if not results.multi_face_landmarks:
            return {
                "face_detected": False,
                "eye_contact": 0,
                "head_stability": 0,
                "emotion": "undetected",
                "engagement_score": 0,
            }

        face_landmarks = results.multi_face_landmarks[0].landmark

        eye_contact = calculate_eye_contact(face_landmarks)
        head_stability = calculate_head_stability(face_landmarks)
        emotion, engagement = estimate_engagement(face_landmarks)
        face_score = compute_face_score(eye_contact, head_stability, engagement)

        return {
            "face_detected": True,
            "eye_contact": _safe_round(eye_contact),
            "head_stability": _safe_round(head_stability),
            "emotion": emotion,
            "engagement_score": _safe_round(engagement),
            "face_score": _safe_round(face_score),
        }

    except Exception as e:
        logger.error("Vision analysis error: %s", e)
        return {"error": str(e)}


def calculate_eye_contact(landmarks) -> float:
    """Eye contact based on iris position within the eye box."""
    # Left eye corners + iris
    l_inner = landmarks[133]
    l_outer = landmarks[33]
    l_iris = landmarks[468]

    # Right eye corners + iris
    r_inner = landmarks[362]
    r_outer = landmarks[263]
    r_iris = landmarks[473]

    l_eye_width = abs(l_outer.x - l_inner.x)
    r_eye_width = abs(r_outer.x - r_inner.x)

    if l_eye_width < 0.001 or r_eye_width < 0.001:
        return 50.0

    # Iris position ratio within eye (0.5 = centered = looking at camera)
    l_ratio = (l_iris.x - min(l_inner.x, l_outer.x)) / l_eye_width
    r_ratio = (r_iris.x - min(r_inner.x, r_outer.x)) / r_eye_width

    l_deviation = abs(l_ratio - 0.5)
    r_deviation = abs(r_ratio - 0.5)
    avg_deviation = (l_deviation + r_deviation) / 2

    # Vertical gaze check
    l_top = landmarks[159]
    l_bot = landmarks[145]
    l_eye_height = abs(l_top.y - l_bot.y)
    l_v_ratio = (l_iris.y - min(l_top.y, l_bot.y)) / max(l_eye_height, 0.001)
    v_deviation = abs(l_v_ratio - 0.5)

    # Combined: horizontal 70% + vertical 30%
    combined = avg_deviation * 0.7 + v_deviation * 0.3
    score = max(0, 100 - combined * 200)

    return min(100, score)


def calculate_head_stability(landmarks) -> float:
    """Track face center across frames — lower variance = higher stability."""
    global _head_history

    nose = landmarks[1]
    current_pos = (float(nose.x), float(nose.y))

    _head_history.append(current_pos)
    if len(_head_history) > _MAX_HISTORY:
        _head_history = _head_history[-_MAX_HISTORY:]

    if len(_head_history) < 3:
        # Not enough frames yet — give a reasonable default based on centering
        x_center = max(0, 100 - abs(nose.x - 0.5) * 200)
        y_center = max(0, 100 - abs(nose.y - 0.5) * 200)
        return max(0, min(100, (x_center + y_center) / 2))

    xs = [p[0] for p in _head_history]
    ys = [p[1] for p in _head_history]

    x_var = float(np.var(xs))
    y_var = float(np.var(ys))
    total_var = x_var + y_var

    # Gentle curve: normal head sway (~0.002 variance) still scores 80+
    # Only heavy movement (>0.01 variance) drops below 50
    stability = max(0, 100 - total_var * 3000)

    # Small centering bonus (max 10 points)
    avg_x = float(np.mean(xs))
    avg_y = float(np.mean(ys))
    center_dist = ((avg_x - 0.5) ** 2 + (avg_y - 0.5) ** 2) ** 0.5
    center_bonus = max(0, 10 - center_dist * 30)

    return max(0, min(100, stability * 0.9 + center_bonus))


def estimate_engagement(landmarks) -> tuple:
    """Returns (emotion_label, engagement_score 0-100)."""
    # Smile detection
    lip_left = landmarks[61]
    lip_right = landmarks[291]
    lip_top = landmarks[13]
    lip_bottom = landmarks[14]

    lip_width = abs(lip_right.x - lip_left.x)
    lip_height = abs(lip_top.y - lip_bottom.y)
    smile_ratio = lip_width / max(lip_height, 0.001)

    # Eye openness
    l_top = landmarks[159]
    l_bot = landmarks[145]
    r_top = landmarks[386]
    r_bot = landmarks[374]
    l_open = abs(l_top.y - l_bot.y)
    r_open = abs(r_top.y - r_bot.y)
    avg_eye_open = (l_open + r_open) / 2

    # Brow raise
    l_brow = landmarks[70]
    r_brow = landmarks[300]
    l_brow_dist = abs(l_brow.y - l_top.y)
    r_brow_dist = abs(r_brow.y - r_top.y)
    avg_brow_raise = (l_brow_dist + r_brow_dist) / 2

    # Head tilt (jaw asymmetry as proxy for attentive head tilt)
    jaw_left = landmarks[234]
    jaw_right = landmarks[454]
    jaw_tilt = abs(jaw_left.y - jaw_right.y)

    # Classify emotion — tuned for realistic webcam conditions
    if lip_height > 0.025 and avg_brow_raise > 0.03:
        emotion = "surprised"
    elif avg_eye_open < 0.006:
        emotion = "nervous"
    elif smile_ratio > 4.0 and lip_width > 0.06:
        emotion = "confident"
    elif smile_ratio > 3.2 and avg_eye_open > 0.012:
        emotion = "engaged"
    elif jaw_tilt > 0.012 and avg_eye_open > 0.015:
        emotion = "attentive"
    elif avg_eye_open > 0.018 and avg_brow_raise > 0.025:
        emotion = "focused"
    elif avg_eye_open < 0.010:
        emotion = "tired"
    elif smile_ratio > 2.8:
        emotion = "relaxed"
    else:
        emotion = "calm"

    # Engagement score — weighted components
    eye_score = min(1.0, avg_eye_open / 0.020) * 30
    smile_score = min(1.0, smile_ratio / 5.0) * 25
    brow_score = min(1.0, avg_brow_raise / 0.04) * 15
    tilt_score = min(1.0, jaw_tilt / 0.015) * 10
    base_engagement = 20

    engagement = min(100, base_engagement + eye_score + smile_score + brow_score + tilt_score)

    return emotion, engagement
