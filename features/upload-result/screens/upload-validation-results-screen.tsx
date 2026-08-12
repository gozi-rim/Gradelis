"use client";

import { useEffect } from "react";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { WizardNavigation } from "@/features/upload-result/components/wizard-navigation";
import { WizardShell } from "@/features/upload-result/components/wizard-shell";
import {
  ValidationIssue,
  useUploadWizardStore,
} from "@/features/upload-result/store/upload-wizard-store";
import { cn } from "@/shared/lib/cn";

const defaultIssues: ValidationIssue[] = [
  { matricNo: "U2021/3020035", studentName: "Charles Joel", issue: "Missing results" },
  { matricNo: "U2021/3020036", studentName: "Charles Joel", issue: "Missing results" },
];

const summaryCards: ReadonlyArray<[string, string, string]> = [
  ["Total Students", "140", "text-slate-700"],
  ["Result Recorded", "138", "text-slate-700"],
  ["Valid", "138", "text-[#57c4b4]"],
  ["Issues", "2", "text-[#ff3d3d]"],
];

export function UploadValidationResultsScreen() {
  const setCurrentStep = useUploadWizardStore((s) => s.setCurrentStep);
  const validationIssues = useUploadWizardStore((s) => s.validationIssues);
  const setValidationIssues = useUploadWizardStore(
    (s) => s.setValidationIssues,
  );

  useEffect(() => {
    setCurrentStep("validation-results");
    if (validationIssues.length === 0) {
      setValidationIssues(defaultIssues);
    }
  }, [setCurrentStep, validationIssues.length, setValidationIssues]);

  return (
    <WizardShell title="Validation Results">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([title, value, color]) => (
          <article key={title} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xl font-semibold text-slate-400">{title}</p>
            <p className={cn("mt-3 text-4xl font-semibold", color)}>{value}</p>
          </article>
        ))}
      </section>

      <UploadSectionCard>
        <h3 className="text-3xl font-semibold text-slate-700">Issues</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="px-4 py-3">Mat no</th>
                <th className="px-4 py-3">Student name</th>
                <th className="px-4 py-3 text-[#ff3d3d]">Issue</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {validationIssues.map((issue, idx) => (
                <tr
                  key={`${issue.matricNo}-${idx}`}
                  className="border-b border-slate-100"
                >
                  <td className="px-4 py-3">{issue.matricNo}</td>
                  <td className="px-4 py-3">{issue.studentName}</td>
                  <td className="px-4 py-3">{issue.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </UploadSectionCard>

      <WizardNavigation nextLabel="Proceed to Confirm" />
    </WizardShell>
  );
}
