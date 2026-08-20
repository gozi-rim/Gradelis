import { redirect } from "next/navigation";

import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth-guard";
import { getReviewQueue } from "@/lib/queries/review-queue";
import { ResolveFileCard } from "@/features/review-queue/components/resolve-file-card";
import { ResolveRowControls } from "@/features/review-queue/components/resolve-row-controls";

export const dynamic = "force-dynamic";

const ROW_LABELS: Record<string, string> = {
  UNMATCHED_STUDENT: "Unknown student",
  DUPLICATE: "Duplicate",
  INVALID_SCORE: "Bad score",
  GRADE_MISMATCH: "Grade clash",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function HodPendingReviewsPage() {
  const guard = await requireRole(UserRole.HOD);
  if (!guard.ok) redirect("/auth/login");

  const queue = await getReviewQueue();

  const openFiles = queue.flatMap((b) => b.files);
  const openRows = openFiles.flatMap((f) => f.rows);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Batches waiting", queue.length, "bg-[#dbe8ff]"],
          ["Files flagged", openFiles.filter((f) => f.status !== "VALID").length, "bg-[#fff3dc]"],
          ["Rows flagged", openRows.length, "bg-[#def7ea]"],
        ].map(([title, value, dot]) => (
          <article key={String(title)} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`size-8 rounded-full ${dot}`} />
              <div>
                <p className="text-sm text-slate-400">{title}</p>
                <p className="text-4xl font-semibold text-slate-800">{value}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {queue.length === 0 ? (
        <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-700">Nothing is waiting.</p>
          <p className="mt-1 text-sm text-slate-400">
            Every uploaded result has either been imported or already settled.
          </p>
        </section>
      ) : null}

      {queue.map((batch) => (
        <section key={batch.id} className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-700">
              {batch.uploadedBy.name}
            </h3>
            <p className="text-sm text-slate-400">{formatDate(batch.uploadedAt)}</p>
          </div>

          {batch.files.map((file) => (
            <div key={file.id} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-slate-700">{file.fileName}</p>
                <p className="text-sm text-slate-400">
                  {file.matchedCourse
                    ? `${file.matchedCourse.code} — ${file.matchedCourse.title}`
                    : `Course code on sheet: ${file.raw.courseCode || "(blank)"}`}
                  {" · "}
                  {file.raw.session} · {file.raw.semester} · {file.totalRows} rows
                </p>
              </div>

              {file.status === "UNMATCHED_COURSE" || file.status === "FAILED" ? (
                <ResolveFileCard file={file} />
              ) : null}

              {file.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="px-2 py-2">MATRIC</th>
                        <th className="px-2 py-2">SCORE</th>
                        <th className="px-2 py-2">SHEET GRADE</th>
                        <th className="px-2 py-2">PROBLEM</th>
                        <th className="px-2 py-2">RESOLVE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {file.rows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100 align-top text-slate-600">
                          <td className="px-2 py-3 font-medium">{row.matricNumberRaw}</td>
                          <td className="px-2 py-3">{row.score ?? "—"}</td>
                          <td className="px-2 py-3">{row.gradeRaw ?? "—"}</td>
                          <td className="px-2 py-3">
                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs text-orange-600">
                              {ROW_LABELS[row.status] ?? row.status}
                            </span>
                            <p className="mt-1 max-w-md text-xs text-slate-400">
                              {row.errorMessage}
                            </p>
                          </td>
                          <td className="px-2 py-3 min-w-[420px]">
                            <ResolveRowControls
                              row={row}
                              courseKnown={file.matchedCourse !== null}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
