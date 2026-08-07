"use server"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export type FormState = {
  errors?: Record<string, string[]>
  message?: string
}

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { message: "Email and password are required" }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
    return { message: "success" }
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid email or password" }
    }
    throw error
  }
}
