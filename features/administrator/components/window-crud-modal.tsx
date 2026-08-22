"use client";

import { useState } from "react";
import { openOrScheduleWindow } from "@/lib/actions/admin-windows";

type WindowCrudModalProps = {
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function WindowCrudModal({
  onClose,
  onSuccess,
}: WindowCrudModalProps) {
  // Default opening: now
  const now = new Date();

  // Format for datetime-local input without using UTC conversion
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const defaultClosingDate = new Date(
    now.getTime() + 14 * 24 * 60 * 60 * 1000
  );

  const [opensAt, setOpensAt] = useState(
    formatDateTimeLocal(now)
  );

  const [closesAt, setClosesAt] = useState(
    formatDateTimeLocal(defaultClosingDate)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const openingDate = new Date(opensAt);
      const closingDate = new Date(closesAt);

      if (Number.isNaN(openingDate.getTime())) {
        setErrorMessage("Please provide a valid opening date and time.");
        return;
      }

      if (Number.isNaN(closingDate.getTime())) {
        setErrorMessage("Please provide a valid closing date and time.");
        return;
      }

      if (closingDate <= openingDate) {
        setErrorMessage(
          "The closing date and time must be after the opening date and time."
        );
        return;
      }

      const res = await openOrScheduleWindow({
        opensAt: openingDate.toISOString(),
        closesAt: closingDate.toISOString(),
      });

      if (res.success) {
        onSuccess(
          res.message ||
            "Global result submission period configured successfully."
        );
        onClose();
      } else {
        setErrorMessage(
          res.error || "Failed to configure submission period."
        );
      }
    } catch {
      setErrorMessage(
        "An unexpected error occurred while configuring the submission period."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Open Result Submission Period
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Authorize result uploads across the department within this
              timeframe
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
          {/* Error */}
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Global Scope Notice */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                🌐
              </div>

              <div>
                <p className="text-xs font-bold text-blue-800">
                  Department-Wide Submission Period
                </p>

                <p className="mt-1 text-[11px] leading-5 text-blue-700">
                  This period applies globally to authorized result uploads.
                  Lecturers and advisers can submit results for their
                  permitted courses and academic sessions while the period is
                  open.
                </p>
              </div>
            </div>
          </div>

          {/* Opening / Closing */}
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

              <p className="text-[10px] text-slate-400">
                Uploads become permitted from this time.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Closing Date &amp; Time
              </label>

              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono text-slate-800 outline-none focus:border-[#2e63e5]"
                required
              />

              <p className="text-[10px] text-slate-400">
                Upload submissions are blocked after this time.
              </p>
            </div>
          </div>

          {/* Information */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] leading-5 text-slate-500">
              <span className="font-semibold text-slate-700">
                Important:
              </span>{" "}
              This is one global submission period. It does not belong to a
              particular lecturer, adviser, course, academic session, or
              semester. Those details are determined when an individual result
              upload is validated.
            </p>
          </div>

          {/* Actions */}
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
              {isSubmitting
                ? "Saving..."
                : "Open Submission Period"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
