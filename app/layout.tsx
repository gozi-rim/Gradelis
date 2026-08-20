import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { HydrationFix } from "@/app/_components/hydration-fix";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gradelis School Project",
  description: "Responsive school frontend built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  const origError = console.error;
                  console.error = function(...args) {
                    const full = args.map(a => (typeof a === 'string' ? a : (a && a.message) || '')).join(' ');
                    if (
                      full.includes('bis_skin_checked') ||
                      full.includes('chrome-extension://') ||
                      full.includes('kiilhncajadbgbmdbdcopdpnmdhlbdle') ||
                      full.includes('crxlauncher') ||
                      (full.includes('hydration') && full.includes('bis_skin_checked'))
                    ) {
                      return;
                    }
                    origError.apply(console, args);
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full bg-slate-50 text-slate-900">
        <HydrationFix />
        {children}
      </body>
    </html>
  );
}
