import Link from "next/link";

import { HodSessionBadge } from "@/features/hod/components/session-badge";
import { PortalShell } from "@/features/portal/components/portal-shell";

export function HodApprovedSuccessScreen() {
  return (
    <PortalShell title="Pending Reviews" role="hod" showProgramSelect={false} rightSlot={<HodSessionBadge />}>
      <div className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <div className="text-center">
          <span className="mx-auto inline-grid size-16 place-items-center rounded-full bg-green-100 text-4xl text-green-500">✓</span>
          <h2 className="mt-4 text-4xl font-semibold text-slate-800">Submission Approved</h2>
          <p className="mt-2 text-slate-500">The records are now locked and available for graduation eligibility processing.</p>
        </div>

        <dl className="mt-6 rounded-2xl border border-slate-200 bg-[#f8fbff] p-5 text-sm text-slate-600 sm:grid sm:grid-cols-2 sm:gap-3">
          <div className="flex justify-between sm:block"><dt>File Name</dt><dd className="font-medium text-slate-800">ECE_402_Results.xlsx</dd></div>
          <div className="flex justify-between sm:block"><dt>Course Adviser</dt><dd className="font-medium text-slate-800">Dr. A. Okafor</dd></div>
          <div className="flex justify-between sm:block"><dt>Approved Records</dt><dd className="font-medium text-slate-800">68</dd></div>
          <div className="flex justify-between sm:block"><dt>Approved By</dt><dd className="font-medium text-slate-800">Dr. Ibrahim Musa</dd></div>
          <div className="flex justify-between sm:block"><dt>Date Approved</dt><dd className="font-medium text-slate-800">18 May 2025, 02:30 PM</dd></div>
          <div className="flex justify-between sm:block"><dt>Status</dt><dd><span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-600">Approved</span></dd></div>
        </dl>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/hod/pending-reviews/submission" className="inline-flex h-11 min-w-36 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm text-slate-600">View Submission</Link>
          <Link href="/hod/reports" className="inline-flex h-11 min-w-36 items-center justify-center rounded-xl bg-[#2e63e5] px-5 text-sm font-semibold text-white">Go to Reports</Link>
        </div>
      </div>
    </PortalShell>
  );
}
