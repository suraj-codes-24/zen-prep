import { useState } from "react";
import { ZenPrepLogo, useWindowSize } from "../shared";

function Sidebar({ active, user, onNav, onLogout, showUser, isOpen, onClose }) {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const [hoveredItem, setHoveredItem] = useState(null);
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "interview_setup", label: "Interview", icon: "◉" },
    { id: "coding",    label: "Coding",    icon: "💻" },
    { id: "communication", label: "Comm Test", icon: "🎤" },
    { id: "gd",            label: "GD Room",   icon: "🎭" },
    { id: "analytics", label: "Analytics", icon: "▦" },
    { id: "career",    label: "Career AI", icon: "📄" },
    { id: "profile",   label: "Profile",   icon: "○" },
    { id: "settings",  label: "Settings",  icon: "⚙" },
  ];
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
        />
      )}
      <div style={{
        width: isMobile ? 280 : 220,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0F1629 0%, #0B1022 50%, #0F1629 100%)",
        borderRight: "1px solid rgba(201,168,76,0.08)",
        display: "flex",
        flexDirection: "column",
        position: isMobile ? "fixed" : "fixed",
        left: isMobile ? (isOpen ? 0 : -280) : 0,
        top: 0,
        zIndex: 100,
        overflow: "hidden",
        transition: isMobile ? "left 0.3s ease" : "none",
      }}>
      {/* Gold accent line on right edge */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, transparent 0%, rgba(201,168,76,0.2) 30%, rgba(201,168,76,0.4) 50%, rgba(201,168,76,0.2) 70%, transparent 100%)" }} />
      {/* Ambient glow behind logo */}
      <div style={{ position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      {/* Subtle grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.015) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Logo */}
      <div onClick={() => onNav("landing")} style={{ position: "relative", padding: "24px 20px 20px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "opacity 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)", animation: "ringPulse 4s ease-in-out infinite", pointerEvents: "none" }} />
          <ZenPrepLogo size={38} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, background: "linear-gradient(135deg, #F1F5F9 40%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZenPrep</div>
          <div style={{ color: "#7C8BA8", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Focus Flows Here</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: "0 16px 8px", height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 10px", position: "relative" }}>
        {items.map(item => {
          const isActive = active === item.id;
          const isHovered = hoveredItem === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, position: "relative",
                padding: "10px 12px", borderRadius: 8, marginBottom: 2, fontSize: 13,
                background: isActive ? "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.08))" : isHovered ? "rgba(99,102,241,0.06)" : "transparent",
                color: isActive ? "#A5B4FC" : isHovered ? "#CBD5E1" : "#7C8BA8",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s ease",
                border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                boxShadow: isActive ? "0 0 20px rgba(99,102,241,0.1), inset 0 0 12px rgba(99,102,241,0.04)" : "none",
              }}>
              {isActive && <div style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: 2, background: "linear-gradient(180deg, #6366F1, #818CF8)", boxShadow: "0 0 8px rgba(99,102,241,0.6)" }} />}
              <span style={{ fontSize: 14, width: 18, textAlign: "center", filter: isActive ? "drop-shadow(0 0 4px rgba(99,102,241,0.5))" : "none" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ margin: "4px 16px 8px", height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />

      {/* Bottom */}
      <div style={{ padding: "8px 10px 16px", position: "relative" }}>
        {showUser && user && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", marginBottom: 8, borderRadius: 10, background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.08)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #A68B3C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700, flexShrink: 0, boxShadow: "0 0 12px rgba(201,168,76,0.25)" }}>
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name?.split(" ")[0]}</div>
              <div style={{ color: "#C9A84C", fontSize: 10, fontWeight: 500 }}>Premium Member</div>
            </div>
          </div>
        )}
        <button onClick={onLogout}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#FCA5A5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7C8BA8"; }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 8,
            background: "transparent", color: "#7C8BA8", fontSize: 13, transition: "all 0.2s",
          }}>
          <span style={{ fontSize: 14 }}>↪</span> Logout
        </button>
      </div>
    </div>
    </>
  );
}

// ─── Page wrapper with sidebar ─────────────────────────────────────────────────
function SidebarLayout({ active, user, onNav, onLogout, children, showUser }) {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0B0F1E" }}>
      <Sidebar active={active} user={user} onNav={onNav} onLogout={onLogout} showUser={showUser} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {/* Background grid overlay */}
        <div style={{ position: "fixed", top: 0, left: isMobile ? 0 : 220, right: 0, bottom: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0 }} />
        {/* Ambient glow orbs */}
        <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)", top: -100, right: -100, animation: "orbFloat1 20s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(226,201,126,0.03) 0%, transparent 70%)", bottom: -50, left: 300, animation: "orbFloat2 25s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
        {/* Global branding header */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid rgba(201,168,76,0.08)", background: "linear-gradient(90deg, #080C1A, #0A1020, #080C1A)", padding: isMobile ? "12px 16px" : "8px 32px", display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)" }} />
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.2)",
                color: "#E2C97E",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              ☰
            </button>
          )}
          <div onClick={() => onNav("landing")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <ZenPrepLogo size={20} />
            <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, background: "linear-gradient(135deg, #E2E8F0 40%, #E2C97E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZenPrep</span>
          </div>
          <span style={{ color: "#1E293B", fontSize: isMobile ? 12 : 13 }}>|</span>
          <span style={{ color: "#4A5568", fontSize: isMobile ? 11 : 12, letterSpacing: "0.04em" }}>Focus Flows Here</span>
        </div>
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}


export { Sidebar, SidebarLayout };
