import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { API, Bar, Spinner, THEME } from "../shared";
import { SidebarLayout } from "./Sidebar";

const LANGUAGE_MAP = { Python: "python", "C++": "cpp", Java: "java" };
const LANG_EXT = { Python: "solution.py", "C++": "solution.cpp", Java: "Solution.java" };
const DIFF_COLOR = { easy: "#22C55E", medium: "#F59E0B", hard: "#EF4444" };

const COMPANY_LOGOS = {
  Google: { icon: "G", bg: "linear-gradient(135deg, #4285F4, #34A853)", colors: ["#4285F4","#EA4335","#FBBC05","#34A853"] },
  Amazon: { icon: "a", bg: "linear-gradient(135deg, #FF9900, #FFB84D)", colors: ["#FF9900","#232F3E"] },
  Microsoft: { icon: "M", bg: "linear-gradient(135deg, #00A4EF, #7FBA00)", colors: ["#F25022","#7FBA00","#00A4EF","#FFB900"] },
  Meta: { icon: "M", bg: "linear-gradient(135deg, #0668E1, #1877F2)", colors: ["#0668E1","#1877F2"] },
};

function CompanyIcon({ company, size = 48 }) {
  const c = COMPANY_LOGOS[company] || { icon: company?.[0] || "?", bg: "linear-gradient(135deg, #C9A84C, #E2C97E)" };
  if (company === "Google") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4"/>
        <path d="M3 12.7l7.1 5.2C12 13.7 17.5 10 24 10c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 3.1 29.6 1 24 1 14.6 1 6.6 5.8 3 12.7z" fill="#EA4335"/>
        <path d="M24 47c5.4 0 10.3-1.8 14.1-5l-6.5-5.5C29.5 38.4 26.9 39 24 39c-6 0-11.1-4-12.9-9.5l-7 5.4C7.7 41.5 15.3 47 24 47z" fill="#34A853"/>
        <path d="M46 24c0-1.3-.2-2.7-.5-4H24v8.5h11.8c-1 2.8-2.8 5-5.2 6.5l6.5 5.5C41.5 36.4 46 30.8 46 24z" fill="#FBBC05"/>
      </svg>
    );
  }
  if (company === "Amazon") {
    return (
      <div style={{ width: size, height: size, background: "#232F3E", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 40 40">
          <path d="M20 8c-7 0-13 4-13 9 0 3 2 6 6 8-1 2-2 4-3 5 2-1 4-2 5-3 1.5.5 3.2.8 5 .8 7 0 13-4 13-9s-6-10.8-13-10.8z" fill="#FF9900"/>
          <text x="20" y="24" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800" fontFamily="Inter">a</text>
        </svg>
      </div>
    );
  }
  if (company === "Microsoft") {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <rect x="4" y="4" width="18" height="18" fill="#F25022" rx="2"/>
        <rect x="26" y="4" width="18" height="18" fill="#7FBA00" rx="2"/>
        <rect x="4" y="26" width="18" height="18" fill="#00A4EF" rx="2"/>
        <rect x="26" y="26" width="18" height="18" fill="#FFB900" rx="2"/>
      </svg>
    );
  }
  if (company === "Meta") {
    return (
      <div style={{ width: size, height: size, background: "linear-gradient(135deg, #0668E1, #1877F2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 30 30">
          <path d="M15 3C8.4 3 3 8.4 3 15c0 5.9 4.3 10.8 10 11.8V19h-3v-4h3v-3c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V15h3.4l-.5 4H16.7v7.8c5.7-1 10-5.9 10-11.8 0-6.6-5.4-12-12-12z" fill="white"/>
        </svg>
      </div>
    );
  }
  return <div style={{ width: size, height: size, background: c.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 800, color: "#fff" }}>{c.icon}</div>;
}

function CodingInterviewPage({ token, user, onNav, onLogout, onResult }) {
  // ── Step: "landing" → "companies" → "levels" → "coding" ────────
  const [step, setStep]                       = useState("companies");
  const [companies, setCompanies]             = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [levels, setLevels]                   = useState([]);
  const [loadingLevels, setLoadingLevels]     = useState(false);

  // ── Session state ─────────────────────────────────────────────────
  const [session, setSession]               = useState(null);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [codeMap, setCodeMap]               = useState({});
  const [language, setLanguage]             = useState("Python");
  const [timer, setTimer]                   = useState(0);
  const [running, setRunning]               = useState(false);
  const [runError, setRunError]             = useState("");
  const [runResults, setRunResults]         = useState(null);
  const [submitting, setSubmitting]         = useState(false);
  const [activeTab, setActiveTab]           = useState("description"); // description | hints
  const [revealedHints, setRevealedHints]   = useState(0);

  const [activeCoding, setActiveCoding] = useState(null);

  const card = { background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(201,168,76,0.06)", borderRadius: 12, position: "relative", overflow: "hidden" };
  const btn = (bg, color = "#fff") => ({ background: bg, color, border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer" });

  // ── Load companies + check active session ─────────────────────────
  useEffect(() => {
    fetch(`${API}/coding/companies`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setCompanies(d); });
    fetch(`${API}/coding/active`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.active) setActiveCoding(d); }).catch(() => {});
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────
  const finishRef = useRef(null);
  useEffect(() => {
    if (step !== "coding" || !session) return;
    const id = setInterval(() => {
      setTimer(t => {
        if (t <= 1 && t > 0) {
          setTimeout(() => { if (finishRef.current) finishRef.current(); }, 0);
          return 0;
        }
        return t > 0 ? t - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, session]);

  function fmtTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function selectCompany(company) {
    setSelectedCompany(company);
    setLoadingLevels(true);
    const r = await fetch(`${API}/coding/levels?company=${encodeURIComponent(company)}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setLevels(Array.isArray(d) ? d : []);
    setLoadingLevels(false);
    setStep("levels");
  }

  function getStarterCode(problem, lang) {
    const fnName = problem.function_name || "solution";
    const pyStarter = problem.starter_code || "";
    // Extract params from Python starter: def fnName(p1, p2)
    const match = pyStarter.match(/def\s+\w+\(([^)]*)\)/);
    const params = match ? match[1].split(",").map(p => p.trim()).filter(Boolean) : [];

    if (lang === "Python") return pyStarter || `def ${fnName}():\n    pass\n`;

    // Infer return type from first test case's expected output
    const testCases = problem.test_cases || [];
    const expected = testCases.length > 0 ? (testCases[0].expected || "").trim() : "";
    function inferReturnType() {
      if (expected === "true" || expected === "false") return "bool";
      if (expected.startsWith("[[")) return "list_of_lists";
      if (expected.startsWith("[")) return "list";
      if (expected.startsWith('"') || expected.startsWith("'")) return "string";
      return "int";
    }
    const retType = inferReturnType();

    // Infer param types from param names
    const arrNames = ["nums","arr","numbers","heights","prices","candidates","stones","piles","cost","gas","intervals"];
    const strArrNames = ["strs","words","tokens"];
    const matrixNames = ["matrix","grid","board"];
    const strNames = ["s","t","word","word1","word2","pattern","haystack","needle","str","text"];
    function cppType(p) {
      if (arrNames.includes(p)) return `vector<int>& ${p}`;
      if (strArrNames.includes(p)) return `vector<string>& ${p}`;
      if (matrixNames.includes(p)) return `vector<vector<int>>& ${p}`;
      if (strNames.includes(p)) return `string ${p}`;
      return `int ${p}`;
    }
    function javaType(p) {
      if (arrNames.includes(p)) return `int[] ${p}`;
      if (strArrNames.includes(p)) return `String[] ${p}`;
      if (matrixNames.includes(p)) return `int[][] ${p}`;
      if (strNames.includes(p)) return `String ${p}`;
      return `int ${p}`;
    }

    const cppReturnMap = { bool: "bool", int: "int", string: "string", list: "vector<int>", list_of_lists: "vector<vector<int>>" };
    const cppDefaultMap = { bool: "false", int: "0", string: '""', list: "{}", list_of_lists: "{}" };
    const javaReturnMap = { bool: "boolean", int: "int", string: "String", list: "int[]", list_of_lists: "int[][]" };
    const javaDefaultMap = { bool: "false", int: "0", string: '""', list: "new int[0]", list_of_lists: "new int[0][0]" };

    if (lang === "C++") {
      const cppParams = params.map(cppType).join(", ");
      const cppRet = cppReturnMap[retType] || "int";
      const cppDef = cppDefaultMap[retType] || "0";
      return [
        "#include <vector>",
        "#include <string>",
        "#include <unordered_map>",
        "#include <unordered_set>",
        "#include <algorithm>",
        "using namespace std;",
        "",
        "class Solution {",
        "public:",
        `    ${cppRet} ${fnName}(${cppParams}) {`,
        "        // your code here",
        `        return ${cppDef};`,
        "    }",
        "};",
        "",
      ].join("\n");
    }
    if (lang === "Java") {
      const javaParams = params.map(javaType).join(", ");
      const javaRet = javaReturnMap[retType] || "int";
      const javaDef = javaDefaultMap[retType] || "0";
      return [
        "import java.util.*;",
        "",
        "class Solution {",
        `    public ${javaRet} ${fnName}(${javaParams}) {`,
        "        // your code here",
        `        return ${javaDef};`,
        "    }",
        "}",
        "",
      ].join("\n");
    }
    return `def ${fnName}():\n    pass\n`;
  }

  async function resumeActiveCoding() {
    if (!activeCoding) return;
    setActiveCoding(null);
    await startLevel(activeCoding.coding_set_id);
  }

  async function startLevel(setId) {
    setRunError("");
    const r = await fetch(`${API}/coding/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ set_id: setId }),
    });
    const d = await r.json();
    if (!r.ok) { setRunError(d?.detail || "Failed to start"); return; }
    setSession(d);
    const map = {};
    (d.problems || []).forEach(p => { map[p.id] = getStarterCode(p, language); });
    setCodeMap(map);
    if (d.start_time && d.duration_minutes) {
      const utcStart = d.start_time.endsWith("Z") ? d.start_time : d.start_time + "Z";
      const endMs = new Date(utcStart).getTime() + d.duration_minutes * 60 * 1000;
      setTimer(Math.max(0, Math.floor((endMs - Date.now()) / 1000)));
    }
    setActiveProblemIdx(0);
    setRunResults(null);
    setRevealedHints(0);
    setActiveTab("description");
    setStep("coding");
  }

  async function runCode() {
    const problem = session.problems[activeProblemIdx];
    const code = codeMap[problem.id] || "";
    setRunning(true); setRunResults(null); setRunError("");
    try {
      const r = await fetch(`${API}/coding/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: session.session_id, problem_id: problem.id, code, language: LANGUAGE_MAP[language] }),
      });
      const d = await r.json();
      if (!r.ok) { setRunError(d?.detail || "Run failed"); }
      else { setRunResults({ ...d, type: "run" }); }
    } catch { setRunError("Could not reach server."); }
    setRunning(false);
  }

  async function submitCode() {
    const problem = session.problems[activeProblemIdx];
    const code = codeMap[problem.id] || "";
    setSubmitting(true); setRunResults(null); setRunError("");
    try {
      const r = await fetch(`${API}/coding/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: session.session_id, problem_id: problem.id, code, language: language.toLowerCase() }),
      });
      const d = await r.json();
      if (!r.ok) { setRunError(d?.detail || "Submit failed"); }
      else { setRunResults({ ...d, type: "submit" }); }
    } catch { setRunError("Could not reach server."); }
    setSubmitting(false);
  }

  async function finishSession() {
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/coding/session/${session.session_id}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      onResult({
        total_score: d.score || 0, nlp_score: d.score || 0,
        voice_score: 0, face_score: 0,
        feedback: `Coding round complete: ${d.company} Level ${d.level_number} — ${d.topic}. Score: ${d.score || 0}%`,
        type: "coding",
      });
    } catch {
      onResult({ total_score: 0, nlp_score: 0, voice_score: 0, face_score: 0, feedback: "Session completed.", type: "coding" });
    }
    setSubmitting(false);
  }
  finishRef.current = finishSession;

  const activeProblem = session?.problems?.[activeProblemIdx];


  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Company Selection
  // ══════════════════════════════════════════════════════════════════
  if (step === "companies") {
    const companyAccents = { Google: "#4285F4", Amazon: "#FF9900", Microsoft: "#00A4EF", Meta: "#1877F2" };
    const companyDescs = { Google: "Algorithm-heavy problems testing data structures, graph theory, and optimization", Amazon: "Leadership-focused coding with emphasis on scalability and system thinking", Microsoft: "Well-rounded problems covering arrays, trees, dynamic programming", Meta: "Graph and string manipulation challenges with real-world applications" };
    return (
      <SidebarLayout active="coding" user={user} onNav={onNav} onLogout={onLogout}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 36px" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 16, padding: "24px 32px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", animation: "fadeIn 0.5s ease" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #22C55E40, transparent)" }} />
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, background: "linear-gradient(135deg, #F1F5F9 30%, #22C55E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Coding Challenges</h1>
              <p style={{ color: "#7C8BA8", fontSize: 13, margin: 0 }}>Company-specific problems · 100 levels · 3 problems per level · 90 min timer</p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[{ v: companies.length || 4, l: "Companies" }, { v: "100", l: "Levels" }, { v: "300", l: "Problems" }].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ color: "#22C55E", fontWeight: 700, fontSize: 18 }}>{s.v}</div>
                  <div style={{ color: "#5A6B85", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active coding session banner */}
          {activeCoding && (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "16px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeIn 0.4s ease" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: "#22C55E", animation: "pulse 2s infinite" }} />
                  <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 14 }}>Active Coding Session</span>
                </div>
                <p style={{ color: "#7C8BA8", fontSize: 12, margin: 0 }}>
                  {activeCoding.company} · Level {activeCoding.level_number} · {activeCoding.topic || activeCoding.round_name} · started {activeCoding.start_time ? new Date(activeCoding.start_time).toLocaleString() : "recently"}
                </p>
              </div>
              <button onClick={resumeActiveCoding}
                style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Resume
              </button>
            </div>
          )}

          {/* Company Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {(companies.length > 0 ? companies : ["Google", "Amazon", "Microsoft", "Meta"]).map((c, i) => {
              const accent = companyAccents[c] || "#C9A84C";
              return (
                <button key={c} onClick={() => selectCompany(c)}
                  style={{
                    ...card, padding: 0, textAlign: "left", cursor: "pointer",
                    border: `1px solid rgba(255,255,255,0.06)`, transition: "all 0.3s",
                    animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}50`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${accent}12`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}40)` }} />
                  <div style={{ padding: "24px 24px 20px", display: "flex", gap: 18, alignItems: "flex-start" }}>
                    <CompanyIcon company={c} size={52} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{c}</div>
                      <div style={{ color: "#5A6B85", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{companyDescs[c] || "100 progressive coding levels"}</div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ color: "#4A5568", fontSize: 11 }}>100 Levels</span>
                        <span style={{ color: "#4A5568", fontSize: 11 }}>3 Problems / Level</span>
                        <span style={{ color: "#4A5568", fontSize: 11 }}>90 min</span>
                      </div>
                    </div>
                    <div style={{ color: accent, fontSize: 18, fontWeight: 300, alignSelf: "center" }}>→</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* How it works — compact */}
          <div style={{ marginTop: 24, background: "linear-gradient(135deg, #0F1629, #111A30)", border: "1px solid rgba(34,197,94,0.04)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
              {[
                { n: "1", t: "Pick Company", icon: "🏢" },
                { n: "2", t: "Select Level", icon: "📶" },
                { n: "3", t: "Solve & Run", icon: "💻" },
                { n: "4", t: "Submit & Score", icon: "✅" },
              ].map((s, i) => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && <span style={{ color: "#334155", marginRight: 8 }}>→</span>}
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{s.icon}</div>
                  <span style={{ color: "#5A6B85", fontSize: 12 }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Level Grid
  // ══════════════════════════════════════════════════════════════════
  if (step === "levels") {
    const completed = levels.filter(l => l.passed).length;
    const currentLevel = levels.find(l => l.unlocked && !l.passed && l.has_problems) || levels.find(l => l.unlocked && !l.passed) || null;
    const companyAccent = { Google: "#4285F4", Amazon: "#FF9900", Microsoft: "#00A4EF", Meta: "#1877F2" }[selectedCompany] || "#C9A84C";

    return (
      <SidebarLayout active="coding" user={user} onNav={onNav} onLogout={onLogout}>
        <div style={{ maxWidth: 1050, margin: "0 auto", padding: "28px 36px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => setStep("companies")}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}>
                ← Companies
              </button>
              <CompanyIcon company={selectedCompany} size={40} />
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>{selectedCompany}</h1>
                <p style={{ color: "#5A6B85", fontSize: 12, margin: 0 }}>{completed} of 100 levels completed</p>
              </div>
            </div>
            {currentLevel && (
              <div style={{ background: `${companyAccent}12`, border: `1px solid ${companyAccent}30`, borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: companyAccent, animation: "pulse 2s infinite" }} />
                <span style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 13 }}>Level {currentLevel.level}</span>
                <span style={{ color: "#5A6B85", fontSize: 11 }}>· {currentLevel.topic}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ ...card, padding: "14px 20px", marginBottom: 20, animation: "fadeIn 0.4s ease 0.1s both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#5A6B85", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Progress</span>
              <span style={{ color: companyAccent, fontSize: 12, fontWeight: 700 }}>{completed}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${completed}%`, height: "100%", background: `linear-gradient(90deg, ${companyAccent}, ${companyAccent}99)`, borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 10, color: "#4A5568", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.5)", display: "inline-block" }} /> Passed</span>
              <span style={{ fontSize: 10, color: "#4A5568", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(201,168,76,0.3)", border: "1px solid rgba(201,168,76,0.5)", display: "inline-block" }} /> Current</span>
              <span style={{ fontSize: 10, color: "#4A5568", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "inline-block" }} /> Locked</span>
            </div>
          </div>

          {loadingLevels ? (
            <div style={{ textAlign: "center", padding: 60, color: "#5A6B85" }}><Spinner /> Loading levels...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6, animation: "fadeInUp 0.4s ease 0.15s both" }}>
              {levels.map((lv) => {
                const isLocked = !lv.unlocked;
                const isPassed = lv.passed;
                const isCurrent = lv.unlocked && !lv.passed && lv.has_problems;
                const noProblems = lv.unlocked && !lv.has_problems;

                let bg = "#0F1629";
                let border = "1px solid rgba(255,255,255,0.05)";
                let color = "#475569";
                let cursor = "default";
                let opacity = 1;
                let shadow = "none";

                const isClickable = !isLocked && !noProblems && lv.set_id;
                if (isPassed) { bg = "rgba(34,197,94,0.08)"; border = "1px solid rgba(34,197,94,0.25)"; color = "#22C55E"; cursor = "pointer"; }
                else if (isCurrent) { bg = `${companyAccent}12`; border = `1.5px solid ${companyAccent}50`; color = companyAccent; cursor = "pointer"; shadow = `0 0 12px ${companyAccent}15`; }
                else if (noProblems) { bg = "rgba(255,255,255,0.01)"; color = "#2D3748"; }
                else if (isLocked) { opacity = 0.35; }

                return (
                  <button key={lv.level}
                    title={`Level ${lv.level}: ${lv.topic}${isPassed ? " (Passed ✓)" : isLocked ? " (Locked 🔒)" : noProblems ? " (Coming Soon)" : " (Click to attempt)"}`}
                    onClick={() => { if (isClickable) startLevel(lv.set_id); }}
                    disabled={!isClickable}
                    style={{
                      background: bg, border, borderRadius: 6, padding: "8px 2px", textAlign: "center",
                      cursor: isClickable ? "pointer" : "default", opacity, transition: "all 0.2s",
                      position: "relative", boxShadow: shadow,
                    }}
                    onMouseEnter={e => { if (isClickable) e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { if (isClickable) e.currentTarget.style.transform = "translateY(0)"; }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1 }}>{lv.level}</div>
                    <div style={{ fontSize: 7, color: "#3D4A5C", marginTop: 2, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lv.topic}</div>
                    {isPassed && <div style={{ position: "absolute", top: 1, right: 2, fontSize: 7, color: "#22C55E" }}>✓</div>}
                    {isLocked && <div style={{ position: "absolute", top: 1, right: 2, fontSize: 7, color: "#475569" }}>🔒</div>}
                  </button>
                );
              })}
            </div>
          )}

          {runError && <div style={{ ...card, padding: 12, marginTop: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)" }}><span style={{ color: "#EF4444", fontSize: 13 }}>{runError}</span></div>}
        </div>
      </SidebarLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: LeetCode-Style Coding Interface
  // ══════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0B0F1E", overflow: "hidden" }}>
      {/* Top Bar */}
      <div style={{ flex: "0 0 50px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#0F1629", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => { setStep("levels"); setSession(null); }} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", padding: "4px 8px" }}>← Levels</button>
          <CompanyIcon company={session?.company} size={28} />
          <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15 }}>Level {session?.level_number}</span>
          <span style={{ color: "#475569", fontSize: 13 }}>— {session?.topic}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...card, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>⏱</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: timer < 300 ? "#EF4444" : "#F1F5F9", fontVariantNumeric: "tabular-nums" }}>{fmtTime(timer)}</span>
          </div>
          <button onClick={finishSession} disabled={submitting}
            style={{ ...btn("rgba(239,68,68,0.12)", "#EF4444"), border: "1px solid rgba(239,68,68,0.25)", padding: "6px 16px", fontSize: 13, borderRadius: 8 }}>
            {submitting ? "..." : "End Session"}
          </button>
        </div>
      </div>

      {/* Problem Tabs */}
      <div style={{ flex: "0 0 42px", display: "flex", alignItems: "center", gap: 4, padding: "0 20px", background: "#0B0F1E", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {(session?.problems || []).map((p, i) => {
          const solved = p.best_passed > 0 && p.best_passed >= p.best_total;
          const partial = p.best_passed > 0 && p.best_passed < p.best_total;
          return (
            <button key={p.id} onClick={() => { setActiveProblemIdx(i); setRunResults(null); setRunError(""); setRevealedHints(0); setActiveTab("description"); }}
              style={{
                background: i === activeProblemIdx ? "rgba(34,197,94,0.1)" : "transparent",
                border: "none", borderBottom: i === activeProblemIdx ? "2px solid #22C55E" : "2px solid transparent",
                padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
              }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: solved ? "#22C55E" : partial ? "#F59E0B" : "#334155" }} />
              <span style={{ color: i === activeProblemIdx ? "#F1F5F9" : "#64748B", fontSize: 13, fontWeight: 600 }}>{i + 1}. {p.title}</span>
              <span style={{ fontSize: 10, color: DIFF_COLOR[p.difficulty] || "#94A3B8", fontWeight: 600, textTransform: "capitalize" }}>{p.difficulty}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content: Left (Description) | Right (Editor + Results) */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 0, overflow: "hidden" }}>
        {/* ── LEFT: Problem Description ─────────────────────────────── */}
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ flex: "0 0 36px", display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["description", "hints"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #22C55E" : "2px solid transparent", padding: "6px 20px", color: activeTab === tab ? "#F1F5F9" : "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                {tab === "hints" ? `Hints (${activeProblem?.hints?.length || 0})` : "Description"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {activeProblem && activeTab === "description" && (
              <div className="fade-in">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{activeProblem.title}</h2>
                  <span style={{ background: `${DIFF_COLOR[activeProblem.difficulty] || "#94A3B8"}18`, color: DIFF_COLOR[activeProblem.difficulty], fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, textTransform: "capitalize" }}>
                    {activeProblem.difficulty}
                  </span>
                </div>
                <div style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.85, whiteSpace: "pre-line", marginBottom: 24 }}>{activeProblem.description}</div>

                {/* Examples */}
                {(activeProblem.examples || []).map((ex, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Example {i + 1}</div>
                    <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 13 }}>
                      <div style={{ color: "#64748B", marginBottom: 4 }}>Input: <span style={{ color: "#CBD5E1" }}>{ex.input}</span></div>
                      <div style={{ color: "#64748B", marginBottom: 4 }}>Output: <span style={{ color: "#22C55E" }}>{ex.output}</span></div>
                      {ex.explanation && <div style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>Explanation: {ex.explanation}</div>}
                    </div>
                  </div>
                ))}

                {/* Constraints */}
                {(activeProblem.constraints || []).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Constraints</div>
                    {activeProblem.constraints.map((c, i) => (
                      <div key={i} style={{ color: "#64748B", fontSize: 13, fontFamily: "'Fira Code', monospace", marginBottom: 4, paddingLeft: 12, borderLeft: "2px solid rgba(201,168,76,0.3)" }}>
                        {c}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {activeProblem.tags && (
                  <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
                    {activeProblem.tags.split(",").map(t => (
                      <span key={t} style={{ background: "rgba(201,168,76,0.1)", color: "#E2C97E", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 99 }}>{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeProblem && activeTab === "hints" && (
              <div className="fade-in">
                <h3 style={{ color: "#F1F5F9", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Hints</h3>
                {(activeProblem.hints || []).map((hint, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    {i < revealedHints ? (
                      <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "12px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>Hint {i + 1}</div>
                        <div style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.6 }}>{hint}</div>
                      </div>
                    ) : (
                      <button onClick={() => setRevealedHints(i + 1)}
                        style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ color: "#64748B", fontSize: 13 }}>🔒 Click to reveal Hint {i + 1}</span>
                      </button>
                    )}
                  </div>
                ))}
                {(!activeProblem.hints || activeProblem.hints.length === 0) && (
                  <p style={{ color: "#475569", fontSize: 13 }}>No hints available for this problem.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor + Test Results ──────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Editor Header */}
          <div style={{ flex: "0 0 36px", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ color: "#475569", fontSize: 12, marginLeft: 4 }}>{LANG_EXT[language]}</span>
            </div>
            <select value={language} onChange={e => {
                const newLang = e.target.value;
                setLanguage(newLang);
                if (activeProblem) {
                  setCodeMap(prev => ({ ...prev, [activeProblem.id]: getStarterCode(activeProblem, newLang) }));
                }
              }}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8", borderRadius: 6, padding: "3px 8px", fontSize: 11 }}>
              <option value="Python">Python</option>
              <option value="C++">C++</option>
              <option value="Java">Java</option>
            </select>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={LANGUAGE_MAP[language]}
              theme="vs-dark"
              value={activeProblem ? (codeMap[activeProblem.id] || "") : ""}
              onChange={value => { if (activeProblem) setCodeMap(prev => ({ ...prev, [activeProblem.id]: value || "" })); }}
              options={{ fontSize: 14, fontFamily: "'Fira Code', 'Consolas', monospace", minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, lineNumbers: "on", tabSize: 4, wordWrap: "on", padding: { top: 12 } }}
            />
          </div>

          {/* Test Results Panel */}
          <div style={{ flex: "0 0 auto", maxHeight: 200, overflowY: "auto", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0B0F1E" }}>
            {runError && (
              <div style={{ padding: "10px 16px", background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
                <span style={{ color: "#EF4444", fontSize: 12 }}>{runError}</span>
              </div>
            )}
            {runResults && (
              <div style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: runResults.passed === runResults.total ? "#22C55E" : "#EF4444" }}>
                      {runResults.passed === runResults.total ? "Accepted" : "Wrong Answer"}
                    </span>
                    {runResults.type === "submit" && <span style={{ fontSize: 10, background: "rgba(201,168,76,0.15)", color: "#E2C97E", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Submitted</span>}
                  </div>
                  <span style={{ fontSize: 12, color: "#64748B" }}>{runResults.passed}/{runResults.total} passed · {runResults.runtime_ms}ms</span>
                </div>
                {(runResults.results || []).map((tc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 6, fontSize: 12, marginBottom: 4, background: tc.passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${tc.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                    <span style={{ color: tc.passed ? "#22C55E" : "#EF4444", fontWeight: 700, fontSize: 11, minWidth: 32 }}>{tc.passed ? "PASS" : "FAIL"}</span>
                    <code style={{ color: "#94A3B8", fontFamily: "monospace", flex: 1, fontSize: 11 }}>Input: {tc.input}</code>
                    {!tc.passed && <code style={{ color: "#64748B", fontFamily: "monospace", fontSize: 11 }}>Expected: {tc.expected}</code>}
                    <code style={{ color: tc.passed ? "#22C55E" : "#EF4444", fontFamily: "monospace", fontSize: 11 }}>Got: {tc.actual}</code>
                  </div>
                ))}
              </div>
            )}
            {!runResults && !runError && (
              <div style={{ padding: "16px", textAlign: "center", color: "#334155", fontSize: 12 }}>Click Run to test your code, or Submit to save your solution</div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ flex: "0 0 52px", display: "flex", gap: 10, padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0F1629" }}>
            <button onClick={runCode} disabled={running || !activeProblem}
              style={{ flex: 1, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22C55E", borderRadius: 8, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: running ? 0.6 : 1, transition: "all 0.2s" }}>
              {running ? <Spinner /> : "▶ Run"}
            </button>
            <button onClick={submitCode} disabled={submitting || !activeProblem}
              style={{ flex: 1, background: "linear-gradient(135deg, #22C55E, #16A34A)", border: "none", color: "#fff", borderRadius: 8, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 20px rgba(34,197,94,0.4)", opacity: submitting ? 0.6 : 1, transition: "all 0.2s" }}>
              {submitting ? <Spinner /> : "Submit"}
            </button>
            <button onClick={finishSession} disabled={submitting}
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#E2C97E", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default CodingInterviewPage;
