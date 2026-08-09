import Link from "next/link";

import { HodSessionBadge } from "@/features/hod/components/session-badge";
import { PortalShell } from "@/app/_components/portal-shell";

export function HodCorrectionRequestScreen() {
  return (
    <PortalShell title="Pending Reviews" role="hod" showProgramSelect={false} rightSlot={<HodSessionBadge />}>
      <div className="mx-auto mt-6 max-w-4xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <form className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700">Correction details</p>
          </div>

          <label className="block space-y-2 text-sm text-slate-500">
            <span>Reason category</span>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-700">
              <option>Select a reason</option>
            </select>
          </label>

          <label className="block space-y-2 text-sm text-slate-500">
            <span>Describe the required correction</span>
            <textarea
              rows={6}
              placeholder="Example: Correct the duplicate entries and re-upload the result file."
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-700"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-500">
            <span>Attach issue report (optional)</span>
            <div className="grid h-24 place-items-center rounded-lg border border-dashed border-[#c8d9f5] text-slate-400">
              Drop file here or browse
            </div>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link href="/hod/pending-reviews/submission" className="inline-flex h-10 min-w-28 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm text-slate-600">Cancel</Link>
            <button type="button" className="h-10 rounded-lg bg-[#ffb04d] px-7 text-sm font-semibold text-white">Send for Correction</button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
