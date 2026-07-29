import { PortalShell } from "@/features/portal/components/portal-shell";
import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { UploadStepper } from "@/features/upload-result/components/upload-stepper";

const steps = [
  { label: "Upload File", order: 1, status: "upcoming" as const },
  { label: "Preview Data", order: 2, status: "current" as const },
  { label: "Validation", order: 3, status: "upcoming" as const },
  { label: "Confirm and Submit", order: 4, status: "upcoming" as const },
];

const rows = [
  ["U2021/3020001", "87", "A", "25", "25"],
  ["U2021/3020002", "77", "A", "30", "30"],
  ["U2021/3020003", "67", "B", "25", "25"],
  ["U2021/3020004", "77", "A", "27", "27"],
  ["U2021/3020005", "89", "A", "29", "29"],
  ["U2021/3020006", "75", "A", "28", "28"],
  ["U2021/3020007", "56", "C", "18", "18"],
  ["U2021/3020008", "63", "B", "20", "20"],
  ["U2021/3020009", "87", "A", "21", "21"],
] as const;

export function UploadPreviewScreen() {
  return (
    <PortalShell title="Upload Results">
      <div className="space-y-8">
        <section>
          <h2 className="text-5xl font-semibold text-slate-700">File Preview</h2>
          <div className="mt-2 flex flex-wrap gap-8 text-2xl text-slate-500">
            <p>
              File name : <span className="font-semibold">ECE_503.1_Results_xlsx</span>
            </p>
            <p>
              Session : <span className="font-semibold">2025/2026</span>
            </p>
          </div>
          <div className="mt-6">
            <UploadStepper steps={steps} />
          </div>
        </section>

        <UploadSectionCard>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-4 py-3">Matriculation number</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">CA</th>
                  <th className="px-4 py-3">Exam</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[0]} className="border-b border-slate-100 text-slate-500">
                    {row.map((cell) => (
                      <td key={cell} className="px-4 py-2.5">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </UploadSectionCard>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <button type="button" className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]">Cancel</button>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]">Go back</button>
            <button type="button" className="h-12 rounded-xl bg-[#2e63e5] px-8 text-lg font-semibold text-white">Proceed to validation</button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
