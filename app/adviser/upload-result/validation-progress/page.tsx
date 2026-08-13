"use client";

import { useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { WizardShell } from "@/features/upload-result/components/wizard-shell";
import {
  WIZARD_STEPS,
  useUploadWizardStore,
  type PreviewRow,
  type ValidationIssue,
} from "@/features/upload-result/store/upload-wizard-store";

/**
 * Validate the uploaded result rows.
 *
 * The Excel file already contains the calculated Total Score.
 *
 * Therefore:
 * - CA is NOT validated.
 * - Exam is NOT validated.
 * - CA + Exam is NOT recalculated.
 * - A blank Total Score is treated as a missing result.
 * - A score of 0 is a valid recorded result.
 */
function validateRows(rows: PreviewRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenMatricNumbers = new Set<string>();

  rows.forEach((row, index) => {
    /*
     * The actual Excel header row may not be row 1,
     * so this is only used as a helpful reference
     * when displaying an issue.
     */
    const rowNumber = index + 2;

    const matricNo = String(row.matricNo ?? "").trim();
    const totalScore = String(row.totalScore ?? "").trim();
    const grade = String(row.grade ?? "").trim().toUpperCase();

    const studentName = matricNo || `Row ${rowNumber}`;

    /*
     * --------------------------------------------------
     * MATRIC NUMBER
     * --------------------------------------------------
     */

    if (!matricNo) {
      issues.push({
        matricNo: "",
        studentName,
        issue: "Missing matric number",
      });
    } else {
      const normalizedMatricNo =
        matricNo.toLowerCase();

      /*
       * Check for duplicate matric numbers.
       */
      if (seenMatricNumbers.has(normalizedMatricNo)) {
        issues.push({
          matricNo,
          studentName,
          issue: "Duplicate matric number",
        });
      } else {
        seenMatricNumbers.add(normalizedMatricNo);
      }
    }

    /*
     * --------------------------------------------------
     * TOTAL SCORE
     * --------------------------------------------------
     *
     * This is the important change.
     *
     * We only check the Total Score from Excel.
     *
     * We DO NOT check CA.
     * We DO NOT check Exam.
     *
     * A blank score is ONE issue.
     */

    if (!totalScore) {
      issues.push({
        matricNo,
        studentName,
        issue: "Missing result/score",
      });

      /*
       * There is no score to validate further.
       *
       * Continue to the next row after checking
       * the grade below.
       */
    } else {
      const numericScore = Number(totalScore);

      /*
       * Make sure the score is actually numeric.
       */
      if (!Number.isFinite(numericScore)) {
        issues.push({
          matricNo,
          studentName,
          issue: "Invalid total score",
        });
      } else if (
        numericScore < 0 ||
        numericScore > 100
      ) {
        /*
         * 0 is valid.
         *
         * Only values outside 0-100 are invalid.
         */
        issues.push({
          matricNo,
          studentName,
          issue:
            "Total score must be between 0 and 100",
        });
      }
    }

    /*
     * --------------------------------------------------
     * GRADE
     * --------------------------------------------------
     */

    if (!grade) {
      issues.push({
        matricNo,
        studentName,
        issue: "Missing grade",
      });
    } else if (totalScore) {
      /*
       * Only compare the grade if a score exists.
       */
      const numericScore = Number(totalScore);

      if (Number.isFinite(numericScore)) {
        const expectedGrade =
          calculateExpectedGrade(numericScore);

        if (grade !== expectedGrade) {
          issues.push({
            matricNo,
            studentName,
            issue: `Grade ${grade} does not match total score ${numericScore}. Expected ${expectedGrade}`,
          });
        }
      }
    }
  });

  return issues;
}

/**
 * Determine the expected grade from the total score.
 *
 * This matches the grading scale currently used
 * by the Excel parser.
 */
function calculateExpectedGrade(
  score: number,
): string {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";

  return "F";
}

export default function UploadValidationProgressScreen() {
  const setCurrentStep = useUploadWizardStore(
    (s) => s.setCurrentStep,
  );

  const previewRows = useUploadWizardStore(
    (s) => s.previewRows,
  );

  const setValidationIssues = useUploadWizardStore(
    (s) => s.setValidationIssues,
  );

  const hasStarted = useRef(false);

  useEffect(() => {
    setCurrentStep("validation-progress");
  }, [setCurrentStep]);

  useEffect(() => {
    if (hasStarted.current) return;

    hasStarted.current = true;

    /*
     * Give React a chance to render the spinner before
     * running validation.
     */
    const validate = async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });

      const issues = validateRows(previewRows);

      setValidationIssues(issues);

      const resultsStep = WIZARD_STEPS.find(
        (step) =>
          step.id === "validation-results",
      );

      if (resultsStep) {
        window.location.assign(
          resultsStep.href,
        );
      }
    };

    validate();
  }, [
    previewRows,
    setValidationIssues,
  ]);

  return (
    <WizardShell title="Validation in Progress">
      <UploadSectionCard>
        <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
          <LoaderCircle
            className="size-20 animate-spin text-[#2e63e5]"
            strokeWidth={1.5}
          />

          <h3 className="mt-8 text-4xl font-semibold text-slate-700">
            Validating Results
          </h3>

          <p className="mt-4 max-w-xl text-xl text-slate-400">
            We are checking the uploaded results
            for missing values, invalid scores,
            duplicate matric numbers, and other
            issues. Please wait...
          </p>

          <div className="mt-8 rounded-xl bg-[#d6e9ff] px-6 py-4 text-[#2e63e5]">
            <p className="text-lg font-semibold">
              ⓘ Do not close this page while
              validation is in progress
            </p>
          </div>
        </div>
      </UploadSectionCard>
    </WizardShell>
  );
}
