"use client";

import { useEffect, useMemo } from "react";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { WizardNavigation } from "@/features/upload-result/components/wizard-navigation";
import { WizardShell } from "@/features/upload-result/components/wizard-shell";
import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";
import { cn } from "@/shared/lib/cn";

export default function UploadValidationResultsScreen() {
  const setCurrentStep = useUploadWizardStore(
    (s) => s.setCurrentStep,
  );

  const previewRows = useUploadWizardStore(
    (s) => s.previewRows,
  );

  const validationIssues = useUploadWizardStore(
    (s) => s.validationIssues,
  );

  const courseCode = useUploadWizardStore(
    (s) => s.courseCode,
  );

  const session = useUploadWizardStore(
    (s) => s.session,
  );

  const semester = useUploadWizardStore(
    (s) => s.semester,
  );

  const creditUnit = useUploadWizardStore(
    (s) => s.creditUnit,
  );

  useEffect(() => {
    setCurrentStep("validation-results");
  }, [setCurrentStep]);

  /*
   * Total number of result rows in the uploaded file.
   *
   * Since one row represents one student result,
   * this is the number of uploaded result records.
   */
  const totalStudents = previewRows.length;

  /*
   * Count students that have at least one validation issue.
   *
   * A student may have multiple issues, but should
   * only be counted once here.
   */
  const studentsWithIssues = useMemo(() => {
    return new Set(
      validationIssues
        .map((issue) =>
          String(issue.matricNo ?? "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );
  }, [validationIssues]);

  const issueStudentCount =
    studentsWithIssues.size;

  /*
   * A student is considered valid when they do not
   * appear in the validation issue list.
   */
  const validStudents = Math.max(
    0,
    totalStudents - issueStudentCount,
  );

  /*
   * Count rows that actually contain a score.
   *
   * IMPORTANT:
   * A blank score is NOT converted to zero.
   *
   * The parser preserves a blank Excel score as
   * an empty string, allowing validation to flag it.
   *
   * The ?? "" also makes this safe against old
   * persisted Zustand data.
   */
  const resultRecorded = previewRows.filter(
    (row) =>
      String(row.totalScore ?? "").trim() !== "",
  ).length;

  /*
   * Number of uploaded results that have no score.
   *
   * This isn't displayed as a card yet, but it is
   * useful if you later want a dedicated "Missing
   * Results" card.
   */
  const missingResults =
    totalStudents - resultRecorded;

  const summaryCards: ReadonlyArray<
    [string, string | number, string]
  > = [
    [
      "Total Students",
      totalStudents,
      "text-slate-700",
    ],
    [
      "Result Recorded",
      resultRecorded,
      "text-slate-700",
    ],
    [
      "Valid",
      validStudents,
      "text-[#57c4b4]",
    ],
    [
      "Issues",
      validationIssues.length,
      "text-[#ff3d3d]",
    ],
  ];

  return (
    <WizardShell
      title="Validation Results"
      meta={
        <>
          <p>
            Course Code :{" "}
            <span className="font-semibold">
              {courseCode || "Not provided"}
            </span>
          </p>

          <p>
            Session :{" "}
            <span className="font-semibold">
              {session || "Not provided"}
            </span>
          </p>

          <p>
            Semester :{" "}
            <span className="font-semibold">
              {semester || "Not provided"}
            </span>
          </p>

          <p>
            Credit Unit :{" "}
            <span className="font-semibold">
              {creditUnit || "Not provided"}
            </span>
          </p>
        </>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(
          ([title, value, color]) => (
            <article
              key={title}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <p className="text-xl font-semibold text-slate-400">
                {title}
              </p>

              <p
                className={cn(
                  "mt-3 text-4xl font-semibold",
                  color,
                )}
              >
                {value}
              </p>
            </article>
          ),
        )}
      </section>

      {missingResults > 0 && (
        <div className="rounded-xl bg-red-50 px-6 py-4 text-[#ff3d3d]">
          <p className="font-semibold">
            {missingResults} result
            {missingResults === 1
              ? ""
              : "s"} have no score.
          </p>

          <p className="mt-1 text-sm">
            Blank scores are treated as missing
            results and are not automatically
            assigned a score of 0.
          </p>
        </div>
      )}

      <UploadSectionCard>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-3xl font-semibold text-slate-700">
            Issues
          </h3>

          <span
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold",
              validationIssues.length > 0
                ? "bg-red-50 text-[#ff3d3d]"
                : "bg-[#d9f6f0] text-[#57c4b4]",
            )}
          >
            {validationIssues.length === 0
              ? "No issues"
              : `${validationIssues.length} issue${
                  validationIssues.length === 1
                    ? ""
                    : "s"
                }`}
          </span>
        </div>

        {validationIssues.length === 0 ? (
          <div className="mt-6 rounded-xl bg-[#d9f6f0] px-6 py-8 text-center text-[#57c4b4]">
            <p className="text-xl font-semibold">
              ✓ All uploaded results passed
              validation.
            </p>

            <p className="mt-2 text-base">
              You can proceed to confirm and
              submit the results.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="px-4 py-3">
                    Mat no
                  </th>

                  <th className="px-4 py-3">
                    Student name
                  </th>

                  <th className="px-4 py-3 text-[#ff3d3d]">
                    Issue
                  </th>
                </tr>
              </thead>

              <tbody className="text-slate-700">
                {validationIssues.map(
                  (issue, idx) => (
                    <tr
                      key={`${issue.matricNo}-${issue.issue}-${idx}`}
                      className="border-b border-slate-100"
                    >
                      <td className="px-4 py-3">
                        {issue.matricNo ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {issue.studentName ||
                          "—"}
                      </td>

                      <td className="px-4 py-3 text-[#ff3d3d]">
                        {issue.issue}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </UploadSectionCard>

      <WizardNavigation
        nextLabel="Proceed to Confirm"
      />
    </WizardShell>
  );
}
