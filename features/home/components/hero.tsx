import Link from "next/link";

import { Container } from "@/shared/ui/container";

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 text-left">
          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-medium tracking-wide text-indigo-700">
            School Project Frontend
          </span>

          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Pixel-perfect, responsive school portal UI built with Next.js
          </h1>

          <p className="text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            This is the base implementation and architecture. Share your design screenshots,
            and we’ll recreate each screen faithfully for both mobile and desktop.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="#screens"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              View prepared structure
            </Link>
            <Link
              href="#next-steps"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              See next steps
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
