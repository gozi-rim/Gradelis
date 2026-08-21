"use client";

import Link from "next/link";

import {
  WIZARD_STEPS,
  getStepStatus,
  useUploadWizardStore,
} from "@/features/upload-result/store/upload-wizard-store";
import { UploadStepper } from "@/features/upload-result/components/upload-stepper";

export function WizardStepper() {
  const currentStep = useUploadWizardStore((s) => s.currentStep);

  return (
    <div className="space-y-3">
      <UploadStepper
        steps={WIZARD_STEPS.map((step, index) => ({
          label: step.label,
          order: index + 1,
          status: getStepStatus(step.id, currentStep),
        }))}
      />
      <nav aria-label="Wizard steps" className="sr-only">
        <ol>
          {WIZARD_STEPS.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href}
                aria-current={step.id === currentStep ? "step" : undefined}
              >
                {step.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
