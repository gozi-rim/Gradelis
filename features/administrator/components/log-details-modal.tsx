"use client";

import { AuditLogItem } from "@/lib/actions/admin-logs";

type LogDetailsModalProps = {
  log: AuditLogItem;
  onClose: () => void;
};

export function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "FAILED":
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                  log.status
                )}`}
              >
                {log.status}
              </span>
              <span className="text-xs font-medium text-slate-400">
                ID: {log.id}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-slate-800">
              {log.action.replace(/_/g, " ")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-400">Triggered By</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {log.userName}
              </p>
              <p className="text-xs text-slate-500">{log.userEmail}</p>
              <span className="mt-1 inline-block rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {log.userRole}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Timestamp</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {new Date(log.timestamp).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-xs text-slate-400">
                Category: {log.category.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target / Entity
            </p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800">
              {log.target}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Event Details &amp; Summary
            </p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {log.details}
            </p>
          </div>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Raw Event Payload &amp; Metadata
              </p>
              <pre className="mt-1 max-h-48 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-emerald-400">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2e63e5] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2456cf]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
