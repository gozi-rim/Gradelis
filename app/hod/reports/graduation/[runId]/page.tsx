import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth-guard";
import { getGraduationRun } from "@/lib/queries/graduation";

export const dynamic = "force-dynamic";

export default async function GraduationRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) redirect("/auth/login");

  const { runId } = await params;
  const run = await getGraduationRun(runId);
  if (!run) notFound();

  const policy = (run.policy ?? null) as { minCgpa?: number; minCreditUnits?: number } | null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-slate-800">
              Cohort {run.academicSession}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Run by {run.triggeredBy.name}
              {run.completedAt
                ? ` · completed ${new Intl.DateTimeFormat("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(run.completedAt)}`
                : null}
            </p>
          </div>
          <Link href="/hod/reports/graduation" className="text-sm font-semibold text-[#2e63e5]">
            All runs
          </Link>
        </div>

        {policy ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Judged against a minimum CGPA of {policy.minCgpa?.toFixed(2)} and{" "}
            {policy.minCreditUnits} credit units. These are the rules as they stood
            when this run happened.
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Evaluated", run.items.length, "text-slate-800"],
            ["Eligible", run.eligible.length, "text-[#18a558]"],
            ["Pending", run.pending.length, "text-[#ff9800]"],
          ].map(([label, value, color]) => (
            <article key={String(label)} className="rounded-xl border border-slate-100 p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className={`mt-1 text-4xl font-semibold ${color}`}>{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-2xl font-semibold text-[#18a558]">
          Eligible to graduate ({run.eligible.length})
        </h3>
        {run.eligible.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nobody cleared every rule.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-2">MATRIC</th>
                  <th className="px-2 py-2">NAME</th>
                  <th className="px-2 py-2">CGPA</th>
                </tr>
              </thead>
              <tbody>
                {run.eligible.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 text-slate-600">
                    <td className="px-2 py-3 font-medium">{item.student.matricNumber}</td>
                    <td className="px-2 py-3">{item.student.fullName}</td>
                    <td className="px-2 py-3">{item.cgpa.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-2xl font-semibold text-[#ff9800]">
          Pending ({run.pending.length})
        </h3>
        {run.pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Nothing outstanding.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-2">MATRIC</th>
                  <th className="px-2 py-2">NAME</th>
                  <th className="px-2 py-2">CGPA</th>
                  <th className="px-2 py-2">WHY NOT</th>
                </tr>
              </thead>
              <tbody>
                {run.pending.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 align-top text-slate-600">
                    <td className="px-2 py-3 font-medium">{item.student.matricNumber}</td>
                    <td className="px-2 py-3">{item.student.fullName}</td>
                    <td className="px-2 py-3">{item.cgpa.toFixed(2)}</td>
                    <td className="px-2 py-3">
                      <ul className="space-y-1">
                        {item.remarks.map((remark) => (
                          <li key={remark.rule} className="text-sm text-slate-500">
                            • {remark.message}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
