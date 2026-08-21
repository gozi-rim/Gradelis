"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SubmissionWindowItem,
  getSubmissionWindows,
  extendWindowDeadline,
  closeWindowImmediately,
  deleteWindow,
} from "@/lib/actions/admin-windows";
import { WindowCrudModal } from "../components/window-crud-modal";

export function AdminUploadWindowsScreen() {
  const [windows, setWindows] = useState<SubmissionWindowItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchWindows = useCallback(async () => {
    try {
      const res = await getSubmissionWindows({
        session: sessionFilter,
        semester: semesterFilter,
        status: statusFilter,
        search: searchTerm,
      });
      if (res.success) {
        setWindows(res.windows);
        setTotalCount(res.total);
        setOpenCount(res.openCount);
        setClosedCount(res.closedCount);
        setScheduledCount(res.scheduledCount);
      }
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  }, [sessionFilter, semesterFilter, statusFilter, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    getSubmissionWindows({
      session: sessionFilter,
      semester: semesterFilter,
      status: statusFilter,
      search: searchTerm,
    }).then((res) => {
      if (isMounted && res.success) {
        setWindows(res.windows);
        setTotalCount(res.total);
        setOpenCount(res.openCount);
        setClosedCount(res.closedCount);
        setScheduledCount(res.scheduledCount);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sessionFilter, semesterFilter, statusFilter, searchTerm]);

  const handleExtend = async (id: string, days: number = 7) => {
    try {
      const res = await extendWindowDeadline(id, days);
      if (res.success) {
        showToast(res.message);
        fetchWindows();
      }
    } catch {
      showToast("Failed to extend deadline.");
    }
  };

  const handleCloseImmediately = async (id: string) => {
    try {
      const res = await closeWindowImmediately(id);
      if (res.success) {
        showToast(res.message);
        fetchWindows();
      }
    } catch {
      showToast("Failed to close window.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteWindow(id);
      if (res.success) {
        showToast(res.message);
        fetchWindows();
      }
    } catch {
      showToast("Failed to delete window.");
    }
  };

  return (
    <div suppressHydrationWarning className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Top Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Result Upload Windows
          </h2>
          <p className="text-sm text-slate-500">
            Control result submission windows, upload deadlines, and session authorizations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchWindows}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e63e5] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf]"
          >
            + Open Submission Window
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Open Windows
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
            </span>
            <p className="text-2xl font-bold text-emerald-600">{openCount}</p>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Currently accepting result uploads
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Scheduled Upcoming
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{scheduledCount}</p>
          <p className="mt-1 text-xs text-slate-400">
            Pre-configured future deadlines
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Closed / Locked
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-600">{closedCount}</p>
          <p className="mt-1 text-xs text-slate-400">
            Upload window expired or locked
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Windows Tracked
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{totalCount}</p>
          <p className="mt-1 text-xs text-slate-400">
            Across all academic sessions
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        {/* Filters */}
        <div className="mb-5 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by course, session, or admin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:bg-white focus:ring-1 focus:ring-[#2e63e5]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#2e63e5]"
            >
              <option value="ALL">All Academic Sessions</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
            </select>
          </div>

          <div>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#2e63e5]"
            >
              <option value="ALL">All Semesters</option>
              <option value="FIRST">First Semester</option>
              <option value="SECOND">Second Semester</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#2e63e5]"
            >
              <option value="ALL">All Window Statuses</option>
              <option value="OPEN">Open (Active)</option>
              <option value="SCHEDULED">Scheduled (Upcoming)</option>
              <option value="CLOSED">Closed (Locked)</option>
            </select>
          </div>
        </div>

        {/* Windows Table */}
        {isLoading ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400">
            Loading submission windows...
          </div>
        ) : windows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-slate-700">
              No submission windows found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Click &quot;+ Open Submission Window&quot; to authorize result uploads.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5">Academic Session &amp; Sem</th>
                  <th className="px-4 py-3.5">Target Scope</th>
                  <th className="px-4 py-3.5">Window Schedule</th>
                  <th className="px-4 py-3.5 text-center">Time Remaining</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {windows.map((win) => (
                  <tr key={win.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-bold text-blue-700">
                          {win.academicSession.slice(2, 4)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">
                            {win.academicSession} Session
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {win.semester === "FIRST" ? "1st Semester" : "2nd Semester"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-xs text-slate-800">
                          {win.courseTitle}
                        </p>
                        <span
                          className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            win.isAllCourses
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-700 font-mono border border-slate-200"
                          }`}
                        >
                          {win.isAllCourses ? "Department-Wide" : win.courseCode}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div>
                        <p>
                          <span className="font-semibold text-slate-700">Opens:</span>{" "}
                          {new Date(win.opensAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-0.5">
                          <span className="font-semibold text-slate-700">Deadline:</span>{" "}
                          {new Date(win.closesAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {win.status === "OPEN" ? (
                        <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                          {win.daysRemaining} days left
                        </span>
                      ) : win.status === "SCHEDULED" ? (
                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                          Opens in {win.daysRemaining} days
                        </span>
                      ) : (
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          Closed
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {win.status === "OPEN" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          OPEN
                        </span>
                      ) : win.status === "SCHEDULED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          SCHEDULED
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                          CLOSED
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {win.status === "OPEN" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleExtend(win.id, 7)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              title="Extend deadline by 7 days"
                            >
                              +7 Days
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCloseImmediately(win.id)}
                              className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                              title="Close submission window immediately"
                            >
                              Close
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(win.id)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <WindowCrudModal
          onClose={() => setShowModal(false)}
          onSuccess={(msg) => {
            showToast(msg);
            fetchWindows();
          }}
        />
      )}
    </div>
  );
}
