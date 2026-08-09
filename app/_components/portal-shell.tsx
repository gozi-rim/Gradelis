"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SessionSelect } from "@/app/_components/session-select";
import { SidebarNav } from "@/app/_components/sidebar-nav";
import { PortalRole } from "@/types/navbar-role";
import { DashboardHeader } from "./dashboard-title";


type PortalShellProps = {
  title: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  role: PortalRole;
  showSessionSelect?: boolean;
};

export function PortalShell({
  title,
  children,
  rightSlot,
  role,
  showSessionSelect = false,
}: PortalShellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-700">
      <aside className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <SidebarNav role={role} />
      </aside>

      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="close menu"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative h-full w-6xl">
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
              <h1 className="font-semibold text-slate-700 sm:text-[40px] sm:leading-none">
                <DashboardHeader role={role} title={title} />
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {rightSlot}
              {showSessionSelect ? <SessionSelect /> : null}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-14 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
