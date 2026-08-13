import { PortalShell } from "@/app/_components/portal-shell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalShell title="Adviser Dashboard" role="adviser" showSessionSelect={true} >
      {children}
    </PortalShell >
  )
}
