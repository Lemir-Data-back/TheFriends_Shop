import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { ClientBottomNav } from "@/components/layout/ClientBottomNav";
import { Footer } from "@/components/layout/Footer";
import { HomeSections } from "@/components/home/HomeSections";

export default function Home() {
  return (
    <main className="min-h-screen bg-tf-bg font-sans pb-bottom-nav lg:pb-0">
      <TopNav heroVariant />
      <ClientBottomNav />

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

        <p className="font-serif text-h2 text-white/80 leading-relaxed mb-10">
          Le centre commercial en ligne.<br />
          <span className="whitespace-nowrap">La mode en ligne.</span>
        </p>
        

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/shopping"
            className="btn-gold inline-flex items-center gap-2 py-3.5"
          >
            Découvrir le shopping
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent text-white border border-white/30 rounded-md font-sans font-medium text-btn hover:border-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-tf-black"
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
          className="btn-gold inline-flex items-center gap-2 px-8 py-4"
        >
          Explorer le shopping
          <ArrowRight size={16} />
        </Link>
      </section>

      <Footer />
    </main>
  );
}
