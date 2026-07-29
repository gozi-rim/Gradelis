import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

type UploadSectionCardProps = ComponentPropsWithoutRef<"section">;

export function UploadSectionCard({ className, ...props }: UploadSectionCardProps) {
  return (
    <section
      className={cn("rounded-2xl bg-white p-6 shadow-sm sm:p-8", className)}
      {...props}
    />
  );
}
