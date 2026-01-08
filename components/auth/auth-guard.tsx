"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token && pathname?.startsWith("/dashboard")) {
      router.replace("/login");
    }
  }, [isHydrated, token, router, pathname]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!token && pathname?.startsWith("/dashboard")) {
    return null;
  }

  return <>{children}</>;
}
