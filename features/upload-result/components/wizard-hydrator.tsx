"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";

type WizardHydratorProps = {
  children: ReactNode;
};

export function WizardHydrator({ children }: WizardHydratorProps) {
  const [hydrated, setHydrated] = useState(() =>
    typeof window !== "undefined"
      ? (useUploadWizardStore.persist?.hasHydrated() ?? false)
      : false,
  );

  useEffect(() => {
    if (hydrated) return;

    const persist = useUploadWizardStore.persist;
    if (!persist) return;

    const unsubFinish = persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsubFinish;
  }, [hydrated]);

  if (!hydrated) return null;
  return <>{children}</>;
}
