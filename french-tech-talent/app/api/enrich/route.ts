import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1mOzACOZAOq8x3uXmNMUVVkB0BOkP_lCjrlESB3rYXOY/export?format=csv";

interface FundingRecord {
  name: string;
  raised: string;
  industry: string;
  description: string;
  date: string;
}

async function fetchFundingDB(): Promise<FundingRecord[]> {
  try {
    const res = await fetch(SHEET_CSV_URL, { next: { revalidate: 3600 } });
    const text = await res.text();
    const lines = text.split("\n");
    const records: FundingRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Parse CSV row (handle quoted fields)
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === "," && !inQuotes) { cols.push(current.trim()); current = ""; }
        else { current += ch; }
      }
      cols.push(current.trim());
      const name = cols[0];
      if (!name || name === "Startup") continue;
      records.push({
        name,
        raised: cols[1] || "",
        industry: cols[2] || "",
        description: cols[3] || "",
        date: cols[4] || "",
      });
    }
    return records;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { company, jobTitle, jobDescription } = await req.json();

    if (!company) {
      return NextResponse.json({ error: "No company provided" }, { status: 400 });
    }

    // Fetch live funding DB from Google Sheets
    const fundingDB = await fetchFundingDB();
    const fundingMatch = fundingDB.find(
      (c) => c.name.toLowerCase() === company.toLowerCase()
    );

    const prompt = `You are enriching company data for a talent matching tool focused on the French tech ecosystem.

Company: ${company}
Job title: ${jobTitle || "N/A"}
Job description: ${jobDescription || "N/A"}

French Tech funding database match: ${
      fundingMatch
        ? `Found — raised ${fundingMatch.raised} (${fundingMatch.date}), industry: ${fundingMatch.industry}, description: ${fundingMatch.description}`
        : "Not found in funding DB"
    }

Return enrichment in 5 structured sections as ONLY valid JSON:

{
  "in_french_db": true | false,
  "funding_info": "From DB if matched, otherwise best knowledge — amount, round, date (e.g. 'Raised €12M Series A, March 2024'). If unknown write null.",
  "stage": "Seed / Series A / B / C / Late Stage / Public / Unknown",
  "glassdoor_rating": "e.g. '4.1/5 (230 reviews)' — only if you have reasonable confidence, else null",
  "glassdoor_snippets": ["2-3 short representative employee quotes or recurring themes from reviews — actual snippets if known, else null"],
  "review_sentiment": "1-2 sentence summary of employee culture and sentiment",
  "salary_signal": "MANDATORY — always provide a range. For the specific role '${jobTitle || "this role"}' at this company in this market. Format: '€X–Yk base + [equity/bonus note]'. If uncertain, give a market estimate with 'est.' prefix.",
  "headcount": "approximate team size and growth trajectory (e.g. '~200 people, growing fast post-Series B')",
  "language_requirement": "Required | Not required | Unknown — whether French language is required for this role. Base this on the job description and company context (French-only companies usually require French).",
  "vibe_summary": "2 sentences on mission and day-to-day culture",
  "industry": "primary industry",
  "founded": "year founded if known",
  "hq": "headquarters city"
}

Rules:
- salary_signal is MANDATORY — always fill it, use market estimates with 'est.' if needed
- language_requirement must always be one of: 'Required' | 'Not required' | 'Unknown'
- in_french_db must be true if the funding DB match was found, false otherwise
- Use null only for fields where you truly have no signal`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse enrichment response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ...result, fundingDbMatch: fundingMatch || null });
  } catch (error) {
    console.error("Enrich error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
