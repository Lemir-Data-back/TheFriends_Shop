import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-tf-bg flex flex-col">

      {/* Header */}
      <nav className="sticky top-0 z-50 flex items-center px-6 py-4 bg-white/70 backdrop-blur-md border-b border-tf-border/50">
        <Link href="/">
          <p className="font-serif text-[1.1rem] text-tf-black leading-none">TheFriends</p>
          <p className="font-sans text-[9px] tracking-[0.4em] text-tf-gold-dark uppercase mt-0.5">Shopping</p>
        </Link>
      </nav>

      {/* Contenu */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-tf-black border-t border-white/10 px-6 py-10">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-serif text-[1.2rem] text-tf-gold leading-none mb-1">TheFriends</p>
            <p className="font-sans text-[10px] tracking-[0.4em] text-tf-gold/60 uppercase mb-3">Shopping</p>
            <p className="font-sans text-[12px] text-white/50 italic">Ta mode, ton style.</p>
          </div>
          <div>
            <p className="font-sans text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Navigation</p>
            <ul className="space-y-2">
              {[
                { label: "Accueil", href: "/" },
                { label: "Shopping", href: "/shopping" },
                { label: "Se connecter", href: "/auth/login" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="font-sans text-[12px] text-white/60 hover:text-tf-gold transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-sans text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Contact</p>
            <ul className="space-y-2">
              <li>
                <a href="mailto:contact@thefriends.ci" className="font-sans text-[12px] text-white/60 hover:text-tf-gold transition-colors">
                  contact@thefriends.ci
                </a>
              </li>
              <li>
                <a href="tel:+22507000000" className="font-sans text-[12px] text-white/60 hover:text-tf-gold transition-colors">
                  +225 07 00 00 00 00
                </a>
              </li>
              <li className="font-sans text-[12px] text-white/60">Abidjan, Côte d&apos;Ivoire</li>
            </ul>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto mt-8 pt-5 border-t border-white/10 text-center">
          <p className="font-sans text-[11px] text-white/30">
            © {new Date().getFullYear()} TheFriends. Tous droits réservés.
          </p>
        </div>
      </footer>

    </div>
  );
}
