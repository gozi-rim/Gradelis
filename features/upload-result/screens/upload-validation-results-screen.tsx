import { PortalShell } from "@/app/_components/portal-shell";
import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { UploadStepper } from "@/features/upload-result/components/upload-stepper";

const steps = [
  { label: "Upload File", order: 1, status: "upcoming" as const },
  { label: "Preview Data", order: 2, status: "complete" as const },
  { label: "Validation", order: 3, status: "complete" as const },
  { label: "Confirm and Submit", order: 4, status: "upcoming" as const },
];

export function UploadValidationResultsScreen() {
  return (
    <PortalShell title="Upload Results">
      <div className="space-y-8">
        <section>
          <h2 className="text-5xl font-semibold text-slate-700">Validation Results</h2>
          <div className="mt-6">
            <UploadStepper steps={steps} />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Students", "140", "text-slate-700"],
            ["Result Recorded", "138", "text-slate-700"],
            ["Valid", "138", "text-[#57c4b4]"],
            ["Issues", "2", "text-[#ff3d3d]"],
          ].map(([title, value, color]) => (
            <article key={title} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xl font-semibold text-slate-400">{title}</p>
              <p className={`mt-3 text-4xl font-semibold ${color}`}>{value}</p>
            </article>
          ))}
        </section>

        <UploadSectionCard>
          <h3 className="text-3xl font-semibold text-slate-700">Issues</h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-4 py-3">Mat no</th>
                  <th className="px-4 py-3">Student name</th>
                  <th className="px-4 py-3 text-[#ff3d3d]">Issue</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3">U2021/3020035</td>
                  <td className="px-4 py-3">Charles Joel</td>
                  <td className="px-4 py-3">Missing results</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">U2021/3020035</td>
                  <td className="px-4 py-3">Charles Joel</td>
                  <td className="px-4 py-3">Missing results</td>
                </tr>
              </tbody>
            </table>
          </div>
        </UploadSectionCard>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <button type="button" className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]">Cancel</button>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]">Download Report</button>
            <button type="button" className="h-12 rounded-xl bg-[#2e63e5] px-8 text-lg font-semibold text-white">Proceed to Confirm</button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
