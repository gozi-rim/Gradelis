import { PortalShell } from "@/app/_components/portal-shell";
import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { UploadStepper } from "@/features/upload-result/components/upload-stepper";

const steps = [
  { label: "Upload File", order: 1, status: "upcoming" as const },
  { label: "Preview Data", order: 2, status: "complete" as const },
  { label: "Validation", order: 3, status: "current" as const },
  { label: "Confirm and Submit", order: 4, status: "upcoming" as const },
];

const checks = [
  ["Checking required columns", "done"],
  ["Validating Matric numbers", "done"],
  ["Validating Scores", "done"],
  ["Checking Duplicates", "active"],
  ["Finalizing validation", "idle"],
] as const;

export function UploadValidationProgressScreen() {
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
          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="text-4xl font-semibold text-slate-700">Validation in Progress</h3>
              <div
                className="mx-auto mt-6 grid size-56 place-items-center rounded-full"
                style={{
                  background: "conic-gradient(#2e63e5 0 72%, #e5e7eb 72% 100%)",
                }}
              >
                <div className="grid size-44 place-items-center rounded-full bg-white text-5xl font-semibold text-slate-700">
                  72%
                </div>
              </div>
              <p className="mt-6 text-center text-2xl text-slate-400">Validating records please wait...</p>
            </div>

            <ul className="space-y-5 border-l border-slate-200 pl-8 text-xl">
              {checks.map(([label, status]) => (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`size-3 rounded-full ${status === "done" ? "bg-[#57c4b4]" : status === "active" ? "bg-[#2e63e5]" : "bg-slate-400"}`}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </UploadSectionCard>

        <section>
          <h3 className="text-4xl font-semibold text-slate-700">Validation Results (so far)</h3>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_2fr]">
            <article className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-500">Total Records</p>
              <p className="mt-3 text-4xl font-semibold text-slate-700">138</p>
            </article>
            <article className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-xl font-semibold text-[#57c4b4]">Valid</p>
              <p className="mt-3 text-4xl font-semibold text-[#57c4b4]">138</p>
            </article>
            <article className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-xl font-semibold text-[#ff3d3d]">Missing Mat no</p>
              <p className="mt-3 text-4xl font-semibold text-[#ff3d3d]">2</p>
            </article>
            <article className="rounded-2xl bg-[#d6e9ff] p-5 text-center text-[#2e63e5] shadow-sm">
              <p className="text-lg font-semibold">ⓘ Do not close validation in progress</p>
            </article>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
