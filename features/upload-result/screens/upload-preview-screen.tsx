"use client";

import { useEffect } from "react";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";
import { WizardNavigation } from "@/features/upload-result/components/wizard-navigation";
import { WizardShell } from "@/features/upload-result/components/wizard-shell";
import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";

export function UploadPreviewScreen() {
  const setCurrentStep = useUploadWizardStore((s) => s.setCurrentStep);
  const uploadedFile = useUploadWizardStore((s) => s.uploadedFile);
  const session = useUploadWizardStore((s) => s.session);
  const previewRows = useUploadWizardStore((s) => s.previewRows);

  useEffect(() => {
    setCurrentStep("preview");
  }, [setCurrentStep]);

  return (
    <WizardShell
      title="File Preview"
      meta={
        <>
          <p>
            File name :{" "}
            <span className="font-semibold">
              {uploadedFile?.name ?? "ECE_503.1_Results_xlsx"}
            </span>
          </p>
          <p>
            Session : <span className="font-semibold">{session}</span>
          </p>
        </>
      }
    >
      <UploadSectionCard>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm sm:text-base">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-4 py-3">Matriculation number</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">CA</th>
                <th className="px-4 py-3">Exam</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.length > 0 ? (
                previewRows.map((row) => (
                  <tr
                    key={row.matricNo}
                    className="border-b border-slate-100 text-slate-500"
                  >
                    <td className="px-4 py-2.5">{row.matricNo}</td>
                    <td className="px-4 py-2.5">{row.score}</td>
                    <td className="px-4 py-2.5">{row.grade}</td>
                    <td className="px-4 py-2.5">{row.ca}</td>
                    <td className="px-4 py-2.5">{row.exam}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No preview rows yet. Upload a file first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </UploadSectionCard>

      <WizardNavigation nextLabel="Proceed to validation" />
    </WizardShell>
  );
}
