import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/admin", "/hod", "/lecturer"];

export const proxy = auth((req) => {
  const isProtected = protectedPrefixes.some((p) =>
    req.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/hod/:path*", "/lecturer/:path*"],
};
