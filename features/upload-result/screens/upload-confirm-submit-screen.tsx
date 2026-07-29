import { PortalShell } from "@/features/portal/components/portal-shell";
import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { UploadStepper } from "@/features/upload-result/components/upload-stepper";

const steps = [
  { label: "Upload file", order: 1, status: "complete" as const },
  { label: "Validation", order: 2, status: "complete" as const },
  { label: "Preview Data", order: 3, status: "complete" as const },
  { label: "Confirm and Submit", order: 4, status: "current" as const },
];

export function UploadConfirmSubmitScreen() {
  return (
    <PortalShell title="Upload Results">
      <div className="space-y-8">
        <section>
          <h2 className="text-5xl font-semibold text-slate-700">Validation in Progress</h2>
          <div className="mt-6">
            <UploadStepper steps={steps} />
          </div>
        </section>

        <UploadSectionCard>
          <h3 className="text-5xl font-semibold text-slate-700">Submission Summary</h3>

          <dl className="mt-8 grid gap-y-6 text-2xl sm:grid-cols-2 sm:gap-x-16">
            <div className="space-y-1">
              <dt className="font-semibold text-slate-500">File name</dt>
              <dd className="font-semibold text-slate-700">ECE_503.1_Results_xlsx</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-semibold text-slate-500">Session</dt>
              <dd className="font-semibold text-slate-700">2025/2026</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-semibold text-slate-500">Results Recorded</dt>
              <dd className="font-semibold text-slate-700">138</dd>
            </div>
            <div className="space-y-1">
              <dt className="font-semibold text-slate-500">Issues Found</dt>
              <dd className="font-semibold text-slate-700">2</dd>
            </div>
          </dl>

          <div className="mt-8 rounded-xl bg-[#d9f6f0] px-6 py-4 text-center text-[#57c4b4]">
            <p className="text-lg font-semibold">ⓘ Once Submitted, The HOD will be notified for review</p>
          </div>
        </UploadSectionCard>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <button type="button" className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]">Cancel</button>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]">Back to Dashboard</button>
            <button type="button" className="h-12 rounded-xl bg-[#2e63e5] px-12 text-lg font-semibold text-white">Submit</button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
