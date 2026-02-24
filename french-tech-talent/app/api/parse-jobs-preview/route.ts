import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAdminAuth } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;

  try {
    const { jobText } = await req.json();

    if (!jobText) {
      return NextResponse.json({ error: "No job text provided" }, { status: 400 });
    }

    const prompt = `You will receive raw copy-pasted text from LinkedIn job search results.
It is messy and contains duplicates, noise, and repeated text patterns.

Your job:
1. Extract every unique job listing
2. For each job return a JSON array with these fields:
   - title: clean job title, no duplicated text, no "with verification"
   - company: company name only
   - location: city + region e.g. "Paris, Île-de-France"
   - work_type: "Hybrid" | "Remote" | "On-site" | "Unknown"
   - posted: e.g. "1 day ago", "Today", "Unknown"
   - requires_french: "yes" | "no" | "unknown" — whether French language proficiency is required.
     Use "yes" if: job is at a French-only company, listing is in French, or description mentions "French required/fluent/native".
     Use "no" if: listing is in English and company is international/global.
     Use "unknown" if: cannot determine from available context.
3. Remove all noise: alumni lines, "Viewed", "Easy Apply",
   "Within the past X hours", "with verification", header/footer text
4. If same title + company appears with different locations, keep both,
   flag with duplicate: true
5. If identical in all fields, keep only one

Return only a valid JSON array. No explanation, no markdown.

Raw text:
${jobText}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to extract jobs from response" }, { status: 500 });
    }

    const rawJobs = JSON.parse(jsonMatch[0]);

    // Client-side dedup flagging (per spec)
    const seen: Record<string, boolean> = {};
    const jobs = rawJobs.map((job: Record<string, unknown>) => {
      const key = `${String(job.title || "").toLowerCase().trim()}__${String(job.company || "").toLowerCase().trim()}`;
      const duplicate = !!seen[key];
      seen[key] = true;
      return { ...job, duplicate };
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Parse preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
