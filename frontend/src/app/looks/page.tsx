"use client"

import Link from "next/link"
import { Sparkles, Heart, ShoppingBag, Camera } from "lucide-react"

export default function LooksPage() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-sans text-[13px] text-tf-text-muted">Communauté</p>
        <h1 className="font-serif text-h1 text-tf-black">Looks</h1>
      </div>

      {/* Coming soon */}
      <div className="bg-white border border-tf-border rounded-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-tf-gold/10 flex items-center justify-center mx-auto mb-5">
          <Sparkles size={28} className="text-tf-gold" />
        </div>

        <h2 className="font-serif text-[24px] text-tf-black mb-3">
          Le feed communautaire arrive bientôt
        </h2>
        <p className="font-sans text-[14px] text-tf-text-muted max-w-md mx-auto leading-relaxed mb-8">
          Partage tes tenues, inspire-toi des looks de la communauté
          et achète directement les articles portés par d&apos;autres membres.
        </p>

        {/* Aperçu des fonctionnalités */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
          {[
            { icon: <Camera size={20} />, label: "Publie tes looks", desc: "Partage tes tenues avec tags articles" },
            { icon: <Heart size={20} />,  label: "Like & commente",   desc: "Interagis avec la communauté" },
            { icon: <ShoppingBag size={20} />, label: "Achète direct", desc: "Commande depuis un look" },
          ].map((f) => (
            <div key={f.label} className="bg-tf-bg border border-tf-border rounded-xl p-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-tf-gold/10 flex items-center justify-center mx-auto mb-2 text-tf-gold">
                {f.icon}
              </div>
              <p className="font-sans text-[13px] font-semibold text-tf-text mb-1">{f.label}</p>
              <p className="font-sans text-[11px] text-tf-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        <Link
          href="/shopping"
          className="inline-flex items-center gap-2 px-6 py-3 bg-tf-black text-white rounded-lg font-sans font-bold text-[13px] hover:bg-tf-charbon transition-colors"
        >
          <ShoppingBag size={15} />
          Aller en shopping en attendant
        </Link>

        <p className="font-sans text-[11px] text-tf-text-muted mt-4">
          Disponible en Phase 2 · Lancement prévu mois 6
        </p>
      </div>
    </div>
  )
}
