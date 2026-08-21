"use client";

import { useState, useEffect, useCallback } from "react";
import { AuditLogItem, getAuditLogs } from "@/lib/actions/admin-logs";
import { exportLogsToExcel } from "@/lib/excel/logs-excel-export";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

export function AdminLogsScreen() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      const res = await getAuditLogs({
        category: "ALL",
        status: "ALL",
        search: searchTerm,
      });
      if (res.success) {
        setLogs(res.logs);
        setTotalCount(res.total);
      }
    } catch {
      // handled
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    getAuditLogs({
      category: "ALL",
      status: "ALL",
      search: searchTerm,
    }).then((res) => {
      if (isMounted && res.success) {
        setLogs(res.logs);
        setTotalCount(res.total);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  const handleExportExcel = () => {
    exportLogsToExcel(
      logs.map((l) => ({
        id: l.id,
        userName: l.userName,
        userEmail: l.userEmail,
        userRole: l.userRole,
        action: l.action,
        category: l.category,
        target: l.target,
        details: l.details,
        timestamp: new Date(l.timestamp).toLocaleString("en-US"),
        status: l.status,
      }))
    );
  };

  return (
    <div suppressHydrationWarning className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            System Audit Trail
          </h2>
          <p className="text-sm text-slate-500">
            Activity history of all operations, account changes, and batch uploads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 hover:cursor-pointer"
          >
            <ExcelFileIcon className="size-4" />
            Export (.xlsx)
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        {/* Search */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <input
              type="text"
              placeholder="Search audit logs by user or action..."
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

          <p className="text-xs font-medium text-slate-400">
            {totalCount} Total Logged Events
          </p>
        </div>

        {/* Simplified Logs Table (User, Action, Timestamp) */}
        {isLoading ? (
          <div className="py-16 text-center text-sm font-medium text-slate-400">
            Loading audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-slate-700">
              No audit logs found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search keyword.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Action Performed</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-xs">
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                            {log.userName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {log.userRole}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-800">
                          {log.details || log.action.replace(/_/g, " ")}
                        </p>
                        {log.target && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            Target: <span className="text-slate-600 font-medium">{log.target}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className="text-xs font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
