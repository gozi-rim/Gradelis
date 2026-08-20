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
import { PortalRole } from "@/types/navbar-role";

type NavItem = {
  label: string;
  href: string;          // always absolute, e.g. "/hod/reports"
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;       // true => only active on exact pathname match
  disabled?: boolean;    // true => never active, not a real link yet
  badgeKey?: string;     // optional key into a badges map, not a hardcoded number
};

const navConfig: Record<PortalRole, NavItem[]> = {
  adviser: [
    { label: "Dashboard", href: "/adviser", exact: true, icon: DashboardIcon },
    { label: "Upload result", href: "/adviser/upload-result", icon: UploadIcon },
    { label: "Student Records", href: "/adviser/student-records", icon: StudentsIcon },
    { label: "Graduation Report", href: "/adviser/graduation-report", icon: ReportIcon },
    { label: "Settings", href: "/adviser/settings", icon: SettingsIcon },
  ],
  hod: [
    { label: "Dashboard", href: "/hod", exact: true, icon: DashboardIcon },
    { label: "Pending Reviews", href: "/hod/pending-reviews", icon: UploadIcon, badgeKey: "pendingReviews" },
    { label: "Student Records", href: "/hod/student-records", icon: StudentsIcon },
    { label: "Reports", href: "/hod/reports", icon: ReportIcon },
    { label: "Notifications", href: "#", icon: BellIcon, disabled: true },
    { label: "Settings", href: "/hod/settings", icon: SettingsIcon, disabled: true },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/", exact: true, icon: DashboardIcon },
    { label: "User Management", href: "/admin/user-management", icon: StudentsIcon },
    { label: "Academic Sessions", href: "/admin/academic-sessions", icon: ReportIcon },
    { label: "System Logs", href: "/admin/system-logs", icon: BellIcon },
    { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ],
};

function isNavItemActive(pathname: string, item: NavItem) {
  if (item.disabled) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type SidebarNavProps = {
  role?: PortalRole;
  onNavigate?: () => void;
  badges?: Partial<Record<string, string | number>>; // e.g. { pendingReviews: 8 }
};

export function SidebarNav({ role = "adviser", onNavigate, badges }: SidebarNavProps) {
  const pathname = usePathname();
  const navItems = navConfig[role];

  return (
    <div className="flex h-full flex-col bg-[#172a49] px-4 py-8 text-white">
      <div className="px-2">
        <BrandLogo compact />
        <p className="mt-2 text-3xl font-semibold">GradElis</p>
      </div>
      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item);
          const Icon = item.icon;
          const badgeValue = item.badgeKey ? badges?.[item.badgeKey] : undefined;

          if (item.disabled) {
            return (
              <span
                key={item.label}
                aria-disabled
                className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500"
              >
                <Icon className="size-4" />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl pr-20 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#2e63e5] text-white"
                  : "text-slate-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4" />
                {item.label}
              </span>
              {badgeValue ? (
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ff5858] text-[10px] font-semibold text-white">
                  {badgeValue}
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
      {role === "admin" ? (
        <div className="mt-auto border-t border-white/10 px-2 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-slate-200" />
            <div>
              <p className="text-sm font-semibold">Admin User</p>
              <p className="text-xs text-slate-300">System Administrator</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
