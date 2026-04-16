"""Coding interview service — manages levels, sessions, and problem execution."""
import ast
import re
import subprocess
import tempfile
import os
import time
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from core.logger import logger

from models.coding import (
    CodingProblem, CodingSet, CodingSetProblem,
    CodingSession, CodingSubmission,
)

# ── 100 Level topics (shared reference) ──────────────────────────────────────
LEVEL_TOPICS = [
    "Arrays", "Strings", "Linked Lists", "Stacks & Queues", "Hash Maps",
    "Recursion", "Sorting", "Binary Search", "Two Pointers", "Sliding Window",
    "Trees", "BST Operations", "Heaps", "Graphs - BFS", "Graphs - DFS",
    "Dynamic Programming I", "Dynamic Programming II", "Greedy", "Backtracking", "Bit Manipulation",
    "Matrix", "Intervals", "Math & Number Theory", "Tries", "Union Find",
    "Segment Trees", "Monotonic Stack", "Topological Sort", "Shortest Path", "Minimum Spanning Tree",
    "Arrays II", "Strings II", "Linked Lists II", "Advanced Trees", "Advanced Graphs",
    "DP on Strings", "DP on Trees", "DP with Bitmask", "Game Theory", "Combinatorics",
    "Binary Indexed Tree", "Suffix Array", "KMP & Z-Algorithm", "Hashing Advanced", "Geometry",
    "Simulation", "Design Problems", "System Design Basics", "Concurrency", "Randomized",
    "Arrays III", "Strings III", "Tree Traversals", "Graph Coloring", "Network Flow",
    "DP Optimization", "Divide & Conquer", "Sweep Line", "Coordinate Compression", "Heavy-Light",
    "Euler Path", "Strongly Connected", "2-SAT", "Centroid Decomposition", "LCA",
    "Persistent DS", "Mo's Algorithm", "Square Root Decomposition", "Wavelet Tree", "Sparse Table",
    "Advanced Sorting", "Counting Sort", "Radix Sort", "Bucket Problems", "Order Statistics",
    "Range Queries", "Offline Queries", "Online Algorithms", "Amortized Analysis", "Probabilistic",
    "String Matching", "Aho-Corasick", "Suffix Automaton", "Palindromic Tree", "Rolling Hash",
    "Convex Hull", "Line Sweep Geometry", "Voronoi Diagram", "Delaunay Triangulation", "Computational Geometry",
    "Interactive Problems", "Constructive", "Ad-Hoc", "Implementation", "Brainteaser",
    "Marathon: Mixed I", "Marathon: Mixed II", "Marathon: Mixed III", "Marathon: Mixed IV", "Grand Finale",
]

COMPANIES = ["Google", "Amazon", "Microsoft", "Meta"]

PASS_THRESHOLD = 60  # Score % needed to unlock next level


# ── Safety check (reused from code_service) ──────────────────────────────────

BLOCKED_MODULES = {
    "os", "sys", "subprocess", "shutil", "socket", "threading",
    "multiprocessing", "signal", "ctypes", "importlib", "pathlib",
    "builtins", "code", "codeop", "compileall", "py_compile",
    "runpy", "pkgutil", "zipimport", "ensurepip", "pip", "venv",
    "http", "urllib", "requests", "ftplib", "smtplib", "telnetlib",
    "xmlrpc", "webbrowser", "antigravity", "turtle", "tkinter",
    "pickle", "shelve", "marshal", "tempfile", "glob", "fnmatch",
    "io", "select", "selectors", "asyncio", "concurrent",
}

BLOCKED_BUILTINS = {
    "exec", "eval", "compile", "__import__", "open",
    "globals", "locals", "getattr", "setattr", "delattr",
    "breakpoint", "input", "memoryview", "help",
    "__loader__", "__spec__",
}


def _check_safety(code: str):
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise HTTPException(status_code=400, detail=f"Syntax error: {e.msg}")

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                mod = alias.name.split(".")[0]
                if mod in BLOCKED_MODULES:
                    raise HTTPException(status_code=400, detail=f"Blocked import: '{alias.name}'")
        if isinstance(node, ast.ImportFrom):
            if node.module:
                mod = node.module.split(".")[0]
                if mod in BLOCKED_MODULES:
                    raise HTTPException(status_code=400, detail=f"Blocked import: '{node.module}'")
        if isinstance(node, ast.Call):
            name = None
            if isinstance(node.func, ast.Name):
                name = node.func.id
            elif isinstance(node.func, ast.Attribute):
                name = node.func.attr
            if name and name in BLOCKED_BUILTINS:
                raise HTTPException(status_code=400, detail=f"Blocked function: '{name}()'")


# ── Execution constants ──────────────────────────────────────────────────────

_TC_DELIM = "<<__TC_SEP__>>"

# On Windows, prevent console windows from popping up during subprocess runs
_SUBPROCESS_FLAGS = {}
if os.name == "nt":
    _SUBPROCESS_FLAGS["creationflags"] = 0x08000000  # CREATE_NO_WINDOW

# Memory limit: 256 MB worth of output to prevent runaway prints
_MAX_OUTPUT_BYTES = 256 * 1024


def _sanitize_error(msg: str) -> str:
    """Strip temp file paths from error messages for cleaner user-facing output."""
    msg = re.sub(r'[A-Za-z]:\\[^\s:]+\\tmp\w+\.cpp', 'solution.cpp', msg)
    msg = re.sub(r'[A-Za-z]:\\[^\s:]+\\tmp\w+\.java', 'solution.java', msg)
    msg = re.sub(r'[A-Za-z]:\\[^\s:]+\\tmp\w+\.py', 'solution.py', msg)
    msg = re.sub(r'/tmp/tmp\w+\.(cpp|java|py)', r'solution.\1', msg)
    return msg


# ── Query helpers ─────────────────────────────────────────────────────────────

def get_companies(db: Session) -> list[str]:
    rows = db.query(CodingSet.company).distinct().all()
    found = sorted(set(r[0] for r in rows))
    # Always return all 4 companies even if no sets exist yet
    for c in COMPANIES:
        if c not in found:
            found.append(c)
    return sorted(found)


def get_levels_for_company(db: Session, company: str, user_id: int) -> list[dict]:
    """Return all 100 levels with unlock status and completion info."""
    # Get all sets for this company
    sets = db.query(CodingSet).filter(CodingSet.company == company).all()
    set_map = {s.level_number: s for s in sets}

    # Build map: set_id → list of required problem_ids
    set_problems_map: dict[int, list[int]] = {}
    for sp in db.query(CodingSetProblem).all():
        set_problems_map.setdefault(sp.set_id, []).append(sp.problem_id)

    # All problem_ids ever submitted by this user (across all sessions)
    submitted_problem_ids: set[int] = set(
        row[0] for row in
        db.query(CodingSubmission.problem_id)
          .join(CodingSession, CodingSubmission.coding_session_id == CodingSession.id)
          .filter(CodingSession.user_id == user_id)
          .all()
    )

    # A level is "all_done" when every problem in its set has been submitted at least once
    all_done_levels: set[int] = set()
    for level_num, s in set_map.items():
        required = set_problems_map.get(s.id, [])
        if required and all(pid in submitted_problem_ids for pid in required):
            all_done_levels.add(level_num)

    # Best scores per level (for display only — not used for unlock)
    best_scores: dict[int, float] = {}
    all_sessions = db.query(CodingSession).join(CodingSet).filter(
        CodingSession.user_id == user_id,
        CodingSet.company == company,
    ).all()
    for sess in all_sessions:
        for s in sets:
            if s.id == sess.coding_set_id:
                lvl = s.level_number
                if sess.score is not None:
                    if lvl not in best_scores or sess.score > best_scores[lvl]:
                        best_scores[lvl] = sess.score
                break

    levels = []
    for i in range(100):
        level_num = i + 1
        topic = LEVEL_TOPICS[i] if i < len(LEVEL_TOPICS) else f"Challenge {level_num}"
        s = set_map.get(level_num)
        has_problems = s is not None

        # Unlock: level 1 always open; next level opens only when all problems in prev level submitted
        if level_num == 1:
            unlocked = True
        else:
            unlocked = (level_num - 1) in all_done_levels

        # Passed badge: all problems submitted AND score >= threshold
        passed = level_num in all_done_levels and best_scores.get(level_num, 0) >= PASS_THRESHOLD
        best = best_scores.get(level_num)

        levels.append({
            "level": level_num,
            "topic": topic,
            "unlocked": unlocked,
            "has_problems": has_problems,
            "passed": passed,
            "all_done": level_num in all_done_levels,
            "best_score": round(best, 1) if best is not None else None,
            "set_id": s.id if s else None,
            "problem_count": s.problem_count if s else 3,
            "duration_minutes": s.duration_minutes if s else 90,
        })

    return levels


def get_company_progress(db: Session, company: str, user_id: int) -> dict:
    """Return summary progress for a company."""
    sets = db.query(CodingSet).filter(CodingSet.company == company).all()
    total_levels = len(sets)
    completed = 0
    for s in sets:
        best = db.query(func.max(CodingSession.score)).filter(
            CodingSession.user_id == user_id,
            CodingSession.coding_set_id == s.id,
        ).scalar()
        if best is not None and best >= PASS_THRESHOLD:
            completed += 1

    return {
        "company": company,
        "total_levels": total_levels,
        "completed_levels": completed,
        "total_possible": 100,
    }


def get_sets_by_company(db: Session, company: str) -> list[dict]:
    sets = db.query(CodingSet).filter(CodingSet.company == company).order_by(CodingSet.level_number).all()
    return [
        {
            "id": s.id,
            "company": s.company,
            "round_name": s.round_name,
            "problem_count": s.problem_count,
            "duration_minutes": s.duration_minutes,
            "level_number": s.level_number,
            "topic": s.topic,
        }
        for s in sets
    ]


def get_active_coding_session(db: Session, user_id: int) -> dict | None:
    """Return the user's active coding session, if any (not timed out)."""
    active = db.query(CodingSession).filter(
        CodingSession.user_id == user_id,
        CodingSession.status == "active",
    ).order_by(CodingSession.start_time.desc()).first()

    if not active:
        return None

    cs = db.query(CodingSet).filter(CodingSet.id == active.coding_set_id).first()
    if cs and active.start_time:
        deadline = active.start_time + timedelta(minutes=cs.duration_minutes)
        if datetime.utcnow() > deadline:
            active.status = "timed_out"
            active.end_time = deadline
            db.commit()
            return None

    return {
        "session_id": active.id,
        "coding_set_id": active.coding_set_id,
        "company": cs.company if cs else "Unknown",
        "round_name": cs.round_name if cs else "Unknown",
        "level_number": cs.level_number if cs else 1,
        "topic": cs.topic if cs else "",
        "start_time": active.start_time.isoformat() if active.start_time else None,
        "score": active.score,
    }


def start_coding_session(db: Session, user_id: int, set_id: int) -> dict:
    # Check for existing active session and handle timeout
    active = db.query(CodingSession).filter(
        CodingSession.user_id == user_id,
        CodingSession.status == "active",
    ).first()
    if active:
        cs = db.query(CodingSet).filter(CodingSet.id == active.coding_set_id).first()
        if cs and active.start_time:
            deadline = active.start_time + timedelta(minutes=cs.duration_minutes)
            if datetime.utcnow() > deadline:
                active.status = "timed_out"
                active.end_time = deadline
                db.commit()
            else:
                # Resume existing session if same set
                if active.coding_set_id == set_id:
                    return _session_to_dict(db, active)
                # Different set — expire old one
                active.status = "timed_out"
                active.end_time = datetime.utcnow()
                db.commit()

    coding_set = db.query(CodingSet).filter(CodingSet.id == set_id).first()
    if not coding_set:
        raise HTTPException(status_code=404, detail="Coding set not found.")

    # Check level unlock
    if coding_set.level_number > 1:
        prev_set = db.query(CodingSet).filter(
            CodingSet.company == coding_set.company,
            CodingSet.level_number == coding_set.level_number - 1,
        ).first()
        if prev_set:
            best = db.query(func.max(CodingSession.score)).filter(
                CodingSession.user_id == user_id,
                CodingSession.coding_set_id == prev_set.id,
            ).scalar()
            if best is None or best < PASS_THRESHOLD:
                raise HTTPException(status_code=403, detail="Complete the previous level first.")

    session = CodingSession(
        user_id=user_id,
        coding_set_id=set_id,
        start_time=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info("Coding session %d started for user %d (set %d)", session.id, user_id, set_id)
    return _session_to_dict(db, session)


def get_coding_session(db: Session, session_id: int, user_id: int) -> dict:
    session = db.query(CodingSession).filter(
        CodingSession.id == session_id,
        CodingSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Coding session not found.")
    return _session_to_dict(db, session)


def submit_solution(
    db: Session, user_id: int, session_id: int, problem_id: int,
    code: str, language: str = "python"
) -> dict:
    session = db.query(CodingSession).filter(
        CodingSession.id == session_id,
        CodingSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is no longer active.")

    # Check time limit
    cs = db.query(CodingSet).filter(CodingSet.id == session.coding_set_id).first()
    if cs and session.start_time:
        deadline = session.start_time + timedelta(minutes=cs.duration_minutes)
        if datetime.utcnow() > deadline:
            session.status = "timed_out"
            session.end_time = deadline
            db.commit()
            raise HTTPException(status_code=400, detail="Time limit exceeded.")

    problem = db.query(CodingProblem).filter(CodingProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")

    if language.lower() == "python":
        _check_safety(code)
    result = _run_tests(code, problem, language)

    submission = CodingSubmission(
        coding_session_id=session_id,
        problem_id=problem_id,
        code=code,
        language=language,
        passed_cases=result["passed"],
        total_cases=result["total"],
        runtime_ms=result["runtime_ms"],
    )
    db.add(submission)

    # Update session score
    _update_session_score(db, session)

    # Auto-complete if all problems solved
    if session.score is not None and session.score >= 100:
        session.status = "completed"
        session.end_time = datetime.utcnow()

    db.commit()
    db.refresh(submission)

    return {
        "submission_id": submission.id,
        "problem_id": problem_id,
        "passed": result["passed"],
        "total": result["total"],
        "runtime_ms": result["runtime_ms"],
        "results": result["results"],
        "output": result["output"],
        "session_score": session.score,
    }


def run_tests_only(
    db: Session, user_id: int, session_id: int, problem_id: int,
    code: str, language: str = "python"
) -> dict:
    """Run tests without saving a submission (for 'Run' button)."""
    session = db.query(CodingSession).filter(
        CodingSession.id == session_id,
        CodingSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is no longer active.")

    problem = db.query(CodingProblem).filter(CodingProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")

    if language.lower() == "python":
        _check_safety(code)
    result = _run_tests(code, problem, language)
    return {
        "passed": result["passed"],
        "total": result["total"],
        "runtime_ms": result["runtime_ms"],
        "results": result["results"],
        "output": result["output"],
    }


def _update_session_score(db: Session, session: CodingSession):
    """Recalculate session score from best submission per problem."""
    set_problems = db.query(CodingSetProblem).filter(
        CodingSetProblem.set_id == session.coding_set_id
    ).all()
    total_possible = 0
    total_earned = 0
    for sp in set_problems:
        total_possible += 1
        best = db.query(CodingSubmission).filter(
            CodingSubmission.coding_session_id == session.id,
            CodingSubmission.problem_id == sp.problem_id,
        ).order_by(CodingSubmission.passed_cases.desc()).first()
        if best and best.total_cases > 0:
            total_earned += best.passed_cases / best.total_cases
    if total_possible > 0:
        session.score = round((total_earned / total_possible) * 100, 1)


def _cpp_build_args(code: str, fn_name: str, cpp_input: str):
    """Parse C++ function signature and build named arg declarations.

    Returns (decl_lines, arg_names) so initializer lists bind to named
    lvalue variables instead of failing as rvalues on non-const ref params.
    """
    # Match the function signature:  returnType fnName(type1 name1, type2& name2, ...)
    sig_pat = re.compile(
        r'\b\w[\w<>, ]*\s+' + re.escape(fn_name) + r'\s*\(([^)]*)\)',
    )
    m = sig_pat.search(code)
    if not m:
        # Fallback: pass directly (may fail for ref params, but won't regress)
        return ("", cpp_input)

    params_str = m.group(1).strip()
    if not params_str:
        return ("", "")

    # Split params by comma, but respect angle brackets (vector<vector<int>>)
    params = []
    depth = 0
    cur = []
    for ch in params_str:
        if ch in ('<',):
            depth += 1
        elif ch in ('>',):
            depth -= 1
        elif ch == ',' and depth == 0:
            params.append("".join(cur).strip())
            cur = []
            continue
        cur.append(ch)
    if cur:
        params.append("".join(cur).strip())

    # Extract base type (strip const/&) for each param
    param_types = []
    for p in params:
        p = p.strip()
        # Remove param name (last token)
        tokens = p.rsplit(None, 1)
        if len(tokens) == 2:
            param_types.append(tokens[0].replace("const ", "").replace("&", "").strip())
        else:
            param_types.append(p.replace("const ", "").replace("&", "").strip())

    # Split cpp_input into individual arguments (respect braces/angles)
    args = []
    depth = 0
    cur = []
    for ch in cpp_input:
        if ch in ('{', '<', '('):
            depth += 1
        elif ch in ('}', '>', ')'):
            depth -= 1
        elif ch == ',' and depth == 0:
            args.append("".join(cur).strip())
            cur = []
            continue
        cur.append(ch)
    if cur:
        args.append("".join(cur).strip())

    if len(args) != len(param_types):
        # Mismatch — fall back to direct pass
        return ("", cpp_input)

    decl_lines = []
    names = []
    for i, (ptype, val) in enumerate(zip(param_types, args)):
        vname = f"_arg{i}"
        decl_lines.append(f"    {ptype} {vname} = {val};")
        names.append(vname)

    return ("\n".join(decl_lines) + "\n", ", ".join(names))


def _run_tests(code: str, problem: CodingProblem, language: str = "python") -> dict:
    """Execute code against problem test cases. Supports python, cpp, java.

    Compiled languages (C++/Java) compile ONCE and run all test cases in a
    single execution for speed.  Python runs each test case separately.
    """
    test_cases = problem.test_cases or []
    fn_name = problem.function_name or "solution"
    lang = language.lower()
    time_limit = problem.time_limit or 5
    problem_title = problem.title or ""

    if not test_cases:
        return {"output": "", "runtime_ms": 0, "results": [], "total": 0, "passed": 0}

    if lang in ("cpp", "c++"):
        return _run_batch_cpp(code, fn_name, test_cases, time_limit, problem_title)
    elif lang == "java":
        return _run_batch_java(code, fn_name, test_cases, time_limit, problem_title)
    else:
        return _run_python(code, fn_name, test_cases, time_limit, problem_title)


def _parse_batch_output(raw: str, test_cases: list, problem_title: str = "") -> list[dict]:
    """Split batch output by delimiter and compare to expected values.
    
    For Two Sum problems, accepts any valid pair of indices that sum to target.
    """
    chunks = raw.split(_TC_DELIM)
    chunks = [c.strip() for c in chunks]
    results = []
    passed_count = 0
    is_two_sum = "two sum" in problem_title.lower() or "twosum" in problem_title.lower()
    
    for i, tc in enumerate(test_cases):
        if i < len(chunks) and chunks[i]:
            actual = chunks[i]
            try:
                if is_two_sum:
                    # Custom validation for Two Sum: check if returned indices are valid
                    p = _validate_two_sum(actual, tc["input"])
                else:
                    p = json.loads(actual) == json.loads(tc["expected"])
            except Exception:
                p = actual == tc["expected"]
        else:
            actual = "Error: No output (process may have crashed)"
            p = False
        if p:
            passed_count += 1
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": actual, "passed": p})
    return results


def _validate_two_sum(actual: str, input_str: str) -> bool:
    """Validate Two Sum answer by checking if returned indices sum to target."""
    try:
        # Parse actual output
        indices = json.loads(actual)
        if not isinstance(indices, list) or len(indices) != 2:
            return False
        
        # Parse input to get nums and target
        # Format: "[1,5,3,7], 8"
        parts = input_str.split(",")
        nums_str = ",".join(parts[:-1]).strip()
        target = int(parts[-1].strip())
        nums = json.loads(nums_str)
        
        # Validate indices
        i, j = indices
        if i == j:  # Can't use same element twice
            return False
        if i < 0 or j < 0 or i >= len(nums) or j >= len(nums):
            return False
        if nums[i] + nums[j] != target:
            return False
        
        return True
    except Exception:
        return False


def _run_batch_cpp(code: str, fn_name: str, test_cases: list, time_limit: int, problem_title: str = "") -> dict:
    """Compile C++ once, run all test cases in a single execution."""
    # Build test-case blocks for main()
    tc_blocks = []
    for i, tc in enumerate(test_cases):
        cpp_input = tc["input"].replace("[", "{").replace("]", "}")
        decls, names = _cpp_build_args(code, fn_name, cpp_input)
        # Indent declarations for block scope (extra 4 spaces)
        indented = decls.replace("    ", "        ") if decls else ""
        block = f"""    {{ // TC {i}
{indented}        auto _r = sol.{fn_name}({names});
        _print(_r);
        cout << endl;
    }}
    cout << "{_TC_DELIM}" << endl;"""
        tc_blocks.append(block)
    main_body = "\n".join(tc_blocks)

    script = f"""#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>
#include <map>
#include <set>
#include <stack>
#include <queue>
using namespace std;

void _print(int v) {{ cout << v; }}
void _print(long long v) {{ cout << v; }}
void _print(double v) {{ cout << v; }}
void _print(bool v) {{ cout << (v ? "true" : "false"); }}
void _print(const string& v) {{ cout << "\\"" << v << "\\""; }}
template<typename T> void _print(const vector<T>& v) {{
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {{ if (i) cout << ", "; _print(v[i]); }}
    cout << "]";
}}
template<typename T> void _print(const vector<vector<T>>& v) {{
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {{ if (i) cout << ", "; _print(v[i]); }}
    cout << "]";
}}

{code}

int main() {{
    Solution sol;
{main_body}
    return 0;
}}
"""
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".cpp", delete=False, encoding="utf-8")
    tmp.write(script)
    tmp.close()
    exe_file = tmp.name.replace(".cpp", ".exe")

    try:
        t0 = time.perf_counter()
        # Compile once
        comp = subprocess.run(
            ["g++", "-std=c++17", "-O2", "-o", exe_file, tmp.name],
            capture_output=True, text=True, timeout=15, **_SUBPROCESS_FLAGS,
        )
        if comp.returncode != 0:
            elapsed = int((time.perf_counter() - t0) * 1000)
            error = _sanitize_error(f"Compilation Error: {comp.stderr.strip()}")
            return {
                "output": error, "runtime_ms": elapsed,
                "results": [{"input": tc["input"], "expected": tc["expected"], "actual": error, "passed": False} for tc in test_cases],
                "total": len(test_cases), "passed": 0,
            }
        # Run all tests in one go
        proc = subprocess.run(
            [exe_file], capture_output=True, text=True,
            timeout=time_limit * len(test_cases), **_SUBPROCESS_FLAGS,
        )
        elapsed = int((time.perf_counter() - t0) * 1000)

        if proc.returncode != 0 and not proc.stdout.strip():
            error = _sanitize_error(f"Runtime Error: {proc.stderr.strip()}")
            return {
                "output": error, "runtime_ms": elapsed,
                "results": [{"input": tc["input"], "expected": tc["expected"], "actual": error, "passed": False} for tc in test_cases],
                "total": len(test_cases), "passed": 0,
            }
        results = _parse_batch_output(proc.stdout, test_cases, problem_title)
        return {
            "output": "\n".join(r["actual"] for r in results),
            "runtime_ms": elapsed, "results": results,
            "total": len(results), "passed": sum(1 for r in results if r["passed"]),
        }
    except subprocess.TimeoutExpired:
        return {
            "output": "Error: Time limit exceeded",
            "runtime_ms": time_limit * len(test_cases) * 1000,
            "results": [{"input": tc["input"], "expected": tc["expected"], "actual": "Error: Time limit exceeded", "passed": False} for tc in test_cases],
            "total": len(test_cases), "passed": 0,
        }
    finally:
        for f in (tmp.name, exe_file):
            try:
                os.unlink(f)
            except OSError:
                pass


def _run_batch_java(code: str, fn_name: str, test_cases: list, time_limit: int, problem_title: str = "") -> dict:
    """Compile Java once, run all test cases in a single execution."""
    # Hoist import/package lines from user code to the top so they appear
    # before any class declaration (Java requires this ordering).
    import_lines, body_lines = [], []
    for line in code.split("\n"):
        stripped = line.strip()
        if stripped.startswith("import ") or stripped.startswith("package "):
            import_lines.append(line)
        else:
            body_lines.append(line)
    user_imports = "\n".join(import_lines)
    user_code_body = "\n".join(body_lines)

    tc_blocks = []
    for i, tc in enumerate(test_cases):
        java_input = re.sub(r'\[([^\[\]]*)\]', r'new int[]{\1}', tc["input"])
        block = f"""            {{ // TC {i}
                var _r = sol.{fn_name}({java_input});
                System.out.println(_P.j(_r));
            }}
            System.out.println("{_TC_DELIM}");"""
        tc_blocks.append(block)
    main_body = "\n".join(tc_blocks)

    script = f"""import java.util.*;
{user_imports}

class _P {{
    static String j(int v) {{ return String.valueOf(v); }}
    static String j(long v) {{ return String.valueOf(v); }}
    static String j(double v) {{ return String.valueOf(v); }}
    static String j(boolean v) {{ return v ? "true" : "false"; }}
    static String j(String v) {{ return "\\"" + v + "\\""; }}
    static String j(int[] a) {{
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) {{ if (i > 0) sb.append(", "); sb.append(a[i]); }}
        return sb.append("]").toString();
    }}
    static String j(String[] a) {{
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.length; i++) {{ if (i > 0) sb.append(", "); sb.append("\\"").append(a[i]).append("\\""); }}
        return sb.append("]").toString();
    }}
    static String j(List<?> a) {{
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < a.size(); i++) {{ if (i > 0) sb.append(", "); Object o = a.get(i); if (o instanceof int[]) sb.append(j((int[])o)); else sb.append(o); }}
        return sb.append("]").toString();
    }}
}}

{user_code_body}

class Main {{
    public static void main(String[] args) {{
        Solution sol = new Solution();
        try {{
{main_body}
        }} catch (Exception e) {{
            System.err.println("Runtime Error: " + e.getMessage());
        }}
    }}
}}
"""
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".java", delete=False, encoding="utf-8")
    tmp.write(script)
    tmp.close()
    tmp_dir = os.path.dirname(tmp.name)

    try:
        t0 = time.perf_counter()
        comp = subprocess.run(
            ["javac", tmp.name], capture_output=True, text=True, timeout=15, **_SUBPROCESS_FLAGS,
        )
        if comp.returncode != 0:
            elapsed = int((time.perf_counter() - t0) * 1000)
            error = _sanitize_error(f"Compilation Error: {comp.stderr.strip()}")
            return {
                "output": error, "runtime_ms": elapsed,
                "results": [{"input": tc["input"], "expected": tc["expected"], "actual": error, "passed": False} for tc in test_cases],
                "total": len(test_cases), "passed": 0,
            }
        proc = subprocess.run(
            ["java", "-cp", tmp_dir, "Main"],
            capture_output=True, text=True,
            timeout=time_limit * len(test_cases), **_SUBPROCESS_FLAGS,
        )
        elapsed = int((time.perf_counter() - t0) * 1000)

        if proc.returncode != 0 and not proc.stdout.strip():
            error = _sanitize_error(f"Runtime Error: {proc.stderr.strip()}")
            return {
                "output": error, "runtime_ms": elapsed,
                "results": [{"input": tc["input"], "expected": tc["expected"], "actual": error, "passed": False} for tc in test_cases],
                "total": len(test_cases), "passed": 0,
            }
        results = _parse_batch_output(proc.stdout, test_cases, problem_title)
        return {
            "output": "\n".join(r["actual"] for r in results),
            "runtime_ms": elapsed, "results": results,
            "total": len(results), "passed": sum(1 for r in results if r["passed"]),
        }
    except subprocess.TimeoutExpired:
        return {
            "output": "Error: Time limit exceeded",
            "runtime_ms": time_limit * len(test_cases) * 1000,
            "results": [{"input": tc["input"], "expected": tc["expected"], "actual": "Error: Time limit exceeded", "passed": False} for tc in test_cases],
            "total": len(test_cases), "passed": 0,
        }
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass
        for cls in ("Main.class", "_P.class", "Solution.class"):
            try:
                os.unlink(os.path.join(tmp_dir, cls))
            except OSError:
                pass


def _run_python(code: str, fn_name: str, test_cases: list, time_limit: int, problem_title: str = "") -> dict:
    """Run Python test cases one at a time (no compilation step)."""
    results = []
    total_time = 0
    combined_out = []
    is_two_sum = "two sum" in problem_title.lower() or "twosum" in problem_title.lower()

    for tc in test_cases:
        tc_input = tc["input"]
        script = f"""{code}

import json
_result = {fn_name}({tc_input})
print(json.dumps(_result))
"""
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8")
        tmp.write(script)
        tmp.close()

        try:
            t0 = time.perf_counter()
            proc = subprocess.run(
                ["python", tmp.name],
                capture_output=True, text=True,
                timeout=time_limit, **_SUBPROCESS_FLAGS,
            )
            elapsed_ms = int((time.perf_counter() - t0) * 1000)
            total_time += elapsed_ms

            if proc.returncode != 0:
                actual = _sanitize_error(f"Error: {proc.stderr.strip()}")
                passed = False
            else:
                actual = proc.stdout.strip()
                try:
                    if is_two_sum:
                        passed = _validate_two_sum(actual, tc["input"])
                    else:
                        passed = json.loads(actual) == json.loads(tc["expected"])
                except Exception:
                    passed = actual == tc["expected"]
        except subprocess.TimeoutExpired:
            actual = "Error: Time limit exceeded"
            passed = False
            elapsed_ms = time_limit * 1000
            total_time += elapsed_ms
        finally:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass

        combined_out.append(actual)
        results.append({"input": tc["input"], "expected": tc["expected"], "actual": actual, "passed": passed})

    return {
        "output": "\n".join(combined_out),
        "runtime_ms": total_time,
        "results": results,
        "total": len(results),
        "passed": sum(1 for r in results if r["passed"]),
    }


def _session_to_dict(db: Session, session: CodingSession) -> dict:
    cs = db.query(CodingSet).filter(CodingSet.id == session.coding_set_id).first()
    set_problems = db.query(CodingSetProblem).filter(
        CodingSetProblem.set_id == session.coding_set_id
    ).order_by(CodingSetProblem.order_index).all()

    problems = []
    for sp in set_problems:
        p = db.query(CodingProblem).filter(CodingProblem.id == sp.problem_id).first()
        if not p:
            continue
        best = db.query(CodingSubmission).filter(
            CodingSubmission.coding_session_id == session.id,
            CodingSubmission.problem_id == p.id,
        ).order_by(CodingSubmission.passed_cases.desc()).first()
        problems.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "difficulty": p.difficulty,
            "starter_code": p.starter_code,
            "function_name": p.function_name,
            "test_cases": p.test_cases or [],
            "test_count": len(p.test_cases or []),
            "hints": p.hints or [],
            "examples": p.examples or [],
            "constraints": p.constraints or [],
            "tags": p.tags,
            "order_index": sp.order_index,
            "best_passed": best.passed_cases if best else 0,
            "best_total": best.total_cases if best else len(p.test_cases or []),
        })

    return {
        "session_id": session.id,
        "coding_set_id": session.coding_set_id,
        "company": cs.company if cs else "Unknown",
        "round_name": cs.round_name if cs else "Unknown",
        "level_number": cs.level_number if cs else 1,
        "topic": cs.topic if cs else "",
        "duration_minutes": cs.duration_minutes if cs else 90,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "status": session.status,
        "score": session.score,
        "problems": problems,
    }
