// app/page.tsx
import { auth } from "@/auth"
import { roleRoutes } from "@/types/roleRoutes"
import { redirect } from "next/navigation"


export default async function RootPage() {
  const session = await auth()

  if (session?.user?.role) {
    redirect(roleRoutes[session.user.role] ?? "/auth/login")
  }

  redirect("/auth/login")
}