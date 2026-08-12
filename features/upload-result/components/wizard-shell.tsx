import type { ReactNode } from "react";

import { WizardStepper } from "@/features/upload-result/components/wizard-stepper";

type WizardShellProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children: ReactNode;
};

export function WizardShell({ title, subtitle, meta, children }: WizardShellProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-5xl font-semibold text-slate-700">{title}</h2>
        {subtitle ? (
          <p className="mt-2 text-lg text-slate-400">{subtitle}</p>
        ) : null}
        {meta ? (
          <div className="mt-2 flex flex-wrap gap-8 text-2xl text-slate-500">
            {meta}
          </div>
        ) : null}
        <div className="mt-6">
          <WizardStepper />
        </div>
      </section>

      {children}
    </div>
  );
}
