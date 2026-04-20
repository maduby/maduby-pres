import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  PRESENTER_COOKIE_NAME,
  signPresenterSession,
} from "@/lib/presenter-session";

export const runtime = "nodejs";

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: Request) {
  const secret = process.env.PRESENTER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = (body as { password?: unknown }).password;
  if (typeof password !== "string") {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  if (!timingSafeEqualStr(password, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signPresenterSession(secret);
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(PRESENTER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
