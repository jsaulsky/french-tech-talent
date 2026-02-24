import { NextRequest, NextResponse } from "next/server";

export function checkAdminAuth(req: NextRequest): NextResponse | null {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
