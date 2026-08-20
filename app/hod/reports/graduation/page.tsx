import Link from "next/link";
import { redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth-guard";
import { listEntrySessions, listGraduationRuns } from "@/lib/queries/graduation";
import { StartRunPanel } from "@/features/graduation/components/start-run-panel";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-600",
  RUNNING: "bg-amber-50 text-amber-600",
  FAILED: "bg-red-50 text-red-500",
  PENDING: "bg-slate-100 text-slate-500",
};

export default async function GraduationReportsPage() {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) redirect("/auth/login");

  const [sessions, runs] = await Promise.all([listEntrySessions(), listGraduationRuns()]);

  return (
    <div className="space-y-6">
      <StartRunPanel sessions={sessions} />

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-2xl font-semibold text-slate-700">Past runs</h3>

        {runs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No evaluation has been run yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-2">COHORT</th>
                  <th className="px-2 py-2">STUDENTS</th>
                  <th className="px-2 py-2">TRIGGERED BY</th>
                  <th className="px-2 py-2">WHEN</th>
                  <th className="px-2 py-2">STATUS</th>
                  <th className="px-2 py-2">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t border-slate-100 text-slate-600">
                    <td className="px-2 py-3 font-medium">{run.academicSession}</td>
                    <td className="px-2 py-3">{run._count.items}</td>
                    <td className="px-2 py-3">{run.triggeredBy.name}</td>
                    <td className="px-2 py-3">
                      {new Intl.DateTimeFormat("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(run.createdAt)}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          STATUS_STYLE[run.status] ?? "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      {run.status === "COMPLETED" ? (
                        <Link
                          href={`/hod/reports/graduation/${run.id}`}
                          className="rounded-lg border border-[#bad4ff] bg-[#eaf2ff] px-4 py-1.5 text-[#2e63e5]"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
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
