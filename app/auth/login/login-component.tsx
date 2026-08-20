"use client"

import { FormState, login } from "@/lib/actions/login"
import { cn } from "@/shared/lib/cn"
import { LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"

const initialState: FormState = {}

export default function LoginFormComponent() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(login, initialState)

  useEffect(() => {
    if (state.message === "success") {
      router.push("/")
      router.refresh()
    }
  }, [state.message, router])

  return <form action={formAction} className="space-y-3.5 pt-1">
    {state.message && state.message !== "success" && (
      <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {state.message}
      </p>
    )}
    <label className="block space-y-1.5 text-sm font-semibold text-slate-800 sm:text-base">
      <span>Email</span>
      <input
        type="text"
        name="email"
        placeholder="Enter your email"
        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#2e63e5]"
      />
      {state.errors?.email && <p className="text-sm text-red-400 mt-1"> {state.errors?.email[0]}</p>}
    </label>

    <label className="block space-y-1.5 text-sm font-semibold text-slate-800 sm:text-base">
      <span>Password</span>
      <input
        type="password"
        name="password"
        placeholder="Enter your password"
        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#2e63e5]"
      />
      {state.errors?.password && <p className="text-sm text-red-400 mt-1">{state.errors?.password[0]}</p>}
    </label>

    <div className="flex items-center justify-end text-sm">

      <Link href="#" className="font-semibold text-[#2e63e5]">
        Forgot password?
      </Link>
    </div>

    <button
      type="submit"
      disabled={pending}
      className={cn("h-11 w-full rounded-xl bg-[#2e63e5] text-lg font-semibold text-white transition hover:cursor-pointer hover:bg-[#2456cf]", pending && "bg-blue-600 hover:bg-blue-600")}
    >
      {pending ? <p className="flex gap-1 items-center justify-center">Submitting <LoaderCircle className="animate-spin" /></p> : "Sign In"}
    </button>





    <div className="rounded-xl border border-slate-200 bg-slate-50 mt-10 px-4 py-3 text-left">
      <p className="text-base font-semibold text-slate-700">
        Secure role-based login
      </p>
      <p className="text-sm leading-5 text-slate-500">
        Your dashboard is selected automatically from your account
        role.
      </p>
    </div>
  </form>

}
