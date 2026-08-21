"use client";

import { useState, useRef } from "react";
import {
  parseStudentSpreadsheet,
  ParsedStudentRow,
} from "@/lib/excel/student-excel-template";
import { importStudentsBatch } from "@/lib/actions/admin-students";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

type StudentImportModalProps = {
  defaultSession: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function StudentImportModal({
  defaultSession,
  onClose,
  onSuccess,
}: StudentImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSession, setSelectedSession] = useState(defaultSession || "2024/2025");
  const [fileName, setFileName] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
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
      const result = parseStudentSpreadsheet(buffer, selectedSession);
      setParsedRows(result.rows);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    } catch (err: unknown) {
      setParseError(
        err instanceof Error ? err.message : "Failed to parse spreadsheet."
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
      const res = await importStudentsBatch({
        entrySession: selectedSession,
        rows: validRows.map((r) => ({
          matricNumber: r.matricNumber,
          fullName: r.fullName,
          currentLevel: r.currentLevel,
          entrySession: r.entrySession,
        })),
      });

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setParseError("Failed to import students. Please try again.");
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
              Batch Excel Student Seeding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select an Excel or CSV file containing student roster details.
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

        {/* Content area with scroll if necessary */}
        <div className="space-y-6 overflow-y-auto py-4">
          {/* Session Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Default Entry Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
            >
              <option value="2025/2026">2025/2026 Session</option>
              <option value="2024/2025">2024/2025 Session</option>
              <option value="2023/2024">2023/2024 Session</option>
              <option value="2022/2023">2022/2023 Session</option>
              <option value="2021/2022">2021/2022 Session</option>
              <option value="2020/2021">2020/2021 Session</option>
            </select>
          </div>

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
              {fileName ? fileName : "No spreadsheet selected yet"}
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Import Error</p>
              <p className="mt-0.5 text-xs text-red-600">{parseError}</p>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-4 text-center text-sm font-medium text-slate-500">
              Parsing and validating spreadsheet data...
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && !isParsing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Spreadsheet Preview ({parsedRows.length} Rows Found)
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
                  <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Row</th>
                      <th className="px-3 py-2.5">Matric No</th>
                      <th className="px-3 py-2.5">Full Name</th>
                      <th className="px-3 py-2.5">Level</th>
                      <th className="px-3 py-2.5">Session</th>
                      <th className="px-3 py-2.5">Validation</th>
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
                          {row.matricNumber || "—"}
                        </td>
                        <td className="px-3 py-2">{row.fullName || "—"}</td>
                        <td className="px-3 py-2">{row.currentLevel}L</td>
                        <td className="px-3 py-2">{row.entrySession}</td>
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

        {/* Footer actions */}
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
              ? "Importing..."
              : `Confirm & Seed ${validCount} Student${validCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
