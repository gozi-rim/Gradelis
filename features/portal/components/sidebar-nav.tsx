"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/shared/icons/brand";
import {
  BellIcon,
  DashboardIcon,
  ReportIcon,
  SettingsIcon,
  StudentsIcon,
  UploadIcon,
} from "@/shared/icons/ui-icons";
import { cn } from "@/shared/lib/cn";

type PortalRole = "student" | "hod";

type SidebarNavProps = {
  role?: PortalRole;
  onNavigate?: () => void;
};

const studentNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    label: "Upload result",
    href: "/upload-result",
    icon: UploadIcon,
    match: (pathname: string) => pathname.startsWith("/upload-result"),
  },
  {
    label: "Student Records",
    href: "/student-records",
    icon: StudentsIcon,
    match: (pathname: string) => pathname.startsWith("/student-records"),
  },
  {
    label: "Graduation Report",
    href: "/graduation-report",
    icon: ReportIcon,
    match: (pathname: string) => pathname.startsWith("/graduation-report"),
  },
  {
    label: "Settings",
    href: "#",
    icon: SettingsIcon,
    match: () => false,
  },
] as const;

const hodNavItems = [
  {
    label: "Dashboard",
    href: "/hod/dashboard",
    icon: DashboardIcon,
    match: (pathname: string) => pathname === "/hod/dashboard",
  },
  {
    label: "Pending Reviews",
    href: "/hod/pending-reviews",
    icon: UploadIcon,
    match: (pathname: string) => pathname.startsWith("/hod/pending-reviews"),
    badge: "8",
  },
  {
    label: "Student Records",
    href: "/hod/student-records",
    icon: StudentsIcon,
    match: (pathname: string) => pathname.startsWith("/hod/student-records"),
  },
  {
    label: "Reports",
    href: "/hod/reports",
    icon: ReportIcon,
    match: (pathname: string) => pathname.startsWith("/hod/reports"),
  },
  {
    label: "Notifications",
    href: "#",
    icon: BellIcon,
    match: () => false,
  },
  {
    label: "Settings",
    href: "#",
    icon: SettingsIcon,
    match: () => false,
  },
] as const;

export function SidebarNav({ role = "student", onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const navItems = role === "hod" ? hodNavItems : studentNavItems;

  return (
    <div className="flex h-full flex-col bg-[#172a49] px-4 py-8 text-white">
      <div className="px-2">
        <BrandLogo compact />
        <p className="mt-2 text-3xl font-semibold">GradElis</p>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#2e63e5] text-white"
                  : "text-slate-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4" />
                {item.label}
              </span>
              {"badge" in item && item.badge ? (
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ff5858] text-[10px] font-semibold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {role === "hod" ? (
        <div className="mt-auto border-t border-white/10 px-2 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-slate-200" />
            <div>
              <p className="text-sm font-semibold">Dr. Ibrahim Musa</p>
              <p className="text-xs text-slate-300">Head of Department</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
