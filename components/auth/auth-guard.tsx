"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

/**
 * AuthGuard
 * - Accepts token stored in either:
 *   - localStorage["adminToken"]  (your dashboard)
 *   - localStorage["token"]       (compat / older builds)
 * - Only redirects AFTER hydration (prevents false redirects on Render)
 */
export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Ensure this only runs in browser
    if (typeof window === "undefined") return;

    const adminToken = localStorage.getItem("adminToken");
    const token = localStorage.getItem("token");

    const t = adminToken || token;

    // If token exists, we allow.
    // (You can add role checking later if you want)
    if (t && t.length > 10) {
      setAllowed(true);
    } else {
      setAllowed(false);

      // avoid redirect loop
      if (pathname !== "/login") {
        router.replace("/login");
      }
    }

    setReady(true);
  }, [router, pathname]);

  // While deciding, show nothing or a loader
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  // If not allowed, we already redirected to /login
  if (!allowed) return null;

  return <>{children}</>;
}