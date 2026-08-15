"use server"
import { signIn, } from "@/auth"
import { AuthError } from "next-auth"
import { loginSchema } from "../zod/schema"
import z from "zod"
import { Prisma } from "@/generated/prisma"

export type FormState = {
  errors?: Record<string, string[]>
  message?: string
}

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error)
    return { message: "Please fix the errors below", errors: flattened.fieldErrors }
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirect: false, // <- key change: no redirectTo here
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { message: "Invalid email or password" }
        default:
          return { message: "Authentication error. Please try again." }
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return { message: "Can't reach the database right now. Try again shortly." }
    }

    console.error("Unexpected login error:", error)
    return { message: "Unexpected server error. Please try again." }
  }

  return { message: "success" }
}
