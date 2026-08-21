"use client";

import { useEffect } from "react";

export function HydrationFix() {
  useEffect(() => {
    // Intercept known browser extension hydration noise (e.g. Bitdefender bis_skin_checked)
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const firstArg = typeof args[0] === "string" ? args[0] : "";
      const secondArg = typeof args[1] === "string" ? args[1] : "";
      const full = firstArg + " " + secondArg;

      if (
        full.includes("bis_skin_checked") ||
        full.includes("kiilhncajadbgbmdbdcopdpnmdhlbdle") ||
        full.includes("crxlauncher") ||
        full.includes("chrome-extension://")
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
