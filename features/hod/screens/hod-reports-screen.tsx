import { CheckCircleIcon, XCircleIcon } from "@/shared/icons/ui-icons";

import { PortalShell } from "@/features/portal/components/portal-shell";

export function HodReportsScreen() {
  return (
    <PortalShell title="Report" role="hod" showProgramSelect={false}>
      <div className="space-y-6">
        <section className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="space-y-2 text-sm text-slate-500">
            <span>Academic Set</span>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-700"><option>U2018</option></select>
          </label>
          <label className="space-y-2 text-sm text-slate-500">
            <span>Current Session</span>
            <input readOnly value="2025/2026" className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-700" />
          </label>
          <label className="space-y-2 text-sm text-slate-500">
            <span>Student Status</span>
            <select className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-700"><option>All Statuses</option></select>
          </label>
          <div className="self-end">
            <button type="button" className="h-11 rounded-lg bg-[#2e63e5] px-8 text-sm font-semibold text-white">Download</button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-4xl font-semibold text-slate-800">Eligible Students</h3>
                <p className="mt-3 text-6xl font-semibold text-[#57c4b4]">140</p>
                <p className="mt-3 text-lg text-slate-400">Are Eligible to Graduate</p>
                <button type="button" className="mt-4 h-11 rounded-lg border border-slate-300 px-5 text-base text-slate-700">View Eligible List</button>
              </div>
              <CheckCircleIcon className="size-14 text-[#35c679]" />
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-4xl font-semibold text-slate-800">Not Eligible Students</h3>
                <p className="mt-3 text-6xl font-semibold text-[#ff3d3d]">55</p>
                <p className="mt-3 text-lg text-slate-400">Are Not Eligible to Graduate</p>
                <button type="button" className="mt-4 h-11 rounded-lg border border-slate-300 px-5 text-base text-slate-700">View Not Eligible List</button>
              </div>
              <XCircleIcon className="size-14 text-[#ff3d3d]" />
            </div>
          </article>
        </section>

        <section className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm lg:grid-cols-2">
          <article className="space-y-6 lg:border-r lg:border-slate-200 lg:pr-8">
            <h3 className="text-4xl font-semibold text-slate-700">Not Eligible (Summary)</h3>
            <div className="space-y-4 text-lg">
              {[
                ["Outstanding Courses", 23, "45%"],
                ["Low CGPA", 12, "18%"],
                ["Failed Courses", 25, "62%"],
              ].map(([label, value, width]) => (
                <div key={label as string} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
                  <p>{label as string}</p>
                  <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-[#ff6f0f]" style={{ width: width as string }} /></div>
                  <span>{value as number}</span>
                </div>
              ))}
            </div>
          </article>

          <article>
            <h3 className="text-4xl font-semibold text-slate-700">Result Preview</h3>
            <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="grid size-56 place-items-center rounded-full" style={{ background: "conic-gradient(#57c4b4 0 55%, #ff7c16 55% 100%)" }}>
                <div className="grid size-36 place-items-center rounded-full bg-white text-center"><p className="text-5xl font-semibold text-slate-800">255</p><p className="text-lg text-slate-400">Total Students</p></div>
              </div>

              <div className="space-y-4 text-lg">
                <p className="flex items-center gap-3"><span className="size-3 rounded-full bg-[#57c4b4]" />Eligible (140)</p>
                <p className="flex items-center gap-3"><span className="size-3 rounded-full bg-[#ffb04d]" />Not Eligible(114)</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </PortalShell>
  );
}
