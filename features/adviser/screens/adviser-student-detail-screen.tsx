"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { getAdviserStudentDetail, StudentDetail } from "@/lib/actions/adviser";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@/shared/icons/ui-icons";

type StudentDetailScreenProps = {
  studentId: string;
};

export function AdviserStudentDetailScreen({ studentId }: StudentDetailScreenProps) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "issues" | "eligibility">("history");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | "ALL">("ALL");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getAdviserStudentDetail(studentId);
      setStudent(data);
    });
  }, [studentId]);

  if (isPending && !student) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="size-10 animate-spin rounded-full border-4 border-[#2e63e5] border-t-transparent mx-auto" />
          <p className="mt-4 text-sm font-medium text-slate-500">Loading student transcript...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-800">Student Record Not Found</p>
        <p className="mt-2 text-sm text-slate-500">The requested student ID does not match any records.</p>
        <Link
          href="/adviser/student-records"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#2e63e5] px-6 text-sm font-semibold text-white"
        >
          ← Return to Student Records
        </Link>
      </div>
    );
  }

  const initials = student.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredResults =
    selectedLevelFilter === "ALL"
      ? student.results
      : student.results.filter((r) => r.level === selectedLevelFilter);

  // Download Transcript handler
  const handleDownloadTranscript = () => {
    const csvHeader = "Level,Semester,Session,Course Code,Course Title,Credit Units,Score,Grade,Grade Point,Status\n";
    const csvRows = student.results
      .map(
        (r) =>
          `${r.level}L,${r.semester},${r.session},"${r.courseCode}","${r.courseTitle}",${r.creditUnits},${r.score},${r.grade},${r.gradePoint},${r.status}`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${student.matricNumber.replace(/\//g, "_")}_Transcript.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/adviser/student-records"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2e63e5] transition"
        >
          ← Back to Student Records
        </Link>
      </div>

      {/* Student Profile Header Card */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="grid size-16 place-items-center rounded-2xl bg-blue-100 text-2xl font-bold text-[#2e63e5] shadow-inner">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{student.fullName}</h2>
              <p className="text-sm text-slate-500">
                <span className="font-mono font-semibold text-slate-700">{student.matricNumber}</span> · {student.department}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Admission Set</p>
              <p className="mt-0.5 font-bold text-slate-800">{student.admissionSet}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Current Level</p>
              <p className="mt-0.5 font-bold text-slate-800">{student.currentLevel} Level</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-slate-400">Academic Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-0.5 text-xs font-bold ${
                  student.status === "Graduated"
                    ? "bg-emerald-100 text-emerald-700"
                    : student.outstandingCourses.length > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-[#2e63e5]"
                }`}
              >
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs & Academic Session Filter */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === "history"
                ? "bg-[#2e63e5] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Academic History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("issues")}
            className={`rounded-xl px-4 py-2 transition flex items-center gap-1.5 ${
              activeTab === "issues"
                ? "bg-[#2e63e5] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Outstanding Issues
            {student.outstandingCourses.length > 0 && (
              <span
                className={`size-2 rounded-full ${
                  activeTab === "issues" ? "bg-white" : "bg-red-500"
                }`}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("eligibility")}
            className={`rounded-xl px-4 py-2 transition ${
              activeTab === "eligibility"
                ? "bg-[#2e63e5] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Graduation Eligibility
          </button>
        </div>

        {activeTab === "history" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Level:</span>
            <select
              value={selectedLevelFilter}
              onChange={(e) =>
                setSelectedLevelFilter(
                  e.target.value === "ALL" ? "ALL" : parseInt(e.target.value)
                )
              }
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-[#2e63e5] focus:outline-none"
            >
              <option value="ALL">All Levels (100L - 500L)</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="500">500 Level</option>
            </select>
          </div>
        )}
      </section>

      {/* Main Content Area + Record Summary Sidebar */}
      <section className="grid gap-6 xl:grid-cols-[1.85fr_1fr]">
        {/* Tab 1: Academic History */}
        {activeTab === "history" && (
          <article className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Course Results Progression
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed semester score breakdown ({filteredResults.length} courses)
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-2">Course</th>
                    <th className="py-3 px-2">Title</th>
                    <th className="py-3 px-2 text-center">Units</th>
                    <th className="py-3 px-2 text-center">Score</th>
                    <th className="py-3 px-2 text-center">Grade</th>
                    <th className="py-3 px-2 text-center">GP</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result, idx) => (
                    <tr
                      key={`${result.courseCode}-${idx}`}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3 px-2 font-mono font-semibold text-slate-800">
                        {result.courseCode}
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {result.courseTitle}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-600">
                        {result.creditUnits}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-800">
                        {result.score}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`font-bold ${
                            result.grade === "A"
                              ? "text-emerald-600"
                              : result.grade === "B"
                              ? "text-blue-600"
                              : result.grade === "C"
                              ? "text-slate-700"
                              : result.grade === "D"
                              ? "text-amber-600"
                              : "text-red-500"
                          }`}
                        >
                          {result.grade}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-xs text-slate-500">
                        {result.gradePoint.toFixed(1)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            result.status === "Passed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {/* Tab 2: Outstanding Issues */}
        {activeTab === "issues" && (
          <article className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">
              Outstanding Deficiencies & Course Issues
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Issues preventing unconditional academic clearance
            </p>

            <div className="mt-5 space-y-4">
              {student.eligibilityIssues.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800">
                  <CheckCircleIcon className="size-8 text-emerald-600 mx-auto" />
                  <p className="mt-2 font-bold">No Academic Issues Found</p>
                  <p className="text-xs mt-0.5">This student is in good academic standing.</p>
                </div>
              ) : (
                student.eligibilityIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 rounded-xl border border-red-200 bg-red-50/60 p-4"
                  >
                    <XCircleIcon className="size-6 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-900">
                        {issue.type === "FAILED_COURSE"
                          ? `Failed Prerequisite: ${issue.courseCode}`
                          : issue.type === "LOW_CGPA"
                          ? "CGPA Below Academic Standard"
                          : "Course Registration Deficiency"}
                      </p>
                      <p className="mt-1 text-xs text-red-700">{issue.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        )}

        {/* Tab 3: Eligibility Status */}
        {activeTab === "eligibility" && (
          <article className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 space-y-5">
            <h3 className="text-lg font-bold text-slate-800">
              Graduation Clearance Evaluation
            </h3>
            <p className="text-xs text-slate-400">
              Verification criteria for degree award
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  {student.creditsEarned >= student.creditsRequired ? (
                    <CheckCircleIcon className="size-5 text-emerald-600" />
                  ) : (
                    <ClockIcon className="size-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Credit Units Requirement</p>
                    <p className="text-xs text-slate-400">Minimum {student.creditsRequired} units required</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {student.creditsEarned} / {student.creditsRequired} Units
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  {student.outstandingCourses.length === 0 ? (
                    <CheckCircleIcon className="size-5 text-emerald-600" />
                  ) : (
                    <XCircleIcon className="size-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Compulsory Courses Clearance</p>
                    <p className="text-xs text-slate-400">All core departmental courses passed</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {student.outstandingCourses.length === 0
                    ? "Cleared"
                    : `${student.outstandingCourses.length} Failed`}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  {student.cgpa >= 1.5 ? (
                    <CheckCircleIcon className="size-5 text-emerald-600" />
                  ) : (
                    <XCircleIcon className="size-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">CGPA Threshold (&gt;= 1.50)</p>
                    <p className="text-xs text-slate-400">Current CGPA: {student.cgpa.toFixed(2)}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {student.cgpa >= 1.5 ? "Passed" : "Below Minimum"}
                </span>
              </div>
            </div>
          </article>
        )}

        {/* Sidebar: Record Summary */}
        <article className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Record Summary</h3>
          <p className="text-xs text-slate-400 mt-0.5">Cumulative metrics</p>

          <dl className="mt-5 space-y-4 text-sm divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-3">
              <dt className="text-slate-500">Cumulative GPA (CGPA)</dt>
              <dd className="text-base font-bold text-[#2e63e5]">{student.cgpa.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between pt-3">
              <dt className="text-slate-500">Credits Earned</dt>
              <dd className="font-semibold text-slate-800">
                {student.creditsEarned} / {student.creditsRequired}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-3">
              <dt className="text-slate-500">Outstanding Courses</dt>
              <dd className="font-semibold text-red-500">{student.outstandingCourses.length}</dd>
            </div>
            <div className="flex items-center justify-between pt-3">
              <dt className="text-slate-500">Eligibility Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    student.eligibilityStatus === "Eligible"
                      ? "bg-emerald-100 text-emerald-700"
                      : student.eligibilityStatus === "In Progress"
                      ? "bg-blue-100 text-[#2e63e5]"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {student.eligibilityStatus}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between pt-3">
              <dt className="text-slate-500">Original Set</dt>
              <dd className="font-semibold text-slate-800">{student.admissionSet}</dd>
            </div>
            <div className="flex items-center justify-between pt-3">
              <dt className="text-slate-500">Current Status</dt>
              <dd className="font-semibold text-slate-800">{student.status}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleDownloadTranscript}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e63e5] text-sm font-semibold text-white shadow-sm transition hover:bg-[#2552c2]"
          >
            Download Full Record (CSV)
          </button>
        </article>
      </section>
    </div>
  );
}
