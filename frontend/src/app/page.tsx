import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { HomeSections } from "@/components/home/HomeSections";

export default function Home() {
  return (
    <main className="min-h-screen bg-tf-bg font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-tf-black min-h-[100vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="hero-gold-glow" />
        {/* Logo */}
        <div className="mb-8">
          <p className="font-serif text-display text-tf-gold leading-none">TheFriends</p>
          <p className="font-sans text-[13px] text-tf-gold tracking-[0.5em] uppercase mt-1 opacity-80">
            Shopping
          </p>
        </div>

        <p className="font-serif text-h2 text-white/80 max-w-lg leading-relaxed mb-10">
          La mode ivoirienne en ligne — prêt-à-porter, sur mesure et communauté.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/shopping"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-btn hover:bg-tf-gold-light transition-colors"
          >
            Découvrir le shopping
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent text-white border border-white/30 rounded-md font-sans font-medium text-btn hover:border-white/60 transition-colors"
          >
            Créer un compte
          </Link>
        </div>
      </section>

      {/* Sections animées par acteur */}
      <HomeSections />

      {/* CTA final */}
      <section className="bg-tf-black py-16 text-center px-4">
        <p className="font-serif text-h1 text-white mb-6">Ta mode, ton style.</p>
        <Link
          href="/shopping"
          className="inline-flex items-center gap-2 px-8 py-4 bg-tf-gold text-tf-black rounded-md font-bold text-btn hover:bg-tf-gold-light transition-colors"
        >
          Explorer le shopping
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-tf-black border-t border-white/10 px-6 py-12">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Marque */}
          <div>
            <p className="font-serif text-[1.4rem] text-tf-gold leading-none mb-1">TheFriends</p>
            <p className="font-sans text-[11px] tracking-[0.4em] text-tf-gold/60 uppercase mb-4">Shopping</p>
            <p className="font-sans text-[13px] text-white/50 leading-relaxed italic">
              Ta mode, ton style.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-sans text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Navigation</p>
            <ul className="space-y-2">
              {[
                { label: "Shopping", href: "/shopping" },
                { label: "Créer un compte", href: "/auth/register" },
                { label: "Se connecter", href: "/auth/login" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="font-sans text-[13px] text-white/60 hover:text-tf-gold transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-sans text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Contact</p>
            <ul className="space-y-2">
              <li>
                <a href="mailto:contact@thefriends.ci" className="font-sans text-[13px] text-white/60 hover:text-tf-gold transition-colors">
                  contact@thefriends.ci
                </a>
              </li>
              <li>
                <a href="tel:+22507000000" className="font-sans text-[13px] text-white/60 hover:text-tf-gold transition-colors">
                  +225 07 00 00 00 00
                </a>
              </li>
              <li className="font-sans text-[13px] text-white/60">
                Abidjan, Côte d&apos;Ivoire
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-screen-xl mx-auto mt-10 pt-6 border-t border-white/10 text-center">
          <p className="font-sans text-[12px] text-white/30">
            © {new Date().getFullYear()} TheFriends. Tous droits réservés.
          </p>
        </div>
      </footer>
    </main>
  );
}
