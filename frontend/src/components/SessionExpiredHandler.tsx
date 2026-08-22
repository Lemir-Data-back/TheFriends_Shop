"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export function SessionExpiredHandler() {
  const { logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    function handle(e: Event) {
      const shouldRedirect = (e as CustomEvent<{ redirect: boolean }>).detail?.redirect;
      logout();
      if (shouldRedirect) {
        router.push("/auth/login");
      }
    }
    window.addEventListener("tf:session-expired", handle);
    return () => window.removeEventListener("tf:session-expired", handle);
  }, [logout, router]);

  return null;
}
