"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  ExcelFileIcon,
  StudentsIcon,
  UploadIcon,
  XCircleIcon,
} from "@/shared/icons/ui-icons";
import { useAdviserStore } from "@/features/adviser/store/adviser-store";
import {
  getAdviserDashboardData,
  AdviserDashboardStats,
} from "@/lib/actions/adviser";

export function AdviserDashboardScreen() {
  const { selectedSet } = useAdviserStore();
  const [data, setData] = useState<AdviserDashboardStats | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const stats = await getAdviserDashboardData(selectedSet);
      setData(stats);
    });
  }, [selectedSet]);

  const statsList = [
    {
      title: "Total students",
      value: data ? data.totalStudents.toString() : "140",
      meta: "View all student records",
      href: "/adviser/student-records",
      icon: StudentsIcon,
      color: "text-[#2e63e5]",
      bg: "bg-blue-50",
    },
    {
      title: "Eligible Students",
      value: data ? data.eligibleStudents.toString() : "0",
      meta: data?.isGraduatingSet
        ? `${data.chartPercentages.eligible}% of total`
        : "0 (Not in graduating year)",
      href: "/adviser/graduation-report",
      icon: CheckCircleIcon,
      color: "text-[#35c679]",
      bg: "bg-emerald-50",
    },
    {
      title: "Not Eligible Students",
      value: data ? data.notEligibleStudents.toString() : "24",
      meta: data
        ? `${data.chartPercentages.notEligible}% of total`
        : "17% of total",
      href: "/adviser/graduation-report",
      icon: XCircleIcon,
      color: "text-[#ff3d3d]",
      bg: "bg-red-50",
    },
    {
      title: "Pending review",
      value: data ? data.pendingReview.toString() : "10",
      meta: data
        ? `${data.chartPercentages.pendingReview}% of total`
        : "7% of total",
      href: "/adviser/student-records",
      icon: ClockIcon,
      color: "text-[#ff9900]",
      bg: "bg-amber-50",
    },
  ];

  // Dynamic conic gradient computation
  const eligiblePct = data ? data.chartPercentages.eligible : 0;
  const notEligiblePct = data ? data.chartPercentages.notEligible : 17;
  const pendingPct = data ? data.chartPercentages.pendingReview : 7;
  const inProgressPct = data ? data.chartPercentages.inProgress : 76;

  const stop1 = eligiblePct;
  const stop2 = stop1 + notEligiblePct;
  const stop3 = stop2 + pendingPct;

  const gradientStyle = data?.isGraduatingSet
    ? `conic-gradient(#57c4b4 0 ${stop1}%, #ff3d3d ${stop1}% ${stop2}%, #ffb04d ${stop2}% 100%)`
    : `conic-gradient(#2e63e5 0 ${inProgressPct}%, #ff3d3d ${inProgressPct}% ${inProgressPct + notEligiblePct}%, #ffb04d ${inProgressPct + notEligiblePct}% 100%)`;

  const centerDisplay = data?.isGraduatingSet
    ? `${eligiblePct}%`
    : `${data?.currentLevel || 400}L`;

  const centerSubtitle = data?.isGraduatingSet
    ? "Graduating"
    : "Current Level";

  return (
    <section className="space-y-8">
      {/* Welcome & Active Set Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            Welcome back, Dr. Kelvin Bello
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Advising Set:{" "}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2e63e5]/10 px-2 py-0.5 font-semibold text-[#2e63e5]">
              {selectedSet} Cohort
            </span>{" "}
            · Electrical & Electronic Engineering Department
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/adviser/upload-result"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2e63e5] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2552c2]"
          >
            <UploadIcon className="size-4" />
            Upload Results
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsList.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="group block rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <p className="text-[32px] font-bold text-slate-900">
                  {isPending ? (
                    <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
                  ) : (
                    stat.value
                  )}
                </p>
                <div className={`grid size-12 place-items-center rounded-xl ${stat.bg}`}>
                  <Icon className={`size-6 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-base font-semibold text-slate-700">
                {stat.title}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-400 group-hover:text-[#2e63e5] transition">
                {stat.meta} →
              </p>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid: Overview, Recent Uploads, Issues Summary */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr_0.85fr]">
        {/* Eligibility / Progress Overview */}
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                {data?.isGraduatingSet ? "Graduation Eligibility" : "Academic Progression Status"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cohort {selectedSet} status breakdown
              </p>
            </div>
            <Link
              href="/adviser/graduation-report"
              className="text-xs font-semibold text-[#2e63e5] hover:underline"
            >
              Full Report →
            </Link>
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div
              className="relative grid size-52 shrink-0 place-items-center rounded-full shadow-inner transition-all duration-500"
              style={{
                background: gradientStyle,
              }}
            >
              <div className="grid size-36 place-items-center rounded-full bg-white text-center shadow-md">
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {centerDisplay}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {centerSubtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3.5 pt-1 text-sm">
              {data?.isGraduatingSet ? (
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2.5 font-medium text-slate-700">
                    <span className="size-3 rounded-full bg-[#57c4b4]" />
                    Eligible for Graduation
                  </span>
                  <span className="font-bold text-slate-800">
                    {data.eligibleStudents} ({data.chartPercentages.eligible}%)
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2.5 font-medium text-slate-700">
                    <span className="size-3 rounded-full bg-[#2e63e5]" />
                    In Progress / Active
                  </span>
                  <span className="font-bold text-slate-800">
                    {data?.inProgressStudents ?? 106} ({inProgressPct}%)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-2.5 font-medium text-slate-700">
                  <span className="size-3 rounded-full bg-[#ffb04d]" />
                  Pending Review
                </span>
                <span className="font-bold text-slate-800">
                  {data?.pendingReview ?? 0} ({pendingPct}%)
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-2.5 font-medium text-slate-700">
                  <span className="size-3 rounded-full bg-[#ff3d3d]" />
                  {data?.isGraduatingSet ? "Not Eligible" : "Outstanding Deficiencies"}
                </span>
                <span className="font-bold text-slate-800">
                  {data?.notEligibleStudents ?? 24} ({notEligiblePct}%)
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Recent Uploads */}
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Recent Uploads</h3>
              <p className="text-xs text-slate-400 mt-0.5">Spreadsheets submitted for this set</p>
            </div>
            <Link
              href="/adviser/upload-result"
              className="text-xs font-semibold text-[#2e63e5] hover:underline"
            >
              Upload New →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {data?.recentUploads.map((upload, idx) => (
              <div
                key={`${upload.fileName}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ExcelFileIcon className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {upload.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {upload.uploadDate} · {upload.semester} Semester
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {upload.session}
                </span>
              </div>
            ))}
          </div>
        </article>

        {/* Issues Summary */}
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Issues Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5">Deficiencies requiring adviser attention</p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-slate-700">
              <div>
                <p className="font-semibold text-slate-800">Failed courses</p>
                <p className="text-[11px] text-slate-400">Scores below 40% (Grade F)</p>
              </div>
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                {data?.issuesSummary.failedCourses || 6}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 text-slate-700">
              <div>
                <p className="font-semibold text-slate-800">Missing courses</p>
                <p className="text-[11px] text-slate-400">Unregistered compulsory units</p>
              </div>
              <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                {data?.issuesSummary.missingCourses || 4}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-slate-700">
              <div>
                <p className="font-semibold text-slate-800">Missing Results</p>
                <p className="text-[11px] text-slate-400">Unsubmitted department grades</p>
              </div>
              <span className="rounded-full bg-[#2e63e5] px-3 py-1 text-xs font-bold text-white">
                {data?.issuesSummary.missingResults || 2}
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
