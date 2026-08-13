"use client";

import { useEffect } from "react";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";

import { WizardNavigation } from "@/features/upload-result/components/wizard-navigation";

import { WizardShell } from "@/features/upload-result/components/wizard-shell";

import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";

export default function UploadPreviewScreen() {
  const setCurrentStep =
    useUploadWizardStore(
      (s) => s.setCurrentStep,
    );

  const uploadedFile =
    useUploadWizardStore(
      (s) => s.uploadedFile,
    );

  /*
   * Shared metadata for this upload.
   */

  const courseCode =
    useUploadWizardStore(
      (s) => s.courseCode,
    );

  const session =
    useUploadWizardStore(
      (s) => s.session,
    );

  const semester =
    useUploadWizardStore(
      (s) => s.semester,
    );

  const creditUnit =
    useUploadWizardStore(
      (s) => s.creditUnit,
    );

  /*
   * Student-level result data.
   */

  const previewRows =
    useUploadWizardStore(
      (s) => s.previewRows,
    );

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
              {uploadedFile?.name ??
                "No file selected"}
            </span>
          </p>

          <p>
            Course Code :{" "}
            <span className="font-semibold">
              {courseCode ||
                "Not provided"}
            </span>
          </p>

          <p>
            Academic Session :{" "}
            <span className="font-semibold">
              {session ||
                "Not provided"}
            </span>
          </p>

          <p>
            Semester :{" "}
            <span className="font-semibold">
              {semester ||
                "Not provided"}
            </span>
          </p>

          <p>
            Credit Unit :{" "}
            <span className="font-semibold">
              {creditUnit ||
                "Not provided"}
            </span>
          </p>
        </>
      }
    >
      <UploadSectionCard>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm sm:text-base">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="whitespace-nowrap px-4 py-3">
                  Matriculation number
                </th>

                <th className="whitespace-nowrap px-4 py-3">
                  Total Score
                </th>

                <th className="whitespace-nowrap px-4 py-3">
                  Grade
                </th>
              </tr>
            </thead>

            <tbody>
              {previewRows.length >
              0 ? (
                previewRows.map(
                  (row, index) => (
                    <tr
                      key={`${row.matricNo}-${index}`}
                      className="border-b border-slate-100 text-slate-500"
                    >
                      <td className="px-4 py-2.5">
                        {row.matricNo ? (
                          row.matricNo
                        ) : (
                          <span className="font-medium text-[#ff3d3d]">
                            Missing
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2.5">
                        {row.totalScore ? (
                          row.totalScore
                        ) : (
                          <span className="font-medium text-[#ff3d3d]">
                            Missing
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2.5">
                        {row.grade ? (
                          row.grade
                        ) : (
                          <span className="font-medium text-[#ff3d3d]">
                            Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No preview rows yet.
                    Upload a file first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </UploadSectionCard>

      <WizardNavigation
        nextLabel="Proceed to validation"
      />
    </WizardShell>
  );
}
