"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AppShell } from "@/components/layout/AppShell";
import { SessionExpiredHandler } from "@/components/SessionExpiredHandler";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiredHandler />
      <Suspense fallback={null}>
        <AppShell>{children}</AppShell>
      </Suspense>
      <CartDrawer />
    </QueryClientProvider>
  );
}
