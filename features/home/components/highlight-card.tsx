import type { ReactNode } from "react";

type HighlightCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function HighlightCard({ title, description, icon }: HighlightCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 sm:p-6">
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </article>
  );
}
