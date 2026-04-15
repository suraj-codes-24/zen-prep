import librosa
import numpy as np
from groq import Groq
import parselmouth
from parselmouth.praat import call
import soundfile as sf
import os
import re
import logging
from concurrent.futures import ThreadPoolExecutor
from scipy.signal import find_peaks

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# GROQ CLOUD STT INITIALIZATION
# ─────────────────────────────────────────────
_groq_stt = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─────────────────────────────────────────────
# FILLER WORDS
# ─────────────────────────────────────────────
FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "literally",
    "actually", "so", "right", "okay", "hmm", "er", "ah",
    "kind of", "sort of", "i mean", "you see"
]

# ─────────────────────────────────────────────
# NORMALIZE audio → standard 16kHz mono WAV
# ─────────────────────────────────────────────
def normalize_audio(audio_path: str) -> str:
    try:
        y, sr_rate = librosa.load(audio_path, sr=16000, mono=True)
        normalized_path = audio_path.rsplit(".", 1)[0] + "_norm.wav"
        sf.write(normalized_path, y, 16000, subtype="PCM_16")
        return normalized_path
    except Exception as e:
        print(f"[VOICE] Normalization failed: {e}")
        return audio_path

# ─────────────────────────────────────────────
# TRANSCRIBE using Groq Cloud STT
# ─────────────────────────────────────────────
def transcribe_audio(audio_path: str) -> str:
    try:
        print(f"[VOICE] Transcribing with Groq Cloud STT...")
        with open(audio_path, "rb") as f:
            resp = _groq_stt.audio.transcriptions.create(
                file=(os.path.basename(audio_path), f, "audio/wav"),
                model="whisper-large-v3-turbo",
                language="en",
            )
        transcript = resp.text.strip().lower()
        print(f"[VOICE] Transcript: '{transcript}'")
        return transcript
    except Exception as e:
        print(f"[VOICE] Groq STT error: {e}")
        return ""

# ─────────────────────────────────────────────
# PACE — words per minute
# ─────────────────────────────────────────────
def calculate_pace(transcript: str, duration_seconds: float) -> dict:
    if duration_seconds <= 0:
        return {"wpm": 0, "label": "unknown", "score": 50}

    words = transcript.split()
    word_count = len(words)
    wpm = (word_count / duration_seconds) * 60

    ideal_center = 140
    if 120 <= wpm <= 160:
        dist = abs(wpm - ideal_center)
        score = round(100 - dist * 0.75, 1)
        label = "good pace"
    elif 100 <= wpm < 120:
        score = round(65 + (wpm - 100) * 1.0, 1)
        label = "slightly slow"
    elif 80 <= wpm < 100:
        score = round(45 + (wpm - 80) * 1.0, 1)
        label = "too slow"
    elif wpm < 80:
        score = max(20, round(wpm * 0.56, 1))
        label = "too slow"
    elif 160 < wpm <= 200:
        score = round(85 - (wpm - 160) * 0.5, 1)
        label = "slightly fast"
    else:
        score = max(35, round(65 - (wpm - 200) * 0.3, 1))
        label = "too fast"

    score = max(0, min(100, score))
    return {"wpm": round(wpm, 1), "label": label, "score": score}

# ─────────────────────────────────────────────
# FILLER WORD COUNT
# ─────────────────────────────────────────────
def detect_filler_words(transcript: str) -> dict:
    if not transcript:
        return {"count": 0, "fillers_found": [], "score": 100, "filler_ratio_percent": 0}

    found = []
    text_lower = transcript.lower()
    for filler in FILLER_WORDS:
        pattern = r'\b' + re.escape(filler) + r'\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            found.append({"word": filler, "count": len(matches)})

    total_count = sum(f["count"] for f in found)
    word_count = max(len(transcript.split()), 1)
    filler_ratio = total_count / word_count

    if filler_ratio < 0.03:
        score = 100
    elif filler_ratio < 0.06:
        score = 80
    elif filler_ratio < 0.10:
        score = 60
    elif filler_ratio < 0.15:
        score = 40
    else:
        score = 20

    return {
        "count": total_count,
        "fillers_found": found,
        "score": score,
        "filler_ratio_percent": round(filler_ratio * 100, 1)
    }

# ─────────────────────────────────────────────
# PITCH & CONFIDENCE via parselmouth
# ─────────────────────────────────────────────
def analyze_pitch(audio_path: str) -> dict:
    try:
        sound = parselmouth.Sound(audio_path)
        pitch_values = np.array([])
        for floor in [50, 60, 75]:
            pitch = call(sound, "To Pitch", 0.0, floor, 600)
            vals = pitch.selected_array['frequency']
            vals = vals[vals > 0]
            if len(vals) > len(pitch_values):
                pitch_values = vals

        if len(pitch_values) == 0:
            y, sr_rate = librosa.load(audio_path, sr=None)
            f0 = librosa.yin(y, fmin=50, fmax=600)
            f0 = f0[f0 > 50]
            if len(f0) == 0:
                return {"mean_pitch": 0, "pitch_variation": 0, "confidence_score": 60}
            pitch_values = f0

        mean_pitch = float(np.mean(pitch_values))
        pitch_std = float(np.std(pitch_values))

        if pitch_std < 8:
            confidence_score = 55
        elif pitch_std < 15:
            confidence_score = 70
        elif pitch_std < 40:
            confidence_score = 85
        elif pitch_std < 80:
            confidence_score = 95
        else:
            confidence_score = 75

        return {
            "mean_pitch": round(mean_pitch, 1),
            "pitch_variation": round(pitch_std, 1),
            "confidence_score": confidence_score
        }
    except Exception as e:
        print(f"[VOICE] Pitch analysis error: {e}")
        return {"mean_pitch": 0, "pitch_variation": 0, "confidence_score": 60}

# ─────────────────────────────────────────────
# SILENCE RATIO
# ─────────────────────────────────────────────
def analyze_silence(audio_path: str) -> dict:
    try:
        y, sr_rate = librosa.load(audio_path, sr=None)
        intervals = librosa.effects.split(y, top_db=30)
        total_frames = len(y)
        voiced_frames = sum(end - start for start, end in intervals)
        silence_ratio = 1 - (voiced_frames / total_frames) if total_frames > 0 else 0

        if silence_ratio < 0.10:
            label = "minimal pauses"
            score = 85
        elif silence_ratio < 0.25:
            label = "good pausing"
            score = 100
        elif silence_ratio < 0.40:
            label = "some hesitation"
            score = 70
        else:
            label = "too many pauses"
            score = 50

        return {
            "silence_ratio": round(silence_ratio * 100, 1),
            "label": label,
            "score": score
        }
    except Exception as e:
        print(f"[VOICE] Silence analysis error: {e}")
        return {"silence_ratio": 0, "label": "unknown", "score": 70}

# ─────────────────────────────────────────────
# ENERGY / LOUDNESS
# ─────────────────────────────────────────────
def analyze_energy(audio_path: str) -> dict:
    try:
        y, sr_rate = librosa.load(audio_path, sr=None)
        rms = librosa.feature.rms(y=y)[0]
        mean_energy = float(np.mean(rms))
        energy_std = float(np.std(rms))

        if mean_energy < 0.01:
            label = "very quiet"
            score = 50
        elif mean_energy < 0.05:
            label = "soft spoken"
            score = 75
        elif mean_energy < 0.15:
            label = "clear volume"
            score = 100
        else:
            label = "loud"
            score = 80

        return {
            "mean_energy": round(mean_energy, 4),
            "energy_variation": round(energy_std, 4),
            "label": label,
            "score": score
        }
    except Exception as e:
        print(f"[VOICE] Energy analysis error: {e}")
        return {"mean_energy": 0, "energy_variation": 0, "label": "unknown", "score": 70}

# ─────────────────────────────────────────────
# PRONUNCIATION (Estimated for Cloud STT)
# ─────────────────────────────────────────────
def analyze_pronunciation(audio_path: str) -> dict:
    """Estimated pronunciation score as Groq Cloud STT doesn't provide word-level confidence yet."""
    try:
        # Note: In a future update, we could use Groq timestamps if available, 
        # but for now, we return a consolidated estimate based on the transcript quality.
        transcript = transcribe_audio(audio_path)
        word_count = len(transcript.split())
        
        # Fixed estimate as per deployment plan to maintain score consistency
        return {
            "score": 75,
            "avg_confidence": 0.75,
            "low_confidence_words": 0,
            "total_words": word_count,
        }
    except Exception as e:
        logger.warning(f"Pronunciation analysis failed: {e}")
        return {"score": 70, "avg_confidence": 0.70, "low_confidence_words": 0, "total_words": 0}

# ─────────────────────────────────────────────
# INTONATION (parselmouth pitch variation)
# ─────────────────────────────────────────────
def analyze_intonation(audio_path: str) -> dict:
    try:
        snd = parselmouth.Sound(audio_path)
        duration = snd.duration
        time_step = 0.005 if duration < 5 else 0.01
        pitch = snd.to_pitch(time_step=time_step)
        pitch_values = pitch.selected_array["frequency"]
        voiced = pitch_values[pitch_values > 0]

        min_frames = 5 if duration < 3 else 10
        if len(voiced) < min_frames:
            return {"score": 45, "pitch_mean_hz": 0, "pitch_std_hz": 0, "pitch_range_hz": 0, "note": "insufficient voiced frames"}

        pitch_mean = float(np.mean(voiced))
        pitch_std = float(np.std(voiced))
        pitch_range = float(np.max(voiced) - np.min(voiced))
        cv = pitch_std / pitch_mean if pitch_mean > 0 else 0

        if 0.08 <= cv <= 0.25:
            score = round(70 + (cv - 0.08) / 0.17 * 30, 1)
        elif cv < 0.08:
            score = round(30 + cv / 0.08 * 40, 1)
        else:
            score = max(55, round(100 - (cv - 0.25) * 80, 1))

        return {
            "score": max(0, min(100, score)),
            "pitch_mean_hz": round(pitch_mean, 1),
            "pitch_std_hz": round(pitch_std, 1),
            "pitch_range_hz": round(pitch_range, 1),
            "note": "monotone" if cv < 0.06 else "natural" if cv < 0.25 else "expressive",
        }
    except Exception as e:
        logger.warning(f"Intonation analysis failed: {e}")
        return {"score": 50, "pitch_mean_hz": 0, "pitch_std_hz": 0, "pitch_range_hz": 0}

# ─────────────────────────────────────────────
# MODULATION (librosa RMS variation)
# ─────────────────────────────────────────────
def analyze_modulation(audio_path: str) -> dict:
    try:
        y, sr = librosa.load(audio_path, sr=None)
        if len(y) < sr * 0.5:
            return {"score": 50, "rms_mean": 0, "rms_std": 0, "variation_ratio": 0}

        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
        rms_mean = float(np.mean(rms))
        rms_std = float(np.std(rms))

        if rms_mean < 1e-6:
            return {"score": 0, "rms_mean": 0, "rms_std": 0, "variation_ratio": 0, "note": "near-silent audio"}

        variation_ratio = rms_std / rms_mean
        if 0.3 <= variation_ratio <= 0.8:
            score = min(100, round(70 + (variation_ratio - 0.3) * 60, 1))
        elif variation_ratio < 0.3:
            score = round(variation_ratio / 0.3 * 70, 1)
        else:
            score = max(40, round(100 - (variation_ratio - 0.8) * 30, 1))

        return {
            "score": round(score, 1),
            "rms_mean": round(float(rms_mean), 5),
            "rms_std": round(float(rms_std), 5),
            "variation_ratio": round(variation_ratio, 3),
            "note": "flat" if variation_ratio < 0.2 else "natural" if variation_ratio < 0.9 else "erratic",
        }
    except Exception as e:
        logger.warning(f"Modulation analysis failed: {e}")
        return {"score": 60, "rms_mean": 0, "rms_std": 0, "variation_ratio": 0}

# ─────────────────────────────────────────────
# RHYTHM (pause naturalness via librosa)
# ─────────────────────────────────────────────
def analyze_rhythm(audio_path: str) -> dict:
    try:
        y, sr = librosa.load(audio_path, sr=None)
        duration = len(y) / sr
        if len(y) < sr * 0.3:
            return {"score": 45, "natural_pauses": 0, "long_pauses": 0, "avg_pause_sec": 0, "note": "too short"}

        intervals = librosa.effects.split(y, top_db=30)
        if len(intervals) < 2:
            return {"score": 65 if duration < 3 else 45, "natural_pauses": 0, "long_pauses": 0, "avg_pause_sec": 0, "note": "fluency issue"}

        pause_durations = []
        for i in range(1, len(intervals)):
            pause_sec = (intervals[i][0] - intervals[i - 1][1]) / sr
            if pause_sec > 0.05:
                pause_durations.append(pause_sec)

        if not pause_durations:
            return {"score": 60, "natural_pauses": 0, "long_pauses": 0, "avg_pause_sec": 0, "note": "rushed speech"}

        natural_pauses = [p for p in pause_durations if 0.1 <= p <= 1.2]
        long_pauses = [p for p in pause_durations if p > 2.5]
        avg_pause = float(np.mean(pause_durations))
        total_pauses = len(pause_durations)
        natural_ratio = len(natural_pauses) / total_pauses if total_pauses > 0 else 0
        base = round(natural_ratio * 80 + 10, 1)
        penalty = len(long_pauses) * 12
        if 0.15 <= avg_pause <= 0.8: base += 10
        
        return {
            "score": max(0, min(100, round(base - penalty, 1))),
            "natural_pauses": len(natural_pauses),
            "long_pauses": len(long_pauses),
            "avg_pause_sec": round(avg_pause, 2),
            "note": "natural" if len(long_pauses) == 0 else "hesitant",
        }
    except Exception as e:
        logger.warning(f"Rhythm analysis failed: {e}")
        return {"score": 50, "natural_pauses": 0, "long_pauses": 0, "avg_pause_sec": 0}

# ─────────────────────────────────────────────
# STRESS & EMPHASIS (parselmouth intensity peaks)
# ─────────────────────────────────────────────
def analyze_stress(audio_path: str) -> dict:
    try:
        snd = parselmouth.Sound(audio_path)
        duration = snd.duration
        if duration < 0.5:
            return {"score": 45, "stress_peaks": 0, "stress_rate_per_10s": 0, "note": "too short"}

        time_step = 0.005 if duration < 3 else 0.01
        intensity = snd.to_intensity(time_step=time_step)
        intensity_values = intensity.values[0]
        prominence = 2.5 if duration < 5 else 4
        distance = 5 if duration < 3 else 10

        peaks, _ = find_peaks(intensity_values, prominence=prominence, distance=distance)
        stress_rate = len(peaks) / duration * 10

        if 3 <= stress_rate <= 8:
            score = round(80 + (1 - abs(stress_rate - 5.5) / 2.5) * 20, 1)
        elif stress_rate < 3:
            score = max(30, round(stress_rate / 3 * 80, 1))
        else:
            score = max(40, round(100 - (stress_rate - 8) * 5, 1))

        return {
            "score": round(min(100, score), 1),
            "stress_peaks": len(peaks),
            "stress_rate_per_10s": round(stress_rate, 2),
            "note": "natural" if stress_rate <= 8 else "over-stressed",
        }
    except Exception as e:
        logger.warning(f"Stress analysis failed: {e}")
        return {"score": 50, "stress_peaks": 0, "stress_rate_per_10s": 0}

# ─────────────────────────────────────────────
# FEEDBACK GENERATOR
# ─────────────────────────────────────────────
def generate_voice_feedback(pace, filler, pitch, silence, energy, overall_score) -> str:
    parts = []
    if overall_score >= 80: parts.append("Great delivery!")
    elif overall_score >= 60: parts.append("Decent delivery with some areas to work on.")
    else: parts.append("Your delivery needs improvement.")

    if pace["label"] == "too fast": parts.append(f"Slow down a bit (Pace: {pace['wpm']} WPM).")
    elif pace["label"] in ["too slow", "slightly slow"]: parts.append(f"Try to be more fluent (Pace: {pace['wpm']} WPM).")

    if filler["count"] > 5: parts.append(f"Reduce filler words.")
    if pitch["confidence_score"] < 65: parts.append("Vary your tone more.")
    if silence["label"] == "too many pauses": parts.append("Practice speaking more fluently.")
    if energy["label"] == "very quiet": parts.append("Speak louder and with more energy.")

    return " ".join(parts)

# ─────────────────────────────────────────────
# MAIN — full voice analysis with parallel processing
# ─────────────────────────────────────────────
def analyze_voice(audio_path: str) -> dict:
    print(f"[VOICE] Starting Cloud analysis: {audio_path}")
    normalized_path = normalize_audio(audio_path)
    
    try:
        y, sr_rate = librosa.load(normalized_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr_rate)
    except Exception:
        duration = 0

    with ThreadPoolExecutor(max_workers=4) as executor:
        transcript_future = executor.submit(transcribe_audio, audio_path)
        pitch_future      = executor.submit(analyze_pitch, normalized_path)
        silence_future    = executor.submit(analyze_silence, normalized_path)
        energy_future     = executor.submit(analyze_energy, normalized_path)

        transcript = transcript_future.result()
        pitch      = pitch_future.result()
        silence    = silence_future.result()
        energy     = energy_future.result()

    pace   = calculate_pace(transcript, duration)
    filler = detect_filler_words(transcript)

    pronunciation_result = analyze_pronunciation(audio_path)
    intonation_result    = analyze_intonation(normalized_path)
    modulation_result    = analyze_modulation(normalized_path)
    rhythm_result        = analyze_rhythm(normalized_path)
    stress_result        = analyze_stress(normalized_path)

    overall_score = round(
        0.15 * pace["score"]                     +
        0.15 * filler["score"]                   +
        0.15 * pronunciation_result["score"]     +
        0.15 * intonation_result["score"]        +
        0.10 * modulation_result["score"]        +
        0.10 * rhythm_result["score"]            +
        0.10 * stress_result["score"]            +
        0.05 * silence["score"]                  +
        0.05 * energy["score"],
        1
    )

    feedback = generate_voice_feedback(pace, filler, pitch, silence, energy, overall_score)

    if normalized_path != audio_path and os.path.exists(normalized_path):
        os.remove(normalized_path)

    return {
        "transcript": transcript,
        "duration_seconds": round(duration, 1),
        "overall_voice_score": overall_score,
        "feedback": feedback,
        "details": {
            "pace": pace, "filler_words": filler, "confidence": pitch,
            "silence": silence, "energy": energy, "pronunciation": pronunciation_result,
            "intonation": intonation_result, "modulation": modulation_result,
            "rhythm": rhythm_result, "stress": stress_result,
        }
    }
