export const dynamic = "force-dynamic";

import type { ReactNode } from "react";

import { WizardHydrator } from "@/features/upload-result/components/wizard-hydrator";

export default function UploadResultLayout({ children }: { children: ReactNode }) {
  return (
    <WizardHydrator>
      <div>{children}</div>
    </WizardHydrator>
  );
}
