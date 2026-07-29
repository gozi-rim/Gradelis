"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { ProgramSelect } from "@/features/portal/components/program-select";
import { SidebarNav } from "@/features/portal/components/sidebar-nav";

type PortalRole = "student" | "hod";

type PortalShellProps = {
  title: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  role?: PortalRole;
  showProgramSelect?: boolean;
};

export function PortalShell({
  title,
  children,
  rightSlot,
  role = "student",
  showProgramSelect = true,
}: PortalShellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-700">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] lg:block">
        <SidebarNav role={role} />
      </aside>

      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="close menu"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative h-full w-[280px]">
            <SidebarNav role={role} onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[228px]">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-14">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 lg:hidden"
                onClick={() => setIsOpen(true)}
                aria-label="open menu"
              >
                ☰
              </button>
              <h1 className="text-2xl font-semibold text-slate-700 sm:text-[40px] sm:leading-none">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {rightSlot}
              {showProgramSelect ? <ProgramSelect /> : null}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-14 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
