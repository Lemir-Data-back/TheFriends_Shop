"use client"

import Link from "next/link"

export function AuthModeSwitch({ active }: { active: "login" | "register" }) {
  return (
    <div className="relative grid grid-cols-2 w-full max-w-sm mx-auto mb-6 p-1 rounded-full bg-tf-gray-soft">
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-tf-black transition-transform duration-300 ease-out ${
          active === "register" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <Link
        href="/auth/login"
        className={`relative z-10 py-2.5 text-center rounded-full font-sans text-[13px] font-bold transition-colors ${
          active === "login" ? "text-white" : "text-tf-text-muted hover:text-tf-text"
        }`}
      >
        Se connecter
      </Link>
      <Link
        href="/auth/register"
        className={`relative z-10 py-2.5 text-center rounded-full font-sans text-[13px] font-bold transition-colors ${
          active === "register" ? "text-white" : "text-tf-text-muted hover:text-tf-text"
        }`}
      >
        Créer un compte
      </Link>
    </div>
  )
}
