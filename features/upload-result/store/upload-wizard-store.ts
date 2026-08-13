"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const WIZARD_STEPS = [
  {
    id: "upload",
    label: "Upload File",
    href: "/adviser/upload-result",
  },
  {
    id: "preview",
    label: "Preview Data",
    href: "/adviser/upload-result/preview",
  },
  {
    id: "validation-progress",
    label: "Validation",
    href: "/adviser/upload-result/validation-progress",
  },
  {
    id: "validation-results",
    label: "Validation Results",
    href: "/adviser/upload-result/validation-results",
  },
  {
    id: "confirm-submit",
    label: "Confirm and Submit",
    href: "/adviser/upload-result/confirm-submit",
  },
] as const;

export type WizardStepId =
  (typeof WIZARD_STEPS)[number]["id"];

/*
 * Student-level information.
 *
 * These are the only values that belong
 * to individual result rows.
 */
export type PreviewRow = {
  matricNo: string;
  totalScore: string;
  grade: string;
};

/*
 * Upload-level information.
 *
 * These values are shared by every row
 * in a single Excel result file.
 */
export type UploadMetadata = {
  courseCode: string;
  session: string;
  semester: string;
  creditUnit: string;
};

export type ValidationIssue = {
  matricNo: string;
  studentName: string;
  issue: string;
};

export type WizardFileMeta = {
  name: string;
  size: number;
};

type WizardState = {
  currentStep: WizardStepId;

  uploadedFile: WizardFileMeta | null;

  /*
   * Shared upload metadata.
   */
  courseCode: string;
  session: string;
  semester: string;
  creditUnit: string;

  /*
   * Student result rows.
   */
  previewRows: PreviewRow[];

  validationProgress: number;
  validationIssues: ValidationIssue[];

  isSubmitted: boolean;

  setCurrentStep: (
    step: WizardStepId,
  ) => void;

  setUploadedFile: (
    file: WizardFileMeta | null,
  ) => void;

  setUploadMetadata: (
    metadata: UploadMetadata,
  ) => void;

  setPreviewRows: (
    rows: PreviewRow[],
  ) => void;

  setValidationProgress: (
    value: number,
  ) => void;

  setValidationIssues: (
    issues: ValidationIssue[],
  ) => void;

  markSubmitted: () => void;

  reset: () => void;
};

const initialState = {
  currentStep:
    "upload" as WizardStepId,

  uploadedFile: null,

  /*
   * Shared course information.
   */
  courseCode: "",
  session: "",
  semester: "",
  creditUnit: "",

  previewRows: [],

  validationProgress: 0,

  validationIssues: [],

  isSubmitted: false,
};

export const useUploadWizardStore =
  create<WizardState>()(
    persist(
      (set) => ({
        ...initialState,

        setCurrentStep: (step) =>
          set({
            currentStep: step,
          }),

        setUploadedFile: (file) =>
          set({
            uploadedFile: file,
          }),

        setUploadMetadata: ({
          courseCode,
          session,
          semester,
          creditUnit,
        }) =>
          set({
            courseCode,
            session,
            semester,
            creditUnit,
          }),

        setPreviewRows: (rows) =>
          set({
            previewRows: rows,
          }),

        setValidationProgress: (
          value,
        ) =>
          set({
            validationProgress: value,
          }),

        setValidationIssues: (
          issues,
        ) =>
          set({
            validationIssues: issues,
          }),

        markSubmitted: () =>
          set({
            isSubmitted: true,
          }),

        reset: () =>
          set(initialState),
      }),
      {
        name: "gradelis.upload-wizard",

        partialize: (state) => ({
          uploadedFile:
            state.uploadedFile,

          courseCode:
            state.courseCode,

          session:
            state.session,

          semester:
            state.semester,

          creditUnit:
            state.creditUnit,

          previewRows:
            state.previewRows,

          validationIssues:
            state.validationIssues,

          isSubmitted:
            state.isSubmitted,
        }),
      },
    ),
  );

export function getStepIndex(
  stepId: WizardStepId,
): number {
  return WIZARD_STEPS.findIndex(
    (step) => step.id === stepId,
  );
}

export function getStepStatus(
  stepId: WizardStepId,
  currentStepId: WizardStepId,
):
  | "complete"
  | "current"
  | "upcoming" {
  const stepIdx =
    getStepIndex(stepId);

  const currentIdx =
    getStepIndex(currentStepId);

  if (stepIdx < currentIdx) {
    return "complete";
  }

  if (stepIdx === currentIdx) {
    return "current";
  }

  return "upcoming";
}
