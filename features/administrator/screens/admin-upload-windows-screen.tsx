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

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  /**
   * Load the single global submission period.
   *
   * There is intentionally no:
   * - course filter
   * - academic session filter
   * - semester filter
   * - adviser filter
   * - lecturer filter
   *
   * The submission period is global.
   */
  const fetchWindows = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await getSubmissionWindows();

      if (!res.success) {
        showToast(
          res.error ?? "Failed to load submission period."
        );
        return;
      }

      setWindows(res.windows);
      setTotalCount(res.total);
      setOpenCount(res.openCount);
      setClosedCount(res.closedCount);
      setScheduledCount(res.scheduledCount);
    } catch (error) {
      console.error("Failed to load submission period:", error);
      showToast("Failed to load submission period.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchWindows();
  }, [fetchWindows]);

  /**
   * Extend the global submission period.
   */
  const handleExtend = async (
    id: string,
    days: number = 7
  ) => {
    try {
      const res = await extendWindowDeadline(id, days);

      showToast(res.message);

      if (res.success) {
        await fetchWindows();
      }
    } catch (error) {
      console.error("Failed to extend submission period:", error);
      showToast("Failed to extend submission deadline.");
    }
  };

  /**
   * Immediately close the global submission period.
   */
  const handleCloseImmediately = async (id: string) => {
    try {
      const res = await closeWindowImmediately(id);

      showToast(res.message);

      if (res.success) {
        await fetchWindows();
      }
    } catch (error) {
      console.error("Failed to close submission period:", error);
      showToast("Failed to close submission period.");
    }
  };

  /**
   * Delete the configured global submission period.
   *
   * This does NOT delete uploaded results.
   */
  const handleDelete = async (id: string) => {
    try {
      const res = await deleteWindow(id);

      showToast(res.message);

      if (res.success) {
        await fetchWindows();
      }
    } catch (error) {
      console.error("Failed to delete submission period:", error);
      showToast("Failed to delete submission period.");
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="space-y-6"
    >
      {/* ================================================================== */}
      {/* Toast Notification */}
      {/* ================================================================== */}
      {toastMessage && (
        <div className="fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg animate-in fade-in slide-in-from-top-2">
          <span>✓</span>

          <span>{toastMessage}</span>

          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-emerald-600 hover:text-emerald-800"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* Header */}
      {/* ================================================================== */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Result Submission Period
          </h2>

          <p className="text-sm text-slate-500">
            Control when authorized users can submit results across the department
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchWindows}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e63e5] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf]"
          >
            + Configure Submission Period
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Top Metrics */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Submission Period
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex size-3">
              {openCount > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}

              <span
                className={`relative inline-flex size-3 rounded-full ${
                  openCount > 0
                    ? "bg-emerald-500"
                    : "bg-slate-300"
                }`}
              />
            </span>

            <p
              className={`text-2xl font-bold ${
                openCount > 0
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              {openCount}
            </p>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {openCount > 0
              ? "Currently accepting result uploads"
              : "No period is currently accepting uploads"}
          </p>
        </div>

        {/* Scheduled */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Scheduled
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {scheduledCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Future global submission period
          </p>
        </div>

        {/* Closed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Closed / Locked
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-600">
            {closedCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Configured period has ended
          </p>
        </div>

        {/* Global */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Global Window
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {totalCount === 1
              ? "One department-wide submission period"
              : "No global submission period configured"}
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Main Card */}
      {/* ================================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        {/* Card Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Global Submission Control
            </h3>

            <p className="mt-0.5 text-xs text-slate-400">
              This period applies to all authorized result uploads.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700">
            🌐 DEPARTMENT-WIDE
          </span>
        </div>

        {/* ================================================================= */}
        {/* Loading */}
        {/* ================================================================= */}
        {isLoading ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400">
            Loading submission period...
          </div>
        ) : windows.length === 0 ? (
          /* ================================================================ */
          /* Empty State */
          /* ================================================================ */
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
              🌐
            </div>

            <p className="mt-4 text-base font-semibold text-slate-700">
              No submission period configured
            </p>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
              No results can currently be submitted. Configure a global
              submission period to authorize lecturers and advisers to upload
              results.
            </p>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-5 rounded-xl bg-[#2e63e5] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2456cf]"
            >
              Configure Submission Period
            </button>
          </div>
        ) : (
          /* ================================================================ */
          /* Global Window Table */
          /* ================================================================ */
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3.5">
                    Submission Scope
                  </th>

                  <th className="px-4 py-3.5">
                    Window Schedule
                  </th>

                  <th className="px-4 py-3.5 text-center">
                    Time Remaining
                  </th>

                  <th className="px-4 py-3.5">
                    Status
                  </th>

                  <th className="px-4 py-3.5">
                    Opened By
                  </th>

                  <th className="px-4 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-600">
                {windows.map((win) => (
                  <tr
                    key={win.id}
                    className="transition hover:bg-slate-50/60"
                  >
                    {/* ==================================================== */}
                    {/* Scope */}
                    {/* ==================================================== */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                          🌐
                        </span>

                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Department-Wide
                          </p>

                          <p className="text-[11px] text-slate-400">
                            All authorized result submissions
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ==================================================== */}
                    {/* Schedule */}
                    {/* ==================================================== */}
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div>
                        <p>
                          <span className="font-semibold text-slate-700">
                            Opens:
                          </span>{" "}
                          {new Date(
                            win.opensAt
                          ).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>

                        <p className="mt-0.5">
                          <span className="font-semibold text-slate-700">
                            Deadline:
                          </span>{" "}
                          {new Date(
                            win.closesAt
                          ).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </td>

                    {/* ==================================================== */}
                    {/* Time Remaining */}
                    {/* ==================================================== */}
                    <td className="px-4 py-3.5 text-center">
                      {win.status === "OPEN" ? (
                        <span className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          {win.daysRemaining}{" "}
                          {win.daysRemaining === 1
                            ? "day"
                            : "days"}{" "}
                          left
                        </span>
                      ) : win.status === "SCHEDULED" ? (
                        <span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Opens in {win.daysRemaining}{" "}
                          {win.daysRemaining === 1
                            ? "day"
                            : "days"}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          Closed
                        </span>
                      )}
                    </td>

                    {/* ==================================================== */}
                    {/* Status */}
                    {/* ==================================================== */}
                    <td className="px-4 py-3.5">
                      {win.status === "OPEN" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
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

                    {/* ==================================================== */}
                    {/* Opened By */}
                    {/* ==================================================== */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {win.openedByName}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          Period administrator
                        </p>
                      </div>
                    </td>

                    {/* ==================================================== */}
                    {/* Actions */}
                    {/* ==================================================== */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {win.status === "OPEN" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleExtend(win.id, 7)
                              }
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              title="Extend deadline by 7 days"
                            >
                              +7 Days
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleCloseImmediately(win.id)
                              }
                              className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                              title="Close submission period immediately"
                            >
                              Close
                            </button>
                          </>
                        )}

                        {win.status === "SCHEDULED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCloseImmediately(win.id)
                            }
                            className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                            title="Cancel scheduled submission period"
                          >
                            Cancel
                          </button>
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

      {/* ================================================================== */}
      {/* Modal */}
      {/* ================================================================== */}
      {showModal && (
        <WindowCrudModal
          onClose={() => setShowModal(false)}
          onSuccess={(msg) => {
            setShowModal(false);
            showToast(msg);
            fetchWindows();
          }}
        />
      )}
    </div>
  );
}
