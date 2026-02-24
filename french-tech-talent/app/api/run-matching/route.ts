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
    const { jobs: rawJobs, members } = await req.json();

    if (!rawJobs || rawJobs.length === 0) {
      return NextResponse.json({ error: "No jobs provided" }, { status: 400 });
    }

    // Assign stable IDs
    const jobs = rawJobs.map((j: Record<string, unknown>, i: number) => ({
      ...j,
      id: `job_${i + 1}`,
    }));

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

    const prompt = `You are a strict talent matching assistant for a French Tech newsletter talent pool. Your job is to surface only genuinely strong matches — not stretch fits.

Here are structured job listings:
<jobs>
${JSON.stringify(jobs, null, 2)}
</jobs>

Here are our talent pool members:
<members>
${membersContext}
</members>

Known companies database (for context):
<companies>
${JSON.stringify(companiesDb)}
</companies>

MATCHING RULES — follow strictly:
1. FUNCTION-FIRST: The job function must match the candidate's role type list. A Marketing Manager is not a match for a Product role. A Software Engineer is not a match for a Sales role.
2. NO STRETCH ROLES: Only include candidates whose current role or stated roleTypes directly overlap with the job. Do not include "could learn" or "has adjacent experience" unless they explicitly listed that role type.
3. TWO-DIMENSION SCORING — rate both separately:
   - function_fit: how well the job function matches their role type ("High" | "Medium" | "Low")
   - industry_fit: how well the company's industry matches their stated industries ("High" | "Medium" | "Low")
   - Only include matches where BOTH function_fit AND industry_fit are "Medium" or "High"
4. DISQUALIFY if: the candidate is overqualified by 2+ levels, the industry is entirely outside their listed interests, or the company size is incompatible with their stated companySizes preference.

For each INCLUDED match provide:
- jobId: the job's id field
- candidateName: exact name from members list
- candidateRole: their current role
- confidence: "High" (both dims High) | "Medium" (at least one Medium, none Low)
- function_fit: "High" | "Medium"
- industry_fit: "High" | "Medium"
- reason: one sentence — cite specific role type + industry alignment

Return ONLY valid JSON:
{
  "matches": [
    {
      "jobId": "job_1",
      "candidateName": "...",
      "candidateRole": "...",
      "confidence": "High|Medium",
      "function_fit": "High|Medium",
      "industry_fit": "High|Medium",
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

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse matching response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ jobs, matches: result.matches || [] });
  } catch (error) {
    console.error("Run matching error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
