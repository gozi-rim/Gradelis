import { PortalShell } from "@/app/_components/portal-shell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalShell title="HOD Dashboard" role="hod" >
      {children}
    </PortalShell >
  )
}
