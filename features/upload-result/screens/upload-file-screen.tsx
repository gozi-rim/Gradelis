import { PortalShell } from "@/features/portal/components/portal-shell";
import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { UploadStepper } from "@/features/upload-result/components/upload-stepper";
import { CloudUploadIcon, ExcelFileIcon } from "@/shared/icons/ui-icons";

const steps = [
  { label: "Upload File", order: 1, status: "current" as const },
  { label: "Preview Data", order: 2, status: "upcoming" as const },
  { label: "Validation", order: 3, status: "upcoming" as const },
  { label: "Confirm and Submit", order: 4, status: "upcoming" as const },
];

export function UploadFileScreen() {
  return (
    <PortalShell title="Upload Results">
      <div className="space-y-8">
        <section>
          <h2 className="text-5xl font-semibold text-slate-700">Upload Excel File</h2>
          <p className="mt-2 text-lg text-slate-400">Upload Excel file containing student results</p>
          <div className="mt-6">
            <UploadStepper steps={steps} />
          </div>
        </section>

        <UploadSectionCard>
          <div className="rounded-xl border border-slate-200 p-8 text-center sm:p-16">
            <CloudUploadIcon className="mx-auto size-12 text-[#2e63e5]" />
            <p className="mt-5 text-3xl font-medium text-slate-600">Drag and drop your Excel file here</p>
            <p className="mt-3 text-3xl text-slate-500">Or</p>
            <button
              type="button"
              className="mt-6 h-12 rounded-xl bg-[#2e63e5] px-8 text-lg font-semibold text-white"
            >
              Choose File
            </button>
            <p className="mt-4 text-lg text-slate-400">Only Xlsx and xls files are allowed</p>
          </div>
        </UploadSectionCard>

        <section>
          <h3 className="text-4xl font-semibold text-slate-700">Recent Uploads</h3>
          <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-6 py-4">File name</th>
                  <th className="px-6 py-4">Date Uploaded</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["2025_2026_First_semester.xlsx", "27th May 2026", "Pending Approval"],
                  ["2025_2026_First_semester.xlsx", "31st October 2025", "Approved"],
                  ["2025_2026_First_semester.xlsx", "4th March 2025", "Approved"],
                ].map(([name, date, status], idx) => (
                  <tr key={`${name}-${idx}`} className="border-b border-slate-100">
                    <td className="flex items-center gap-2 px-6 py-4 text-slate-700">
                      <ExcelFileIcon className="size-8" />
                      {name}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{date}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <span className={`size-2.5 rounded-full ${status === "Approved" ? "bg-[#57c4b4]" : "bg-[#ffb04d]"}`} />
                        {status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
