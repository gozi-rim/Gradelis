"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/cn";

export function RoleViewToggle() {
  const pathname = usePathname();
  const isHod = pathname.startsWith("/hod");

  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <Link
        href="/dashboard"
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
          !isHod ? "bg-[#2e63e5] text-white" : "text-slate-600 hover:bg-slate-50",
        )}
      >
        Student view
      </Link>
      <Link
        href="/hod/dashboard"
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm",
          isHod ? "bg-[#2e63e5] text-white" : "text-slate-600 hover:bg-slate-50",
        )}
      >
        HOD view
      </Link>
    </div>
  );
}
