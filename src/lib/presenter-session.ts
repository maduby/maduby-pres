import { SignJWT, jwtVerify } from "jose";

export const PRESENTER_COOKIE_NAME = "fhgr_presenter";

export async function signPresenterSession(secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ role: "presenter" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyPresenterSession(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const key = new TextEncoder().encode(secret);
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}
