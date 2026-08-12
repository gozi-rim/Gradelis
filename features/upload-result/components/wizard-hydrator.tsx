"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useUploadWizardStore } from "@/features/upload-result/store/upload-wizard-store";

type WizardHydratorProps = {
  children: ReactNode;
};

export function WizardHydrator({ children }: WizardHydratorProps) {
  const [hydrated, setHydrated] = useState(() =>
    useUploadWizardStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubFinish = useUploadWizardStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsubFinish;
  }, []);

  if (!hydrated) return null;
  return <>{children}</>;
}
