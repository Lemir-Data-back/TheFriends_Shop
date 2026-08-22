"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { AuthModeSwitch } from "@/components/auth/AuthModeSwitch";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authMode = pathname === "/auth/register" ? "register" : pathname === "/auth/login" ? "login" : null;

  return (
    <div className="min-h-screen bg-tf-bg flex flex-col">
      <TopNav />

      {/* Contenu */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-10">
        {authMode && <AuthModeSwitch active={authMode} />}
        {children}
      </main>

      <Footer />
    </div>
  );
}
