"use client";

import { useEffect } from "react";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { WizardNavigation } from "@/features/upload-result/components/wizard-navigation";
import { WizardShell } from "@/features/upload-result/components/wizard-shell";
import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";

export function UploadConfirmSubmitScreen() {
  const setCurrentStep = useUploadWizardStore((s) => s.setCurrentStep);
  const uploadedFile = useUploadWizardStore((s) => s.uploadedFile);
  const session = useUploadWizardStore((s) => s.session);
  const validationIssues = useUploadWizardStore((s) => s.validationIssues);

  useEffect(() => {
    setCurrentStep("confirm-submit");
  }, [setCurrentStep]);

  const recorded = 138;
  const issuesFound = validationIssues.length;

  return (
    <WizardShell title="Validation in Progress">
      <UploadSectionCard>
        <h3 className="text-5xl font-semibold text-slate-700">
          Submission Summary
        </h3>

        <dl className="mt-8 grid gap-y-6 text-2xl sm:grid-cols-2 sm:gap-x-16">
          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">File name</dt>
            <dd className="font-semibold text-slate-700">
              {uploadedFile?.name ?? "ECE_503.1_Results_xlsx"}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Session</dt>
            <dd className="font-semibold text-slate-700">{session}</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Results Recorded</dt>
            <dd className="font-semibold text-slate-700">{recorded}</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold text-slate-500">Issues Found</dt>
            <dd className="font-semibold text-slate-700">{issuesFound}</dd>
          </div>
        </dl>

        <div className="mt-8 rounded-xl bg-[#d9f6f0] px-6 py-4 text-center text-[#57c4b4]">
          <p className="text-lg font-semibold">
            ⓘ Once Submitted, The HOD will be notified for review
          </p>
        </div>
      </UploadSectionCard>

      <WizardNavigation nextLabel="Submit" />
    </WizardShell>
  );
}
