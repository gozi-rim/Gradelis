"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/shared/lib/cn";
import {
  WIZARD_STEPS,
  getStepIndex,
  useUploadWizardStore,
} from "@/features/upload-result/store/upload-wizard-store";

type WizardNavigationProps = {
  nextLabel?: string;
  showCancel?: boolean;
  disabled?: boolean;
  onNext?: () => boolean | Promise<boolean>;
};

export function WizardNavigation({
  nextLabel = "Proceed",
  showCancel = true,
  disabled = false,
  onNext,
}: WizardNavigationProps) {
  const router = useRouter();
  const currentStep = useUploadWizardStore((s) => s.currentStep);
  const reset = useUploadWizardStore((s) => s.reset);
  const markSubmitted = useUploadWizardStore((s) => s.markSubmitted);

  const currentIndex = getStepIndex(currentStep);
  const previousStep = currentIndex > 0 ? WIZARD_STEPS[currentIndex - 1] : null;
  const nextStep =
    currentIndex < WIZARD_STEPS.length - 1
      ? WIZARD_STEPS[currentIndex + 1]
      : null;
  const isFinalStep = !nextStep;

  const handleCancel = () => {
    reset();
    router.push("/adviser/upload-result");
  };

  const handleBack = () => {
    if (previousStep) router.push(previousStep.href);
  };

  const handleNext = async () => {
    const allowed = onNext ? await onNext() : true;
    if (!allowed) return;
    if (isFinalStep) {
      markSubmitted();
      router.push("/adviser/dashboard");
      return;
    }
    if (nextStep) router.push(nextStep.href);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
      {showCancel ? (
        <button
          type="button"
          onClick={handleCancel}
          className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]"
        >
          Cancel
        </button>
      ) : (
        <span />
      )}

      <div className="flex flex-wrap gap-3">
        {previousStep ? (
          <button
            type="button"
            onClick={handleBack}
            className="h-12 rounded-xl border border-[#2e63e5] px-8 text-lg font-semibold text-[#2e63e5]"
          >
            Go back
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleNext}
          disabled={disabled}
          className={cn(
            "h-12 rounded-xl bg-[#2e63e5] text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
            isFinalStep ? "px-12" : "px-8",
          )}
        >
          {isFinalStep ? "Submit" : nextLabel}
        </button>
      </div>
    </div>
  );
}
