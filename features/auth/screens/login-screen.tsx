import Link from "next/link";

import { UserOutlineIcon } from "@/shared/icons/ui-icons";

const highlights = [
  {
    icon: "🛡️",
    title: "Secure",
    text: "Role-based access and protection",
  },
  {
    icon: "🎯",
    title: "Accurate",
    text: "Reliable validation and record keeping",
  },
  {
    icon: "⚡",
    title: "Efficient",
    text: "Fast approval and report generation",
  },
] as const;

export function LoginScreen() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:grid-cols-[1fr_1fr]">
        <section className="hidden bg-[#162b4c] px-8 py-8 text-white lg:flex lg:flex-col lg:justify-between xl:px-12 xl:py-10">
          <div className="mx-auto mt-2 max-w-md text-center">
            <div className="text-5xl">🎓</div>
            <h1 className="mt-3 text-[clamp(2.3rem,3.4vw,3.6rem)] font-semibold tracking-tight">
              GradElis
            </h1>
            <p className="mt-1 text-[clamp(1.35rem,1.75vw,2rem)] font-medium text-slate-100">
              Graduation Eligibility System
            </p>
            <span className="mx-auto mt-4 block h-1 w-12 rounded-full bg-[#2f66e8]" />
            <p className="mt-5 text-[clamp(1rem,1.2vw,1.2rem)] leading-7 text-slate-200">
              A centralized platform for managing, validating, and preserving
              student records.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-3 xl:grid-cols-3">
              {highlights.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-white/5 bg-white/5 p-3.5 backdrop-blur-sm"
                >
                  <span className="text-2xl" aria-hidden>
                    {item.icon}
                  </span>
                  <h2 className="mt-1.5 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-0.5 text-sm leading-5 text-slate-300">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>

            <p className="text-sm text-slate-300">
              © 2026 Graduation Eligibility System
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12 lg:py-8">
          <div className="w-full max-w-[520px] space-y-4">
            <div className="space-y-2 text-center">
              <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-blue-50 text-[#2e63e5]">
                <UserOutlineIcon className="size-8" />
              </div>
              <h2 className="text-[clamp(1.8rem,2.4vw,2.5rem)] font-semibold text-slate-800">
                Welcome Back
              </h2>
              <p className="text-[clamp(.95rem,1.1vw,1.2rem)] text-slate-500">
                Sign in to access the Graduation Eligibility System
              </p>
            </div>

            <form action="/dashboard" className="space-y-3.5 pt-1">
              <label className="block space-y-1.5 text-sm font-semibold text-slate-800 sm:text-base">
                <span>Username / Email</span>
                <input
                  type="text"
                  placeholder="Enter your email or username"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#2e63e5]"
                />
              </label>

              <label className="block space-y-1.5 text-sm font-semibold text-slate-800 sm:text-base">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#2e63e5]"
                />
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-500">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-slate-300"
                  />
                  Remember me
                </label>
                <Link href="#" className="font-semibold text-[#2e63e5]">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="h-11 w-full rounded-xl bg-[#2e63e5] text-lg font-semibold text-white transition hover:bg-[#2456cf]"
              >
                Sign In
              </button>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="h-px flex-1 bg-slate-200" />
                or
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white text-base font-semibold text-[#1f3f7d]"
              >
                Sign in with Google
              </button>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <p className="text-base font-semibold text-slate-700">
                  Secure role-based login
                </p>
                <p className="text-sm leading-5 text-slate-500">
                  Your dashboard is selected automatically from your account
                  role.
                </p>
              </div>
            </form>

            <p className="pt-1 text-center text-sm text-slate-400 sm:text-base">
              Need an account? Contact the System Administrator
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
