"use client";

import { useState, useEffect, useMemo } from "react";
import { MatchCard } from "../page";

interface Member {
  id: string;
  fullName: string;
  email: string;
  linkedinUrl: string;
  currentRole: string;
  roleTypes: string[];
  industries: string[];
  companySizes: string[];
  lookingFor: string;
}

interface ParsedJob {
  title: string;
  company: string;
  location: string;
  work_type: "Hybrid" | "Remote" | "On-site" | "Unknown";
  posted: string;
  duplicate: boolean;
  requires_french: "yes" | "no" | "unknown";
}

interface Props {
  matchCards: MatchCard[];
  setMatchCards: (cards: MatchCard[]) => void;
  onUpdateCard: (card: MatchCard) => void;
  onDraftEmail: (card: MatchCard) => void;
  onMultiDraft: (cards: MatchCard[]) => void;
  onDraftAll: (cards: MatchCard[]) => void;
  sessionToken: string;
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    High: { bg: "rgba(39,174,96,0.12)", text: "#1e8449" },
    Medium: { bg: "rgba(230,126,34,0.12)", text: "#b7770d" },
    Low: { bg: "rgba(192,57,43,0.1)", text: "#922b21" },
  };
  const c = colors[level] || colors["Low"];
  return (
    <span style={{ backgroundColor: c.bg, color: c.text, padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.03em" }}>
      {level}
    </span>
  );
}

function EnrichmentPanel({ enrichment, onChange }: { enrichment: Record<string, unknown>; onChange: (key: string, value: string) => void }) {
  const langColor = enrichment.language_requirement === "Required"
    ? { bg: "rgba(192,57,43,0.1)", text: "#c0392b", icon: "🔴" }
    : enrichment.language_requirement === "Not required"
    ? { bg: "rgba(39,174,96,0.1)", text: "#1e8449", icon: "🟢" }
    : { bg: "rgba(46,58,68,0.08)", text: "rgba(46,58,68,0.6)", icon: "🟡" };

  const textFields = [
    { key: "funding_info", label: "Funding" },
    { key: "stage", label: "Stage" },
    { key: "salary_signal", label: "Salary" },
    { key: "glassdoor_rating", label: "Glassdoor Rating" },
    { key: "review_sentiment", label: "Review Sentiment" },
    { key: "headcount", label: "Headcount" },
    { key: "vibe_summary", label: "Vibe" },
    { key: "industry", label: "Industry" },
    { key: "hq", label: "HQ" },
    { key: "founded", label: "Founded" },
  ];

  return (
    <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "rgba(25,39,51,0.04)", borderRadius: "8px", border: "1px solid rgba(46,58,68,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(46,58,68,0.5)", margin: 0 }}>
          Company Enrichment
        </p>
        {!!enrichment.in_french_db && (
          <span style={{ backgroundColor: "rgba(39,174,96,0.12)", color: "#1e8449", padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.02em" }}>
            ✓ French Tech DB
          </span>
        )}
      </div>

      {/* Language requirement badge */}
      {!!enrichment.language_requirement && (
        <div style={{ marginBottom: "12px", padding: "8px 12px", backgroundColor: langColor.bg, borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px" }}>{langColor.icon}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: langColor.text }}>
            French language: {String(enrichment.language_requirement)}
          </span>
        </div>
      )}

      {/* Glassdoor snippets */}
      {Array.isArray(enrichment.glassdoor_snippets) && (enrichment.glassdoor_snippets as string[]).length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "rgba(46,58,68,0.55)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Glassdoor Snippets
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {(enrichment.glassdoor_snippets as string[]).map((snippet, i) => (
              <p key={i} style={{ fontSize: "12px", color: "#2E3A44", padding: "6px 10px", backgroundColor: "rgba(255,251,242,0.8)", borderRadius: "5px", border: "1px solid rgba(46,58,68,0.1)", margin: 0, fontStyle: "italic" }}>
                &ldquo;{snippet}&rdquo;
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Editable text fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {textFields.map(({ key, label }) => {
          const val = enrichment[key];
          if (!val) return null;
          return (
            <div key={key}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "rgba(46,58,68,0.55)", display: "block", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {label}
              </label>
              <textarea
                value={String(val)}
                onChange={(e) => onChange(key, e.target.value)}
                rows={key === "review_sentiment" || key === "vibe_summary" ? 2 : 1}
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(46,58,68,0.15)", backgroundColor: "#FFFBF2", color: "#2E3A44", fontSize: "12px", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", resize: "vertical", outline: "none" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchCardRow({
  card,
  onUpdate,
  onDraftEmail,
  sessionToken,
}: {
  card: MatchCard;
  onUpdate: (card: MatchCard) => void;
  onDraftEmail: (card: MatchCard) => void;
  sessionToken: string;
}) {
  const [enriching, setEnriching] = useState(false);

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": sessionToken },
        body: JSON.stringify({ company: card.job.company, jobTitle: card.job.title, jobDescription: card.job.description }),
      });
      const data = await res.json();
      onUpdate({ ...card, enrichment: data });
    } catch (e) { console.error("Enrich failed", e); }
    finally { setEnriching(false); }
  };

  const btnStyle: React.CSSProperties = {
    padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
    cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    transition: "opacity 0.15s", border: "none",
  };

  return (
    <div style={{ backgroundColor: "#FFFBF2", borderRadius: "10px", padding: "18px 20px", boxShadow: "0 1px 4px rgba(46,58,68,0.08), 0 0 0 1px rgba(46,58,68,0.07)", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
            <ConfidenceBadge level={card.match.confidence} />
            {card.match.function_fit && (
              <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(46,58,68,0.07)", color: "rgba(46,58,68,0.65)", letterSpacing: "0.02em" }}>
                fn: {card.match.function_fit}
              </span>
            )}
            {card.match.industry_fit && (
              <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "999px", backgroundColor: "rgba(46,58,68,0.07)", color: "rgba(46,58,68,0.65)", letterSpacing: "0.02em" }}>
                ind: {card.match.industry_fit}
              </span>
            )}
            <span style={{ fontSize: "11px", color: "rgba(46,58,68,0.45)", fontStyle: "italic" }}>{card.match.reason}</span>
          </div>
          <h4 style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "15px", fontWeight: 700, color: "#192733", marginBottom: "2px" }}>
            {card.job.title}
            <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(46,58,68,0.6)", marginLeft: "8px" }}>@ {card.job.company}</span>
          </h4>
          <p style={{ fontSize: "12px", color: "rgba(46,58,68,0.55)" }}>
            {card.job.location}
            {card.job.work_type && <span style={{ marginLeft: "8px", backgroundColor: "rgba(46,58,68,0.08)", padding: "1px 7px", borderRadius: "4px", fontSize: "11px" }}>{card.job.work_type}</span>}
            {card.job.posted && <span style={{ marginLeft: "8px", opacity: 0.6 }}>{card.job.posted}</span>}
            {card.job.apply_url && (
              <a href={card.job.apply_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "10px", fontSize: "11px", color: "rgba(46,58,68,0.5)", textDecoration: "none", border: "1px solid rgba(46,58,68,0.18)", padding: "1px 7px", borderRadius: "4px" }}>
                Apply ↗
              </a>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button onClick={handleEnrich} disabled={enriching} style={{ ...btnStyle, backgroundColor: card.enrichment ? "rgba(25,39,51,0.1)" : "#192733", color: card.enrichment ? "#192733" : "#FFFBF2", opacity: enriching ? 0.6 : 1 }}>
            {enriching ? "Enriching..." : card.enrichment ? "Re-enrich" : "Enrich"}
          </button>
          <button onClick={() => onDraftEmail(card)} style={{ ...btnStyle, backgroundColor: "transparent", color: "rgba(46,58,68,0.6)", border: "1px solid rgba(46,58,68,0.2)" }}>
            Draft solo email
          </button>
        </div>
      </div>

      {card.enrichment && (
        <EnrichmentPanel
          enrichment={card.enrichment as Record<string, unknown>}
          onChange={(key, value) => onUpdate({ ...card, enrichment: { ...(card.enrichment || {}), [key]: value } })}
        />
      )}

      {card.emailDraft && (
        <div style={{ marginTop: "10px", padding: "8px 12px", backgroundColor: "rgba(39,174,96,0.06)", borderRadius: "6px", border: "1px solid rgba(39,174,96,0.2)", fontSize: "12px", color: "#1e8449", fontWeight: 500 }}>
          ✓ Email draft ready — view in Email Drafts tab
        </div>
      )}
    </div>
  );
}

export default function JobMatchingTab({ matchCards, setMatchCards, onUpdateCard, onDraftEmail, onMultiDraft, onDraftAll, sessionToken }: Props) {
  const [jobText, setJobText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState<"idle" | "parsing" | "matching">("idle");
  const [error, setError] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [jobCount, setJobCount] = useState(0);
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([]);
  const [selectedJobsByCandidate, setSelectedJobsByCandidate] = useState<Record<string, string[]>>({});
  const [hideFrenchRequired, setHideFrenchRequired] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch("/api/members", {
          headers: { "x-admin-token": sessionToken },
        });
        const data = await res.json();
        if (data.members) { setMembers(data.members); }
        else { setMemberError("Failed to load members from Airtable."); }
      } catch { setMemberError("Could not connect to Airtable."); }
      finally { setLoadingMembers(false); }
    };
    fetchMembers();
  }, [sessionToken]);

  // Group match cards by candidate
  const candidateGroups = useMemo(() => {
    const map = new Map<string, MatchCard[]>();
    matchCards.forEach((card) => {
      const key = card.match.candidateName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(card);
    });
    return Array.from(map.entries()).map(([name, cards]) => ({ name, cards }));
  }, [matchCards]);

  const handleParse = async () => {
    if (!jobText.trim()) { setError("Paste some job listings first."); return; }
    setError("");
    setMatchCards([]);
    setSelectedJobsByCandidate({});
    setParsing(true);
    setParsingStep("parsing");
    try {
      const res = await fetch("/api/parse-jobs-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": sessionToken },
        body: JSON.stringify({ jobText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Parsing failed."); return; }
      setParsedJobs(data.jobs || []);
    } catch { setError("Network error. Please try again."); }
    finally { setParsing(false); setParsingStep("idle"); }
  };

  const handleRunMatching = async () => {
    if (parsedJobs.length === 0) return;
    if (members.length === 0) { setError("No talent pool members loaded yet."); return; }
    setError("");
    setParsing(true);
    setParsingStep("matching");
    try {
      const res = await fetch("/api/run-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": sessionToken },
        body: JSON.stringify({ jobs: parsedJobs, members }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Matching failed."); return; }
      const { jobs, matches } = data;
      setJobCount(jobs.length);
      const cards: MatchCard[] = matches.map((match: { jobId: string; candidateName: string; candidateRole: string; confidence: "High" | "Medium" | "Low"; reason: string }) => {
        const job = jobs.find((j: { id: string }) => j.id === match.jobId);
        const member = members.find((m) => m.fullName.toLowerCase() === match.candidateName.toLowerCase());
        return { job, match, member };
      });
      setMatchCards(cards);
      setSelectedJobsByCandidate({});
      setParsedJobs([]);
    } catch { setError("Network error. Please try again."); }
    finally { setParsing(false); setParsingStep("idle"); }
  };

  const removeJob = (index: number) => {
    setParsedJobs((prev) => prev.filter((_, i) => i !== index));
  };

  const isJobSelected = (candidateName: string, jobId: string): boolean => {
    const selected = selectedJobsByCandidate[candidateName];
    if (!selected) return false;
    return selected.includes(jobId);
  };

  const toggleJobSelection = (candidateName: string, jobId: string) => {
    setSelectedJobsByCandidate((prev) => {
      const current = prev[candidateName] ?? [];
      const next = current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId];
      return { ...prev, [candidateName]: next };
    });
  };

  const handleDraftAllSelected = () => {
    const selected = matchCards.filter((card) => isJobSelected(card.match.candidateName, card.job?.id));
    onDraftAll(selected);
  };

  const dupCount = parsedJobs.filter((j) => j.duplicate).length;
  const frenchCount = parsedJobs.filter((j) => j.requires_french === "yes").length;
  const visibleJobs = hideFrenchRequired ? parsedJobs.filter((j) => j.requires_french !== "yes") : parsedJobs;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "22px", fontWeight: 700, color: "#192733", marginBottom: "6px" }}>Job Matching</h2>
        <div style={{ fontSize: "13px", color: "rgba(46,58,68,0.55)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {loadingMembers ? <span>Loading talent pool...</span>
            : memberError ? <span style={{ color: "#c0392b" }}>{memberError}</span>
            : <span><strong style={{ color: "#192733" }}>{members.length}</strong> members in talent pool</span>}
          {parsedJobs.length > 0 && matchCards.length === 0 && (
            <span><strong style={{ color: "#192733" }}>{parsedJobs.length}</strong> jobs parsed — review then run matching</span>
          )}
          {matchCards.length > 0 && (
            <span>
              <strong style={{ color: "#192733" }}>{matchCards.length}</strong> matches across{" "}
              <strong style={{ color: "#192733" }}>{jobCount}</strong> jobs ·{" "}
              <strong style={{ color: "#192733" }}>{candidateGroups.length}</strong> candidate{candidateGroups.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Paste area */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#2E3A44", marginBottom: "8px" }}>Paste LinkedIn jobs here</label>
        <textarea
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={10}
          placeholder={`Paste raw job listings from LinkedIn here. Claude will extract and clean the jobs first — then you can review before running matching.\n\nExample:\nSenior Product Manager · Mistral AI · Paris (Hybrid) · 2 days ago\n...\n\n---\n\nHead of Marketing · Qonto · Remote\n...`}
          style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1.5px solid rgba(46,58,68,0.2)", backgroundColor: "#FFFBF2", color: "#2E3A44", fontSize: "13px", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", resize: "vertical", lineHeight: "1.6", outline: "none" }}
        />
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#c0392b", fontSize: "13px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Parse Jobs button */}
      <button
        onClick={handleParse}
        disabled={parsing || loadingMembers}
        style={{ backgroundColor: parsing || loadingMembers ? "rgba(25,39,51,0.5)" : "#192733", color: "#FFFBF2", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: 600, cursor: parsing || loadingMembers ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", marginBottom: "28px", display: "flex", alignItems: "center", gap: "8px" }}
      >
        {parsingStep === "parsing" ? (
          <>
            <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,251,242,0.3)", borderTopColor: "#FFFBF2", borderRadius: "999px", animation: "spin 0.8s linear infinite" }} />
            Parsing jobs...
          </>
        ) : "Parse Jobs →"}
      </button>

      {/* Job Preview Table */}
      {parsedJobs.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(46,58,68,0.5)", margin: 0 }}>
                {visibleJobs.length}{hideFrenchRequired ? ` of ${parsedJobs.length}` : ""} job{parsedJobs.length !== 1 ? "s" : ""}
                {dupCount > 0 && (
                  <span style={{ marginLeft: "10px", color: "#b7770d" }}>
                    · {dupCount} duplicate{dupCount !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              {frenchCount > 0 && (
                <button
                  onClick={() => setHideFrenchRequired((v) => !v)}
                  style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", border: `1px solid ${hideFrenchRequired ? "#c0392b" : "rgba(46,58,68,0.2)"}`, backgroundColor: hideFrenchRequired ? "rgba(192,57,43,0.08)" : "transparent", color: hideFrenchRequired ? "#c0392b" : "rgba(46,58,68,0.55)", cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
                >
                  🔴 {hideFrenchRequired ? `Showing ${frenchCount} hidden` : `Hide ${frenchCount} French-required`}
                </button>
              )}
            </div>
            <button
              onClick={handleRunMatching}
              disabled={parsing || parsedJobs.length === 0}
              style={{ backgroundColor: parsing || parsedJobs.length === 0 ? "rgba(25,39,51,0.5)" : "#192733", color: "#FFFBF2", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: parsing || parsedJobs.length === 0 ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", display: "flex", alignItems: "center", gap: "8px" }}
            >
              {parsingStep === "matching" ? (
                <>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(255,251,242,0.3)", borderTopColor: "#FFFBF2", borderRadius: "999px", animation: "spin 0.8s linear infinite" }} />
                  Matching...
                </>
              ) : "Run Matching →"}
            </button>
          </div>

          <div style={{ border: "1px solid rgba(46,58,68,0.12)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.5fr) 80px 80px 46px 70px 36px", backgroundColor: "rgba(46,58,68,0.04)", padding: "10px 16px", borderBottom: "1px solid rgba(46,58,68,0.1)" }}>
              {["Title", "Company", "Location", "Type", "Posted", "🇫🇷", "Flag", ""].map((h, i) => (
                <span key={i} style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(46,58,68,0.45)" }}>{h}</span>
              ))}
            </div>
            {visibleJobs.map((job, i) => {
              const langDot = job.requires_french === "yes" ? "🔴" : job.requires_french === "no" ? "🟢" : "🟡";
              const origIdx = parsedJobs.indexOf(job);
              return (
                <div
                  key={i}
                  style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.5fr) 80px 80px 46px 70px 36px", padding: "11px 16px", borderBottom: i < visibleJobs.length - 1 ? "1px solid rgba(46,58,68,0.07)" : "none", backgroundColor: job.duplicate ? "rgba(230,126,34,0.03)" : "#FFFBF2", alignItems: "center" }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#192733", paddingRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={job.title}>{job.title}</span>
                  <span style={{ fontSize: "12px", color: "#2E3A44", paddingRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={job.company}>{job.company}</span>
                  <span style={{ fontSize: "12px", color: "rgba(46,58,68,0.65)", paddingRight: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={job.location}>{job.location}</span>
                  <span style={{ fontSize: "11px", color: "rgba(46,58,68,0.65)" }}>{job.work_type}</span>
                  <span style={{ fontSize: "11px", color: "rgba(46,58,68,0.55)" }}>{job.posted}</span>
                  <span style={{ fontSize: "14px", textAlign: "center" }} title={`French required: ${job.requires_french}`}>{langDot}</span>
                  <div>
                    {job.duplicate && (
                      <span style={{ backgroundColor: "rgba(230,126,34,0.12)", color: "#b7770d", padding: "2px 7px", borderRadius: "999px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                        Duplicate
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeJob(origIdx)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(46,58,68,0.3)", fontSize: "15px", padding: "0", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "4px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(192,57,43,0.75)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(46,58,68,0.3)")}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Match results — grouped by candidate */}
      {matchCards.length > 0 && (
        <div>
          {/* Results header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "12px", borderBottom: "1px solid rgba(46,58,68,0.1)" }}>
            <h3 style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "15px", fontWeight: 700, color: "#192733" }}>
              {matchCards.length} match{matchCards.length !== 1 ? "es" : ""} · {candidateGroups.length} candidate{candidateGroups.length !== 1 ? "s" : ""}
            </h3>
            {candidateGroups.length > 0 && (
              <button
                onClick={handleDraftAllSelected}
                style={{ backgroundColor: "#192733", color: "#FFFBF2", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
              >
                Draft {candidateGroups.length} email{candidateGroups.length !== 1 ? "s" : ""} →
              </button>
            )}
          </div>

          {/* One section per candidate */}
          {candidateGroups.map(({ name, cards }, groupIdx) => {
            const initials = name.split(" ").map((n: string) => n[0] || "").join("").slice(0, 2).toUpperCase();
            const member = cards[0].member;
            return (
              <div key={name} style={{ marginBottom: groupIdx < candidateGroups.length - 1 ? "40px" : "0" }}>
                {/* Candidate header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid rgba(46,58,68,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "999px", backgroundColor: "#192733", color: "#FFFBF2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <p style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "15px", fontWeight: 700, color: "#192733" }}>{name}</p>
                        {member?.linkedinUrl && (
                          <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "rgba(46,58,68,0.45)", textDecoration: "none", border: "1px solid rgba(46,58,68,0.18)", padding: "2px 7px", borderRadius: "4px" }}>
                            LinkedIn ↗
                          </a>
                        )}
                      </div>
                      <p style={{ fontSize: "12px", color: "rgba(46,58,68,0.55)" }}>
                        {cards[0].match.candidateRole}
                        {member?.email && (
                          <span style={{ marginLeft: "10px", color: "rgba(46,58,68,0.4)" }}>{member.email}</span>
                        )}
                        <span style={{ marginLeft: "10px", backgroundColor: "rgba(46,58,68,0.07)", padding: "1px 7px", borderRadius: "4px", fontSize: "11px", color: "rgba(46,58,68,0.6)" }}>
                          {cards.length} job{cards.length !== 1 ? "s" : ""} matched
                        </span>
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const selCards = cards.filter((c) => isJobSelected(name, c.job?.id));
                    const selCount = selCards.length;
                    return (
                      <button
                        onClick={() => selCount === 1 ? onDraftEmail(selCards[0]) : onMultiDraft(selCards)}
                        disabled={selCount === 0}
                        style={{ backgroundColor: selCount === 0 ? "rgba(25,39,51,0.35)" : "#192733", color: "#FFFBF2", border: "none", borderRadius: "7px", padding: "9px 16px", fontSize: "12px", fontWeight: 600, cursor: selCount === 0 ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", whiteSpace: "nowrap" }}
                      >
                        {selCount === 0
                          ? "No jobs selected"
                          : selCount < cards.length
                          ? `Draft email (${selCount} of ${cards.length} jobs) →`
                          : `Draft email for ${name.split(" ")[0]} →`}
                      </button>
                    );
                  })()}
                </div>

                {/* Job cards for this candidate */}
                {cards.map((card, i) => {
                  const jobId = card.job?.id;
                  const selected = isJobSelected(name, jobId);
                  return (
                    <div key={`${jobId}-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div
                        onClick={() => toggleJobSelection(name, jobId)}
                        style={{ width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0, marginTop: "18px", border: `2px solid ${selected ? "#192733" : "rgba(46,58,68,0.22)"}`, backgroundColor: selected ? "#192733" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}
                      >
                        {selected && <span style={{ color: "#FFFBF2", fontSize: "10px", fontWeight: 700, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <MatchCardRow
                          card={card}
                          onUpdate={onUpdateCard}
                          onDraftEmail={onDraftEmail}
                          sessionToken={sessionToken}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
