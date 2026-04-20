import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  VISITOR_PREVIEW_COOKIE_NAME,
  verifyVisitorPreviewSession,
} from "@/lib/visitor-preview-session";

export const runtime = "nodejs";

export async function GET() {
  const password = process.env.VISITOR_PASSWORD;
  const sessionId = process.env.NEXT_PUBLIC_DECK_SESSION_ID;
  if (!password || !sessionId) {
    return NextResponse.json({ unlocked: false, configured: false });
  }

  const jar = await cookies();
  const token = jar.get(VISITOR_PREVIEW_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ unlocked: false, configured: true });
  }

  const ok = await verifyVisitorPreviewSession(token, password, sessionId);
  return NextResponse.json({ unlocked: ok, configured: true });
}
