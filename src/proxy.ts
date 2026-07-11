import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isApi = pathname.startsWith("/api");
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isAuthApi || isPublic) {
    return NextResponse.next();
  }

  if (!req.auth) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.jpg|uploads).*)"],
};
