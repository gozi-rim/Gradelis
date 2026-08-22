"use client";

import { useEffect, useState } from "react";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { WizardNavigation } from "@/features/upload-result/components/wizard-navigation";
import { WizardShell } from "@/features/upload-result/components/wizard-shell";
import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";
import {
  submitResultUpload,
  type UploadSubmitState,
} from "@/lib/actions/upload-results";

export default function UploadConfirmSubmitScreen() {
  const setCurrentStep = useUploadWizardStore((s) => s.setCurrentStep);
  const uploadedFile = useUploadWizardStore((s) => s.uploadedFile);
  const rawFile = useUploadWizardStore((s) => s.rawFile);
  const session = useUploadWizardStore((s) => s.session);
  const courseCode = useUploadWizardStore((s) => s.courseCode);
  const previewRows = useUploadWizardStore((s) => s.previewRows);
  const validationIssues = useUploadWizardStore((s) => s.validationIssues);
  const isSubmitted = useUploadWizardStore((s) => s.isSubmitted);
  const markSubmitted = useUploadWizardStore((s) => s.markSubmitted);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<UploadSubmitState | null>(null);

  useEffect(() => {
    setCurrentStep("confirm-submit");
  }, [setCurrentStep]);

  const recorded = previewRows.length;
  const issuesFound = validationIssues.length;

  /*
   * The browser checks are only a heads-up. The server checks again
   * and flags whatever it doesn't like, so issues don't block us here.
   * What does block us is having no file left to send.
   */
  const canSubmit = rawFile !== null && recorded > 0 && !isSubmitted;

  const handleSubmit = async (): Promise<boolean> => {
    if (!canSubmit || isSubmitting || !rawFile) return false;

    setIsSubmitting(true);
    setResult(null);

    try {
      const data = new FormData();
      data.set("file", rawFile);

      const state = await submitResultUpload({}, data);
      setResult(state);

      if (state.message !== "success") return false;

      markSubmitted();
      return false;
    } catch {
      setResult({ message: "Could not reach the server. Please try again." });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusMessage = () => {
    if (result && result.message !== "success") return result.message;
    if (isSubmitted && result?.message === "success") {
      const imported = result.imported ?? 0;
      const flagged = result.flagged ?? 0;
      return flagged === 0
        ? `${imported} results imported. Nothing needs review.`
        : `${imported} results imported, ${flagged} item(s) sent to the HOD for review.`;
    }
    if (isSubmitted) return "These results have already been submitted for review.";
    if (!uploadedFile) return "No result file has been uploaded.";
    if (!rawFile) return "The file was lost on reload. Please upload it again.";
    if (recorded === 0) return "No student results were found in the uploaded file.";
    if (issuesFound > 0) {
      return `${issuesFound} issue(s) were spotted here. You can still submit — the HOD reviews anything flagged.`;
    }
    return "Once Submitted, The HOD will be notified for review";
  };

  const isGood = isSubmitted || (canSubmit && issuesFound === 0);

  return (
    <WizardShell title="Confirm and Submit">
      <UploadSectionCard>
        <h3 className="text-5xl font-semibold text-slate-700">Submission Summary</h3>

        <dl className="mt-8 grid gap-y-6 text-2xl sm:grid-cols-2 sm:gap-x-16">
          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">File name</dt>
            <dd className="break-all font-semibold text-slate-700">
              {uploadedFile?.name ?? "No file selected"}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Course</dt>
            <dd className="font-semibold text-slate-700">{courseCode || "Not detected"}</dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Session</dt>
            <dd className="font-semibold text-slate-700">{session || "Not detected"}</dd>
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
            isGood ? "bg-[#d9f6f0] text-[#57c4b4]" : "bg-red-50 text-red-500"
          }`}
        >
          <p className="text-lg font-semibold">ⓘ {getStatusMessage()}</p>
        </div>
      </UploadSectionCard>

      <WizardNavigation
        nextLabel={isSubmitting ? "Submitting..." : isSubmitted ? "Submitted" : "Submit"}
        disabled={!canSubmit || isSubmitting}
        onNext={handleSubmit}
      />
    </WizardShell>
  );
}
