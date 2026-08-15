"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Adviser = {
  level: string;
  lecturer: string;
  session: string;
  accessPeriod: string;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const assignedAdvisers: Adviser[] = [
  { level: "Year 1", lecturer: "Dr. Grace Ibrahim", session: "2025/2026", accessPeriod: "Sep 2025–Aug 2026" },
  { level: "Year 2", lecturer: "Dr. Emeka Nwosu", session: "2025/2026", accessPeriod: "Sep 2025–Aug 2026" },
  { level: "Year 3", lecturer: "Dr. Maryam Bello", session: "2025/2026", accessPeriod: "Sep 2025–Aug 2026" },
  { level: "Year 4", lecturer: "Dr. A. Okafor", session: "2025/2026", accessPeriod: "Sep 2025–Aug 2026" },
  { level: "Year 5", lecturer: "Dr. T. Lawal", session: "2025/2026", accessPeriod: "Sep 2025–Aug 2026" },
];

// ─── Remove modal ─────────────────────────────────────────────────────────────

function RemoveAdviserModal({
  adviser,
  onClose,
}: {
  adviser: Adviser;
  onClose: () => void;
}) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* Warning icon */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl font-bold text-red-500">!</span>
        </div>

        {/* Heading */}
        <h2 className="mt-5 text-center text-xl font-bold text-slate-800">
          Remove this adviser?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {adviser.lecturer} will lose access to {adviser.level} records for the selected session.
        </p>

        {/* Detail card */}
        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm">
          {[
            ["Lecturer", adviser.lecturer],
            ["Assigned Level", adviser.level],
            ["Session", adviser.session],
            ["Account Status", "Remains Active"],
            ["Audit History", "Preserved"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-1.5">
              <span className="text-slate-400">{label}</span>
              <span className="font-medium text-slate-700">{value}</span>
            </div>
          ))}
        </div>

        {/* Reason field */}
        <div className="mt-5 space-y-1.5">
          <label htmlFor="removal-reason" className="block text-sm font-medium text-slate-700">
            Reason for removal
          </label>
          <input
            id="removal-reason"
            type="text"
            placeholder="End of adviser responsibility"
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Remove Assignment
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function UserManagementScreen() {
  const [selected, setSelected] = useState<Adviser | null>(null);

  return (
    <>
      <div className="space-y-6">
        <p className="text-sm text-slate-500">View, change or remove level access</p>

        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-700">Assigned Advisers</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Level</th>
                  <th className="px-3 py-3">Lecturer</th>
                  <th className="px-3 py-3">Session</th>
                  <th className="px-3 py-3">Access Period</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedAdvisers.map((row) => (
                  <tr key={row.level} className="border-t border-slate-100">
                    <td className="px-3 py-5 font-medium text-slate-700">{row.level}</td>
                    <td className="px-3 py-5 text-slate-600">{row.lecturer}</td>
                    <td className="px-3 py-5 text-slate-600">{row.session}</td>
                    <td className="px-3 py-5 text-slate-600">{row.accessPeriod}</td>
                    <td className="px-3 py-5">
                      <span className="rounded-full bg-green-50 px-4 py-1 text-xs font-medium text-green-600">
                        Active
                      </span>
                    </td>
                    <td className="px-3 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          className="rounded-lg border border-red-200 bg-white px-4 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warning notice */}
          <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
            <p className="text-sm font-semibold text-orange-600">
              Removing an assignment revokes level access only.
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              The lecturer account and all previous activity remain preserved.
            </p>
          </div>
        </div>
      </div>

      {selected && (
        <RemoveAdviserModal adviser={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
