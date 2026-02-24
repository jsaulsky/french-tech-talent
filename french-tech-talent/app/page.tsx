"use client";

import { useState } from "react";

const ROLE_TYPES = [
  "Product",
  "Marketing",
  "Strategy",
  "Operations",
  "Sales",
  "Finance",
  "Investor",
  "Founder's Associate",
  "Internship",
  "Other",
];

const JOB_TITLES = [
  "Product Manager",
  "Senior Product Manager",
  "Product Marketing Manager",
  "Marketing Manager",
  "Growth Manager",
  "Brand Manager",
  "Strategy Manager",
  "Finance Manager",
  "Financial Analyst",
  "Project Manager",
  "Operations Manager",
  "Business Development Manager",
  "Sales Manager",
  "Account Executive",
  "SDR / BDR",
  "Customer Success Manager",
  "Customer Care Manager",
  "Founder's Associate",
  "Chief of Staff",
  "Venture Investor / VC Analyst",
  "Data Analyst",
  "Data Scientist",
  "Software Engineer",
  "UX / Product Designer",
  "Graphic Designer",
  "Copywriter / Content Writer",
  "Communications / PR Manager",
  "HR / People Manager",
  "Legal Counsel",
  "Other",
];

const SENIORITY_LEVELS = [
  "Internship",
  "Junior (1–3 years)",
  "Mid-Level (4–6 years)",
  "Experienced (7–10 years)",
  "Senior (10+ years)",
];

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

const INDUSTRIES = [
  { emoji: "🧬", label: "Biotech" },
  { emoji: "💳", label: "Fintech" },
  { emoji: "🏭", label: "Industrial Tech" },
  { emoji: "↔️", label: "B2B Software" },
  { emoji: "🩺", label: "Medtech" },
  { emoji: "🤖", label: "AI" },
  { emoji: "🛤️", label: "Infrastructure Management" },
  { emoji: "🎬", label: "Media Tech" },
  { emoji: "🏠", label: "Proptech" },
  { emoji: "🗣️", label: "AI Agents" },
  { emoji: "✈️", label: "Travel" },
  { emoji: "🏗️", label: "Construction" },
  { emoji: "🏅", label: "Sports" },
  { emoji: "🏪", label: "Retail Tech" },
  { emoji: "📢", label: "Marketing" },
  { emoji: "🚚", label: "Digital Services / Logistics" },
  { emoji: "🌡️", label: "Climate Tech" },
  { emoji: "🛸", label: "Aerospace" },
  { emoji: "🦾", label: "Robotics" },
  { emoji: "🔩", label: "Materials Manufacturing" },
  { emoji: "🪖", label: "Defense" },
  { emoji: "⚖️", label: "Legaltech" },
  { emoji: "🏥", label: "HealthTech" },
  { emoji: "🎓", label: "Edtech" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "💻", label: "Platform Engineering" },
  { emoji: "🔌", label: "EV Charging" },
  { emoji: "🌾", label: "Agritech" },
  { emoji: "☢️", label: "Nuclear Energy" },
  { emoji: "🔬", label: "Deeptech" },
  { emoji: "📱", label: "Telecom" },
  { emoji: "🖲️", label: "Quantum Computing" },
  { emoji: "⚡", label: "Renewable Energy" },
  { emoji: "🍽️", label: "Food & Beverage" },
  { emoji: "👥", label: "HR Tech" },
  { emoji: "🛡️", label: "Cybersecurity" },
  { emoji: "♻️", label: "Circular Economy" },
  { emoji: "📜", label: "Insurtech" },
  { emoji: "🎧", label: "Consumer Tech" },
  { emoji: "🛣️", label: "Transportation" },
  { emoji: "💽", label: "Semiconductors" },
  { emoji: "₿", label: "Cryptocurrency & Blockchain" },
  { emoji: "🛍️", label: "E-commerce" },
  { emoji: "🎵", label: "Music" },
  { emoji: "🚁", label: "Drone Tech" },
  { emoji: "🚀", label: "GovTech" },
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: selected ? "#192733" : "transparent",
        color: selected ? "#FFFBF2" : "#2E3A44",
        border: `1.5px solid ${selected ? "#192733" : "rgba(46,58,68,0.3)"}`,
        borderRadius: "999px",
        padding: "6px 16px",
        fontSize: "13px",
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s ease",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function IndustryChip({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: selected ? "#192733" : "transparent",
        color: selected ? "#FFFBF2" : "#2E3A44",
        border: `1.5px solid ${selected ? "#192733" : "rgba(46,58,68,0.3)"}`,
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: "15px" }}>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

export default function Home() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    linkedinUrl: "",
    currentRole: "",
    lookingFor: "",
  });
  const [roleTypes, setRoleTypes] = useState<string[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [seniority, setSeniority] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const toggleItem = (
    item: string,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.linkedinUrl || !form.currentRole) {
      setError("Please fill in all required fields.");
      return;
    }
    if (roleTypes.length === 0) {
      setError("Please select at least one role type.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roleTypes, jobTitles, seniority, industries, companySizes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1.5px solid rgba(46,58,68,0.2)",
    backgroundColor: "#FFFBF2",
    color: "#2E3A44",
    fontSize: "14px",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#2E3A44",
    marginBottom: "6px",
  };

  const sectionHeadStyle: React.CSSProperties = {
    fontFamily: "Trebuchet MS, sans-serif",
    fontSize: "16px",
    fontWeight: 700,
    color: "#192733",
    marginBottom: "6px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(46,58,68,0.1)",
  };

  const subLabelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(46,58,68,0.5)",
    marginBottom: "16px",
  };

  if (success) {
    return (
      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#FFFBF2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "480px" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>🎉</div>
          <h1
            style={{
              fontFamily: "Trebuchet MS, sans-serif",
              fontSize: "28px",
              color: "#192733",
              marginBottom: "16px",
              fontWeight: 700,
            }}
          >
            You&apos;re in the pool!
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#2E3A44",
              lineHeight: "1.6",
              marginBottom: "12px",
            }}
          >
            We&apos;ll be in touch when we spot a role that matches your interests.
          </p>
          <p style={{ fontSize: "14px", color: "rgba(46,58,68,0.6)" }}>
            No spam, only curated, personal intros.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFBF2",
        padding: "60px 20px 80px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <a
            href="https://frenchtechupdates.beehiiv.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(46,58,68,0.5)",
              marginBottom: "12px",
              display: "block",
              textDecoration: "none",
            }}
          >
            French Tech Updates
          </a>
          <h1
            style={{
              fontFamily: "Trebuchet MS, sans-serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 700,
              color: "#192733",
              lineHeight: "1.15",
              marginBottom: "16px",
            }}
          >
            Join the talent pool
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(46,58,68,0.7)",
              lineHeight: "1.6",
              maxWidth: "480px",
            }}
          >
            Tell us about yourself and what you&apos;re looking for. When a
            relevant opportunity comes up, we&apos;ll reach out personally.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={sectionHeadStyle}>About you</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>
                  Full name <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Sophie Martin"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Email <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="sophie@example.com"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  LinkedIn URL <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  type="url"
                  name="linkedinUrl"
                  value={form.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/sophiemartin"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Current role / function <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  name="currentRole"
                  value={form.currentRole}
                  onChange={handleChange}
                  placeholder="e.g. Product Manager at Alma"
                />
              </div>
            </div>
          </section>

          {/* Role Types */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={sectionHeadStyle}>
              Types of roles you&apos;re looking for
            </h2>
            <p style={subLabelStyle}>Select all that apply</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {ROLE_TYPES.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  selected={roleTypes.includes(role)}
                  onClick={() => toggleItem(role, roleTypes, setRoleTypes)}
                />
              ))}
            </div>
          </section>

          {/* Job Titles */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={sectionHeadStyle}>Job titles that interest you</h2>
            <p style={subLabelStyle}>Select all that apply</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {JOB_TITLES.map((title) => (
                <Chip
                  key={title}
                  label={title}
                  selected={jobTitles.includes(title)}
                  onClick={() => toggleItem(title, jobTitles, setJobTitles)}
                />
              ))}
            </div>
          </section>

          {/* Seniority */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={sectionHeadStyle}>Seniority level</h2>
            <p style={subLabelStyle}>Select all levels you'd consider</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {SENIORITY_LEVELS.map((level) => (
                <Chip
                  key={level}
                  label={level}
                  selected={seniority.includes(level)}
                  onClick={() => toggleItem(level, seniority, setSeniority)}
                />
              ))}
            </div>
          </section>

          {/* Industries */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={sectionHeadStyle}>Industries of interest</h2>
            <p style={subLabelStyle}>Select all sectors that excite you</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "8px",
                maxHeight: "320px",
                overflowY: "auto",
                padding: "4px 2px",
              }}
            >
              {INDUSTRIES.map((ind) => (
                <IndustryChip
                  key={ind.label}
                  emoji={ind.emoji}
                  label={ind.label}
                  selected={industries.includes(ind.label)}
                  onClick={() => toggleItem(ind.label, industries, setIndustries)}
                />
              ))}
            </div>
          </section>

          {/* Company Size */}
          <section style={{ marginBottom: "36px" }}>
            <h2 style={sectionHeadStyle}>Preferred company size</h2>
            <p style={subLabelStyle}>Select all that work for you</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {COMPANY_SIZES.map((size) => (
                <Chip
                  key={size}
                  label={size}
                  selected={companySizes.includes(size)}
                  onClick={() => toggleItem(size, companySizes, setCompanySizes)}
                />
              ))}
            </div>
          </section>

          {/* Looking For */}
          <section style={{ marginBottom: "40px" }}>
            <h2 style={sectionHeadStyle}>
              What are you looking for in your next role?
            </h2>
            <p style={subLabelStyle}>
              The more context you give, the better we can match you
            </p>
            <textarea
              name="lookingFor"
              value={form.lookingFor}
              onChange={handleChange}
              rows={4}
              placeholder="E.g. I'm looking for a founding team role at an early-stage B2B SaaS company where I can own the product roadmap. I want something with real responsibility from day one..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }}
            />
          </section>

          {error && (
            <div
              style={{
                backgroundColor: "rgba(192,57,43,0.08)",
                border: "1px solid rgba(192,57,43,0.3)",
                borderRadius: "8px",
                padding: "12px 16px",
                color: "#c0392b",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: submitting ? "rgba(25,39,51,0.6)" : "#192733",
              color: "#FFFBF2",
              border: "none",
              borderRadius: "8px",
              padding: "14px 32px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              transition: "opacity 0.15s ease",
              width: "100%",
            }}
          >
            {submitting ? "Submitting..." : "Join the talent pool →"}
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "rgba(46,58,68,0.4)",
              marginTop: "12px",
            }}
          >
            Your information is kept private and never shared without your consent.
          </p>
        </form>
      </div>
    </main>
  );
}
