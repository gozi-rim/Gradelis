import Link from "next/link";

import { HodUserChip } from "@/features/hod/components/hod-user-chip";
import { RoleViewToggle } from "@/features/hod/components/role-view-toggle";
import { PortalShell } from "@/features/portal/components/portal-shell";

const topStats = [
  ["Total Submissions", "25", "text-slate-800"],
  ["Pending Reviews", "8", "text-[#ff9800]"],
  ["Approved", "14", "text-[#18a558]"],
  ["Rejected", "3", "text-[#ff4d4d]"],
  ["Students in Department", "324", "text-[#6b4fe8]"],
  ["Final Year Eligible Graduates", "71.99%", "text-[#1e93da]"],
] as const;

const pendingRows = [
  ["Dr. A. Okafor", "400", "68", "18 May 2025"],
  ["Dr. L. Abdul", "300", "72", "17 May 2025"],
  ["Dr. M. Yusuf", "200", "54", "17 May 2025"],
  ["Dr. A. Okafor", "400", "68", "16 May 2025"],
] as const;

export function HodDashboardScreen() {
  return (
    <PortalShell title="HOD Dashboard" role="hod" showProgramSelect={false} rightSlot={<HodUserChip />}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-slate-800">Welcome back, Dr. Ibrahim Musa</h2>
            <p className="text-slate-500">Here is what needs your attention today.</p>
          </div>
          <RoleViewToggle />
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {topStats.map(([title, value, color]) => (
            <article key={title} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-400">{title}</p>
              <p className={`mt-2 text-4xl font-semibold ${color}`}>{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.7fr_.8fr]">
          <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-3xl font-semibold text-slate-800">Pending Submissions for Review</h3>
              <Link href="/hod/pending-reviews" className="text-sm font-semibold text-[#2e63e5]">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="px-2 py-2">COURSE ADVISER</th>
                    <th className="px-2 py-2">LEVEL</th>
                    <th className="px-2 py-2">RECORDS</th>
                    <th className="px-2 py-2">DATE</th>
                    <th className="px-2 py-2">STATUS</th>
                    <th className="px-2 py-2">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map((row, idx) => (
                    <tr key={`${row[0]}-${idx}`} className="border-t border-slate-100 text-slate-600">
                      <td className="px-2 py-3">{row[0]}</td>
                      <td className="px-2 py-3">{row[1]}</td>
                      <td className="px-2 py-3">{row[2]}</td>
                      <td className="px-2 py-3">{row[3]}</td>
                      <td className="px-2 py-3"><span className="rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-500">Pending</span></td>
                      <td className="px-2 py-3"><Link href="/hod/pending-reviews/submission" className="rounded-lg border border-[#bad4ff] bg-[#eaf2ff] px-4 py-1.5 text-sm text-[#2e63e5]">Review</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="space-y-4">
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-slate-800">Submission Overview</h3>
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div
                  className="grid size-44 place-items-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#22c55e 0 56%, #f59e0b 56% 88%, #ef4444 88% 100%)",
                  }}
                >
                  <div className="grid size-28 place-items-center rounded-full bg-white text-4xl font-semibold">25</div>
                </div>
                <div className="space-y-3 pt-2 text-sm">
                  <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#22c55e]" />14 Approved</p>
                  <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#f59e0b]" />8 Pending</p>
                  <p className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#ef4444]" />3 Rejected</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-slate-800">Quick Actions</h3>
              <div className="mt-4 space-y-2.5 text-sm">
                <Link href="/hod/pending-reviews" className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><p className="font-semibold">Review Pending Submissions</p><p className="text-slate-500">8 submissions awaiting review</p></Link>
                <Link href="/hod/reports" className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><p className="font-semibold">Generate Graduation Report</p><p className="text-slate-500">Create eligibility reports</p></Link>
                <Link href="/hod/student-records" className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><p className="font-semibold">View Eligible Students</p><p className="text-slate-500">324 students ready to graduate</p></Link>
                <Link href="/hod/reports" className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><p className="font-semibold">Export Reports</p><p className="text-slate-500">Download Excel or PDF reports</p></Link>
              </div>
            </article>
          </div>
        </section>

        <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-3xl font-semibold text-slate-800">Recently Reviewed</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-2">ADVISER</th>
                  <th className="px-2 py-2">LEVEL</th>
                  <th className="px-2 py-2">DECISION</th>
                  <th className="px-2 py-2">DATE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 text-slate-600">
                  <td className="px-2 py-3">Dr. A. Okafor</td>
                  <td className="px-2 py-3">300</td>
                  <td className="px-2 py-3"><span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-600">Approved</span></td>
                  <td className="px-2 py-3">18 May 2025</td>
                </tr>
                <tr className="border-t border-slate-100 text-slate-600">
                  <td className="px-2 py-3">Dr. K. Bello</td>
                  <td className="px-2 py-3">400</td>
                  <td className="px-2 py-3"><span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-500">Rejected</span></td>
                  <td className="px-2 py-3">17 May 2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </PortalShell>
  );
}
