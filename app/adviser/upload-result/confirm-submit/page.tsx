"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { WizardNavigation } from "@/features/upload-result/components/wizard-navigation";
import { WizardShell } from "@/features/upload-result/components/wizard-shell";
import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";

export default function UploadConfirmSubmitScreen() {
  const router = useRouter();

  const setCurrentStep = useUploadWizardStore((s) => s.setCurrentStep);

  const uploadedFile = useUploadWizardStore((s) => s.uploadedFile);

  const session = useUploadWizardStore((s) => s.session);

  const previewRows = useUploadWizardStore((s) => s.previewRows);

  const validationIssues = useUploadWizardStore((s) => s.validationIssues);

  const isSubmitted = useUploadWizardStore((s) => s.isSubmitted);

  const markSubmitted = useUploadWizardStore((s) => s.markSubmitted);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStep("confirm-submit");
  }, [setCurrentStep]);

  /*
   * The number of records actually parsed from the Excel file.
   */
  const recorded = previewRows.length;

  /*
   * The number of validation issues discovered earlier.
   */
  const issuesFound = validationIssues.length;

  /*
   * The submission is only allowed when:
   * - a file exists
   * - results were successfully parsed
   * - validation found no issues
   * - the submission has not already happened
   */
  const canSubmit =
    uploadedFile !== null && recorded > 0 && issuesFound === 0 && !isSubmitted;

  /*
   * Handle the actual confirmation action.
   *
   * For now this marks the wizard as submitted.
   * The database/API submission should be added here later.
   */
  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);

      /*
       * TODO:
       * Replace this with your server action/API call.
       *
       * Example:
       *
       * await submitResults({
       *   session,
       *   rows: previewRows,
       * });
       */

      markSubmitted();
    } catch (error) {
      console.error("Failed to submit results:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * Determine the status message shown to the user.
   */
  const getStatusMessage = () => {
    if (isSubmitted) {
      return "These results have already been submitted for review.";
    }

    if (!uploadedFile) {
      return "No result file has been uploaded.";
    }

    if (recorded === 0) {
      return "No student results were found in the uploaded file.";
    }

    if (issuesFound > 0) {
      return "Please resolve all validation issues before submitting.";
    }

    return "Once Submitted, The HOD will be notified for review";
  };

  const statusMessage = getStatusMessage();

  return (
    <WizardShell title="Validation in Progress">
      <UploadSectionCard>
        <h3 className="text-5xl font-semibold text-slate-700">
          Submission Summary
        </h3>

        <dl className="mt-8 grid gap-y-6 text-2xl sm:grid-cols-2 sm:gap-x-16">
          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">File name</dt>

            <dd className="break-all font-semibold text-slate-700">
              {uploadedFile?.name ?? "No file selected"}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Session</dt>

            <dd className="font-semibold text-slate-700">
              {session || "Not selected"}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Results Recorded</dt>

            <dd className="font-semibold text-slate-700">{recorded}</dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Issues Found</dt>

            <dd
              className={
                issuesFound > 0
                  ? "font-semibold text-red-500"
                  : "font-semibold text-slate-700"
              }
            >
              {issuesFound}
            </dd>
          </div>
        </dl>

        <div
          className={`mt-8 rounded-xl px-6 py-4 text-center ${
            isSubmitted || canSubmit
              ? "bg-[#d9f6f0] text-[#57c4b4]"
              : "bg-red-50 text-red-500"
          }`}
        >
          <p className="text-lg font-semibold">ⓘ {statusMessage}</p>
        </div>
      </UploadSectionCard>

      <WizardNavigation
        nextLabel={
          isSubmitting ? "Submitting..." : isSubmitted ? "Submitted" : "Submit"
        }
        disabled={!canSubmit || isSubmitting}
        onNext={handleSubmit}
      />
    </WizardShell>
  );
}
