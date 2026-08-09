import { RoleViewToggle } from "@/features/hod/components/role-view-toggle";
import {
  CheckCircleIcon,
  ClockIcon,
  ExcelFileIcon,
  StudentsIcon,
  XCircleIcon,
} from "@/shared/icons/ui-icons";

const stats = [
  {
    title: "Total students",
    value: "140",
    meta: "View students",
    icon: StudentsIcon,
    color: "text-[#2e63e5]",
  },
  {
    title: "Eligible Students",
    value: "111",
    meta: "79.29% of total",
    icon: CheckCircleIcon,
    color: "text-[#35c679]",
  },
  {
    title: "Not Eligible Students",
    value: "19",
    meta: "13% of total",
    icon: XCircleIcon,
    color: "text-[#ff3d3d]",
  },
  {
    title: "Pending review",
    value: "10",
    meta: "7% of total",
    icon: ClockIcon,
    color: "text-[#ff9900]",
  },
] as const;

const uploads = [
  "2025_2026_First_semester.xlsx",
  "2025_2026_First_semester.xlsx",
  "2025_2026_First_semester.xlsx",
] as const;

export default function DashboardScreen() {
  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-4xl font-semibold text-slate-700">
          Welcome back, Dr Victor Odoi
        </h2>
        <RoleViewToggle />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.title}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-[28px] font-semibold text-slate-900">
                  {stat.value}
                </p>
                <Icon className={`size-7 ${stat.color}`} />
              </div>
              <p className="mt-2 text-base font-medium text-slate-700">
                {stat.title}
              </p>
              <p className="mt-4 text-sm text-slate-400">{stat.meta}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_.75fr]">
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-700">
            Eligibility Overview
          </h3>
          <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div
              className="grid size-56 place-items-center rounded-full"
              style={{
                background:
                  "conic-gradient(#57c4b4 0 79%, #ff3d3d 79% 92%, #ffb04d 92% 100%)",
              }}
            >
              <div className="grid size-36 place-items-center rounded-full bg-white text-xl font-semibold text-slate-700">
                79%
              </div>
            </div>

            <div className="space-y-4 pt-3 text-base">
              <p className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-[#57c4b4]" />
                Eligible
              </p>
              <p className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-[#ffb04d]" />
                Pending review
              </p>
              <p className="flex items-center gap-3">
                <span className="size-3 rounded-full bg-[#ff3d3d]" />
                Not Eligible
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-700">
            Recent Uploads
          </h3>
          <div className="mt-5 space-y-3">
            {uploads.map((upload, idx) => (
              <div
                key={`${upload}-${idx}`}
                className="flex items-center gap-3 border-b border-slate-100 pb-3"
              >
                <ExcelFileIcon className="size-9" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {upload}
                  </p>
                  <p className="text-xs text-slate-400">
                    Uploaded 24th May 2026
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold text-slate-700">
            Issues summary
          </h3>
          <div className="mt-6 space-y-4 text-sm">
            <p className="flex items-center justify-between border-b border-slate-100 pb-2 text-slate-600">
              Failed courses{" "}
              <span className="rounded bg-red-100 px-3 py-0.5 text-red-500">
                6
              </span>
            </p>
            <p className="flex items-center justify-between border-b border-slate-100 pb-2 text-slate-600">
              Missing courses{" "}
              <span className="rounded bg-amber-100 px-3 py-0.5 text-amber-500">
                6
              </span>
            </p>
            <p className="flex items-center justify-between border-b border-slate-100 pb-2 text-slate-600">
              Missing Results{" "}
              <span className="rounded bg-blue-100 px-3 py-0.5 text-blue-500">
                6
              </span>
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
