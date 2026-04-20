import type { NextRequest } from "next/server";
import {
  PRESENTER_COOKIE_NAME,
  verifyPresenterSession,
} from "@/lib/presenter-session";

export async function isPresenterAuthorized(
  request: NextRequest,
  secret: string,
): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const token = request.cookies.get(PRESENTER_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyPresenterSession(token, secret);
}
