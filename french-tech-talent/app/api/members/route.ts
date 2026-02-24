import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authError = checkAdminAuth(req);
  if (authError) return authError;
  try {
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "Members")}?maxRecords=200`;

    const response = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        { error: "Failed to fetch members", details: err },
        { status: 500 }
      );
    }

    const data = await response.json();
    const members = data.records.map((r: { id: string; fields: Record<string, unknown> }) => ({
      id: r.id,
      fullName: r.fields["Name"] || "",
      email: r.fields["Email"] || "",
      linkedinUrl: r.fields["LinkedIn URL"] || "",
      currentRole: r.fields["Current Role"] || "",
      roleTypes: r.fields["Role Types"] || [],
      industries: r.fields["Industries"] || [],
      companySizes: r.fields["Company Size"] || [],
      lookingFor: r.fields["Looking For"] || "",
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Members fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
