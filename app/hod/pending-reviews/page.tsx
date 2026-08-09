import Link from "next/link";

import { HodSessionBadge } from "@/features/hod/components/session-badge";
import { PortalShell } from "@/app/_components/portal-shell";

const rows = [
  ["Dr. A. Okafor", "400", "2024/2025", "ECE_402_Results.xlsx", "68", "18 May, 10:45 AM"],
  ["Dr. L. Abdul", "500", "2024/2025", "ECE_504_Results.xlsx", "72", "18 May, 09:12 AM"],
  ["Dr. M. Yusuf", "200", "2024/2025", "ECE_204_Results.xlsx", "54", "17 May, 04:30 PM"],
  ["Dr. A.Okafor", "400", "2024/2025", "ECE_404_Results.xlsx", "60", "17 May, 03:15 PM"],
] as const;

export default function HodPendingReviewsPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        {[
          ["Total Pending", "8", "bg-[#dbe8ff]"],
          ["Pending Today", "4", "bg-[#fff3dc]"],
          ["Total Records", "524", "bg-[#def7ea]"],
        ].map(([title, value, dot]) => (
          <article key={title} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`size-8 rounded-full ${dot}`} />
              <div>
                <p className="text-sm text-slate-400">{title}</p>
                <p className="text-4xl font-semibold text-slate-800">{value}</p>
              </div>
            </div>
          </article>
        ))}
        <div className="self-center justify-self-start lg:justify-self-end">
          <button type="button" className="h-10 rounded-lg border border-[#3a70ec] px-5 text-sm text-[#3a70ec]">All levels</button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-base font-medium text-slate-600">Submissions Awaiting Review</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-2">ADVISER</th>
                <th className="px-2 py-2">LEVEL</th>
                <th className="px-2 py-2">SESSION</th>
                <th className="px-2 py-2">FILE NAME</th>
                <th className="px-2 py-2">RECORDS</th>
                <th className="px-2 py-2">DATE SUBMITTED</th>
                <th className="px-2 py-2">STATUS</th>
                <th className="px-2 py-2">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row[0]}-${idx}`} className="border-t border-slate-100 text-slate-600">
                  {row.map((cell) => (
                    <td key={cell} className="px-2 py-4">{cell}</td>
                  ))}
                  <td className="px-2 py-4"><span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-500">Pending</span></td>
                  <td className="px-2 py-4"><Link href="/hod/pending-reviews/submission" className="rounded-lg border border-[#bfd7ff] bg-[#edf4ff] px-4 py-1.5 text-sm text-[#2e63e5]">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
