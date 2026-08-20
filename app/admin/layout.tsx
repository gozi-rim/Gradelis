import { PortalShell } from "@/app/_components/portal-shell";

export default function AdministratorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalShell title="Administrator Dashboard" role="admin">
      {children}
    </PortalShell>
  );
}
