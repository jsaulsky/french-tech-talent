"use client";

import { useState, useCallback } from "react";
import JobMatchingTab from "./components/JobMatchingTab";
import EmailDraftsTab from "./components/EmailDraftsTab";

type Tab = "matching" | "drafts";

interface Member {
  id: string;
  fullName: string;
  email: string;
  linkedinUrl: string;
  currentRole: string;
  roleTypes: string[];
  jobTitles: string[];
  seniority: string[];
  industries: string[];
  companySizes: string[];
  lookingFor: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  work_type: string;
  posted?: string;
  apply_url?: string;
  description?: string;
  requires_french?: "yes" | "no" | "unknown";
}

interface Match {
  jobId: string;
  candidateName: string;
  candidateRole: string;
  confidence: "High" | "Medium" | "Low";
  function_fit?: "High" | "Medium" | "Low";
  industry_fit?: "High" | "Medium" | "Low";
  reason: string;
}

interface Enrichment {
  in_french_db?: boolean;
  glassdoor_rating?: string;
  glassdoor_snippets?: string[];
  review_sentiment?: string;
  salary_signal?: string;
  funding_info?: string;
  headcount?: string;
  vibe_summary?: string;
  language_requirement?: string;
  industry?: string;
  stage?: string;
  founded?: string;
  hq?: string;
}

export interface MatchCard {
  job: Job;
  match: Match;
  member?: Member;
  enrichment?: Enrichment;
  emailDraft?: string;
  sentAt?: string;
  deleted?: boolean;
}

export interface MultiDraft {
  id: string;
  candidateName: string;
  candidateRole: string;
  member?: Member;
  cards: MatchCard[];
  emailDraft?: string;
  sentAt?: string;
  deleted?: boolean;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("matching");
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [multiDrafts, setMultiDrafts] = useState<MultiDraft[]>([]);
  const [draftTarget, setDraftTarget] = useState<MatchCard | null>(null);
  const [multiDraftTarget, setMultiDraftTarget] = useState<MultiDraft | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setAuthError("Enter the password."); return; }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { setAuthed(true); setSessionToken(password); setPassword(""); }
      else { setAuthError("Incorrect password."); }
    } catch { setAuthError("Could not verify password. Try again."); }
    finally { setAuthLoading(false); }
  };

  const handleUpdateCard = useCallback((updated: MatchCard) => {
    setMatchCards((prev) =>
      prev.map((c) => {
        if (c.job.id === updated.job.id && c.match.candidateName === updated.match.candidateName) {
          return updated;
        }
        // Propagate enrichment to all other cards for the same job
        if (c.job.id === updated.job.id && updated.enrichment !== undefined) {
          return { ...c, enrichment: updated.enrichment };
        }
        return c;
      })
    );
  }, []);

  const handleDraftEmail = useCallback((card: MatchCard) => {
    setDraftTarget(card);
    setMultiDraftTarget(null);
    setActiveTab("drafts");
  }, []);

  const handleMultiDraft = useCallback((cards: MatchCard[]) => {
    if (cards.length === 0) return;
    const candidate = cards[0].match.candidateName;
    const existing = multiDrafts.find(
      (d) => d.candidateName === candidate && d.cards.map((c) => c.job.id).sort().join() === cards.map((c) => c.job.id).sort().join()
    );
    if (existing) {
      setMultiDraftTarget(existing);
    } else {
      const newDraft: MultiDraft = {
        id: `multi-${Date.now()}`,
        candidateName: candidate,
        candidateRole: cards[0].match.candidateRole,
        member: cards[0].member,
        cards,
      };
      setMultiDrafts((prev) => [...prev, newDraft]);
      setMultiDraftTarget(newDraft);
    }
    setDraftTarget(null);
    setActiveTab("drafts");
  }, [multiDrafts]);

  const handleUpdateMultiDraft = useCallback((updated: MultiDraft) => {
    setMultiDrafts((prev) => prev.map((d) => d.id === updated.id ? updated : d));
  }, []);

  const handleDraftAll = useCallback((cards: MatchCard[]) => {
    const byCandidate = new Map<string, MatchCard[]>();
    cards.forEach((card) => {
      const key = card.match.candidateName;
      if (!byCandidate.has(key)) byCandidate.set(key, []);
      byCandidate.get(key)!.push(card);
    });
    const newDrafts: MultiDraft[] = [];
    byCandidate.forEach((candidateCards, candidateName) => {
      const jobIds = candidateCards.map((c) => c.job.id).sort().join();
      const existing = multiDrafts.find(
        (d) => d.candidateName === candidateName && d.cards.map((c) => c.job.id).sort().join() === jobIds
      );
      if (!existing) {
        newDrafts.push({
          id: `multi-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          candidateName,
          candidateRole: candidateCards[0].match.candidateRole,
          member: candidateCards[0].member,
          cards: candidateCards,
        });
      }
    });
    if (newDrafts.length > 0) {
      setMultiDrafts((prev) => [...prev, ...newDrafts]);
    }
    setDraftTarget(null);
    setMultiDraftTarget(null);
    setActiveTab("drafts");
  }, [multiDrafts]);

  const totalDrafts = matchCards.filter((c) => c.emailDraft).length + multiDrafts.filter((d) => d.emailDraft).length;

  if (!authed) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#FFFBF2", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(46,58,68,0.5)", marginBottom: "8px" }}>
            French Tech Updates
          </p>
          <h1 style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "26px", fontWeight: 700, color: "#192733", marginBottom: "32px" }}>
            Admin Dashboard
          </h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#2E3A44", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1.5px solid rgba(46,58,68,0.2)", backgroundColor: "#FFFBF2", color: "#2E3A44", fontSize: "14px", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", outline: "none" }}
              />
            </div>
            {authError && <p style={{ color: "#c0392b", fontSize: "13px", marginBottom: "12px" }}>{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              style={{ backgroundColor: authLoading ? "rgba(25,39,51,0.6)" : "#192733", color: "#FFFBF2", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: 600, cursor: authLoading ? "not-allowed" : "pointer", width: "100%", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
            >
              {authLoading ? "Checking..." : "Enter"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: activeTab === tab ? 600 : 400,
    color: activeTab === tab ? "#192733" : "rgba(46,58,68,0.55)",
    background: "none",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid #192733" : "2px solid transparent",
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    transition: "all 0.15s ease",
  });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFBF2" }}>
      <div style={{ borderBottom: "1px solid rgba(46,58,68,0.12)", backgroundColor: "#FFFBF2", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div style={{ padding: "16px 0" }}>
              <span style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "15px", fontWeight: 700, color: "#192733" }}>FTU Admin</span>
            </div>
            <nav style={{ display: "flex" }}>
              <button style={tabStyle("matching")} onClick={() => setActiveTab("matching")}>Job Matching</button>
              <button style={tabStyle("drafts")} onClick={() => setActiveTab("drafts")}>
                Email Drafts
                {totalDrafts > 0 && (
                  <span style={{ marginLeft: "6px", backgroundColor: "#192733", color: "#FFFBF2", borderRadius: "999px", fontSize: "10px", padding: "1px 6px", fontWeight: 700 }}>
                    {totalDrafts}
                  </span>
                )}
              </button>
            </nav>
          </div>
          <button onClick={() => { setAuthed(false); setSessionToken(""); }} style={{ fontSize: "12px", color: "rgba(46,58,68,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {activeTab === "matching" && (
          <JobMatchingTab
            matchCards={matchCards}
            setMatchCards={setMatchCards}
            onUpdateCard={handleUpdateCard}
            onDraftEmail={handleDraftEmail}
            onMultiDraft={handleMultiDraft}
            onDraftAll={handleDraftAll}
            sessionToken={sessionToken}
          />
        )}
        {activeTab === "drafts" && (
          <EmailDraftsTab
            matchCards={matchCards}
            multiDrafts={multiDrafts}
            initialTarget={draftTarget}
            initialMultiTarget={multiDraftTarget}
            onUpdateCard={handleUpdateCard}
            onUpdateMultiDraft={handleUpdateMultiDraft}
            sessionToken={sessionToken}
          />
        )}
      </div>
    </main>
  );
}
