import { CheckCircleIcon } from "@/shared/icons/ui-icons";
import { cn } from "@/shared/lib/cn";

type StepStatus = "complete" | "current" | "upcoming";

type Step = {
  label: string;
  order: number;
  status: StepStatus;
};

export function UploadStepper({ steps }: { steps: Step[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            {step.status === "complete" ? (
              <span className="inline-flex items-center gap-2 text-[#57c4b4]">
                <CheckCircleIcon className="size-7" />
              </span>
            ) : (
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                  step.status === "current"
                    ? "border-[#2e63e5] bg-[#2e63e5] text-white"
                    : "border-slate-300 text-slate-500",
                )}
              >
                {step.order}
              </span>
            )}
            <span
              className={cn(
                "text-base",
                step.status === "current" ? "font-semibold text-[#2e63e5]" : "text-slate-400",
              )}
            >
              {step.label}
            </span>
          </div>

          {index < steps.length - 1 ? (
            <span className="hidden h-px w-10 bg-slate-300 sm:block" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
