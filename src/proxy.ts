import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [/^\/dashboard(?:\/|$)/, /^\/forms(?:\/|$)/, /^\/users(?:\/|$)/, /^\/roles(?:\/|$)/, /^\/profile(?:\/|$)/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api")) return NextResponse.next();

  const hasSession = request.cookies.has("access_token") || request.cookies.has("refresh_token");
  const isProtected = PROTECTED.some((pattern) => pattern.test(pathname));

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (pathname === "/signin" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/dashboard" : "/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
