import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

export default function App() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("You're on the list! We'll be in touch.");
  const [showAboutContent, setShowAboutContent] = useState(false);
  const [displayContent, setDisplayContent] = useState<boolean | null>(false);

  // Two thresholds so content only changes at defined scroll points (no flicker when barely scrolling)
  const SCROLL_THRESHOLD_DOWN = 0.35; // scroll down past 35% of viewport → show About Us
  const SCROLL_THRESHOLD_UP = 0.15;   // scroll up above 15% of viewport → show Waitlist

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const thresholdDownPx = vh * SCROLL_THRESHOLD_DOWN;
      const thresholdUpPx = vh * SCROLL_THRESHOLD_UP;

      setShowAboutContent((prev) => {
        if (y >= thresholdDownPx) return true;
        if (y <= thresholdUpPx) return false;
        return prev;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set initial state
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // When target content changes: disappear briefly (both opaque), then show new content
  useEffect(() => {
    if (displayContent === showAboutContent) return;

    setDisplayContent(null);
    const t = setTimeout(() => setDisplayContent(showAboutContent), 220);
    return () => clearTimeout(t);
  }, [showAboutContent]);

  async function handleJoinWaitlist(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    // Email format: local@domain.tld, max 128 chars (covers real addresses, blocks junk)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (trimmed.length > 128 || !emailRegex.test(trimmed)) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      if (!supabase) throw new Error("Supabase not configured.");
      const { error } = await supabase.from("waitlist").insert({ email: trimmed });
      if (error) throw error;
      setSuccessMessage("You're on the list! We'll be in touch.");
      setStatus("success");
      setEmail("");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? (e as { message: string }).message
          : "Something went wrong.";
      const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
      const isDuplicate =
        code === "23505" ||
        (typeof msg === "string" &&
          (msg.includes("unique") || msg.includes("duplicate key") || msg.includes("already exists")));
      if (isDuplicate) {
        setSuccessMessage("You're already on the list.");
        setStatus("success");
        setEmail("");
        return;
      }
      if (typeof msg === "string" && msg.toLowerCase().includes("does not exist")) {
        setStatus("success");
        setEmail("");
        return;
      }
      setErrorMessage(msg);
      setStatus("error");
    }
  }

  return (
    <div className="page">
      {/* Single hero: left content swaps (waitlist ↔ About Us) on scroll; right stays the same */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-content">
            {/* displayContent: false = waitlist, true = about, null = both hidden (brief disappear) */}
            <div
              className={`content-slide ${displayContent === false ? "content-slide-visible" : ""}`}
              aria-hidden={displayContent !== false}
            >
              <div className="top-nav">
                <span className="pill">Join Waitlist</span>
              </div>
                <h1 className="hero-headline">
                  Split Expenses with Your Barkada – No More Awkward Conversations
                </h1>
                <p className="hero-subtext">
                  Track shared costs, see who owes who instantly, and settle up with one tap – built for
                  Filipino friend groups who split everything from samgyup to weekend trips.
                </p>
                <form className="form-row" onSubmit={handleJoinWaitlist}>
                  <input
                    type="email"
                    className="email-input"
                    placeholder="@ Your Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setStatus("idle");
                      setErrorMessage("");
                    }}
                    disabled={status === "loading"}
                    aria-label="Email"
                  />
                  <button
                    type="submit"
                    className="btn-join"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Joining…" : "Join Waitlist"}
                  </button>
                </form>
                {status === "success" && (
                  <p className="message success">{successMessage}</p>
                )}
                {status === "error" && errorMessage && (
                  <p className="message error">{errorMessage}</p>
                )}
                <div className="social-proof">
                  <div className="avatar-row">
                    <span className="avatar avatar-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/></svg>
                    </span>
                    <span className="avatar avatar-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/></svg>
                    </span>
                    <span className="avatar avatar-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/></svg>
                    </span>
                  </div>
                  <span className="social-text">50+ people have joined already.</span>
                </div>
            </div>

            <div
              className={`content-slide ${displayContent === true ? "content-slide-visible" : ""}`}
              aria-hidden={displayContent !== true}
            >
              <div className="top-nav">
                <span className="pill">About Us</span>
              </div>
                <h1 className="hero-headline">About Us</h1>
                <p className="hero-subtext">
                  We're building a simple, peso-first expense splitting app made for how Filipino
                  barkadas actually spend. Add expenses, split them equally or custom, and instantly see
                  simplified balances so you know exactly who owes who. Join our waitlist to get early
                  access and help us build the app your group chat has been asking for. No spreadsheets,
                  no mental math – just fair splits.
                </p>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="phone-mockups">
            <PhoneMockupGroup />
            <PhoneMockupHome />
          </div>
          <div className="scroll-hint-below-mockups">
            <span className="scroll-hint-icon" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
            <span className="scroll-hint-text">Scroll Down</span>
          </div>
        </div>
      </section>

      {/* Spacer so the page can scroll; scroll position (thresholds) controls content swap */}
      <div className="scroll-spacer" aria-hidden="true" />
    </div>
  );
}

function PhoneMockupGroup() {
  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-header">
        <span className="phone-btn" />
        <span className="phone-title">College Buddies</span>
        <span className="phone-icon green-dot" />
      </div>
      <div className="phone-buttons">
        <div className="green-btn">Invite Friends</div>
        <div className="green-btn">Add Member</div>
        <div className="green-btn">Add Expense</div>
      </div>
      <div className="phone-section">
        <div className="section-label">Balances</div>
        <div className="balance-row">
          <span>Brent</span>
          <span className="owes">Owes P400.00</span>
        </div>
        <div className="balance-row">
          <span>Julian Erwan</span>
          <span className="owed">Owed</span>
        </div>
      </div>
      <div className="phone-section">
        <div className="section-label">Settlement History</div>
        <div className="muted">No settlements yet. Settle balances to record payments.</div>
      </div>
    </div>
  );
}

function PhoneMockupHome() {
  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-header">
        <span className="phone-btn" />
        <span className="phone-title">Home</span>
        <span className="phone-btn circle" />
      </div>
      <div className="balance-block">
        <div className="balance-label">Overall Balance</div>
        <div className="balance-amount">P400.00</div>
        <div className="balance-sub">You are owed P400.00</div>
      </div>
      <div className="phone-section">
        <div className="section-row">
          <span className="section-label">RECENT ACTIVITY</span>
          <span className="see-all">See all</span>
        </div>
        <div className="activity-row">
          <span className="activity-title">Dinner</span>
          <span className="activity-meta">College Buddies · just now</span>
          <span className="activity-amount">P800.00</span>
        </div>
      </div>
      <div className="phone-section">
        <div className="section-label">MY GROUPS</div>
        <div className="group-row">
          <span>HS OG4</span>
          <span className="muted">No activity yet.</span>
        </div>
        <div className="group-row">
          <span>DOTA Friends</span>
          <span className="muted">No activity yet.</span>
        </div>
        <div className="group-row">
          <span>College Buddies</span>
          <span className="green-text">P400.00</span>
        </div>
      </div>
      <div className="phone-tabs">
        <span>Groups</span>
        <span className="tab-plus">+</span>
        <span>Profile</span>
      </div>
    </div>
  );
}
