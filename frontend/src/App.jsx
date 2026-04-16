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
    if (token && user) {
      setPage("dashboard");
      window.history.replaceState({ page: "dashboard" }, "", "#dashboard");
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setPage(event.state.page);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle initial page load from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== page) {
      setPage(hash);
    }
  }, []);

  function handleLogin(t, u) {
    setToken(t); setUser(u);
    const targetPage = localStorage.getItem("onboarding_complete") ? "dashboard" : "onboarding";
    setPage(targetPage);
    window.history.pushState({ page: targetPage }, "", `#${targetPage}`);
  }

  function handleLogout() {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setToken(""); setUser(null); setPage("landing");
    window.history.replaceState({ page: "landing" }, "", "#landing");
  }

  function handleNav(dest) {
    if (dest === "landing") { handleLogout(); return; }
    
    const pageMap = {
      "dashboard": "dashboard",
      "analytics": "analytics",
      "interview_setup": "interview_setup",
      "profile": "profile",
      "settings": "settings",
      "coding": "coding",
      "career": "career",
      "resume": "career",
      "jd": "career_jd",
      "communication": "communication",
      "gd": "gd",
    };
    
    const targetPage = pageMap[dest];
    if (targetPage && targetPage !== page) {
      setPage(targetPage);
      // Push to browser history so back button works
      window.history.pushState({ page: targetPage }, "", `#${targetPage}`);
    }
  }

  function handleUpdateUser(updatedUser) {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem("user", JSON.stringify(merged));
  }

  const sidebarProps = { user, onNav: handleNav, onLogout: handleLogout };

  const navigateTo = (targetPage) => {
    setPage(targetPage);
    window.history.pushState({ page: targetPage }, "", `#${targetPage}`);
  };

  return (
    <>
      <style>{globalCss}</style>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><Spinner /></div>}>
      {page === "landing" && <LandingPage onLogin={() => navigateTo("login")} onGetStarted={() => navigateTo("login")} />}
      {page === "login" && <LoginPage onLogin={handleLogin} onBack={() => navigateTo("landing")} />}
      {page === "onboarding" && <OnboardingPage user={user} onFinish={() => { localStorage.setItem("onboarding_complete", "true"); navigateTo("dashboard"); }} />}
      {page === "dashboard" && <DashboardPage token={token} {...sidebarProps} />}
      {page === "interview_setup" && <InterviewPage token={token} {...sidebarProps} onStart={sd => { setSessionData(sd); navigateTo("interview"); }} />}
      {page === "interview" && sessionData && <InterviewRoomPage token={token} user={user} sessionData={sessionData} onResult={r => { setLastResult(r); navigateTo("result"); }} onBack={() => navigateTo("dashboard")} />}
      {page === "result" && <ResultsPage token={token} user={user} lastResult={lastResult} onBack={() => navigateTo("dashboard")} onRetake={() => navigateTo("interview_setup")} />}
      {page === "analytics" && <AnalyticsPage token={token} {...sidebarProps} />}
      {page === "profile" && <ProfilePage token={token} {...sidebarProps} onUpdateUser={handleUpdateUser} />}
      {page === "settings" && <SettingsPage token={token} {...sidebarProps} />}
      {page === "coding"   && <CodingInterviewPage token={token} {...sidebarProps} onResult={r => { setLastResult(r); navigateTo("result"); }} />}
      {page === "career"   && <CareerAIPage token={token} {...sidebarProps} initialTab="resume" />}
      {page === "career_jd" && <CareerAIPage token={token} {...sidebarProps} initialTab="jd" />}
      {page === "communication" && <CommunicationTestPage token={token} {...sidebarProps} />}
      {page === "gd" && <GDPage token={token} {...sidebarProps} />}
      </Suspense>
    </>
  );
}
