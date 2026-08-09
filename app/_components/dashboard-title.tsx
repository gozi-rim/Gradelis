import { PortalRole } from "@/types/navbar-role";

type DashboardHeaderProps = {
  role: PortalRole;
  title: string;
};

const roleLabel: Record<PortalRole, string> = {
  adviser: "Adviser Portal",
  hod: "Head of Department",
  admin: "System Administration",
};

export function DashboardHeader({ role, title }: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-2xl font-semibold uppercase tracking-wide text-slate-600">
          {roleLabel[role]}
        </p>

      </div>
      <span className="text-sm text-slate-400">{today}</span>
    </div>
  );
}
