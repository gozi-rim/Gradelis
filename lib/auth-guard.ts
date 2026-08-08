// lib/auth-guard.ts
import { auth } from "@/auth"

export async function requireRole(allowed: string[]) {
  const session = await auth()
  if (!session?.user || !allowed.includes(session.user.role as string)) {
    throw new Error("Forbidden")
  }
  return session
}
