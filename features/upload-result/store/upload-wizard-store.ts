"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const WIZARD_STEPS = [
  { id: "upload", label: "Upload File", href: "/adviser/upload-result" },
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

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export type PreviewRow = {
  matricNo: string;
  score: string;
  grade: string;
  ca: string;
  exam: string;
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
  session: string;
  previewRows: PreviewRow[];
  validationProgress: number;
  validationIssues: ValidationIssue[];
  isSubmitted: boolean;

  setCurrentStep: (step: WizardStepId) => void;
  setUploadedFile: (file: WizardFileMeta | null) => void;
  setSession: (session: string) => void;
  setPreviewRows: (rows: PreviewRow[]) => void;
  setValidationProgress: (value: number) => void;
  setValidationIssues: (issues: ValidationIssue[]) => void;
  markSubmitted: () => void;
  reset: () => void;
};

const initialState = {
  currentStep: "upload" as WizardStepId,
  uploadedFile: null,
  session: "2025/2026",
  previewRows: [],
  validationProgress: 0,
  validationIssues: [],
  isSubmitted: false,
};

export const useUploadWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,
      setCurrentStep: (step) => set({ currentStep: step }),
      setUploadedFile: (file) => set({ uploadedFile: file }),
      setSession: (session) => set({ session }),
      setPreviewRows: (rows) => set({ previewRows: rows }),
      setValidationProgress: (value) => set({ validationProgress: value }),
      setValidationIssues: (issues) => set({ validationIssues: issues }),
      markSubmitted: () => set({ isSubmitted: true }),
      reset: () => set(initialState),
    }),
    {
      name: "gradelis.upload-wizard",
      partialize: (state) => ({
        uploadedFile: state.uploadedFile,
        session: state.session,
        previewRows: state.previewRows,
        validationIssues: state.validationIssues,
        isSubmitted: state.isSubmitted,
      }),
    },
  ),
);

export function getStepIndex(stepId: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === stepId);
}

export function getStepStatus(
  stepId: WizardStepId,
  currentStepId: WizardStepId,
): "complete" | "current" | "upcoming" {
  const stepIdx = getStepIndex(stepId);
  const currentIdx = getStepIndex(currentStepId);
  if (stepIdx < currentIdx) return "complete";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}
