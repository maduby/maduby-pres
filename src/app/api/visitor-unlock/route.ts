import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  VISITOR_PREVIEW_COOKIE_NAME,
  signVisitorPreviewSession,
} from "@/lib/visitor-preview-session";

export const runtime = "nodejs";

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: Request) {
  const password = process.env.VISITOR_PASSWORD;
  const sessionId = process.env.NEXT_PUBLIC_DECK_SESSION_ID;
  if (!password || !sessionId) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const submitted = (body as { password?: unknown }).password;
  if (typeof submitted !== "string") {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  if (!timingSafeEqualStr(submitted, password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signVisitorPreviewSession(password, sessionId);
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(VISITOR_PREVIEW_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
