// proxy.ts
import { NextResponse } from "next/server"
import { roleRoutes, routeAccess } from "./types/roleRoutes"
import NextAuth from "next-auth"
import { authConfig } from "./auth.config"



const protectedPrefixes = Object.keys(routeAccess)

export default NextAuth(authConfig).auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role as string | undefined

  const isAuthRoute = nextUrl.pathname.startsWith("/auth/login")
  const isRoot = nextUrl.pathname === "/"
  const matchedPrefix = protectedPrefixes.find((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  )

  // root: send to login if logged out, or straight to their dashboard if logged in
  if (isRoot) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(roleRoutes[role ?? ""] ?? "/auth/login", nextUrl.origin))
    }
    return NextResponse.redirect(new URL("/auth/login", nextUrl.origin))
  }

  // hitting a protected route while logged out
  if (matchedPrefix && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // logged in, trying to revisit login
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(roleRoutes[role ?? ""] ?? "/auth/login", nextUrl.origin))
  }


  // logged in, but wrong role for this specific route tree
  if (matchedPrefix && isLoggedIn && !routeAccess[matchedPrefix].includes(role ?? "")) {

    return NextResponse.redirect(new URL(roleRoutes[role ?? ""] ?? "/auth/login", nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
