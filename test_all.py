"""
ZenPrep -- Full Endpoint + Feature Test Suite
Run: python test_all.py
Results written to: test_results.md
"""

import requests
import json
import sys
import struct
import wave
import io
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

BASE = "http://localhost:8000"
EMAIL = "suraj@test.com"
PASSWORD = "test123"
RESULTS = []
TOKEN = None

# ----------------------------------------------------------------
#  Helpers
# ----------------------------------------------------------------

def h(token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def auth_header():
    return {"Authorization": f"Bearer {TOKEN}"}

def ok(name, resp, expect=200):
    status = "PASS" if resp.status_code == expect else "FAIL"
    try:
        body = resp.json()
    except Exception:
        body = resp.text[:300]
    RESULTS.append({"name": name, "status": status,
                    "code": resp.status_code, "body": body})
    icon = "[PASS]" if status == "PASS" else "[FAIL]"
    print(f"  {icon} [{resp.status_code}] {name}")
    if status == "FAIL":
        body_str = json.dumps(body) if not isinstance(body, str) else body
        print(f"      >> {body_str[:300]}")
    return body if status == "PASS" else None

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")
    RESULTS.append({"name": f"-- {title} --", "status": "SECTION", "code": "-", "body": ""})

def make_wav(seconds=2):
    """Return BytesIO of a silent WAV at 16kHz."""
    buf = io.BytesIO()
    frames = 16000 * seconds
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(struct.pack("<" + "h" * frames, *([0] * frames)))
    buf.seek(0)
    return buf

# ----------------------------------------------------------------
#  AUTH
# ----------------------------------------------------------------

def test_auth():
    global TOKEN
    section("AUTH")

    r = requests.post(f"{BASE}/auth/login",
                      json={"email": EMAIL, "password": PASSWORD})
    data = ok("POST /auth/login (valid)", r)
    if data:
        TOKEN = data.get("access_token")
    else:
        print("  [WARN] Login failed -- remaining tests may fail")
        return

    r = requests.post(f"{BASE}/auth/login",
                      json={"email": EMAIL, "password": "wrongpass"})
    ok("POST /auth/login (wrong password -- 401)", r, expect=401)

    r = requests.post(f"{BASE}/auth/login",
                      json={"email": "nobody@x.com", "password": "abc"})
    ok("POST /auth/login (unknown user -- 401)", r, expect=401)

    r = requests.post(f"{BASE}/auth/register",
                      json={"name": "Test", "email": EMAIL,
                            "password": "test123", "branch": "CS", "year": 2})
    ok("POST /auth/register (duplicate -- 400)", r, expect=400)

    r = requests.put(f"{BASE}/auth/profile",
                     json={"name": "Suraj Singh", "branch": "CSE", "year": 2},
                     headers=h(TOKEN))
    ok("PUT /auth/profile", r)

    # Change password then revert
    r = requests.put(f"{BASE}/auth/password",
                     json={"current_password": PASSWORD, "new_password": "newpass123"},
                     headers=h(TOKEN))
    ok("PUT /auth/password (change)", r)

    r2 = requests.post(f"{BASE}/auth/login",
                       json={"email": EMAIL, "password": "newpass123"})
    data2 = ok("POST /auth/login (after password change)", r2)
    if data2:
        TOKEN = data2.get("access_token")

    r3 = requests.put(f"{BASE}/auth/password",
                      json={"current_password": "newpass123", "new_password": PASSWORD},
                      headers=h(TOKEN))
    ok("PUT /auth/password (revert)", r3)

    r4 = requests.post(f"{BASE}/auth/login",
                       json={"email": EMAIL, "password": PASSWORD})
    data4 = ok("POST /auth/login (after revert)", r4)
    if data4:
        TOKEN = data4.get("access_token")

# ----------------------------------------------------------------
#  INTERVIEW
# ----------------------------------------------------------------

def test_interview():
    section("INTERVIEW")

    r = requests.get(f"{BASE}/interview/subjects", headers=h(TOKEN))
    subjects = ok("GET /interview/subjects", r)
    if not subjects:
        return

    subject_id = subjects[0]["id"]

    r = requests.get(f"{BASE}/interview/topics?subject_id={subject_id}", headers=h(TOKEN))
    topics = ok("GET /interview/topics", r)
    topic_id = topics[0]["id"] if topics else None

    subtopics = None
    if topic_id:
        r = requests.get(f"{BASE}/interview/subtopics?topic_id={topic_id}", headers=h(TOKEN))
        subtopics = ok("GET /interview/subtopics", r)

    r = requests.post(f"{BASE}/interview/start",
                      json={"subject_id": subject_id,
                            "topic_id": topic_id,
                            "subtopic_id": subtopics[0]["id"] if subtopics else None,
                            "difficulty": "beginner",
                            "interview_type": "technical"},
                      headers=h(TOKEN))
    sess = ok("POST /interview/start", r)
    if not sess:
        return
    session_id = sess.get("session_id")

    r = requests.get(f"{BASE}/interview/question",
                      params={"subject_id": subject_id, "difficulty": "beginner",
                              "session_id": session_id},
                      headers=h(TOKEN))
    q = ok("GET /interview/question (adaptive)", r)

    answer_text = "Arrays store elements in contiguous memory. We use index-based access for O(1) retrieval. Common operations include traversal, insertion, deletion, and searching."
    r = requests.post(f"{BASE}/interview/answer",
                      json={"session_id": session_id,
                            "question_id": q["question_id"] if q else 1,
                            "user_answer": answer_text,
                            "voice_score": 72.0,
                            "face_score": 68.0},
                      headers=h(TOKEN))
    ok("POST /interview/answer", r)

    r = requests.post(f"{BASE}/ai/followup",
                      json={"question_text": q["question_text"] if q else "What is an array?",
                            "user_answer": answer_text,
                            "session_id": session_id},
                      headers=h(TOKEN))
    ok("POST /ai/followup (Ollama)", r)

    r = requests.get(f"{BASE}/reports/session/{session_id}", headers=h(TOKEN))
    ok("GET /reports/session/{id} (PDF)", r)

# ----------------------------------------------------------------
#  VOICE & VISION
# ----------------------------------------------------------------

def test_voice_vision():
    section("VOICE / VISION")

    # Voice -- field name is 'audio'
    r = requests.post(f"{BASE}/api/voice/analyze",
                      files={"audio": ("test.wav", make_wav(2), "audio/wav")},
                      headers=auth_header())
    data = ok("POST /api/voice/analyze (silent WAV)", r)
    if data:
        score = data.get("overall_voice_score") or data.get("voice_score") or data.get("score")
        print(f"      overall_voice_score={score}")

    # Vision -- sends JSON with base64 image + session_id + question_id
    import base64, io
    try:
        from PIL import Image
        img = Image.new("RGB", (100, 100), color=(128, 128, 128))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        img_b64 = base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        # Fallback: minimal valid JPEG base64
        img_b64 = ("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH"
                   "BwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAARC"
                   "AABAAEDASIA/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD"
                   "/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=")
    r = requests.post(f"{BASE}/api/vision/analyze",
                      json={"image": img_b64, "session_id": 1, "question_id": 1},
                      headers=h(TOKEN))
    data = ok("POST /api/vision/analyze (base64 JSON)", r)
    if data:
        score = data.get("engagement_score") or data.get("face_score")
        print(f"      engagement_score={score}, face_detected={data.get('face_detected')}")

# ----------------------------------------------------------------
#  CODING
# ----------------------------------------------------------------

def test_coding():
    section("CODING")

    r = requests.get(f"{BASE}/coding/companies", headers=h(TOKEN))
    companies = ok("GET /coding/companies", r)
    if not companies:
        return

    company = companies[0] if isinstance(companies[0], str) else companies[0].get("name", "Amazon")

    r = requests.get(f"{BASE}/coding/levels?company={company}", headers=h(TOKEN))
    levels = ok(f"GET /coding/levels?company={company}", r)
    if not levels:
        return

    # Field is 'unlocked', not 'is_locked'
    unlocked_lv = next((lv for lv in levels if lv.get("unlocked", False) and lv.get("has_problems")), None)
    if not unlocked_lv:
        print(f"  [WARN] No unlocked level with problems. Level data: {levels[0]}")
        return

    set_id = unlocked_lv.get("set_id")
    level_num = unlocked_lv.get("level", 1)
    print(f"      Testing level {level_num} (set_id={set_id})")

    r = requests.post(f"{BASE}/coding/start",
                      json={"set_id": set_id},
                      headers=h(TOKEN))
    sess = ok("POST /coding/start", r)
    if not sess:
        return

    session_id = sess.get("session_id") or sess.get("id")

    r = requests.get(f"{BASE}/coding/session/{session_id}", headers=h(TOKEN))
    session_data = ok("GET /coding/session/{id}", r)
    if not session_data:
        return

    problems = session_data.get("problems", [])
    if not problems:
        print("  [WARN] No problems in session")
        return

    print(f"      {len(problems)} problems in session")
    pid = problems[0]["id"]
    fn_name = problems[0].get("function_name", "solution")
    p1_title = problems[0].get("title", "problem")
    print(f"      Testing: {p1_title} (id={pid}, fn={fn_name})")

    # Build solutions using the actual function name from the problem
    py_code = (
        f"def {fn_name}(nums):\n"
        f"    return len(nums) != len(set(nums))\n"
    )
    r = requests.post(f"{BASE}/coding/run",
                      json={"session_id": session_id, "problem_id": pid,
                            "language": "python", "code": py_code},
                      headers=h(TOKEN))
    run_data = ok("POST /coding/run (Python)", r)
    if run_data:
        p = run_data.get("passed", 0)
        t = run_data.get("total", 0)
        status = "OK" if p == t else f"only {p}/{t}"
        print(f"      tests: {p}/{t} {status}")

    # C++ must use class Solution { public: ... }; (matches frontend starter)
    cpp_code = "\n".join([
        "#include <vector>",
        "#include <unordered_set>",
        "using namespace std;",
        "",
        "class Solution {",
        "public:",
        f"    bool {fn_name}(vector<int>& nums) {{",
        "        unordered_set<int> seen(nums.begin(), nums.end());",
        "        return seen.size() != nums.size();",
        "    }",
        "};",
        "",
    ])
    r = requests.post(f"{BASE}/coding/run",
                      json={"session_id": session_id, "problem_id": pid,
                            "language": "cpp", "code": cpp_code},
                      headers=h(TOKEN))
    run_data = ok("POST /coding/run (C++)", r)
    if run_data:
        p = run_data.get("passed", 0)
        t = run_data.get("total", 0)
        print(f"      tests: {p}/{t}")

    # Java must use class Solution { public ... } (matches frontend starter)
    java_code = "\n".join([
        "import java.util.*;",
        "",
        "class Solution {",
        f"    public boolean {fn_name}(int[] nums) {{",
        "        Set<Integer> seen = new HashSet<>();",
        "        for (int n : nums) if (!seen.add(n)) return true;",
        "        return false;",
        "    }",
        "}",
        "",
    ])
    r = requests.post(f"{BASE}/coding/run",
                      json={"session_id": session_id, "problem_id": pid,
                            "language": "java", "code": java_code},
                      headers=h(TOKEN))
    run_data = ok("POST /coding/run (Java with import)", r)
    if run_data:
        p = run_data.get("passed", 0)
        t = run_data.get("total", 0)
        print(f"      tests: {p}/{t}")

    # Submit all 3 problems to test unlock logic
    for prob in problems:
        r = requests.post(f"{BASE}/coding/submit",
                          json={"session_id": session_id, "problem_id": prob["id"],
                                "language": "python", "code": py_code},
                          headers=h(TOKEN))
        ok(f"POST /coding/submit problem {prob['id']}", r)

    # Check level 2 is now unlocked (all 3 submitted)
    r = requests.get(f"{BASE}/coding/levels?company={company}", headers=h(TOKEN))
    levels2 = ok("GET /coding/levels (after all 3 submitted)", r)
    if levels2:
        unlocked_nums = [lv.get("level") for lv in levels2 if lv.get("unlocked")]
        passed_nums   = [lv.get("level") for lv in levels2 if lv.get("passed") or lv.get("all_done")]
        print(f"      Unlocked levels: {unlocked_nums}")
        print(f"      Passed/done levels: {passed_nums}")
        next_lv = next((lv for lv in levels2 if lv.get("level") == level_num + 1), None)
        if next_lv:
            status = "UNLOCKED" if next_lv.get("unlocked") else "STILL LOCKED"
            print(f"      Level {level_num+1}: {status} (expected: UNLOCKED)")

# ----------------------------------------------------------------
#  COMMUNICATION TEST
# ----------------------------------------------------------------

def test_comm():
    section("COMMUNICATION TEST")

    r = requests.get(f"{BASE}/comm/sections", headers=h(TOKEN))
    ok("GET /comm/sections", r)

    r = requests.post(f"{BASE}/comm/start", headers=h(TOKEN))
    sess = ok("POST /comm/start", r)
    if not sess:
        return
    sess_id = sess.get("session_id") or sess.get("id")

    r = requests.get(f"{BASE}/comm/question/{sess_id}", headers=h(TOKEN))
    q = ok("GET /comm/question/{id}", r)
    q_id = q.get("question_id") if q else 1

    # Answer -- requires both 'audio' (file) and 'question_id' (form)
    r = requests.post(f"{BASE}/comm/answer/{sess_id}",
                      files={"audio": ("answer.wav", make_wav(1), "audio/wav")},
                      data={"question_id": q_id, "time_taken": 3.0},
                      headers=auth_header())
    ok("POST /comm/answer/{id} (silent WAV + question_id)", r)

    r = requests.post(f"{BASE}/comm/finish/{sess_id}", headers=h(TOKEN))
    ok("POST /comm/finish/{id}", r)

    r = requests.get(f"{BASE}/comm/results/{sess_id}", headers=h(TOKEN))
    results = ok("GET /comm/results/{id}", r)
    if results:
        print(f"      overall_score={results.get('overall_score')}, band={results.get('band')}, section_scores={results.get('section_scores', {})}")

    r = requests.get(f"{BASE}/comm/history", headers=h(TOKEN))
    ok("GET /comm/history", r)

    # TTS voices
    for voice in ["nova", "alloy", "cole", "claire"]:
        r = requests.get(f"{BASE}/comm/tts",
                         params={"text": "Hello, this is a test.", "voice": voice},
                         headers=h(TOKEN))
        ok(f"GET /comm/tts (voice={voice})", r)

    r = requests.get(f"{BASE}/reports/comm/{sess_id}", headers=h(TOKEN))
    ok("GET /reports/comm/{id} (PDF)", r)

# ----------------------------------------------------------------
#  GD ROOM
# ----------------------------------------------------------------

def test_gd():
    section("GD ROOM")

    r = requests.get(f"{BASE}/gd/topics", headers=h(TOKEN))
    raw = ok("GET /gd/topics", r)

    r2 = requests.get(f"{BASE}/gd/topics?page=2&per_page=12", headers=h(TOKEN))
    ok("GET /gd/topics (page 2)", r2)

    if not raw:
        return

    # Response is {"topics": [...], "total": N, ...}
    topic_list = raw.get("topics", raw) if isinstance(raw, dict) else raw
    if not topic_list:
        print("  [WARN] No topics found")
        return
    topic_id = topic_list[0]["id"]

    r = requests.post(f"{BASE}/gd/start",
                      json={"topic_id": topic_id, "bot_count": 3, "duration_mins": 5},
                      headers=h(TOKEN))
    sess = ok("POST /gd/start", r)
    if not sess:
        return
    sess_id = sess.get("session_id") or sess.get("id")

    # Bot turn -- all 4 phases
    for phase in ["opening", "discussion", "summary", "closing"]:
        r = requests.post(f"{BASE}/gd/bot-turn/{sess_id}",
                          data={"bot_name": "Alex", "gd_phase": phase},
                          headers=auth_header())
        ok(f"POST /gd/bot-turn (phase={phase})", r)

    # User turn with silent audio
    r = requests.post(f"{BASE}/gd/user-turn/{sess_id}",
                      files={"audio": ("turn.wav", make_wav(2), "audio/wav")},
                      data={"duration_sec": 2.0, "raised_hand": True},
                      headers=auth_header())
    ok("POST /gd/user-turn/{id} (silent WAV)", r)

    # Finish
    r = requests.post(f"{BASE}/gd/finish/{sess_id}", headers=h(TOKEN))
    ok("POST /gd/finish/{id}", r)

    # Results
    r = requests.get(f"{BASE}/gd/results/{sess_id}", headers=h(TOKEN))
    result = ok("GET /gd/results/{id}", r)
    if result:
        scores = result.get("scores", {})
        dims = ["participation", "leadership", "listening", "idea_quality", "teamwork"]
        print(f"      GD scores: { {d: round(scores.get(d, 0), 1) for d in dims} }")

    r = requests.get(f"{BASE}/gd/history", headers=h(TOKEN))
    ok("GET /gd/history", r)

    r = requests.get(f"{BASE}/reports/gd/{sess_id}", headers=h(TOKEN))
    ok("GET /reports/gd/{id} (PDF)", r)

# ----------------------------------------------------------------
#  ANALYTICS
# ----------------------------------------------------------------

def test_analytics():
    section("ANALYTICS")
    r = requests.get(f"{BASE}/analytics/me", headers=h(TOKEN))
    data = ok("GET /analytics/me", r)
    if data:
        print(f"      Modules present: {list(data.keys())}")

# ----------------------------------------------------------------
#  RESUME & JD
# ----------------------------------------------------------------

def test_resume_jd():
    section("RESUME / JD")

    fake_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    r = requests.post(f"{BASE}/resume/analyse",
                      files={"file": ("resume.pdf", fake_pdf, "application/pdf")},
                      headers=auth_header())
    ok("POST /resume/analyse (minimal PDF)", r)

    r = requests.post(f"{BASE}/jd/analyse",
                      json={"jd_text": "We are looking for a Python backend developer with FastAPI experience and SQL knowledge.",
                            "resume_text": "I am a Python developer with 2 years of experience using FastAPI, PostgreSQL, and REST APIs."},
                      headers=h(TOKEN))
    ok("POST /jd/analyse", r)

# ----------------------------------------------------------------
#  WRITE RESULTS
# ----------------------------------------------------------------

def write_results():
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in RESULTS if r["status"] == "FAIL")
    total = passed + failed

    lines = [
        "# ZenPrep -- Full Test Results",
        f"**Run:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"**Score:** {passed}/{total} passed  ({failed} failed)\n",
        "---\n",
    ]

    for r in RESULTS:
        if r["status"] == "SECTION":
            lines.append(f"\n## {r['name']}")
        elif r["status"] == "PASS":
            lines.append(f"- PASS `{r['code']}` **{r['name']}**")
        else:
            body_str = json.dumps(r["body"])[:400] if r["body"] else ""
            lines.append(f"- FAIL `{r['code']}` **{r['name']}**")
            if body_str:
                lines.append(f"  ```\n  {body_str}\n  ```")

    with open("test_results.md", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\n{'='*60}")
    print(f"  TOTAL: {passed}/{total} passed   {failed} FAILED")
    print(f"  Results written to test_results.md")
    print(f"{'='*60}\n")

# ----------------------------------------------------------------
#  MAIN
# ----------------------------------------------------------------

if __name__ == "__main__":
    print(f"\nZenPrep Full Test Suite  [{datetime.now().strftime('%H:%M:%S')}]")
    print(f"   Backend: {BASE}\n")

    try:
        r = requests.get(f"{BASE}/docs", timeout=5)
        print(f"  Backend reachable OK\n")
    except Exception:
        print(f"  [ERROR] Backend not reachable at {BASE}")
        sys.exit(1)

    test_auth()
    test_interview()
    test_voice_vision()
    test_coding()
    test_comm()
    test_gd()
    test_analytics()
    test_resume_jd()
    write_results()
