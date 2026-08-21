"use client";

import { useState, useRef } from "react";
import {
  parseStaffSpreadsheet,
  ParsedStaffRow,
  StaffCredentialItem,
} from "@/lib/excel/staff-excel-template";
import { importStaffBatch } from "@/lib/actions/admin-staff";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

type StaffImportModalProps = {
  onClose: () => void;
  onSuccess: (message: string, credentials: StaffCredentialItem[]) => void;
};

export function StaffImportModal({ onClose, onSuccess }: StaffImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStaffRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setParseError(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseStaffSpreadsheet(buffer);
      setParsedRows(result.rows);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    } catch (err: unknown) {
      setParseError(
        err instanceof Error ? err.message : "Failed to parse staff spreadsheet."
      );
      setParsedRows([]);
      setValidCount(0);
      setInvalidCount(0);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.status === "VALID");
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await importStaffBatch({
        rows: validRows.map((r) => ({
          name: r.name,
          email: r.email,
          role: r.role,
          temporaryPassword: r.generatedPassword,
        })),
      });

      if (res.success) {
        onSuccess(res.message, res.credentials || []);
        onClose();
      } else {
        setParseError("Failed to seed staff accounts.");
      }
    } catch (err: unknown) {
      setParseError(
        err instanceof Error ? err.message : "Unexpected error during import."
      );
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
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Bulk Staff Excel Import &amp; Password Generator
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Upload faculty/staff roster. Secure 8-character temporary passwords
              will be automatically created and hashed.
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

        <div className="space-y-6 overflow-y-auto py-4">
          {/* File Picker Selection Card */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <ExcelFileIcon className="size-6" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              {fileName ? fileName : "No staff spreadsheet selected yet"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats
            </p>

            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isSubmitting || isParsing}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2e63e5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2456cf] hover:cursor-pointer disabled:opacity-50"
            >
              {fileName ? "Change Spreadsheet File" : "Choose Excel File"}
            </button>
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <p className="font-semibold">Import Error</p>
              <p className="mt-0.5">{parseError}</p>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-4 text-center text-sm font-medium text-slate-500">
              Parsing and validating staff rows...
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && !isParsing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Staff Preview ({parsedRows.length} Rows)
                </h3>
                <div className="flex gap-2 text-xs">
                  <span className="rounded-md bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="rounded-md bg-red-100 px-2.5 py-1 font-semibold text-red-800">
                      {invalidCount} Issues
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Row</th>
                      <th className="px-3 py-2.5">Full Name</th>
                      <th className="px-3 py-2.5">Email</th>
                      <th className="px-3 py-2.5">Role</th>
                      <th className="px-3 py-2.5">Generated Temp Pass</th>
                      <th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={
                          row.status === "VALID"
                            ? "hover:bg-slate-50"
                            : "bg-red-50/50 hover:bg-red-50"
                        }
                      >
                        <td className="px-3 py-2 font-mono text-slate-400">
                          #{row.rowNumber}
                        </td>
                        <td className="px-3 py-2 font-semibold">
                          {row.name || "—"}
                        </td>
                        <td className="px-3 py-2">{row.email || "—"}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                            {row.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-blue-600">
                          {row.generatedPassword || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {row.status === "VALID" ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                              ✓ Ready
                            </span>
                          ) : (
                            <span
                              className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700"
                              title={row.errorMessage}
                            >
                              {row.errorMessage || "Invalid"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || validCount === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e63e5] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2456cf] hover:cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? "Importing & Generating Passwords..."
              : `Import & Generate Passwords (${validCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}
