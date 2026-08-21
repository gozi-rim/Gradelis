"use client";

import { useState, useRef } from "react";
import {
  parseCourseSpreadsheet,
  ParsedCourseRow,
} from "@/lib/excel/course-excel-template";
import { importCoursesBatch } from "@/lib/actions/admin-courses";
import { ExcelFileIcon } from "@/shared/icons/ui-icons";

type CourseImportModalProps = {
  defaultLevel: number;
  defaultSemester: "FIRST" | "SECOND";
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function CourseImportModal({
  defaultLevel,
  defaultSemester,
  onClose,
  onSuccess,
}: CourseImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(defaultLevel || 100);
  const [selectedSemester, setSelectedSemester] = useState<"FIRST" | "SECOND">(
    defaultSemester || "FIRST"
  );
  const [fileName, setFileName] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCourseRow[]>([]);
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
      const result = parseCourseSpreadsheet(buffer, selectedLevel, selectedSemester);
      setParsedRows(result.rows);
      setValidCount(result.validCount);
      setInvalidCount(result.invalidCount);
    } catch (err: unknown) {
      setParseError(
        err instanceof Error ? err.message : "Failed to parse course spreadsheet."
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
      const res = await importCoursesBatch({
        rows: validRows.map((r) => ({
          code: r.code,
          title: r.title,
          creditUnits: r.creditUnits,
          level: r.level,
          semester: r.semester,
          courseType: r.courseType,
        })),
      });

      if (res.success) {
        onSuccess(res.message);
        onClose();
      } else {
        setParseError("Failed to import courses. Please try again.");
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
              Batch Excel Course Seeding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload an Excel or CSV file containing departmental courses and credit units.
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
          {/* Level and Semester Selector */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Default Academic Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              >
                <option value={100}>100 Level (Year 1)</option>
                <option value={200}>200 Level (Year 2)</option>
                <option value={300}>300 Level (Year 3)</option>
                <option value={400}>400 Level (Year 4)</option>
                <option value={500}>500 Level (Year 5)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Default Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(e.target.value as "FIRST" | "SECOND")
                }
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-[#2e63e5] focus:ring-1 focus:ring-[#2e63e5]"
              >
                <option value="FIRST">First Semester</option>
                <option value="SECOND">Second Semester</option>
              </select>
            </div>
          </div>

          {/* File Picker Selection Card */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white shadow-xs">
              <ExcelFileIcon className="size-6 text-emerald-600" />
            </div>

            {fileName ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-800">{fileName}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {isParsing ? "Parsing spreadsheet..." : "Spreadsheet loaded"}
                </p>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isSubmitting}
                  className="mt-3 inline-flex text-xs font-semibold text-[#2e63e5] hover:underline"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-700">
                  No spreadsheet selected yet
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats
                </p>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isSubmitting}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#2e63e5] px-6 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf]"
                >
                  Choose Excel File
                </button>
              </div>
            )}
          </div>

          {/* Parse error alert */}
          {parseError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <strong>Error:</strong> {parseError}
            </div>
          )}

          {/* Validation Preview & Summary */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Spreadsheet Validation Preview ({parsedRows.length} Rows)
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                      <span className="size-2 rounded-full bg-red-500" />
                      {invalidCount} Flagged
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Units</th>
                      <th className="px-3 py-2">Level</th>
                      <th className="px-3 py-2">Semester</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.status === "INVALID" ? "bg-red-50/50" : ""}
                      >
                        <td className="px-3 py-2 font-mono text-slate-400">
                          {row.rowNumber}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">
                          {row.code || "-"}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {row.title || "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.creditUnits}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.level}L
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.semester === "FIRST" ? "1st" : "2nd"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.courseType}
                        </td>
                        <td className="px-3 py-2">
                          {row.status === "VALID" ? (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                              ✓ Ready
                            </span>
                          ) : (
                            <span
                              className="rounded-md bg-red-100 px-2 py-0.5 font-semibold text-red-700"
                              title={row.errors.join(", ")}
                            >
                              {row.errors[0]}
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

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || validCount === 0}
            className="rounded-xl bg-[#2e63e5] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2456cf] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting
              ? "Seeding Courses..."
              : `Confirm & Seed ${validCount} Courses`}
          </button>
        </div>
      </div>
    </div>
  );
}
