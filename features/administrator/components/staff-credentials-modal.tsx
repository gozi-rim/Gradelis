"use client";

import { useState } from "react";
import {
  StaffCredentialItem,
  exportStaffCredentialsToExcel,
} from "@/lib/excel/staff-excel-template";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

type StaffCredentialsModalProps = {
  credentials: StaffCredentialItem[];
  onClose: () => void;
};

export function StaffCredentialsModal({
  credentials,
  onClose,
}: StaffCredentialsModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const handleCopySingle = (password: string, index: number) => {
    navigator.clipboard.writeText(password);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const text = credentials
      .map(
        (c) =>
          `Name: ${c.name} | Email: ${c.email} | Role: ${c.role} | Temp Password: ${c.temporaryPassword}`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  const handleDownloadExcel = () => {
    exportStaffCredentialsToExcel(credentials);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              ✓ Batch Seeding Completed
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-800">
              Staff Credentials &amp; Temporary Passwords
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Temporary 8-character passwords generated for distribution.
              Export or copy these credentials before closing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Action bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-50/70 p-3.5">
          <div className="text-xs font-medium text-[#2e63e5]">
            {credentials.length} account(s) generated with secure temporary passwords.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              {allCopied ? "✓ Copied All" : "Copy All Credentials"}
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <ExcelFileIcon className="size-3.5" />
              Download Excel Spreadsheet
            </button>
          </div>
        </div>

        {/* Credentials Table */}
        <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3.5 py-3">Full Name</th>
                <th className="px-3.5 py-3">Email Address</th>
                <th className="px-3.5 py-3">Role</th>
                <th className="px-3.5 py-3">Temporary Password</th>
                <th className="px-3.5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {credentials.map((item, idx) => (
                <tr key={item.email + idx} className="hover:bg-slate-50">
                  <td className="px-3.5 py-3 font-semibold">{item.name}</td>
                  <td className="px-3.5 py-3 text-slate-600">{item.email}</td>
                  <td className="px-3.5 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                      {item.role}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-mono font-bold text-blue-700">
                    {item.temporaryPassword}
                  </td>
                  <td className="px-3.5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(item.temporaryPassword, idx)}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {copiedIndex === idx ? "✓ Copied" : "Copy"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2e63e5] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2456cf]"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
