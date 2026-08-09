import Link from "next/link";

import { HodSessionBadge } from "@/features/hod/components/session-badge";
import { PortalShell } from "@/app/_components/portal-shell";

const rows = [
  ["U2021/3020020", "Adebayo, John", "ECE 402", "18", "62", "80", "A", "3"],
  ["U2021/3020021", "Muhammad, Ali", "ECE 402", "15", "55", "70", "B", "3"],
  ["U2021/3020022", "Daniel, James", "ECE 402", "12", "48", "60", "C", "3"],
  ["U2021/3020023", "Bello, Ahmed", "ECE 402", "17", "58", "75", "B", "3"],
] as const;

export function HodPendingReviewSubmissionScreen() {
  return (
    <PortalShell title="Pending Reviews" role="hod" showProgramSelect={false} rightSlot={<HodSessionBadge />}>
      <div className="space-y-5">
        <Link href="/hod/pending-reviews" className="text-sm text-[#2e63e5]">← Back to Pending Reviews</Link>

        <section className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <p>File Name <span className="ml-2 font-medium text-slate-700">ECE_402_Results.xlsx</span></p>
          <p>Course Adviser <span className="ml-2 font-medium text-slate-700">Dr. A. Okafor</span></p>
          <p>Level <span className="ml-2 font-medium text-slate-700">400 Level</span></p>
          <p>Session <span className="ml-2 font-medium text-slate-700">2024/2025</span></p>
          <p>Submitted Records <span className="ml-2 font-medium text-slate-700">68</span></p>
          <p className="sm:col-span-2">Date Submitted <span className="ml-2 font-medium text-slate-700">18 May 2025, 10:45 AM</span></p>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap gap-6 border-b border-slate-200 text-sm">
            <button type="button" className="border-b-2 border-[#2e63e5] pb-2 font-medium text-[#2e63e5]">Preview Data</button>
            <button type="button" className="pb-2 text-slate-500">Validation Summary</button>
            <button type="button" className="pb-2 text-slate-500">Issue Details</button>
          </div>

          <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="px-2 py-2">MATRIC NO.</th>
                    <th className="px-2 py-2">STUDENT NAME</th>
                    <th className="px-2 py-2">COURSE</th>
                    <th className="px-2 py-2">CA</th>
                    <th className="px-2 py-2">EXAM</th>
                    <th className="px-2 py-2">TOTAL</th>
                    <th className="px-2 py-2">GRADE</th>
                    <th className="px-2 py-2">CREDIT</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row[0]} className="border-t border-slate-100 text-slate-600">
                      {row.map((cell) => (
                        <td key={cell} className="px-2 py-4">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/hod/pending-reviews/correction" className="rounded-xl border border-orange-400 px-5 py-2 text-sm font-semibold text-orange-500">Request Correction</Link>
          <button type="button" className="rounded-xl border border-red-300 px-5 py-2 text-sm font-semibold text-red-500">Reject Submission</button>
          <Link href="/hod/pending-reviews/approve" className="rounded-xl bg-[#57c4b4] px-5 py-2 text-sm font-semibold text-white">Approve Submission</Link>
        </div>
      </div>
    </PortalShell>
  );
}
