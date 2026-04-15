import { useState, useEffect, lazy, Suspense } from "react";
import { globalCss, Spinner, SplashScreen } from "./shared";

const LandingPage = lazy(() => import("./components/LandingPage"));
const LoginPage = lazy(() => import("./components/LoginPage"));
const DashboardPage = lazy(() => import("./components/DashboardPage"));
const InterviewPage = lazy(() => import("./components/InterviewPage"));
const InterviewRoomPage = lazy(() => import("./components/InterviewRoomPage"));
const ResultsPage = lazy(() => import("./components/ResultsPage"));
const AnalyticsPage = lazy(() => import("./components/AnalyticsPage"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const SettingsPage = lazy(() => import("./components/SettingsPage"));
const OnboardingPage = lazy(() => import("./components/OnboardingPage"));
const CodingInterviewPage = lazy(() => import("./components/CodingInterviewPage"));
const CareerAIPage = lazy(() => import("./components/CareerAIPage"));
const CommunicationTestPage = lazy(() => import("./components/CommunicationTestPage"));
const GDPage = lazy(() => import("./components/GDPage"));

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [page, setPage] = useState("landing");
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } });
  const [sessionData, setSessionData] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (token && user) setPage("dashboard");
  }, []);

  function handleLogin(t, u) {
    setToken(t); setUser(u);
    if (localStorage.getItem("onboarding_complete")) {
      setPage("dashboard");
    } else {
      setPage("onboarding");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setToken(""); setUser(null); setPage("landing");
  }

  function handleNav(dest) {
    if (dest === "landing") { handleLogout(); return; }
    if (dest === "dashboard") setPage("dashboard");
    else if (dest === "analytics") setPage("analytics");
    else if (dest === "interview_setup") setPage("interview_setup");
    else if (dest === "profile") setPage("profile");
    else if (dest === "settings") setPage("settings");
    else if (dest === "coding")   setPage("coding");
    else if (dest === "career")   setPage("career");
    else if (dest === "resume")   setPage("career");
    else if (dest === "jd")       setPage("career_jd");
    else if (dest === "communication") setPage("communication");
    else if (dest === "gd")            setPage("gd");
  }

  function handleUpdateUser(updatedUser) {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem("user", JSON.stringify(merged));
  }

  const sidebarProps = { user, onNav: handleNav, onLogout: handleLogout };

  return (
    <>
      <style>{globalCss}</style>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><Spinner /></div>}>
      {page === "landing" && <LandingPage onLogin={() => setPage("login")} onGetStarted={() => setPage("login")} />}
      {page === "login" && <LoginPage onLogin={handleLogin} onBack={() => setPage("landing")} />}
      {page === "onboarding" && <OnboardingPage user={user} onFinish={() => { localStorage.setItem("onboarding_complete", "true"); setPage("dashboard"); }} />}
      {page === "dashboard" && <DashboardPage token={token} {...sidebarProps} />}
      {page === "interview_setup" && <InterviewPage token={token} {...sidebarProps} onStart={sd => { setSessionData(sd); setPage("interview"); }} />}
      {page === "interview" && sessionData && <InterviewRoomPage token={token} user={user} sessionData={sessionData} onResult={r => { setLastResult(r); setPage("result"); }} onBack={() => setPage("dashboard")} />}
      {page === "result" && <ResultsPage token={token} user={user} lastResult={lastResult} onBack={() => setPage("dashboard")} onRetake={() => setPage("interview_setup")} />}
      {page === "analytics" && <AnalyticsPage token={token} {...sidebarProps} />}
      {page === "profile" && <ProfilePage token={token} {...sidebarProps} onUpdateUser={handleUpdateUser} />}
      {page === "settings" && <SettingsPage token={token} {...sidebarProps} />}
      {page === "coding"   && <CodingInterviewPage token={token} {...sidebarProps} onResult={r => { setLastResult(r); setPage("result"); }} />}
      {page === "career"   && <CareerAIPage token={token} {...sidebarProps} initialTab="resume" />}
      {page === "career_jd" && <CareerAIPage token={token} {...sidebarProps} initialTab="jd" />}
      {page === "communication" && <CommunicationTestPage token={token} {...sidebarProps} />}
      {page === "gd" && <GDPage token={token} {...sidebarProps} />}
      </Suspense>
    </>
  );
}
