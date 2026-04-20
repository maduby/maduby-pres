import { type NextRequest, NextResponse } from "next/server";
import {
  PRESENTER_COOKIE_NAME,
  verifyPresenterSession,
} from "@/lib/presenter-session";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/present/login")) {
    return NextResponse.next();
  }

  const secret = process.env.PRESENTER_SECRET;
  if (!secret) {
    return new NextResponse("Presenter not configured", { status: 503 });
  }

  const token = request.cookies.get(PRESENTER_COOKIE_NAME)?.value;
  if (!token || !(await verifyPresenterSession(token, secret))) {
    const url = request.nextUrl.clone();
    url.pathname = "/present/login";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/present", "/present/:path*"],
};
