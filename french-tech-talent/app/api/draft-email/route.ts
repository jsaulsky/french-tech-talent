import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { candidate, job, jobs, enrichment, enrichments, matchReason, matchReasons, requiresFrench } = await req.json();

    if (!candidate) {
      return NextResponse.json({ error: "Missing candidate data" }, { status: 400 });
    }

    const isMulti = Array.isArray(jobs) && jobs.length > 1;

    if (isMulti) {
      // Multi-job email
      const jobsList = jobs.map((j: { title: string; company: string; location: string; work_type: string; description?: string; apply_url?: string; requires_french?: string }, i: number) => {
        const enrich = enrichments?.[i];
        const reason = matchReasons?.[i] || "";
        const langNote = j.requires_french === "yes"
          ? "⚠️ Note: This role likely requires French language proficiency."
          : j.requires_french === "no"
          ? "No French language requirement."
          : "";
        return `
Role ${i + 1}: ${j.title} at ${j.company}
- Location: ${j.location} · ${j.work_type}
- Why it fits: ${reason}
${j.description ? `- About the role: ${j.description}` : ""}
${enrich?.funding_info ? `- Company funding: ${enrich.funding_info}` : ""}
${enrich?.vibe_summary ? `- Vibe: ${enrich.vibe_summary}` : ""}
${enrich?.salary_signal ? `- Salary: ${enrich.salary_signal}` : ""}
${langNote ? `- Language: ${langNote}` : ""}
${j.apply_url ? `- Apply: ${j.apply_url}` : ""}`.trim();
      }).join("\n\n");

      const prompt = `You are writing a personalized email on behalf of the French Tech Updates newsletter author — a connector and community builder in the French startup ecosystem.

Write a warm, direct, first-person email to a candidate sharing MULTIPLE job opportunities you think could interest them. The tone should feel like a message from a trusted friend, not a recruiter blast.

Candidate:
- Name: ${candidate.name}
- Current role: ${candidate.currentRole}
- Looking for: ${candidate.lookingFor || "not specified"}
- Interested in: ${(candidate.roleTypes || []).join(", ")}
- Industries: ${(candidate.industries || []).join(", ")}

Roles to share:
${jobsList}

Write the email following this structure:
1. Warm opener using their first name — acknowledge their current role (1-2 sentences)
2. "I came across a few roles I think could be interesting for you" framing (1 sentence)
3. For each role: a short paragraph — what it is, why it fits them, key context (2-3 sentences each). ALWAYS include: the company's last funding round and date if available (e.g. "They raised €X in [month year]"). If a role has a language note (⚠️ French required), mention it naturally (e.g. "Worth noting this role is French-speaking"). End each role's paragraph with the apply link on its own line — use the URL if provided, otherwise write [INSERT APPLY LINK].
4. Brief closing — encourage them to reach out if any catch their eye
5. Warm personal sign-off

Keep it under 400 words. No subject line. Start directly with the opener.
Sign off as: "James"

Return ONLY the email text, no extra commentary.`;

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const emailText = message.content[0].type === "text" ? message.content[0].text : "";
      return NextResponse.json({ email: emailText });

    } else {
      // Single-job email
      const j = job || jobs?.[0];
      if (!j) return NextResponse.json({ error: "Missing job data" }, { status: 400 });

      const enrichmentContext = enrichment
        ? `Company enrichment:
- Glassdoor: ${enrichment.glassdoor_rating || "N/A"}
- Review sentiment: ${enrichment.review_sentiment || "N/A"}
- Funding: ${enrichment.funding_info || "N/A"}
- Salary signal: ${enrichment.salary_signal || "N/A"}
- Headcount: ${enrichment.headcount || "N/A"}
- Vibe: ${enrichment.vibe_summary || "N/A"}`
        : "No enrichment data available.";

      const prompt = `You are writing a personalized email on behalf of the French Tech Updates newsletter author — a connector and community builder in the French startup ecosystem.

Write a warm, direct, first-person email to a specific candidate about a job opportunity. The tone should feel personal, like a message from a trusted friend who thinks of you, not a recruiting blast.

Candidate:
- Name: ${candidate.name}
- Current role: ${candidate.currentRole}
- Looking for: ${candidate.lookingFor || "not specified"}
- Interested in: ${(candidate.roleTypes || []).join(", ")}
- Industries: ${(candidate.industries || []).join(", ")}

Job opportunity:
- Title: ${j.title}
- Company: ${j.company}
- Location: ${j.location}
- Work type: ${j.work_type}
- French language required: ${requiresFrench ?? j.requires_french ?? "unknown"}
- Description: ${j.description || "N/A"}
- Apply URL: ${j.apply_url || "N/A"}

Match reason: ${matchReason || "Strong profile alignment"}

${enrichmentContext}

Write the email following this structure:
1. Warm opener using their first name + acknowledging their current role (1-2 sentences)
2. "I came across a role I think could be interesting for you" framing (1 sentence)
3. Job summary — what it is, where, how they work (2-3 lines, no buzzwords)
4. Why it matches their stated interests (2-3 sentences, specific)
5. Company context using enrichment if available — ALWAYS mention the company's last funding round and date if known (e.g. "They raised €X in [month year]"). Include Glassdoor/salary signal if meaningful. If French language is required ("yes"), mention it naturally (e.g. "Worth noting this role is French-speaking").
6. Apply link on its own line — use the URL if provided, otherwise write [INSERT APPLY LINK]
7. Personal sign-off

Under 280 words. No subject line. Start directly with the opener.
Sign off as: "James"

Return ONLY the email text, no extra commentary.`;

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const emailText = message.content[0].type === "text" ? message.content[0].text : "";
      return NextResponse.json({ email: emailText });
    }
  } catch (error) {
    console.error("Draft email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
