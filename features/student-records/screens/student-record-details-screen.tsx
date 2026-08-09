import { PortalShell } from "@/app/_components/portal-shell";

export function StudentRecordDetailsScreen() {
  return (
    <PortalShell title="Student records">
      <div className="space-y-5">
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded-full bg-blue-100 text-3xl font-semibold text-[#2e63e5]">
                AM
              </div>
              <div>
                <p className="font-semibold text-slate-700">Ali Muhammad</p>
                <p className="text-sm text-slate-500">U2021/302003 · Electrical / Electronic Engineering</p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-3">
              <p>
                Admission Set
                <span className="mt-1 block text-slate-700">U2021</span>
              </p>
              <p>
                Current Session
                <span className="mt-1 block text-slate-700">2025/2026</span>
              </p>
              <p>
                <span className="inline-flex rounded-full bg-orange-50 px-5 py-1 text-orange-500">Active</span>
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <button type="button" className="font-medium text-[#2e63e5]">Academic History</button>
            <button type="button" className="text-slate-500">Outstanding Issues</button>
            <button type="button" className="text-slate-500">Eligibility</button>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-500">
            Academic Session
            <select className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-700">
              <option>2023/2024</option>
            </select>
          </label>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-medium text-slate-700">Course Results — 2023/2024</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="py-2">Course</th>
                    <th className="py-2">Title</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Grade</th>
                    <th className="py-2">Credit</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr className="border-t border-slate-100">
                    <td className="py-4">ECE 402</td>
                    <td className="py-4">Digital Electronics</td>
                    <td className="py-4">38</td>
                    <td className="py-4">F</td>
                    <td className="py-4">3</td>
                    <td className="py-4">Outstanding</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="py-4">ECE 404</td>
                    <td className="py-4">Control Systems</td>
                    <td className="py-4">62</td>
                    <td className="py-4">B</td>
                    <td className="py-4">3</td>
                    <td className="py-4">Passed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-medium text-slate-700">Record Summary</h3>
            <dl className="mt-5 space-y-5 text-sm text-slate-500">
              <div className="flex items-center justify-between"><dt>CGPA</dt><dd className="text-slate-700">2.45</dd></div>
              <div className="flex items-center justify-between"><dt>Credits Earned</dt><dd className="text-slate-700">148 / 160</dd></div>
              <div className="flex items-center justify-between"><dt>Outstanding Courses</dt><dd className="text-slate-700">1</dd></div>
              <div className="flex items-center justify-between"><dt>Eligibility Status</dt><dd className="text-slate-700">Not Eligible</dd></div>
              <div className="flex items-center justify-between"><dt>Original Set</dt><dd className="text-slate-700">U2021</dd></div>
              <div className="flex items-center justify-between"><dt>Current Status</dt><dd className="text-slate-700">Carried Forward</dd></div>
            </dl>
            <button type="button" className="mt-8 h-11 w-full rounded-xl bg-[#2e63e5] text-sm font-semibold text-white">Download Full Record</button>
          </article>
        </section>
      </div>
    </PortalShell>
  );
}
