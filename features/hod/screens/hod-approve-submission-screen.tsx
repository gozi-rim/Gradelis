import Link from "next/link";

import { HodSessionBadge } from "@/features/hod/components/session-badge";
import { PortalShell } from "@/features/portal/components/portal-shell";

export function HodApproveSubmissionScreen() {
  return (
    <PortalShell title="Pending Reviews" role="hod" showProgramSelect={false} rightSlot={<HodSessionBadge />}>
      <div className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <div className="text-center">
          <span className="mx-auto inline-grid size-16 place-items-center rounded-full bg-green-100 text-4xl text-green-500">✓</span>
          <h2 className="mt-4 text-4xl font-semibold text-slate-800">Approve this submission?</h2>
          <p className="mt-2 text-slate-500">Once approved, the records will be locked and Recorded.</p>
        </div>

        <dl className="mt-6 rounded-2xl border border-slate-200 bg-[#f8fbff] p-5 text-sm text-slate-600 sm:grid sm:grid-cols-2 sm:gap-3">
          <div className="flex justify-between sm:block"><dt>File Name</dt><dd className="font-medium text-slate-800">ECE_402_Results.xlsx</dd></div>
          <div className="flex justify-between sm:block"><dt>Level</dt><dd className="font-medium text-slate-800">400 Level</dd></div>
          <div className="flex justify-between sm:block"><dt>Course Adviser</dt><dd className="font-medium text-slate-800">Dr. A. Okafor</dd></div>
          <div className="flex justify-between sm:block"><dt>Valid Records</dt><dd className="font-medium text-slate-800">68</dd></div>
          <div className="flex justify-between sm:block"><dt>Issues Found</dt><dd className="font-medium text-slate-800">0</dd></div>
        </dl>

        <label className="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <input type="checkbox" defaultChecked className="size-4" />
          I have reviewed the records and confirm this approval.
        </label>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/hod/pending-reviews/submission" className="inline-flex h-11 min-w-32 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm text-slate-600">Cancel</Link>
          <Link href="/hod/pending-reviews/approved" className="inline-flex h-11 min-w-40 items-center justify-center rounded-xl bg-[#57c4b4] px-5 text-sm font-semibold text-white">Yes, Approve</Link>
        </div>
      </div>
    </PortalShell>
  );
}
