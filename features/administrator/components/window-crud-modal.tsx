"use client";

import { useState } from "react";
import { openOrScheduleWindow } from "@/lib/actions/admin-windows";

type WindowCrudModalProps = {
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function WindowCrudModal({ onClose, onSuccess }: WindowCrudModalProps) {
  const [session, setSession] = useState("2024/2025");
  const [semester, setSemester] = useState<"FIRST" | "SECOND">("SECOND");
  const [scope, setScope] = useState<"ALL" | "SPECIFIC">("ALL");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");

  // Default opening: today at 08:00 AM, Closing: 14 days from now at 11:59 PM
  const todayStr = new Date().toISOString().slice(0, 16);
  const twoWeeksLater = new Date(Date.now() + 14 * 86400000);
  const twoWeeksStr = twoWeeksLater.toISOString().slice(0, 16);

  const [opensAt, setOpensAt] = useState(todayStr);
  const [closesAt, setClosesAt] = useState(twoWeeksStr);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await openOrScheduleWindow({
        academicSession: session,
        semester,
        courseId: scope === "ALL" ? undefined : "specific-course-custom",
        courseCode: scope === "ALL" ? undefined : courseCode.trim().toUpperCase(),
        courseTitle: scope === "ALL" ? undefined : courseTitle.trim(),
        opensAt: new Date(opensAt).toISOString(),
        closesAt: new Date(closesAt).toISOString(),
      });

      if (res.success) {
        onSuccess(res.message || "Result submission window opened successfully.");
        onClose();
      } else {
        setErrorMessage(res.error || "Failed to configure submission window.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Open Result Submission Window
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Authorize lecturers and advisers to upload results within this timeframe
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Academic Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                <option value="2025/2026">2025/2026 Session</option>
                <option value="2024/2025">2024/2025 Session</option>
                <option value="2023/2024">2023/2024 Session</option>
                <option value="2022/2023">2022/2023 Session</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) =>
                  setSemester(e.target.value as "FIRST" | "SECOND")
                }
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#2e63e5]"
              >
                <option value="FIRST">First Semester</option>
                <option value="SECOND">Second Semester</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Course Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope("ALL")}
                className={`rounded-xl border p-2.5 text-xs font-semibold transition ${
                  scope === "ALL"
                    ? "border-[#2e63e5] bg-blue-50/50 text-[#2e63e5]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Courses (General Window)
              </button>
              <button
                type="button"
                onClick={() => setScope("SPECIFIC")}
                className={`rounded-xl border p-2.5 text-xs font-semibold transition ${
                  scope === "SPECIFIC"
                    ? "border-[#2e63e5] bg-blue-50/50 text-[#2e63e5]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Specific Course Only
              </button>
            </div>
          </div>

          {scope === "SPECIFIC" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CPE 401"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#2e63e5]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Course Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Embedded Systems"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-[#2e63e5]"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Opening Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono text-slate-800 outline-none focus:border-[#2e63e5]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Closing Date &amp; Time (Deadline)
              </label>
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono text-slate-800 outline-none focus:border-[#2e63e5]"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#2e63e5] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf] disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Open Window"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
