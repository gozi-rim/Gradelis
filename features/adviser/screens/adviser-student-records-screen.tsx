"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useAdviserStore } from "@/features/adviser/store/adviser-store";
import { getAdviserStudents, StudentDetail } from "@/lib/actions/adviser";
import { SearchIcon, StudentsIcon } from "@/shared/icons/ui-icons";

export function AdviserStudentRecordsScreen() {
  const { selectedSet } = useAdviserStore();
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchStudents = () => {
    startTransition(async () => {
      const res = await getAdviserStudents({
        set: selectedSet,
        status: statusFilter,
        search: searchQuery,
      });
      if (res.success) {
        setStudents(res.students);
      }
    });
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedSet, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const totalCount = students.length;
  const graduatedCount = students.filter((s) => s.status === "Graduated").length;
  const activeCount = students.filter((s) => s.status === "Active").length;
  const carryoverCount = students.filter(
    (s) => s.status === "Carried Forward" || s.outstandingCourses.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Student Records — {selectedSet} Set
          </h2>
          <p className="text-sm text-slate-500">
            Cohort roster and comprehensive academic performance records
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search matric no or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-64 rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#2e63e5] focus:outline-none focus:ring-2 focus:ring-[#2e63e5]/20"
            />
            <SearchIcon className="absolute left-3 top-3.5 size-4 text-slate-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm focus:border-[#2e63e5] focus:outline-none"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Graduated">Graduated</option>
            <option value="Carried Forward">Carried Forward</option>
            <option value="Eligible">Eligible</option>
            <option value="Not Eligible">Not Eligible</option>
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl bg-[#2e63e5] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2552c2]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Students ({selectedSet})
          </p>
          <p className="mt-2 text-3xl font-bold text-[#2e63e5]">
            {isPending ? "..." : totalCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Enrolled in cohort</p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Graduated / Completed
          </p>
          <p className="mt-2 text-3xl font-bold text-[#1d9f4f]">
            {isPending ? "..." : graduatedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {graduatedCount > 0 ? "Degree cleared" : "Cohort still in study"}
          </p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active / In Progress
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {isPending ? "..." : activeCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Currently taking courses</p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Deficiencies / Carried Forward
          </p>
          <p className="mt-2 text-3xl font-bold text-[#ff9900]">
            {isPending ? "..." : carryoverCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Has outstanding courses</p>
        </article>
      </section>

      {/* Main Student Roster Table */}
      <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-[#2e63e5]">
              <StudentsIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {selectedSet} Set Records
              </h3>
              <p className="text-xs text-slate-400">
                Showing {students.length} student profiles
              </p>
            </div>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Session: 2025/2026
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="px-3 py-3">Matric No.</th>
                <th className="px-3 py-3">Student Name</th>
                <th className="px-3 py-3">Admission Set</th>
                <th className="px-3 py-3">Current Status</th>
                <th className="px-3 py-3">Level / Grad Year</th>
                <th className="px-3 py-3">CGPA</th>
                <th className="px-3 py-3">Outstanding</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No student records found matching your filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const hasIssues = student.outstandingCourses.length > 0;
                  const isGrad = student.status === "Graduated";

                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-4 font-mono font-medium text-slate-900">
                        {student.matricNumber}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-800">
                        {student.fullName}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                          {student.admissionSet}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isGrad
                              ? "bg-emerald-100 text-emerald-700"
                              : hasIssues
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-[#2e63e5]"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {student.graduationYear || `${student.currentLevel}L`}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`font-semibold ${
                            student.cgpa >= 3.5
                              ? "text-emerald-600"
                              : student.cgpa >= 2.4
                              ? "text-slate-800"
                              : "text-red-500"
                          }`}
                        >
                          {student.cgpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        {hasIssues ? (
                          <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-200">
                            {student.outstandingCourses.join(", ")}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <Link
                          href={`/adviser/student-records/${student.id}`}
                          className="inline-flex h-9 items-center rounded-lg border border-[#bfd7ff] bg-[#edf4ff] px-3.5 text-xs font-semibold text-[#2e63e5] shadow-sm transition hover:bg-[#2e63e5] hover:text-white"
                        >
                          View Record
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
