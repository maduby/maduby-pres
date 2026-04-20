import { SignJWT, jwtVerify } from "jose";

export const VISITOR_PREVIEW_COOKIE_NAME = "fhgr_visitor_preview";

export async function signVisitorPreviewSession(
  secret: string,
  sessionId: string,
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ role: "visitor_preview", sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyVisitorPreviewSession(
  token: string,
  secret: string,
  expectedSessionId: string,
): Promise<boolean> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    const p = payload as { role?: unknown; sid?: unknown };
    if (p.role !== "visitor_preview") return false;
    if (typeof p.sid !== "string" || p.sid !== expectedSessionId) return false;
    return true;
  } catch {
    return false;
  }
}
