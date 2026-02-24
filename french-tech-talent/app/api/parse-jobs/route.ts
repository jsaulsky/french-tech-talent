import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { checkAdminAuth } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;
  try {
    const { jobText, members } = await req.json();

    if (!jobText) {
      return NextResponse.json({ error: "No job text provided" }, { status: 400 });
    }

    // Load companies DB
    let companiesDb: Array<{ name: string; industry: string; stage: string; raised: string; summary: string }> = [];
    try {
      const companiesPath = join(process.cwd(), "data", "companies.json");
      companiesDb = JSON.parse(readFileSync(companiesPath, "utf-8"));
    } catch {
      // proceed without company DB
    }

    const membersContext = JSON.stringify(
      members.map((m: { fullName: string; currentRole: string; roleTypes: string[]; industries: string[]; companySizes: string[]; lookingFor: string }) => ({
        name: m.fullName,
        currentRole: m.currentRole,
        roleTypes: m.roleTypes,
        industries: m.industries,
        companySizes: m.companySizes,
        lookingFor: m.lookingFor,
      }))
    );

    const prompt = `You are a talent matching assistant for a French Tech newsletter talent pool.

Here is raw LinkedIn job listing text to parse:
<jobs>
${jobText}
</jobs>

Here are our talent pool members:
<members>
${membersContext}
</members>

Known companies database (for context):
<companies>
${JSON.stringify(companiesDb)}
</companies>

Tasks:
1. Parse the raw text into structured job listings. Extract: title, company, location, work_type (hybrid/remote/onsite), posted_date (if available), apply_url (if available), description (brief).
2. For each job, score it against EVERY member. Only include HIGH or MEDIUM confidence matches. Ignore low-confidence or non-matches.
3. For each match, provide:
   - confidence: "High" | "Medium"
   - reason: one-line explanation of why it's a good match

Return ONLY valid JSON in this exact format:
{
  "jobs": [
    {
      "id": "job_1",
      "title": "...",
      "company": "...",
      "location": "...",
      "work_type": "hybrid|remote|onsite",
      "posted": "...",
      "apply_url": "...",
      "description": "..."
    }
  ],
  "matches": [
    {
      "jobId": "job_1",
      "candidateName": "...",
      "candidateRole": "...",
      "confidence": "High|Medium",
      "reason": "..."
    }
  ]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse response", raw: responseText }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Parse jobs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
