import { NextResponse } from "next/server";
import { VISITOR_PREVIEW_COOKIE_NAME } from "@/lib/visitor-preview-session";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(VISITOR_PREVIEW_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
