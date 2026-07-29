import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

type SectionHeadingProps = {
  title: string;
  description?: string;
  centered?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "title">;

export function SectionHeading({
  title,
  description,
  centered = false,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "space-y-2",
        centered && "mx-auto max-w-2xl text-center",
        className,
      )}
      {...props}
    >
      <h2 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
