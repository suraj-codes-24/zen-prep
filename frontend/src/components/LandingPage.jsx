import { useState, useEffect } from "react";
import { API, Bar, ZenPrepLogo, THEME } from "../shared";

function ModalOverlay({ title, onClose, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        animation: mounted ? "fadeIn 0.2s ease" : "none",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0F1629",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          maxWidth: 640,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          padding: "36px 40px",
          position: "relative",
          animation: mounted ? "scaleIn 0.25s ease" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94A3B8",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ContactModal({ onClose }) {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactSent, setContactSent] = useState(false);

  const handleSubmit = async () => {
    if (contactForm.name && contactForm.email && contactForm.message) {
      try {
        const res = await fetch(`${API}/contact/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactForm),
        });
        if (res.ok) setContactSent(true);
      } catch (e) {
        console.error("Failed to send contact form:", e);
      }
    }
  };

  return (
    <ModalOverlay title="Contact Us" onClose={onClose}>
      {contactSent ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              animation: "scaleIn 0.3s ease",
            }}
          >
            ✅
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Message Sent!
          </h3>
          <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 24 }}>
            Thank you for reaching out. We'll get back to you within 24
            hours.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              setContactSent(false);
              setContactForm({ name: "", email: "", message: "" });
            }}
            style={{
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Close
          </button>
        </div>
      ) : (
        <div>
          <p
            style={{
              color: "#94A3B8",
              fontSize: 14,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Have a question, feedback, or want to discuss enterprise plans?
            We'd love to hear from you.
          </p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Name
              </label>
              <input
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                placeholder="Your name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F1F5F9",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Email
              </label>
              <input
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                placeholder="your@email.com"
                type="email"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F1F5F9",
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#94A3B8",
                  fontWeight: 600,
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Message
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    message: e.target.value,
                  })
                }
                placeholder="Tell us how we can help..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F1F5F9",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94A3B8",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  !contactForm.name ||
                  !contactForm.email ||
                  !contactForm.message
                }
                style={{
                  background: "linear-gradient(135deg, #6366F1, #818CF8)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  opacity:
                    contactForm.name &&
                    contactForm.email &&
                    contactForm.message
                      ? 1
                      : 0.5,
                }}
              >
                Send Message
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#E2E8F0",
                marginBottom: 12,
              }}
            >
              Other Ways to Reach Us
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13,
                color: "#64748B",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                📧{" "}
                <span style={{ color: "#A5B4FC" }}>
                  suraj14mk@gmail.com
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                💬 Live chat available Mon–Fri, 9am–6pm IST
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                📍 Kanpur, India
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <a
                  href="https://github.com/suraj-codes-24"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#64748B",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#A5B4FC")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748B")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/suraj-codes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#64748B",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#A5B4FC")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748B")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}

function LandingPage({ onLogin, onGetStarted }) {
  const [modal, setModal] = useState(null); // "terms" | "privacy" | "contact" | null
  const setModalWithDebug = (value) => {
    setModal(value);
  };
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredPricing, setHoveredPricing] = useState(1);
  const [openFaq, setOpenFaq] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    const timer = setTimeout(() => {
      document
        .querySelectorAll(".scroll-reveal")
        .forEach((el) => observer.observe(el));
    }, 100);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const features = [
    {
      icon: "🎤",
      color: "#6366F1",
      title: "9-Dimension Voice Analysis",
      desc: "AI evaluates pace, filler words, pronunciation, intonation, modulation, rhythm, stress patterns, silence ratio, and energy levels in real-time.",
    },
    {
      icon: "👁",
      color: "#22C55E",
      title: "Computer Vision Tracking",
      desc: "MediaPipe-powered face mesh tracks eye contact, head posture, and micro-expressions through 468 facial landmarks during your interview.",
    },
    {
      icon: "🧠",
      color: "#F59E0B",
      title: "NLP Semantic Scoring",
      desc: "Deep semantic analysis evaluates technical accuracy, keyword coverage, answer depth, and structural coherence against expert-level responses.",
    },
    {
      icon: "💻",
      color: "#3B82F6",
      title: "Live Coding Environment",
      desc: "Built-in Monaco editor with syntax highlighting, auto-completion, and sandboxed execution. Practice DSA problems like a real coding interview.",
    },
    {
      icon: "🎯",
      color: "#A855F7",
      title: "Communication Assessment",
      desc: "Versant-style 8-section test evaluating reading aloud, sentence repetition, story retelling, open questions, and speaking fluency.",
    },
    {
      icon: "🗣",
      color: "#06B6D4",
      title: "Group Discussion Room",
      desc: "5 AI bots with distinct personalities (Alex, Maya, Ravi, Priya, Sam) simulate a live GD. Scored on participation, leadership, idea quality, and teamwork.",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Choose Your Mode",
      desc: "Pick from Mock Interview, Live Coding, Communication Test, or Group Discussion — across 7 subjects, 24 coding problems, and 60+ GD topics.",
      icon: "📋",
    },
    {
      step: "02",
      title: "Practice with AI",
      desc: "Answer questions via voice while AI analyzes your speech patterns, facial expressions, and technical accuracy simultaneously.",
      icon: "🤖",
    },
    {
      step: "03",
      title: "Get Detailed Feedback",
      desc: "Receive comprehensive scorecards with dimension-by-dimension breakdowns, topic mastery maps, and AI coaching tips.",
      icon: "📊",
    },
  ];

  const stats = [
    { value: "482+", label: "Interview Questions", desc: "Across 7 subjects" },
    { value: "60+", label: "GD Topics", desc: "5 categories, 5 AI bots" },
    { value: "9", label: "Voice Dimensions", desc: "Real-time AI analysis" },
    { value: "140+", label: "Comm Questions", desc: "Versant-style test" },
  ];

  const pricing = [
    {
      name: "Starter",
      price: "Free",
      period: "",
      desc: "Perfect for getting started",
      features: [
        "5 mock interviews/month",
        "Basic voice analysis",
        "3 subjects available",
        "Session score reports",
        "Community support",
      ],
      cta: "Get Started Free",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "/month",
      desc: "For serious interview preparation",
      features: [
        "Unlimited mock interviews",
        "Full 9-dimension voice analysis",
        "All 7 subjects + 482 questions",
        "Group Discussion Room (5 AI bots)",
        "Live coding — Python, C++, Java",
        "AI follow-up questions",
        "Resume & JD gap analysis",
        "PDF reports + analytics dashboard",
        "Communication test (8 sections)",
        "Priority support",
      ],
      cta: "Start Pro Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      desc: "For universities & organizations",
      features: [
        "Everything in Pro",
        "Bulk user management",
        "Custom question banks",
        "Admin analytics dashboard",
        "API access & integrations",
        "Dedicated account manager",
        "Custom branding",
        "SLA guarantee",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "SDE at Google",
      text: "ZenPrep's voice analysis helped me eliminate filler words I didn't even know I was using. Landed my dream role after 3 weeks of practice.",
      avatar: "#C9A84C",
    },
    {
      name: "Rahul Verma",
      role: "Backend Dev at Microsoft",
      text: "The adaptive difficulty is genius — it kept pushing me until System Design concepts truly clicked. The AI follow-up questions are incredibly realistic.",
      avatar: "#22C55E",
    },
    {
      name: "Ananya Patel",
      role: "ML Engineer at Amazon",
      text: "Communication assessment was a game-changer. I improved my IELTS speaking band by 1.5 points using ZenPrep's Versant-style practice tests.",
      avatar: "#F59E0B",
    },
  ];

  const faqs = [
    {
      q: "How does the AI interview scoring work?",
      a: "ZenPrep uses a multimodal scoring engine that combines NLP semantic analysis (45% semantic similarity, 25% keywords, 20% depth, 10% structure), 9-dimension voice analysis (pace, filler words, pronunciation, intonation, modulation, rhythm, stress, silence ratio, energy), and computer vision face tracking. Technical interviews weight 70% NLP + 20% Voice + 10% Face.",
    },
    {
      q: "What subjects and topics are available?",
      a: "We offer 482+ questions across 7 subjects: Data Structures & Algorithms, Object-Oriented Programming, System Design, DBMS, Operating Systems & Networking, Machine Learning, and Behavioral. Each subject has multiple topics and subtopics with 4 difficulty levels.",
    },
    {
      q: "What is the Communication Assessment?",
      a: "It's a Versant-style 8-section test covering: Read Aloud, Repeat Sentences, Sentence Building, Sentence Completion, Story Retelling, Open Questions, Describe Image, and Reading Comprehension. Each section evaluates specific communication skills with AI voice analysis.",
    },
    {
      q: "Do I need any special hardware?",
      a: "Just a modern web browser, a microphone for voice analysis, and optionally a webcam for facial expression tracking. ZenPrep runs entirely in your browser with AI processing on our servers.",
    },
    {
      q: "Can I track my progress over time?",
      a: "Yes! The Analytics dashboard shows score trends, subject performance comparisons, topic mastery maps, difficulty breakdowns, and session history. You can also download detailed PDF reports for each session.",
    },
    {
      q: "Is my data private and secure?",
      a: "Absolutely. All audio and video data is processed in real-time and not stored permanently. Your session scores and analytics are encrypted and only accessible to you. We never share personal data with third parties.",
    },
  ];

  const resources = [
    {
      icon: "📄",
      title: "Resume Analyser",
      desc: "Upload your PDF resume — Ollama AI extracts skills, experience, and projects, then gives targeted improvement tips.",
      color: "#A855F7",
    },
    {
      icon: "🎯",
      title: "JD Gap Analysis",
      desc: "Paste any job description and get a side-by-side skill gap breakdown between your resume and the role requirements.",
      color: "#06B6D4",
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      desc: "Track score trends, topic mastery maps, voice dimension radar charts, and session history across all modules.",
      color: "#22C55E",
    },
    {
      icon: "📑",
      title: "PDF Reports",
      desc: "Download detailed scorecards for every interview, communication test, and GD session — shareable anywhere.",
      color: "#F59E0B",
    },
  ];

  // Modal overlay
  const ModalOverlay = ({ title, onClose, children }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0F1629",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          maxWidth: 640,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          padding: "36px 40px",
          position: "relative",
          animation: "scaleIn 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94A3B8",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "#0B0F1E",
        minHeight: "100vh",
        color: "#F1F5F9",
        overflowX: "hidden",
      }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 60px",
          borderBottom: navScrolled
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid transparent",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: navScrolled ? "rgba(11,15,30,0.95)" : "transparent",
          backdropFilter: navScrolled ? "blur(20px)" : "none",
          zIndex: 100,
          transition: "all 0.3s ease",
        }}
      >
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <ZenPrepLogo size={32} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 18,
              background: "linear-gradient(135deg, #F1F5F9, #E2C97E)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ZenPrep
          </span>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 14 }}>
          {[
            { label: "Features", id: "features" },
            { label: "How It Works", id: "how-it-works" },
            { label: "Pricing", id: "pricing" },
            { label: "Resources", id: "resources" },
            { label: "Contact", id: "contact" },
          ].map((link) => (
            <span
              key={link.id}
              onClick={() =>
                link.id === "contact" ? setModalWithDebug("contact") : scrollTo(link.id)
              }
              style={{
                cursor: "pointer",
                color: "#94A3B8",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#F1F5F9")}
              onMouseLeave={(e) => (e.target.style.color = "#94A3B8")}
            >
              {link.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={onLogin}
            style={{
              background: "transparent",
              color: "#94A3B8",
              fontSize: 14,
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "rgba(99,102,241,0.5)";
              e.target.style.color = "#F1F5F9";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)";
              e.target.style.color = "#94A3B8";
            }}
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            style={{
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 22px",
              borderRadius: 8,
              boxShadow: "0 0 20px rgba(99,102,241,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.boxShadow = "0 0 30px rgba(99,102,241,0.5)")
            }
            onMouseLeave={(e) =>
              (e.target.style.boxShadow = "0 0 20px rgba(99,102,241,0.3)")
            }
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "140px 40px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 60,
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Background orbs */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
            top: -100,
            left: -100,
            animation: "orbFloat1 12s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)",
            bottom: -50,
            right: -50,
            animation: "orbFloat2 15s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />
        {/* Floating particles */}
        {[12, 28, 45, 62, 78, 35, 55, 88, 18, 72].map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: i % 3 === 0 ? 4 : 3,
              height: i % 3 === 0 ? 4 : 3,
              background: i % 2 === 0 ? "#6366F1" : "#06B6D4",
              borderRadius: "50%",
              left: `${l}%`,
              top: `${(i * 13 + 10) % 90}%`,
              opacity: 0,
              animation: `floatUp ${5 + i * 0.7}s ease-in ${i * 0.5}s infinite`,
              pointerEvents: "none",
            }}
          />
        ))}
        {/* Animated waveform SVG */}
        <svg
          style={{
            position: "absolute",
            bottom: -2,
            left: 0,
            right: 0,
            width: "100%",
            height: 80,
            pointerEvents: "none",
            opacity: 0.15,
          }}
          viewBox="0 0 1200 80"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 Q150,10 300,40 T600,40 T900,40 T1200,40 L1200,80 L0,80 Z"
            fill="url(#waveGrad)"
            style={{ animation: "float 6s ease-in-out infinite" }}
          />
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>

        {/* Left */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            animation: "slideInFromBottom 0.8s ease both",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 99,
              padding: "6px 16px",
              fontSize: 11,
              color: "#A5B4FC",
              fontWeight: 600,
              letterSpacing: "0.06em",
              marginBottom: 28,
              animation: "borderGlow 3s ease-in-out infinite",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: "#22C55E",
                borderRadius: "50%",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            FOCUS FLOWS HERE — AI INTERVIEW PLATFORM
          </div>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.08,
              marginBottom: 22,
            }}
          >
            Master Your
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #C9A84C 0%, #E2C97E 50%, #C9A84C 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradientShift 4s ease infinite",
              }}
            >
              Interview Skills
            </span>
            <br />
            <span style={{ fontSize: 48 }}>with AI Precision</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "#94A3B8",
              lineHeight: 1.75,
              marginBottom: 36,
              maxWidth: 460,
            }}
          >
            Practice with real-time voice analysis, computer vision tracking,
            and NLP-powered feedback. 482+ questions across 7 subjects, adaptive
            difficulty, and detailed performance analytics.
          </p>
          <div style={{ display: "flex", gap: 14, marginBottom: 36 }}>
            <button
              onClick={onGetStarted}
              style={{
                background: "linear-gradient(135deg, #6366F1, #818CF8)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                padding: "14px 32px",
                borderRadius: 10,
                boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 40px rgba(99,102,241,0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 24px rgba(99,102,241,0.35)";
              }}
            >
              Start Practicing Free <span style={{ fontSize: 18 }}>→</span>
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#F1F5F9",
                fontSize: 15,
                padding: "14px 24px",
                borderRadius: 10,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.08)";
                e.target.style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.04)";
                e.target.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              See How It Works
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex" }}>
              {["#C9A84C", "#22C55E", "#F59E0B", "#EC4899", "#3B82F6"].map(
                (c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c}, ${c}CC)`,
                      border: "2px solid #0B0F1E",
                      marginLeft: i > 0 ? -10 : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    {["P", "R", "A", "S", "M"][i]}
                  </div>
                ),
              )}
            </div>
            <div style={{ fontSize: 13, color: "#94A3B8" }}>
              Trusted by <strong style={{ color: "#F1F5F9" }}>2,000+</strong>{" "}
              candidates
              <br />
              <span style={{ fontSize: 12 }}>across top universities</span>
            </div>
          </div>
        </div>

        {/* Right — Rich Dashboard Preview */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            animation: "slideInFromBottom 0.8s ease 0.15s both",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #0F1629 0%, #131B35 100%)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)",
            }}
          >
            {/* Title bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "rgba(0,0,0,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#EF4444",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#F59E0B",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#22C55E",
                    display: "inline-block",
                  }}
                />
                <span style={{ marginLeft: 8, fontSize: 12, color: "#64748B" }}>
                  ZenPrep — Interview Room
                </span>
              </div>
              <span
                style={{
                  background: "rgba(99,102,241,0.2)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  color: "#A5B4FC",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#6366F1",
                    animation: "pulse 1.5s infinite",
                  }}
                />{" "}
                LIVE
              </span>
            </div>

            {/* AI Interviewer area */}
            <div
              style={{
                padding: "20px 18px 16px",
                background:
                  "linear-gradient(160deg, #1E293B 0%, #0F172A 60%, #160d30 100%)",
                position: "relative",
                height: 180,
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              {/* Rings + Avatar */}
              <div
                style={{
                  position: "relative",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 100,
                  height: 100,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    border: "1px solid rgba(99,102,241,0.2)",
                    animation: "ringPulse 3s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    border: "1px solid rgba(6,182,212,0.1)",
                    animation: "ringPulse 3s ease-in-out 0.7s infinite",
                  }}
                />
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.2))",
                    border: "2px solid rgba(99,102,241,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 34,
                    position: "relative",
                    zIndex: 1,
                    animation: "float 3s ease-in-out infinite",
                  }}
                >
                  🤖
                </div>
              </div>
              {/* AI Question bubble */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#64748B",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  AI Interviewer · System Design
                </div>
                <div
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "#CBD5E1",
                    lineHeight: 1.6,
                  }}
                >
                  "How would you design a scalable notification system for 10M
                  users?"
                </div>
                {/* Voice waveform */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    marginTop: 10,
                    height: 24,
                  }}
                >
                  <span
                    style={{ fontSize: 10, color: "#6366F1", marginRight: 4 }}
                  >
                    🎙
                  </span>
                  {[4, 7, 12, 9, 14, 8, 6, 11, 5, 13, 7, 9, 4, 8, 12, 6].map(
                    (h, i) => (
                      <div
                        key={i}
                        style={{
                          width: 3,
                          height: h,
                          background: `rgba(99,102,241,${0.4 + (i % 3) * 0.2})`,
                          borderRadius: 2,
                          animation: `float ${0.4 + (i % 4) * 0.1}s ease-in-out ${i * 0.05}s infinite alternate`,
                        }}
                      />
                    ),
                  )}
                  <span
                    style={{ fontSize: 10, color: "#64748B", marginLeft: 6 }}
                  >
                    Listening…
                  </span>
                </div>
              </div>
            </div>

            {/* Score row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 0,
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {[
                { label: "NLP Score", val: "88%", color: "#6366F1" },
                { label: "Voice", val: "91%", color: "#22C55E" },
                { label: "Eye Contact", val: "94%", color: "#06B6D4" },
                { label: "Overall", val: "91%", color: "#F59E0B" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    textAlign: "center",
                    borderRight:
                      i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: s.color }}
                  >
                    {s.val}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom module strip */}
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 16px",
                background: "rgba(0,0,0,0.25)",
                borderTop: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {[
                { icon: "🎤", label: "Interview", color: "#6366F1" },
                { icon: "💻", label: "Coding", color: "#22C55E" },
                { icon: "🎯", label: "Comm Test", color: "#A855F7" },
                { icon: "🗣", label: "GD Room", color: "#06B6D4" },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: `${m.color}12`,
                    border: `1px solid ${m.color}25`,
                    borderRadius: 8,
                    padding: "6px 4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 14 }}>{m.icon}</div>
                  <div
                    style={{
                      fontSize: 9,
                      color: m.color,
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section
        style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 60px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            animation: "slideUp 0.6s ease 0.4s both",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(15,22,41,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "24px 20px",
                textAlign: "center",
                transition: "all 0.3s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${THEME.indigo}50`;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = THEME.glowIndigo;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  background: THEME.gradientText,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#E2E8F0",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section
        id="features"
        className="scroll-reveal"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 99,
              padding: "6px 16px",
              fontSize: 11,
              color: "#A5B4FC",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            CORE CAPABILITIES
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14 }}>
            Everything You Need to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Succeed
            </span>
          </h2>
          <p
            style={{
              color: "#94A3B8",
              fontSize: 16,
              maxWidth: 580,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Our multimodal AI engine analyzes every dimension of your interview
            performance — voice, vision, and knowledge — in real-time.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background:
                  hoveredFeature === i
                    ? "linear-gradient(145deg, #131B35, #0F1629)"
                    : "#0F1629",
                border: `1px solid ${hoveredFeature === i ? `${f.color}40` : "rgba(255,255,255,0.06)"}`,
                borderRadius: 16,
                padding: 28,
                cursor: "default",
                transition: "all 0.3s ease",
                transform:
                  hoveredFeature === i ? "translateY(-4px)" : "translateY(0)",
                boxShadow:
                  hoveredFeature === i ? `0 12px 40px ${f.color}15` : "none",
                animation: `slideUp 0.5s ease ${i * 0.08}s both`,
              }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: `${f.color}15`,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 18,
                  border: `1px solid ${f.color}25`,
                  transition: "all 0.3s",
                  transform: hoveredFeature === i ? "scale(1.1)" : "scale(1)",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 10,
                  color: "#F1F5F9",
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Module Showcase Strip ── */}
      <section
        className="scroll-reveal"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 80px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          {/* Mock Interview */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 16,
              padding: "22px 18px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
              }}
            />
            <div style={{ fontSize: 28, marginBottom: 12 }}>🎤</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#A5B4FC",
                marginBottom: 6,
              }}
            >
              Mock Interview
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              7 subjects · 482 questions · adaptive difficulty
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "NLP Score", val: "88%", w: 88 },
                { label: "Voice", val: "91%", w: 91 },
              ].map((m, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      color: "#64748B",
                      marginBottom: 3,
                    }}
                  >
                    <span>{m.label}</span>
                    <span style={{ color: "#6366F1" }}>{m.val}</span>
                  </div>
                  <div
                    style={{
                      height: 3,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${m.w}%`,
                        background: "linear-gradient(90deg, #6366F1, #818CF8)",
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coding Room */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))",
              border: "1px solid rgba(34,197,94,0.15)",
              borderRadius: 16,
              padding: "22px 18px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
              }}
            />
            <div style={{ fontSize: 28, marginBottom: 12 }}>💻</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#4ADE80",
                marginBottom: 6,
              }}
            >
              Coding Interview
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              24 problems · Python, C++, Java · 4 companies
            </div>
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                borderRadius: 8,
                padding: "10px 12px",
                fontFamily: "monospace",
                fontSize: 10,
                color: "#4ADE80",
                lineHeight: 1.7,
              }}
            >
              <div style={{ color: "#64748B" }}>{"// Two Sum — O(n)"}</div>
              <div>
                <span style={{ color: "#818CF8" }}>def</span>{" "}
                <span style={{ color: "#4ADE80" }}>twoSum</span>(nums, target):
              </div>
              <div style={{ paddingLeft: 12 }}>seen = {"{}"}</div>
              <div style={{ paddingLeft: 12 }}>
                <span style={{ color: "#F59E0B" }}>for</span> i, n{" "}
                <span style={{ color: "#F59E0B" }}>in</span> nums …
              </div>
            </div>
          </div>

          {/* GD Room */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(6,182,212,0.08), rgba(6,182,212,0.03))",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: 16,
              padding: "22px 18px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
              }}
            />
            <div style={{ fontSize: 28, marginBottom: 12 }}>🗣</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#22D3EE",
                marginBottom: 6,
              }}
            >
              Group Discussion
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              60 topics · 5 AI bots · 5 scored dimensions
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { name: "Alex", color: "#6366F1" },
                { name: "Maya", color: "#EC4899" },
                { name: "Ravi", color: "#F59E0B" },
                { name: "Priya", color: "#22C55E" },
                { name: "Sam", color: "#06B6D4" },
              ].map((bot, i) => (
                <div
                  key={i}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: `${bot.color}22`,
                    border: `2px solid ${bot.color}60`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: bot.color,
                    fontWeight: 700,
                    boxShadow: `0 0 8px ${bot.color}40`,
                  }}
                >
                  {bot.name[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Career Tools */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(168,85,247,0.08), rgba(168,85,247,0.03))",
              border: "1px solid rgba(168,85,247,0.15)",
              borderRadius: 16,
              padding: "22px 18px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
              }}
            />
            <div style={{ fontSize: 28, marginBottom: 12 }}>📄</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#C084FC",
                marginBottom: 6,
              }}
            >
              Career AI Tools
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              Resume · JD analysis · PDF reports · Analytics
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Resume Match", val: "87%", color: "#22C55E" },
                { label: "Skill Gap", val: "4 skills", color: "#EF4444" },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 6,
                    padding: "5px 8px",
                  }}
                >
                  <span style={{ fontSize: 10, color: "#94A3B8" }}>
                    {m.label}
                  </span>
                  <span
                    style={{ fontSize: 10, fontWeight: 700, color: m.color }}
                  >
                    {m.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)",
          }}
        />
      </div>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="scroll-reveal"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 99,
              padding: "6px 16px",
              fontSize: 11,
              color: "#4ADE80",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            SIMPLE PROCESS
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14 }}>
            How ZenPrep{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #22C55E, #4ADE80)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Works
            </span>
          </h2>
          <p
            style={{
              color: "#94A3B8",
              fontSize: 16,
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Three simple steps to transform your interview performance.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            position: "relative",
          }}
        >
          {/* Animated connecting arrows */}
          <svg
            style={{
              position: "absolute",
              top: 38,
              left: "20%",
              width: "60%",
              height: 24,
              zIndex: 0,
              overflow: "visible",
            }}
            viewBox="0 0 600 24"
          >
            <defs>
              <linearGradient id="arrowGrad">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="12"
              x2="260"
              y2="12"
              stroke="url(#arrowGrad)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <polygon
              points="258,6 270,12 258,18"
              fill="#6366F1"
              opacity="0.5"
            />
            <line
              x1="330"
              y1="12"
              x2="590"
              y2="12"
              stroke="url(#arrowGrad)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <polygon
              points="588,6 600,12 588,18"
              fill="#818CF8"
              opacity="0.5"
            />
          </svg>
          {howItWorks.map((s, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                animation: `slideUp 0.5s ease ${0.1 + i * 0.15}s both`,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  margin: "0 auto 24px",
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #131B35, #0F1629)",
                  border: "2px solid rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  position: "relative",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {/* Glow ring */}
                <div
                  style={{
                    position: "absolute",
                    inset: -8,
                    borderRadius: "50%",
                    border: "1px solid rgba(99,102,241,0.1)",
                    animation: `ringPulse 3s ease-in-out ${i * 0.5}s infinite`,
                  }}
                />
                {s.icon}
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366F1, #818CF8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#fff",
                    boxShadow: "0 2px 10px rgba(99,102,241,0.4)",
                  }}
                >
                  {s.step}
                </div>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                {s.title}
              </h3>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: 13,
                  lineHeight: 1.7,
                  maxWidth: 280,
                  margin: "0 auto",
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Detailed Feature Showcase ── */}
      <section
        className="scroll-reveal"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 40px 80px" }}
      >
        <div
          style={{
            background: "linear-gradient(145deg, #0F1629 0%, #131B35 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 24,
            padding: 48,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 99,
                padding: "6px 16px",
                fontSize: 11,
                color: "#FBBF24",
                fontWeight: 600,
                letterSpacing: "0.08em",
                marginBottom: 20,
              }}
            >
              REAL-TIME FEEDBACK
            </div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                marginBottom: 16,
                lineHeight: 1.2,
              }}
            >
              AI-Powered Analysis
              <br />
              Across Every Dimension
            </h2>
            <p
              style={{
                color: "#94A3B8",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              ZenPrep doesn't just evaluate your answers — it analyzes how you
              deliver them. Our multimodal engine processes voice patterns,
              facial expressions, and content quality simultaneously.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  label: "Voice Analysis",
                  desc: "9 dimensions including pace, pronunciation, intonation",
                  color: "#6366F1",
                  value: 94,
                },
                {
                  label: "NLP Scoring",
                  desc: "Semantic similarity, keyword matching, depth analysis",
                  color: "#22C55E",
                  value: 88,
                },
                {
                  label: "Vision Tracking",
                  desc: "Eye contact, posture, micro-expression detection",
                  color: "#F59E0B",
                  value: 91,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#E2E8F0",
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: item.color,
                      }}
                    >
                      {item.value}%
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}
                  >
                    {item.desc}
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.value}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}AA)`,
                        borderRadius: 2,
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            {[
              {
                icon: "🔢",
                label: "DSA",
                count: "120+ Questions",
                color: "#6366F1",
              },
              {
                icon: "🏗",
                label: "System Design",
                count: "80+ Questions",
                color: "#22C55E",
              },
              {
                icon: "🧩",
                label: "OOP Concepts",
                count: "65+ Questions",
                color: "#F59E0B",
              },
              {
                icon: "🗄",
                label: "DBMS",
                count: "70+ Questions",
                color: "#3B82F6",
              },
              {
                icon: "⚡",
                label: "OS & Networks",
                count: "55+ Questions",
                color: "#EC4899",
              },
              {
                icon: "🤖",
                label: "ML / AI",
                count: "50+ Questions",
                color: "#A855F7",
              },
            ].map((subj, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 14,
                  padding: "18px 16px",
                  textAlign: "center",
                  transition: "all 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${subj.color}40`;
                  e.currentTarget.style.transform = "scale(1.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{subj.icon}</div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}
                >
                  {subj.label}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                  {subj.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)",
          }}
        />
      </div>

      {/* ── Pricing Section ── */}
      <section
        id="pricing"
        className="scroll-reveal"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(236,72,153,0.08)",
              border: "1px solid rgba(236,72,153,0.2)",
              borderRadius: 99,
              padding: "6px 16px",
              fontSize: 11,
              color: "#F472B6",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            PRICING
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14 }}>
            Simple, Transparent{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #EC4899, #F472B6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Pricing
            </span>
          </h2>
          <p
            style={{
              color: "#94A3B8",
              fontSize: 16,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            Start free and upgrade when you're ready. No hidden fees.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          {pricing.map((plan, i) => (
            <div
              key={i}
              style={{
                background: plan.highlighted
                  ? "linear-gradient(145deg, #131B35, #1a1245)"
                  : "#0F1629",
                border: `1px solid ${plan.highlighted ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 20,
                padding: "36px 28px",
                position: "relative",
                transition: "all 0.3s",
                transform:
                  hoveredPricing === i ? "translateY(-4px)" : "translateY(0)",
                boxShadow: plan.highlighted
                  ? "0 20px 60px rgba(99,102,241,0.15)"
                  : hoveredPricing === i
                    ? "0 10px 40px rgba(0,0,0,0.3)"
                    : "none",
              }}
              onMouseEnter={() => setHoveredPricing(i)}
              onMouseLeave={() => setHoveredPricing(plan.highlighted ? i : -1)}
            >
              {plan.highlighted && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #6366F1, #818CF8)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 16px",
                    borderRadius: 20,
                  }}
                >
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 42,
                    fontWeight: 800,
                    background: plan.highlighted
                      ? "linear-gradient(135deg, #A5B4FC, #fff)"
                      : "linear-gradient(135deg, #F1F5F9, #94A3B8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ color: "#64748B", fontSize: 14 }}>
                    {plan.period}
                  </span>
                )}
              </div>
              <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24 }}>
                {plan.desc}
              </p>
              <button
                onClick={i === 2 ? () => setModalWithDebug("contact") : onGetStarted}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 24,
                  background: plan.highlighted
                    ? "linear-gradient(135deg, #6366F1, #818CF8)"
                    : "rgba(255,255,255,0.04)",
                  color: plan.highlighted ? "#fff" : "#E2E8F0",
                  border: plan.highlighted
                    ? "none"
                    : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: plan.highlighted
                    ? "0 4px 15px rgba(99,102,241,0.3)"
                    : "none",
                  transition: "all 0.2s",
                }}
              >
                {plan.cta}
              </button>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {plan.features.map((feat, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: "#94A3B8",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: plan.highlighted
                          ? "rgba(99,102,241,0.15)"
                          : "rgba(34,197,94,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: plan.highlighted ? "#A5B4FC" : "#22C55E",
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        className="scroll-reveal"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 99,
              padding: "6px 16px",
              fontSize: 11,
              color: "#4ADE80",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            TESTIMONIALS
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14 }}>
            Loved by{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #22C55E, #4ADE80)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Candidates
            </span>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{
                background: "#0F1629",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: 28,
                transition: "all 0.3s",
                animation: `slideUp 0.5s ease ${i * 0.1}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${t.avatar}40`;
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} style={{ color: "#FBBF24", fontSize: 14 }}>
                    ★
                  </span>
                ))}
              </div>
              <p
                style={{
                  color: "#CBD5E1",
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 20,
                  fontStyle: "italic",
                }}
              >
                "{t.text}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${t.avatar}, ${t.avatar}AA)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}
                  >
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Resources Section ── */}
      <section
        id="resources"
        className="scroll-reveal"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 99,
              padding: "6px 16px",
              fontSize: 11,
              color: "#A5B4FC",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            CAREER TOOLS
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14 }}>
            Beyond the{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #A855F7, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Interview
            </span>
          </h2>
          <p
            style={{
              color: "#94A3B8",
              fontSize: 16,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            Powerful career tools built into ZenPrep — resume analysis, JD gap
            checks, analytics, and downloadable reports.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {resources.map((r, i) => (
            <div
              key={i}
              style={{
                background: "#0F1629",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "28px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${r.color}40`;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 8px 30px ${r.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: `${r.color}15`,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  margin: "0 auto 14px",
                  border: `1px solid ${r.color}25`,
                }}
              >
                {r.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                {r.title}
              </h3>
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section
        style={{ maxWidth: 800, margin: "0 auto", padding: "60px 40px 80px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 14 }}>
            Frequently Asked{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Questions
            </span>
          </h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: "#0F1629",
                border: `1px solid ${openFaq === i ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "all 0.3s",
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  color: "#F1F5F9",
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                {faq.q}
                <span
                  style={{
                    color: "#818CF8",
                    fontSize: 18,
                    transition: "transform 0.3s",
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                    flexShrink: 0,
                    marginLeft: 16,
                  }}
                >
                  +
                </span>
              </button>
              {openFaq === i && (
                <div
                  style={{
                    padding: "0 24px 18px",
                    color: "#94A3B8",
                    fontSize: 13,
                    lineHeight: 1.7,
                    animation: "fadeIn 0.25s ease",
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section
        style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 80px" }}
      >
        <div
          style={{
            background: "linear-gradient(145deg, #131B35, #1a1245)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            padding: "64px 48px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background effects */}
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
              top: -100,
              right: -50,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
              bottom: -50,
              left: -30,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontSize: 42,
                fontWeight: 800,
                marginBottom: 16,
                lineHeight: 1.2,
              }}
            >
              Ready to Ace Your
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Next Interview?
              </span>
            </h2>
            <p
              style={{
                color: "#94A3B8",
                fontSize: 16,
                maxWidth: 520,
                margin: "0 auto 32px",
                lineHeight: 1.7,
              }}
            >
              Join thousands of candidates who transformed their interview
              performance with ZenPrep's AI-powered multimodal analysis
              platform.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <button
                onClick={onGetStarted}
                style={{
                  background: "linear-gradient(135deg, #6366F1, #818CF8)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "14px 36px",
                  borderRadius: 12,
                  boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 40px rgba(99,102,241,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(99,102,241,0.35)";
                }}
              >
                Start Free — No Card Required
              </button>
              <button
                onClick={() => setModalWithDebug("contact")}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#F1F5F9",
                  fontSize: 16,
                  padding: "14px 28px",
                  borderRadius: 12,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                Talk to Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(15,22,41,0.5)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "48px 40px 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
              gap: 40,
              marginBottom: 40,
            }}
          >
            {/* Brand */}
            <div>
              <div
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <ZenPrepLogo size={28} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    background: "linear-gradient(135deg, #F1F5F9, #E2C97E)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  ZenPrep
                </span>
              </div>
              <p
                style={{
                  color: "#64748B",
                  fontSize: 13,
                  lineHeight: 1.7,
                  maxWidth: 260,
                }}
              >
                Focus flows here. AI-powered interview preparation with
                precision analytics.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <a
                  href="https://github.com/suraj-codes-24"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                    e.currentTarget.style.color = "#A5B4FC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/suraj-codes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748B",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                    e.currentTarget.style.color = "#A5B4FC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            {/* Product */}
            <div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Product
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {["Features", "Pricing", "Resources", "FAQ"].map((link) => (
                  <span
                    key={link}
                    onClick={() =>
                      scrollTo(
                        link.toLowerCase() === "faq"
                          ? "resources"
                          : link.toLowerCase(),
                      )
                    }
                    style={{
                      color: "#64748B",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#A5B4FC")}
                    onMouseLeave={(e) => (e.target.style.color = "#64748B")}
                  >
                    {link}
                  </span>
                ))}
              </div>
            </div>
            {/* Company */}
            <div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Company
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  { label: "About Us", action: () => scrollTo("how-it-works") },
                  { label: "Contact", action: () => setModalWithDebug("contact") },
                  { label: "Careers", action: () => setModalWithDebug("contact") },
                ].map((link) => (
                  <span
                    key={link.label}
                    onClick={link.action}
                    style={{
                      color: "#64748B",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#A5B4FC")}
                    onMouseLeave={(e) => (e.target.style.color = "#64748B")}
                  >
                    {link.label}
                  </span>
                ))}
              </div>
            </div>
            {/* Legal */}
            <div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Legal
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  {
                    label: "Privacy Policy",
                    action: () => setModalWithDebug("privacy"),
                  },
                  {
                    label: "Terms of Service",
                    action: () => setModalWithDebug("terms"),
                  },
                  { label: "Cookie Policy", action: () => setModalWithDebug("privacy") },
                ].map((link) => (
                  <span
                    key={link.label}
                    onClick={link.action}
                    style={{
                      color: "#64748B",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#A5B4FC")}
                    onMouseLeave={(e) => (e.target.style.color = "#64748B")}
                  >
                    {link.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#475569", fontSize: 12 }}>
              © 2025 ZenPrep. All rights reserved.
            </span>
            <div style={{ display: "flex", gap: 20 }}>
              <span
                onClick={() => setModalWithDebug("privacy")}
                style={{
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#94A3B8")}
                onMouseLeave={(e) => (e.target.style.color = "#475569")}
              >
                Privacy
              </span>
              <span
                onClick={() => setModalWithDebug("terms")}
                style={{
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#94A3B8")}
                onMouseLeave={(e) => (e.target.style.color = "#475569")}
              >
                Terms
              </span>
              <span
                onClick={() => setModalWithDebug("contact")}
                style={{
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#94A3B8")}
                onMouseLeave={(e) => (e.target.style.color = "#475569")}
              >
                Contact
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Terms Modal ── */}
      {modal === "terms" && (
        <ModalOverlay title="Terms of Service" onClose={() => setModalWithDebug(null)}>
          <div style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.8 }}>
            <p style={{ marginBottom: 16 }}>
              <strong style={{ color: "#E2E8F0" }}>Effective Date:</strong>{" "}
              January 1, 2025
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              1. Acceptance of Terms
            </h3>
            <p style={{ marginBottom: 12 }}>
              By accessing or using ZenPrep ("the Service"), you agree to be
              bound by these Terms of Service. If you do not agree to these
              terms, you may not use the Service.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              2. Description of Service
            </h3>
            <p style={{ marginBottom: 12 }}>
              ZenPrep provides an AI-powered interview preparation platform that
              includes mock interviews, voice analysis, facial expression
              tracking, coding assessments, and communication tests. The Service
              is intended for educational and practice purposes only.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              3. User Accounts
            </h3>
            <p style={{ marginBottom: 12 }}>
              You must create an account to use the Service. You are responsible
              for maintaining the confidentiality of your account credentials.
              You must provide accurate and complete information during
              registration.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              4. Acceptable Use
            </h3>
            <p style={{ marginBottom: 12 }}>
              You agree not to: (a) reverse engineer or attempt to extract the
              AI models; (b) use the Service for any unlawful purpose; (c) share
              your account with others; (d) attempt to interfere with the
              Service's infrastructure.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              5. Intellectual Property
            </h3>
            <p style={{ marginBottom: 12 }}>
              All content, algorithms, and AI models within ZenPrep are the
              property of ZenPrep and its licensors. You retain ownership of
              your personal data and interview recordings.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              6. Limitation of Liability
            </h3>
            <p style={{ marginBottom: 12 }}>
              ZenPrep is provided "as is" without warranties of any kind. We do
              not guarantee that using the Service will result in successful
              interview outcomes. Our liability is limited to the amount you
              paid for the Service.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              7. Modifications
            </h3>
            <p>
              We reserve the right to modify these terms at any time. Continued
              use of the Service after changes constitutes acceptance of the
              modified terms.
            </p>
          </div>
        </ModalOverlay>
      )}

      {/* ── Privacy Modal ── */}
      {modal === "privacy" && (
        <ModalOverlay title="Privacy Policy" onClose={() => setModalWithDebug(null)}>
          <div style={{ color: "#94A3B8", fontSize: 13, lineHeight: 1.8 }}>
            <p style={{ marginBottom: 16 }}>
              <strong style={{ color: "#E2E8F0" }}>Effective Date:</strong>{" "}
              January 1, 2025
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              1. Information We Collect
            </h3>
            <p style={{ marginBottom: 8 }}>
              We collect the following types of information:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
              <li style={{ marginBottom: 4 }}>
                <strong style={{ color: "#CBD5E1" }}>Account Data:</strong>{" "}
                Name, email address, branch, year of study
              </li>
              <li style={{ marginBottom: 4 }}>
                <strong style={{ color: "#CBD5E1" }}>Interview Data:</strong>{" "}
                Session recordings, answers, and AI-generated scores
              </li>
              <li style={{ marginBottom: 4 }}>
                <strong style={{ color: "#CBD5E1" }}>Voice Data:</strong> Audio
                recordings processed in real-time for voice analysis
              </li>
              <li style={{ marginBottom: 4 }}>
                <strong style={{ color: "#CBD5E1" }}>Visual Data:</strong>{" "}
                Camera feed processed locally for facial expression analysis
              </li>
              <li>
                <strong style={{ color: "#CBD5E1" }}>Usage Data:</strong>{" "}
                Session history, performance analytics, and platform
                interactions
              </li>
            </ul>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              2. How We Use Your Data
            </h3>
            <p style={{ marginBottom: 12 }}>
              Your data is used to: provide and improve the Service, generate
              performance analytics, personalize your interview experience, and
              communicate important updates. We do not sell your personal data
              to third parties.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              3. Data Processing & Storage
            </h3>
            <p style={{ marginBottom: 12 }}>
              Audio and video data is processed in real-time and is not
              permanently stored on our servers. Interview scores and text-based
              analytics are stored securely in our encrypted PostgreSQL
              database. Camera data is processed entirely client-side using
              MediaPipe and never leaves your browser.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              4. Data Security
            </h3>
            <p style={{ marginBottom: 12 }}>
              We implement industry-standard security measures including JWT
              authentication, encrypted data transmission, and secure database
              storage. Access to user data is restricted to authorized personnel
              only.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              5. Your Rights
            </h3>
            <p style={{ marginBottom: 12 }}>
              You have the right to: access your personal data, request data
              deletion, update your information, and export your performance
              data. Contact us to exercise these rights.
            </p>
            <h3
              style={{
                color: "#E2E8F0",
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 8,
                marginTop: 20,
              }}
            >
              6. Contact
            </h3>
            <p>
              For privacy-related inquiries, please contact us at{" "}
              <span style={{ color: "#A5B4FC" }}>privacy@zenprep.ai</span>
            </p>
          </div>
        </ModalOverlay>
      )}

      {/* ── Contact Modal ── */}
      {modal === "contact" && <ContactModal onClose={() => setModalWithDebug(null)} />}
    </div>
  );
}

export default LandingPage;
