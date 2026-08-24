"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useAdviserStore } from "@/features/adviser/store/adviser-store";
import {
  getAdviserGraduationReport,
  AdviserGraduationReportData,
} from "@/lib/actions/adviser";
import {
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  StudentsIcon,
  XCircleIcon,
} from "@/shared/icons/ui-icons";

export function AdviserGraduationReportScreen() {
  const { selectedSet } = useAdviserStore();
  const [report, setReport] = useState<AdviserGraduationReportData | null>(null);
  const [viewTable, setViewTable] = useState<"none" | "eligible" | "notEligible">("none");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getAdviserGraduationReport(selectedSet);
      setReport(data);
    });
  }, [selectedSet]);

  const handleDownloadReport = () => {
    if (!report) return;

    const csvHeader = "Matric Number,Student Name,Admission Set,CGPA,Class of Degree / Status,Eligibility,Deficiency Remarks\n";
    
    const eligibleRows = report.eligibleList.map(
      (s) =>
        `"${s.matricNumber}","${s.fullName}","${report.set}",${s.cgpa.toFixed(2)},"${s.classOfDegree}","Eligible","Cleared for Degree Award"`
    );

    const notEligibleRows = report.notEligibleList.map(
      (s) =>
        `"${s.matricNumber}","${s.fullName}","${report.set}",${s.cgpa.toFixed(2)},"Not Cleared","Not Eligible","${s.reason}"`
    );

    const allRows = [...eligibleRows, ...notEligibleRows].join("\n");
    const blob = new Blob([csvHeader + allRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${report.set}_Graduation_Clearance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isGraduating = report?.isGraduatingSet ?? false;
  const eligiblePercentage = report?.eligiblePercentage ?? 0;
  const notEligiblePercentage = report?.notEligiblePercentage ?? 100;

  const conicStyle = isGraduating
    ? `conic-gradient(#57c4b4 0 ${eligiblePercentage}%, #ff3d3d ${eligiblePercentage}% 100%)`
    : `conic-gradient(#2e63e5 0 85%, #ffb04d 85% 100%)`;

  return (
    <div className="space-y-7">
      {/* Top Header & Actions */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Graduation Clearance Report
          </h2>
          <p className="text-sm text-slate-500">
            Official degree eligibility and deficiency analysis for the{" "}
            <span className="font-semibold text-slate-700">{selectedSet}</span> set
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm">
            <span className="mr-2 size-2 rounded-full bg-[#2e63e5]" />
            {selectedSet} Report
          </div>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={!report || isPending}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2e63e5] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2552c2] disabled:opacity-50"
          >
            <DownloadIcon className="size-4" />
            Download Report (CSV)
          </button>
        </div>
      </section>

      {/* In-Progress Notification for Non-Graduating Sets */}
      {!isGraduating && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5">
          <div className="flex items-start gap-3.5">
            <ClockIcon className="size-6 text-[#2e63e5] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-800">
                Cohort Still In Study ({selectedSet} · Pre-Graduation Stage)
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Eligible students count is <strong>0</strong> because students have not yet reached final year / completed their 5-year curriculum. Full graduation clearance will run automatically once 500L results are finalized.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Eligible vs Not Eligible KPI Cards */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Eligible Students</h3>
              <p className="mt-3 text-5xl font-bold text-[#57c4b4]">
                {isPending ? "..." : report?.eligibleCount ?? 0}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {isGraduating
                  ? "Are cleared and eligible to graduate"
                  : "0 (Students have not finished stay in school)"}
              </p>
              {isGraduating && (
                <button
                  type="button"
                  onClick={() =>
                    setViewTable(viewTable === "eligible" ? "none" : "eligible")
                  }
                  className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  {viewTable === "eligible" ? "Hide List" : "View Eligible List"}
                </button>
              )}
            </div>
            <div className="grid size-14 place-items-center rounded-2xl bg-emerald-50">
              <CheckCircleIcon className="size-8 text-[#35c679]" />
            </div>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {isGraduating ? "Not Eligible Students" : "In Progress & Deficiencies"}
              </h3>
              <p className="mt-3 text-5xl font-bold text-[#ff3d3d]">
                {isPending ? "..." : report?.notEligibleCount ?? 0}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {isGraduating
                  ? "Students with outstanding courses or low CGPA"
                  : "Students taking active courses or having carryovers"}
              </p>
              <button
                type="button"
                onClick={() =>
                  setViewTable(viewTable === "notEligible" ? "none" : "notEligible")
                }
                className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                {viewTable === "notEligible" ? "Hide List" : "View Deficiencies List"}
              </button>
            </div>
            <div className="grid size-14 place-items-center rounded-2xl bg-red-50">
              <XCircleIcon className="size-8 text-[#ff3d3d]" />
            </div>
          </div>
        </article>
      </section>

      {/* Interactive Tables on Click */}
      {viewTable === "eligible" && report && (
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-emerald-800">
              Eligible Students Roster ({report.eligibleList.length} Students)
            </h3>
            <button
              onClick={() => setViewTable("none")}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-3">Matric No.</th>
                  <th className="px-3 py-3">Student Name</th>
                  <th className="px-3 py-3">CGPA</th>
                  <th className="px-3 py-3">Class of Degree</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.eligibleList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3.5 font-mono font-medium text-slate-800">
                      {s.matricNumber}
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-slate-800">
                      {s.fullName}
                    </td>
                    <td className="px-3 py-3.5 font-bold text-emerald-600">
                      {s.cgpa.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">
                      {s.classOfDegree}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        Cleared
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <Link
                        href={`/adviser/student-records/${s.id}`}
                        className="text-xs font-semibold text-[#2e63e5] hover:underline"
                      >
                        View Transcript →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewTable === "notEligible" && report && (
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-red-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-red-800">
              Students with Deficiencies ({report.notEligibleList.length} Students)
            </h3>
            <button
              onClick={() => setViewTable("none")}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-3">Matric No.</th>
                  <th className="px-3 py-3">Student Name</th>
                  <th className="px-3 py-3">CGPA</th>
                  <th className="px-3 py-3">Primary Reason / Issue</th>
                  <th className="px-3 py-3">Failed Courses</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.notEligibleList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3.5 font-mono font-medium text-slate-800">
                      {s.matricNumber}
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-slate-800">
                      {s.fullName}
                    </td>
                    <td className="px-3 py-3.5 font-bold text-slate-700">
                      {s.cgpa.toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-red-600 font-medium">
                      {s.reason}
                    </td>
                    <td className="px-3 py-3.5">
                      {s.outstandingCourses.length > 0 ? (
                        <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-200">
                          {s.outstandingCourses.join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <Link
                        href={`/adviser/student-records/${s.id}`}
                        className="text-xs font-semibold text-[#2e63e5] hover:underline"
                      >
                        View Transcript →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Deficiency Summary & Result Preview */}
      <section className="grid gap-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 lg:grid-cols-2">
        {/* Left: Deficiency Reasons Breakdown */}
        <article className="space-y-6 lg:pr-6 lg:border-r lg:border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Deficiencies Summary
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of academic obstacles preventing clearance
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Outstanding / Incomplete Courses
                </span>
                <span className="font-bold text-slate-800">
                  {report?.reasonsBreakdown.outstandingCourses.count ?? 14} (
                  {report?.reasonsBreakdown.outstandingCourses.percentage ?? 45}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-[#ff7c16] transition-all duration-500"
                  style={{
                    width: `${report?.reasonsBreakdown.outstandingCourses.percentage ?? 45}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Low CGPA (Below 1.50 Cutoff)
                </span>
                <span className="font-bold text-slate-800">
                  {report?.reasonsBreakdown.lowCgpa.count ?? 4} (
                  {report?.reasonsBreakdown.lowCgpa.percentage ?? 18}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-[#ff3d3d] transition-all duration-500"
                  style={{
                    width: `${report?.reasonsBreakdown.lowCgpa.percentage ?? 18}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Multiple Failed Core Courses
                </span>
                <span className="font-bold text-slate-800">
                  {report?.reasonsBreakdown.failedCourses.count ?? 10} (
                  {report?.reasonsBreakdown.failedCourses.percentage ?? 37}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-[#e11d48] transition-all duration-500"
                  style={{
                    width: `${report?.reasonsBreakdown.failedCourses.percentage ?? 37}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </article>

        {/* Right: Result Preview Chart */}
        <article className="flex flex-col justify-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Clearance Distribution Preview
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Overall set distribution
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div
              className="relative grid size-52 shrink-0 place-items-center rounded-full shadow-inner transition-all duration-500"
              style={{
                background: conicStyle,
              }}
            >
              <div className="grid size-36 place-items-center rounded-full bg-white text-center shadow-md">
                <div>
                  <p className="text-3xl font-bold text-slate-800">
                    {report?.totalStudents ?? 140}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    Total Students
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3.5 text-sm">
              {isGraduating ? (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 px-3.5 py-2">
                    <span className="flex items-center gap-2.5 font-semibold text-emerald-800">
                      <span className="size-3 rounded-full bg-[#57c4b4]" />
                      Eligible to Graduate
                    </span>
                    <span className="font-bold text-emerald-900">
                      {report?.eligibleCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-red-50/60 px-3.5 py-2">
                    <span className="flex items-center gap-2.5 font-semibold text-red-800">
                      <span className="size-3 rounded-full bg-[#ff3d3d]" />
                      Not Eligible
                    </span>
                    <span className="font-bold text-red-900">
                      {report?.notEligibleCount ?? 0}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50/60 px-3.5 py-2">
                    <span className="flex items-center gap-2.5 font-semibold text-[#2e63e5]">
                      <span className="size-3 rounded-full bg-[#2e63e5]" />
                      Active / In Progress
                    </span>
                    <span className="font-bold text-slate-800">
                      {(report?.totalStudents ?? 140) - (report?.pendingReviewCount ?? 10)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3.5 py-2">
                    <span className="flex items-center gap-2.5 font-semibold text-amber-800">
                      <span className="size-3 rounded-full bg-[#ffb04d]" />
                      Pending Reviews
                    </span>
                    <span className="font-bold text-amber-900">
                      {report?.pendingReviewCount ?? 10}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
