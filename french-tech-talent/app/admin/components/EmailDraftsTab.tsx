"use client";

import { useState, useEffect } from "react";
import { MatchCard, MultiDraft } from "../page";

interface Props {
  matchCards: MatchCard[];
  multiDrafts: MultiDraft[];
  initialTarget: MatchCard | null;
  initialMultiTarget: MultiDraft | null;
  onUpdateCard: (card: MatchCard) => void;
  onUpdateMultiDraft: (draft: MultiDraft) => void;
  sessionToken: string;
}

// ── Shared sub-components ──────────────────────────────────────────────────

function GenerateButton({ drafting, onClick, label }: { drafting: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={drafting}
      style={{ backgroundColor: "#192733", color: "#FFFBF2", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "13px", fontWeight: 600, cursor: drafting ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", opacity: drafting ? 0.65 : 1, display: "inline-flex", alignItems: "center", gap: "8px" }}
    >
      {drafting ? (<><span style={{ display: "inline-block", width: "13px", height: "13px", border: "2px solid rgba(255,251,242,0.3)", borderTopColor: "#FFFBF2", borderRadius: "999px", animation: "spin 0.8s linear infinite" }} />Drafting...</>) : (label || "Generate Email Draft →")}
    </button>
  );
}

function DraftEditor({ draft, drafting, copied, onChange, onRegenerate, onCopy, onMarkSent, onDelete, email, isSent }: {
  draft: string; drafting: boolean; copied: boolean;
  onChange: (v: string) => void; onRegenerate: () => void; onCopy: () => void;
  onMarkSent: () => void; onDelete: () => void;
  email?: string; isSent?: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, color: "rgba(46,58,68,0.55)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Email Draft</label>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={onRegenerate} disabled={drafting} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: drafting ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", backgroundColor: "transparent", color: "#192733", border: "1.5px solid rgba(25,39,51,0.25)", opacity: drafting ? 0.6 : 1 }}>
            {drafting ? "Regenerating..." : "Regenerate"}
          </button>
          <button onClick={onCopy} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", backgroundColor: copied ? "rgba(39,174,96,0.12)" : "#192733", color: copied ? "#1e8449" : "#FFFBF2", border: "none", transition: "all 0.2s" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1.5px solid rgba(46,58,68,0.15)", backgroundColor: "#FFFBF2", color: "#2E3A44", fontSize: "13px", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", resize: "vertical", lineHeight: "1.7", outline: "none" }}
      />
      {email && (
        <p style={{ fontSize: "11px", color: "rgba(46,58,68,0.45)", marginTop: "6px" }}>
          Send to: <strong style={{ color: "rgba(46,58,68,0.7)", fontFamily: "monospace" }}>{email}</strong> — copy into Gmail manually
        </p>
      )}
      {/* Actions row */}
      <div style={{ display: "flex", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(46,58,68,0.08)" }}>
        {!isSent && (
          <button
            onClick={onMarkSent}
            style={{ padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", backgroundColor: "rgba(39,174,96,0.1)", color: "#1e8449", border: "1px solid rgba(39,174,96,0.25)" }}
          >
            ✓ Mark as sent
          </button>
        )}
        <button
          onClick={onDelete}
          style={{ padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", backgroundColor: "transparent", color: "rgba(192,57,43,0.7)", border: "1px solid rgba(192,57,43,0.2)" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Single-job draft card ──────────────────────────────────────────────────

function SingleDraftCard({ card, isActive, isSent, onActivate, onUpdate, sessionToken }: {
  card: MatchCard; isActive: boolean; isSent?: boolean;
  onActivate: () => void; onUpdate: (card: MatchCard) => void;
  sessionToken: string;
}) {
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localDraft, setLocalDraft] = useState(card.emailDraft || "");

  useEffect(() => { setLocalDraft(card.emailDraft || ""); }, [card.emailDraft]);

  const handleGenerate = async () => {
    setDrafting(true);
    try {
      const res = await fetch("/api/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": sessionToken },
        body: JSON.stringify({
          candidate: { name: card.match.candidateName, currentRole: card.match.candidateRole, lookingFor: card.member?.lookingFor, roleTypes: card.member?.roleTypes, industries: card.member?.industries },
          job: card.job, enrichment: card.enrichment, matchReason: card.match.reason,
        }),
      });
      const data = await res.json();
      if (data.email) { setLocalDraft(data.email); onUpdate({ ...card, emailDraft: data.email }); }
    } catch (e) { console.error(e); }
    finally { setDrafting(false); }
  };

  const handleCopy = () => { navigator.clipboard.writeText(localDraft); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleMarkSent = () => onUpdate({ ...card, sentAt: new Date().toISOString() });
  const handleDelete = () => onUpdate({ ...card, deleted: true });

  const confidenceColor: Record<string, string> = { High: "#1e8449", Medium: "#b7770d", Low: "#922b21" };

  return (
    <div style={{ backgroundColor: "#FFFBF2", borderRadius: "10px", border: isActive ? "1.5px solid #192733" : "1px solid rgba(46,58,68,0.12)", boxShadow: isActive ? "0 2px 12px rgba(25,39,51,0.12)" : "0 1px 4px rgba(46,58,68,0.06)", marginBottom: "10px", overflow: "hidden", opacity: isSent ? 0.85 : 1 }}>
      <div style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} onClick={onActivate}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: confidenceColor[card.match.confidence] || "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.match.confidence}</span>
            {isSent && card.sentAt && (
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#1e8449", backgroundColor: "rgba(39,174,96,0.1)", padding: "1px 7px", borderRadius: "999px" }}>
                Sent {formatSentDate(card.sentAt)}
              </span>
            )}
            {!isSent && card.emailDraft && (
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e8449", backgroundColor: "rgba(39,174,96,0.1)", padding: "1px 7px", borderRadius: "999px" }}>Draft ready</span>
            )}
          </div>
          <p style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", fontWeight: 700, color: "#192733" }}>
            {card.match.candidateName}
            <span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(46,58,68,0.55)", marginLeft: "6px" }}>→ {card.job?.title} @ {card.job?.company}</span>
          </p>
          <p style={{ fontSize: "11px", color: "rgba(46,58,68,0.45)", marginTop: "1px" }}>{card.match.candidateRole}</p>
          {card.member?.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
              <span style={{ fontSize: "11px", color: "rgba(46,58,68,0.4)" }}>To:</span>
              <span
                style={{ fontSize: "12px", fontWeight: 500, color: "#192733", backgroundColor: "rgba(25,39,51,0.07)", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontFamily: "monospace" }}
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(card.member!.email); }}
                title="Click to copy email"
              >
                {card.member.email}
              </span>
            </div>
          )}
        </div>
        <span style={{ fontSize: "18px", color: "rgba(46,58,68,0.3)", transform: isActive ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0, marginLeft: "12px" }}>▾</span>
      </div>

      {isActive && (
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{ padding: "10px 12px", backgroundColor: "rgba(46,58,68,0.04)", borderRadius: "6px", marginBottom: "14px", fontSize: "12px", color: "rgba(46,58,68,0.6)" }}>
            <strong>Match reason:</strong> {card.match.reason}
            {card.enrichment?.vibe_summary && <> · <strong>Vibe:</strong> {card.enrichment.vibe_summary}</>}
          </div>
          {!localDraft ? (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <p style={{ fontSize: "13px", color: "rgba(46,58,68,0.55)", marginBottom: "14px" }}>
                {card.enrichment ? "Enrichment loaded — ready to draft." : "No enrichment yet. You can still generate a draft."}
              </p>
              <GenerateButton drafting={drafting} onClick={handleGenerate} />
              <button onClick={handleDelete} style={{ display: "block", margin: "12px auto 0", padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", backgroundColor: "transparent", color: "rgba(192,57,43,0.6)", border: "1px solid rgba(192,57,43,0.2)" }}>
                Delete
              </button>
            </div>
          ) : (
            <DraftEditor
              draft={localDraft} drafting={drafting} copied={copied}
              onChange={(v) => { setLocalDraft(v); onUpdate({ ...card, emailDraft: v }); }}
              onRegenerate={handleGenerate} onCopy={handleCopy}
              onMarkSent={handleMarkSent} onDelete={handleDelete}
              email={card.member?.email} isSent={isSent}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Multi-job draft card ───────────────────────────────────────────────────

function MultiDraftCard({ draft, isActive, isSent, onActivate, onUpdate, sessionToken }: {
  draft: MultiDraft; isActive: boolean; isSent?: boolean;
  onActivate: () => void; onUpdate: (d: MultiDraft) => void;
  sessionToken: string;
}) {
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localDraft, setLocalDraft] = useState(draft.emailDraft || "");

  useEffect(() => { setLocalDraft(draft.emailDraft || ""); }, [draft.emailDraft]);

  const handleGenerate = async () => {
    setDrafting(true);
    try {
      const res = await fetch("/api/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": sessionToken },
        body: JSON.stringify({
          candidate: { name: draft.candidateName, currentRole: draft.candidateRole, lookingFor: draft.member?.lookingFor, roleTypes: draft.member?.roleTypes, industries: draft.member?.industries },
          jobs: draft.cards.map((c) => c.job),
          enrichments: draft.cards.map((c) => c.enrichment || null),
          matchReasons: draft.cards.map((c) => c.match.reason),
        }),
      });
      const data = await res.json();
      if (data.email) { setLocalDraft(data.email); onUpdate({ ...draft, emailDraft: data.email }); }
    } catch (e) { console.error(e); }
    finally { setDrafting(false); }
  };

  const handleCopy = () => { navigator.clipboard.writeText(localDraft); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleMarkSent = () => onUpdate({ ...draft, sentAt: new Date().toISOString() });
  const handleDelete = () => onUpdate({ ...draft, deleted: true });

  return (
    <div style={{ backgroundColor: "#FFFBF2", borderRadius: "10px", border: isActive ? "1.5px solid #192733" : "1px solid rgba(46,58,68,0.12)", boxShadow: isActive ? "0 2px 12px rgba(25,39,51,0.12)" : "0 1px 4px rgba(46,58,68,0.06)", marginBottom: "10px", overflow: "hidden", opacity: isSent ? 0.85 : 1 }}>
      <div style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }} onClick={onActivate}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#192733", backgroundColor: "rgba(25,39,51,0.1)", padding: "1px 8px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {draft.cards.length} roles
            </span>
            {isSent && draft.sentAt && (
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#1e8449", backgroundColor: "rgba(39,174,96,0.1)", padding: "1px 7px", borderRadius: "999px" }}>
                Sent {formatSentDate(draft.sentAt)}
              </span>
            )}
            {!isSent && draft.emailDraft && (
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e8449", backgroundColor: "rgba(39,174,96,0.1)", padding: "1px 7px", borderRadius: "999px" }}>Draft ready</span>
            )}
          </div>
          <p style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", fontWeight: 700, color: "#192733" }}>{draft.candidateName}</p>
          <p style={{ fontSize: "11px", color: "rgba(46,58,68,0.5)", marginTop: "2px" }}>
            {draft.cards.map((c) => `${c.job?.title} @ ${c.job?.company}`).join(" · ")}
          </p>
          {draft.member?.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
              <span style={{ fontSize: "11px", color: "rgba(46,58,68,0.4)" }}>To:</span>
              <span
                style={{ fontSize: "12px", fontWeight: 500, color: "#192733", backgroundColor: "rgba(25,39,51,0.07)", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontFamily: "monospace" }}
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(draft.member!.email); }}
                title="Click to copy email"
              >
                {draft.member.email}
              </span>
            </div>
          )}
        </div>
        <span style={{ fontSize: "18px", color: "rgba(46,58,68,0.3)", transform: isActive ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0, marginLeft: "12px" }}>▾</span>
      </div>

      {isActive && (
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            {draft.cards.map((c, i) => (
              <div key={i} style={{ padding: "8px 12px", backgroundColor: "rgba(46,58,68,0.04)", borderRadius: "6px", fontSize: "12px", color: "rgba(46,58,68,0.7)" }}>
                <strong style={{ color: "#192733" }}>{c.job?.title} @ {c.job?.company}</strong>
                {c.job?.location && <span> · {c.job.location}</span>}
                {c.match.reason && <span style={{ opacity: 0.7 }}> — {c.match.reason}</span>}
              </div>
            ))}
          </div>
          {!localDraft ? (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <p style={{ fontSize: "13px", color: "rgba(46,58,68,0.55)", marginBottom: "14px" }}>
                Generate one email covering all {draft.cards.length} roles.
              </p>
              <GenerateButton drafting={drafting} onClick={handleGenerate} label={`Generate combined email (${draft.cards.length} roles) →`} />
              <button onClick={handleDelete} style={{ display: "block", margin: "12px auto 0", padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", backgroundColor: "transparent", color: "rgba(192,57,43,0.6)", border: "1px solid rgba(192,57,43,0.2)" }}>
                Delete
              </button>
            </div>
          ) : (
            <DraftEditor
              draft={localDraft} drafting={drafting} copied={copied}
              onChange={(v) => { setLocalDraft(v); onUpdate({ ...draft, emailDraft: v }); }}
              onRegenerate={handleGenerate} onCopy={handleCopy}
              onMarkSent={handleMarkSent} onDelete={handleDelete}
              email={draft.member?.email} isSent={isSent}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatSentDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Main tab ───────────────────────────────────────────────────────────────

export default function EmailDraftsTab({ matchCards, multiDrafts, initialTarget, initialMultiTarget, onUpdateCard, onUpdateMultiDraft, sessionToken }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [sentOpen, setSentOpen] = useState(false);

  useEffect(() => {
    if (initialMultiTarget) { setActiveKey(`multi-${initialMultiTarget.id}`); }
    else if (initialTarget) { setActiveKey(`single-${initialTarget.job?.id}-${initialTarget.match.candidateName}`); }
  }, [initialTarget, initialMultiTarget]);

  const singleKey = (c: MatchCard) => `single-${c.job?.id}-${c.match.candidateName}`;
  const multiKey = (d: MultiDraft) => `multi-${d.id}`;
  const toggle = (key: string) => setActiveKey((prev) => prev === key ? null : key);

  // Partition: deleted, sent, active
  const activeCards = matchCards.filter((c) => !c.deleted && !c.sentAt);
  const activeMulti = multiDrafts.filter((d) => !d.deleted && !d.sentAt);
  const sentCards = matchCards.filter((c) => !c.deleted && c.sentAt);
  const sentMulti = multiDrafts.filter((d) => !d.deleted && d.sentAt);

  const totalActive = activeCards.length + activeMulti.length;
  const totalSent = sentCards.length + sentMulti.length;
  const totalDraftsReady = activeCards.filter((c) => c.emailDraft).length + activeMulti.filter((d) => d.emailDraft).length;

  if (totalActive === 0 && totalSent === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "20px", fontWeight: 700, color: "#192733", marginBottom: "8px" }}>No matches yet</p>
        <p style={{ fontSize: "14px", color: "rgba(46,58,68,0.5)" }}>Go to Job Matching, paste job listings, and click &quot;Draft Email&quot; on any match.</p>
      </div>
    );
  }

  const withDrafts = [...activeCards.filter((c) => c.emailDraft), ...activeMulti.filter((d) => d.emailDraft)];
  const withoutDrafts = [...activeCards.filter((c) => !c.emailDraft), ...activeMulti.filter((d) => !d.emailDraft)];

  const renderCard = (item: MatchCard | MultiDraft) => {
    if ("job" in item) {
      const key = singleKey(item);
      return <SingleDraftCard key={key} card={item} isActive={activeKey === key} onActivate={() => toggle(key)} onUpdate={onUpdateCard} sessionToken={sessionToken} />;
    } else {
      const key = multiKey(item);
      return <MultiDraftCard key={key} draft={item} isActive={activeKey === key} onActivate={() => toggle(key)} onUpdate={onUpdateMultiDraft} sessionToken={sessionToken} />;
    }
  };

  const renderSentCard = (item: MatchCard | MultiDraft) => {
    if ("job" in item) {
      const key = `sent-${singleKey(item)}`;
      return <SingleDraftCard key={key} card={item} isActive={activeKey === key} isSent onActivate={() => toggle(key)} onUpdate={onUpdateCard} sessionToken={sessionToken} />;
    } else {
      const key = `sent-${multiKey(item)}`;
      return <MultiDraftCard key={key} draft={item} isActive={activeKey === key} isSent onActivate={() => toggle(key)} onUpdate={onUpdateMultiDraft} sessionToken={sessionToken} />;
    }
  };

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontFamily: "Trebuchet MS, sans-serif", fontSize: "22px", fontWeight: 700, color: "#192733", marginBottom: "6px" }}>Email Drafts</h2>
        <p style={{ fontSize: "13px", color: "rgba(46,58,68,0.55)" }}>
          {totalActive} active · {totalDraftsReady} draft{totalDraftsReady !== 1 ? "s" : ""} ready
          {totalSent > 0 && ` · ${totalSent} sent`}
        </p>
      </div>

      {/* Drafts ready */}
      {withDrafts.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "11px", fontWeight: 700, color: "rgba(46,58,68,0.45)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
            Drafts ready ({withDrafts.length})
          </h3>
          {withDrafts.map(renderCard)}
        </div>
      )}

      {/* Pending (no draft yet) */}
      {withoutDrafts.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "rgba(46,58,68,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Pending ({withoutDrafts.length})
            </h3>
            <button
              onClick={() => {
                activeCards.filter((c) => !c.emailDraft).forEach((c) => onUpdateCard({ ...c, deleted: true }));
                activeMulti.filter((d) => !d.emailDraft).forEach((d) => onUpdateMultiDraft({ ...d, deleted: true }));
              }}
              style={{ fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", backgroundColor: "transparent", color: "rgba(192,57,43,0.65)", border: "1px solid rgba(192,57,43,0.22)", padding: "4px 10px", borderRadius: "5px" }}
            >
              Delete all
            </button>
          </div>
          {withoutDrafts.map(renderCard)}
        </div>
      )}

      {/* Sent — collapsible */}
      {totalSent > 0 && (
        <div style={{ marginTop: "24px", borderTop: "1px solid rgba(46,58,68,0.1)", paddingTop: "16px" }}>
          <button
            onClick={() => setSentOpen((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: "0", width: "100%", textAlign: "left" }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(46,58,68,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sent ({totalSent})
            </span>
            <span style={{ fontSize: "14px", color: "rgba(46,58,68,0.3)", transform: sentOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: "2px" }}>▾</span>
          </button>

          {sentOpen && (
            <div style={{ marginTop: "12px" }}>
              {[...sentCards, ...sentMulti]
                .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime())
                .map(renderSentCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
