import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter: max 3 submissions per IP per 10 minutes
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000;

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { fullName, email, linkedinUrl, currentRole, roleTypes, industries, companySizes, lookingFor } = body;

    if (!fullName || !email || !linkedinUrl || !currentRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "Members")}`;

    const response = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        typecast: true,
        fields: {
          Name: fullName,
          Email: email,
          "LinkedIn URL": linkedinUrl,
          "Current Role": currentRole,
          "Role Types": roleTypes || [],
          Industries: industries || [],
          "Company Size": companySizes || [],
          "Looking For": lookingFor || "",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Airtable error:", err);
      return NextResponse.json({ error: "Failed to save your submission. Please try again." }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
