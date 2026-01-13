// components/auth/auth-guard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // ✅ client-only check
    const token =
      localStorage.getItem("adminToken") || localStorage.getItem("token");

    const isLoginPage = pathname === "/login";

    if (!token && !isLoginPage) {
      setAllowed(false);
      setReady(true);
      router.replace("/login");
      return;
    }

    // If token exists, allow
    setAllowed(true);
    setReady(true);

    // Optional: if already logged in and you are on /login, push to dashboard
    if (token && isLoginPage) {
      router.replace("/dashboard");
    }
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}