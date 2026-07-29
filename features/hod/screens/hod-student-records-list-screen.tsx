import Link from "next/link";

import { PortalShell } from "@/features/portal/components/portal-shell";

const students = [
  ["U2018/3020001", "John Adebayo", "U2018", "Graduated", "2023/2024", "3.42", "None"],
  ["U2018/3020002", "Ali Muhammad", "U2018", "Not Graduated", "—", "2.45", "ECE 402"],
  ["U2018/3020003", "Daniel James", "U2018", "Carried Forward", "—", "2.30", "ECE 406, GST 302"],
] as const;

export function HodStudentRecordsListScreen() {
  return (
    <PortalShell title="Student records" role="hod" showProgramSelect={false}>
      <div className="space-y-5">
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
            <button type="button" className="h-11 rounded-lg bg-[#2e63e5] px-9 text-sm font-semibold text-white">Apply</button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Students", "126", "text-[#2e63e5]"],
            ["Graduated", "102", "text-[#1d9f4f]"],
            ["Not Graduated", "18", "text-[#ff3d3d]"],
            ["Carried Forward", "6", "text-[#ff9900]"],
          ].map(([title, value, color]) => (
            <article key={title} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-400">{title}</p>
              <p className={`mt-2 text-4xl font-semibold ${color}`}>{value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-base font-medium text-slate-600">U2018 Set Records</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Matric No.</th>
                  <th className="px-3 py-3">Student Name</th>
                  <th className="px-3 py-3">Admission Set</th>
                  <th className="px-3 py-3">Current Status</th>
                  <th className="px-3 py-3">Graduation Year</th>
                  <th className="px-3 py-3">CGPA</th>
                  <th className="px-3 py-3">Outstanding</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student[0]} className="border-t border-slate-100 text-sm text-slate-600">
                    {student.map((cell, idx) => (
                      <td key={`${student[0]}-${idx}`} className="px-3 py-4">{cell}</td>
                    ))}
                    <td className="px-3 py-4">
                      <Link href="/hod/student-records/u2018-3020002" className="inline-flex h-9 items-center rounded-lg border border-[#bfd7ff] bg-[#edf4ff] px-4 text-sm text-[#2e63e5]">View Record</Link>
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
