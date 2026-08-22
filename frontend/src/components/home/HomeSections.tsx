"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ShieldCheck, Ruler, Scissors, MessageCircle,
  Store, BadgeCheck, Calendar, TrendingUp, Smartphone, DollarSign,
  Package, BarChart2, Tag, Star, Users, Zap, ArrowRight,
  Lightbulb, PieChart, AlertTriangle, TrendingDown, Sparkles,
  Wallet, ClipboardList, UserCheck, Bell, RefreshCw,
} from "lucide-react"
import { TiltCard } from "@/components/ui/TiltCard"
import { ProgressBar as SharedProgressBar } from "@/components/ui/ProgressBar"

// ── Hook scroll animation ────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ── Données par acteur ────────────────────────────────────────────────────────

const ACTORS = [
  {
    id: "client",
    label: "Client",
    emoji: "🛍️",
    headline: "Achète en confiance, à ta taille",
    sub: "Fini les mauvaises surprises sur la taille ou le retard du couturier. TheFriends Shopping protège chaque achat.",
    color: "tf-gold",
    cta: { label: "Créer mon compte", href: "/auth/register" },
    features: [
      {
        icon: <ShieldCheck size={20} />,
        titre: "Paiement 100% sécurisé",
        desc: "Ton argent est bloqué en escrow et libéré uniquement quand tu confirmes la livraison.",
      },
      {
        icon: <Ruler size={20} />,
        titre: "Guide de taille intelligent",
        desc: "Saisis tes mensurations une seule fois. L'app te dit automatiquement quelle taille prendre chez chaque vendeur.",
      },
      {
        icon: <Scissors size={20} />,
        titre: "Couture sur mesure en ligne",
        desc: "Envoie ton tissu et tes photos de modèle. Reçois des devis de couturiers et choisis le meilleur.",
      },
      {
        icon: <MessageCircle size={20} />,
        titre: "Messagerie directe",
        desc: "Discute avec le vendeur ou le couturier avant de commander. Plus d'ambiguïté.",
      },
    ],
  },
  {
    id: "couturier",
    label: "Couturier",
    emoji: "✂️",
    headline: "Transforme ton talent en business digital",
    sub: "Plus de clients fantômes. Plus d'impayés. Une boutique en ligne qui travaille pour toi pendant que tu couds.",
    color: "tf-gold",
    cta: { label: "Ouvrir mon atelier", href: "/auth/register" },
    features: [
      {
        icon: <Store size={20} />,
        titre: "Boutique clé en main",
        desc: "Catalogue, photos, bio, zone, spécialités — tout configuré en quelques minutes depuis ton téléphone.",
      },
      {
        icon: <ShieldCheck size={20} />,
        titre: "Paiement garanti à la livraison",
        desc: "L'argent du client est sécurisé dès la commande. Jamais de travail non payé ni de client fantôme.",
      },
      {
        icon: <DollarSign size={20} />,
        titre: "Jalons pour grandes commandes",
        desc: "Pour les commandes > 50 000 FCFA, tu débloque des acomptes à chaque étape (tissu coupé, assemblage, livraison).",
      },
      {
        icon: <BadgeCheck size={20} />,
        titre: "Badge Couturier Fiable",
        desc: "Affiché sur ton profil si ton score délais dépasse 4.2/5. Un signal fort qui attire plus de clients.",
      },
      {
        icon: <Calendar size={20} />,
        titre: "Calendrier de charge",
        desc: "Visualise tes commandes en cours et tes dates de livraison. Ne prends jamais plus que tu ne peux livrer.",
      },
      {
        icon: <Smartphone size={20} />,
        titre: "Zéro application à télécharger",
        desc: "Tout fonctionne depuis le navigateur de ton téléphone. Accessible sur Tecno, Itel, Infinix.",
      },
    ],
  },
  {
    id: "vendeur",
    label: "Vendeur",
    emoji: "🏪",
    headline: "Ouvre ta boutique en ligne aujourd'hui",
    sub: "Gère ton stock, analyse tes ventes et attire de nouveaux clients sans te ruiner en publicité.",
    color: "tf-gold",
    cta: { label: "Ouvrir ma boutique", href: "/auth/register" },
    features: [
      {
        icon: <Package size={20} />,
        titre: "Gestion de stock simplifiée",
        desc: "Stock par article, taille et couleur. Alerte automatique quand un article est presque épuisé.",
      },
      {
        icon: <BarChart2 size={20} />,
        titre: "Dashboard analytique",
        desc: "Articles les plus vus, taux de conversion, stock à renouveler. Des données claires pour mieux décider.",
      },
      {
        icon: <Tag size={20} />,
        titre: "Promotions avec date d'expiration",
        desc: "Crée tes promos et fixe une date de fin. L'app gère la bascule automatiquement.",
      },
      {
        icon: <Star size={20} />,
        titre: "Avis clients par article",
        desc: "Chaque avis après livraison renforce ta réputation et améliore ton classement dans le catalogue.",
      },
      {
        icon: <Zap size={20} />,
        titre: "Tableau de tailles personnalisé",
        desc: "Tes tailles, tes mesures. Le guide de taille intelligent s'adapte à tes références spécifiques.",
      },
    ],
  },
]

// ── Composant onglets acteurs ─────────────────────────────────────────────────

function ActorTabs() {
  const [active, setActive] = useState("client")
  const actor = ACTORS.find((a) => a.id === active)!

  return (
    <div>
      {/* Sélecteur */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-tf-gray-soft rounded-full p-1 gap-1">
          {ACTORS.map((a) => (
            <button
              key={a.id}
              onClick={() => setActive(a.id)}
              aria-pressed={active === a.id}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2 ${
                active === a.id
                  ? "bg-tf-black text-white shadow-sm"
                  : "text-tf-text-muted hover:text-tf-text"
              }`}
            >
              <span className="mr-1.5">{a.emoji}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div key={active} className="animate-fade-in">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h3 className="font-serif text-h1 text-tf-text mb-3">{actor.headline}</h3>
          <p className="font-sans text-body text-tf-text-muted leading-relaxed">{actor.sub}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {actor.features.map((f, i) => (
            <div
              key={f.titre}
              className={`relative bg-white border rounded-xl p-5 transition-all duration-200 ease-out group ${
                (f as { soon?: boolean }).soon
                  ? "border-tf-border opacity-70"
                  : "border-tf-border hover:border-tf-gold/50 hover:shadow-card-hover motion-safe:hover:-translate-y-1"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {(f as { soon?: boolean }).soon && (
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-tf-gray-soft border border-tf-border rounded-full font-sans text-[9px] font-semibold text-tf-text-muted uppercase tracking-wider">
                  Bientôt
                </span>
              )}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                (f as { soon?: boolean }).soon
                  ? "bg-tf-gray-soft text-tf-text-muted"
                  : "bg-tf-gray-soft text-tf-gold group-hover:bg-tf-gold/10"
              }`}>
                {f.icon}
              </div>
              <h4 className="font-sans font-semibold text-tf-text text-[15px] mb-1.5">{f.titre}</h4>
              <p className="font-sans text-[13px] text-tf-text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={actor.cta.href}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-tf-black text-white rounded-md font-sans font-bold text-btn hover:bg-tf-charbon transition-colors"
          >
            {actor.cta.label}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Section "Comment ça marche" ───────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    titre: "Crée ton compte",
    desc: "Client, couturier ou vendeur — choisis ton rôle et complète ton profil en 2 minutes.",
  },
  {
    num: "02",
    titre: "Explore ou publie",
    desc: "Parcours le catalogue, commande sur mesure, ou publie tes articles et créations.",
  },
  {
    num: "03",
    titre: "Paye en sécurité",
    desc: "Ton paiement est bloqué en escrow. Le vendeur est payé uniquement à la livraison confirmée.",
  },
  {
    num: "04",
    titre: "Confirme et note",
    desc: "Confirme la réception, laisse un avis. Les fonds sont libérés au vendeur.",
  },
]

function HowItWorks() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {STEPS.map((step, i) => (
        <FadeUp key={step.num} delay={i * 100}>
          <div className="relative">
            {i < STEPS.length - 1 && (
              <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-tf-border z-0" />
            )}
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-tf-black flex items-center justify-center mb-4">
                <span className="font-serif text-tf-gold text-[15px] font-medium">{step.num}</span>
              </div>
              <h4 className="font-sans font-semibold text-tf-text text-[15px] mb-2">{step.titre}</h4>
              <p className="font-sans text-[13px] text-tf-text-muted leading-relaxed">{step.desc}</p>
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  )
}

// ── Bandeau paiements mobiles ─────────────────────────────────────────────────

const PAYMENTS = ["Wave", "Orange Money", "MTN Money", "Carte bancaire"]

function PaymentBanner() {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="bg-tf-black rounded-2xl px-8 py-10 text-center">
        <p className="font-sans text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">
          Paiements acceptés
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {PAYMENTS.map((p) => (
            <span
              key={p}
              className="px-4 py-2 border border-white/20 rounded-full font-sans text-[13px] text-white/80 font-medium"
            >
              {p}
            </span>
          ))}
        </div>
        <p className="font-sans text-[13px] text-white/50 mt-4">
          Tous les paiements sont traités par CinetPay — certifié et sécurisé.
        </p>
      </div>
    </div>
  )
}

// ── Mocks dashboard ──────────────────────────────────────────────────────────

function StatPill({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="bg-tf-gray-soft rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
      <span className="font-sans text-[11px] font-medium text-tf-text-muted">{label}</span>
      <span
        className={`font-mono text-[13px] font-bold tabular-nums tracking-tight ${
          up === undefined ? "text-tf-text" : up ? "text-tf-success" : "text-tf-error"
        }`}
      >
        {up !== undefined && <span className="mr-0.5 text-[11px]">{up ? "↑" : "↓"}</span>}
        {value}
      </span>
    </div>
  )
}

function IaCard({ text }: { text: string }) {
  return (
    <div className="border border-tf-gold/[0.35] bg-tf-gold/[0.06] rounded-lg p-3 flex gap-2.5">
      <Sparkles size={14} className="text-tf-gold mt-0.5 shrink-0" />
      <p className="font-sans text-[12px] text-tf-text leading-relaxed italic">&ldquo;{text}&rdquo;</p>
    </div>
  )
}

function AlertCard({ text, type = "warning" }: { text: string; type?: "warning" | "success" | "info" }) {
  const colors = {
    warning: "border-tf-warning/40 bg-tf-warning-bg text-tf-warning",
    success: "border-tf-success/30 bg-tf-success-bg text-tf-success",
    info:    "border-tf-info/30 bg-tf-info-bg text-tf-info",
  }
  return (
    <div className={`border rounded-lg px-3 py-2 flex gap-2 items-start ${colors[type]}`}>
      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
      <p className="font-sans text-[12px] leading-relaxed">{text}</p>
    </div>
  )
}


function ProgressBar({ value, max, color = "var(--tf-gold)" }: { value: number; max: number; color?: string }) {
  return <SharedProgressBar value={(value / max) * 100} color={color} />
}

function ClientDashboardMock() {
  return (
    <div className="bg-white border border-tf-border rounded-2xl p-5 space-y-4 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans text-[11px] font-semibold text-tf-text-muted uppercase tracking-wider">Mon tableau de bord</span>
        <span className="text-[10px] px-2 py-0.5 bg-tf-gold/[0.12] text-tf-gold-dark rounded-full font-semibold">⭐ Client Premium</span>
      </div>

      {/* Budget */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="font-sans text-[12px] font-medium text-tf-text">Budget du mois</span>
          <span className="font-mono text-[13px] text-tf-text font-medium">75 000 <span className="text-tf-text-muted text-[11px]">/ 100 000 FCFA</span></span>
        </div>
        <ProgressBar value={75000} max={100000} />
        <p className="font-sans text-[11px] text-tf-text-muted mt-1">25 000 FCFA disponibles ce mois</p>
      </div>

      {/* Conseil morphologie */}
      <IaCard text="Les personnes avec ta silhouette portent beaucoup les coupes trapèze cette saison à Abidjan" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Commandes ce mois" value="3" />
        <StatPill label="Économisé (promos)" value="12 500 F" up={true} />
        <StatPill label="Articles en wishlist" value="4 articles" />
        <StatPill label="Score de confiance" value="4.8 / 5" up={true} />
      </div>

      {/* Rapport mensuel */}
      <AlertCard
        text="Rapport du mois prêt — 3 articles likés non achetés entrent dans ton budget."
        type="info"
      />
    </div>
  )
}

function CouturierDashboardMock() {
  return (
    <div className="bg-white border border-tf-border rounded-2xl p-5 space-y-4 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans text-[11px] font-semibold text-tf-text-muted uppercase tracking-wider">Mon Atelier Intelligent</span>
        <span className="text-[10px] px-2 py-0.5 bg-tf-success-bg text-tf-success rounded-full font-semibold">✓ Couturier Fiable</span>
      </div>

      {/* Tendance */}
      <div className="bg-tf-gray-soft rounded-lg p-3">
        <p className="font-sans text-[11px] text-tf-text-muted uppercase tracking-wider mb-2">🔥 Tendance cette semaine</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-sans text-[12px] text-tf-text">Boubou brodé</span>
            <span className="font-sans text-[12px] font-semibold text-tf-success">127 recherches ↑</span>
          </div>
          <ProgressBar value={127} max={150} color="var(--tf-success)" />
          <div className="flex justify-between items-center">
            <span className="font-sans text-[12px] text-tf-text">Wax cérémonie</span>
            <span className="font-sans text-[12px] font-semibold text-tf-gold">+32% ↑</span>
          </div>
          <ProgressBar value={82} max={100} />
        </div>
      </div>

      {/* Conseil IA */}
      <IaCard text="La coupe Ankara bicolore est très recherchée à Cocody mais absente de ton catalogue — opportunité à saisir" />

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Délais", score: 4.7 },
          { label: "Qualité", score: 4.9 },
          { label: "Comm.", score: 4.6 },
        ].map(({ label, score }) => (
          <div key={label} className="bg-tf-gray-soft rounded-lg p-2.5">
            <p className="font-sans text-[10px] font-semibold text-tf-text-muted uppercase tracking-wide mb-1.5">{label}</p>
            <p className="font-mono text-[18px] font-bold tabular-nums text-tf-text leading-none">{score.toFixed(1)}</p>
            <p className="font-sans text-[9px] text-tf-text-muted mt-0.5">/ 5</p>
          </div>
        ))}
      </div>

      {/* Charge + revenus */}
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Commandes en cours" value="5" />
        <StatPill label="CA ce mois" value="285 000 F" up={true} />
      </div>

      {/* Classement clients */}
      <div className="bg-tf-gray-soft rounded-lg p-3">
        <p className="font-sans text-[11px] font-bold text-tf-text uppercase tracking-wider mb-2.5">
          🏆 Classement clients
        </p>
        <div className="space-y-2">
          {[
            { rank: 1, name: "Aminata K.", ca: "150 000 F", cmds: 5, label: "Premium" },
            { rank: 2, name: "Fatou D.",   ca:  "85 000 F", cmds: 3, label: "Fiable"  },
            { rank: 3, name: "Mariam S.",  ca:  "45 000 F", cmds: 2, label: "Fiable"  },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2.5">
              <span className="font-sans text-[11px] font-bold text-tf-text-muted w-4">{c.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[12px] font-semibold text-tf-text truncate">{c.name}</p>
                <p className="font-sans text-[10px] text-tf-text-muted">{c.cmds} commandes</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[12px] font-bold tabular-nums text-tf-text">{c.ca}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  c.label === "Premium" ? "bg-tf-gold/[0.15] text-tf-gold-dark" : "bg-tf-success-bg text-tf-success"
                }`}>{c.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clients inactifs */}
      <div className="border border-tf-warning/40 bg-tf-warning-bg rounded-lg p-3 space-y-1.5">
        <p className="font-sans text-[11px] font-bold text-tf-warning uppercase tracking-wide">
          ⏰ 2 clients inactifs depuis 60 j+
        </p>
        <p className="font-sans text-[11px] text-tf-text-muted">Koné B., Diallo A. — dernière commande il y a plus de 2 mois</p>
        <p className="font-sans text-[11px] font-semibold text-tf-warning cursor-pointer hover:underline">
          → Envoyer une relance personnalisée
        </p>
      </div>

      {/* Suggestion ciblée */}
      <div className="border border-tf-gold/[0.35] bg-tf-gold/[0.06] rounded-lg p-3 flex gap-2.5">
        <Sparkles size={13} className="text-tf-gold mt-0.5 shrink-0" />
        <p className="font-sans text-[11px] text-tf-text leading-relaxed">
          <strong>Nadia S.</strong> cherche une robe wax bicolore — tu as un modèle correspondant dans ton catalogue
        </p>
      </div>
    </div>
  )
}

function VendeurDashboardMock() {
  return (
    <div className="bg-white border border-tf-border rounded-2xl p-5 space-y-4 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans text-[11px] font-semibold text-tf-text-muted uppercase tracking-wider">Ma Boutique Intelligente</span>
        <span className="text-[10px] px-2 py-0.5 bg-tf-gray-soft text-tf-text-muted rounded-full font-semibold">32 articles actifs</span>
      </div>

      {/* Alertes stock */}
      <div className="space-y-2">
        <p className="font-sans text-[11px] text-tf-text-muted uppercase tracking-wider">Stock & alertes</p>
        <AlertCard text="Robe wax L noir — 2 unités restantes. Réapprovisionner." type="warning" />
        <AlertCard text="Pantalon en lin — 0 vente depuis 60 jours. Promotion recommandée." type="warning" />
      </div>

      {/* Opportunité marché */}
      <IaCard text="Chemise oversize homme très recherchée à Yopougon — aucun article dans ton catalogue ne correspond" />

      {/* Calendrier ivoirien */}
      <div className="border border-tf-info/30 bg-tf-info-bg rounded-lg px-3 py-2.5 flex gap-2.5 items-start">
        <Calendar size={13} className="text-tf-info mt-0.5 shrink-0" />
        <p className="font-sans text-[12px] text-tf-info leading-relaxed">
          <strong>Tabaski dans 45 jours</strong> — Prépare tes collections cérémonie maintenant.
        </p>
      </div>

      {/* Classement clients */}
      <div className="bg-tf-gray-soft rounded-lg p-3">
        <p className="font-sans text-[11px] font-bold text-tf-text uppercase tracking-wider mb-2.5">
          🏆 Classement clients
        </p>
        <div className="space-y-2">
          {[
            { rank: 1, name: "Aminata K.", ca: "42 500 F", cmds: 8,  label: "Premium"  },
            { rank: 2, name: "Sékou M.",   ca: "28 000 F", cmds: 4,  label: "Fiable"   },
            { rank: 3, name: "Diallo F.",  ca: "15 500 F", cmds: 2,  label: "Standard" },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2.5">
              <span className="font-sans text-[11px] font-bold text-tf-text-muted w-4">{c.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[12px] font-semibold text-tf-text truncate">{c.name}</p>
                <p className="font-sans text-[10px] text-tf-text-muted">{c.cmds} commandes · panier moy. {Math.round(parseInt(c.ca) / c.cmds).toLocaleString("fr")} F</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[12px] font-bold tabular-nums text-tf-text">{c.ca}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  c.label === "Premium"  ? "bg-tf-gold/[0.15] text-tf-gold-dark" :
                  c.label === "Fiable"   ? "bg-tf-success-bg text-tf-success" :
                                           "bg-tf-border text-tf-text-muted"
                }`}>{c.label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-tf-border flex justify-between">
          <span className="font-sans text-[11px] text-tf-text-muted">Clients fidèles (3+ cmd)</span>
          <span className="font-mono text-[12px] font-bold tabular-nums text-tf-success">12 / 47</span>
        </div>
      </div>

      {/* Clients inactifs */}
      <div className="border border-tf-warning/40 bg-tf-warning-bg rounded-lg p-3 space-y-1.5">
        <p className="font-sans text-[11px] font-bold text-tf-warning uppercase tracking-wide">
          ⏰ 5 clients inactifs depuis 30 j+
        </p>
        <p className="font-sans text-[11px] text-tf-text-muted">Ils ont acheté par le passé mais n&apos;ont pas commandé ce mois</p>
        <p className="font-sans text-[11px] font-semibold text-tf-warning cursor-pointer hover:underline">
          → Suggérer un article en lien avec leurs achats précédents
        </p>
      </div>

      {/* Suggestion ciblée */}
      <div className="border border-tf-gold/[0.35] bg-tf-gold/[0.06] rounded-lg p-3 flex gap-2.5">
        <Sparkles size={13} className="text-tf-gold mt-0.5 shrink-0" />
        <p className="font-sans text-[11px] text-tf-text leading-relaxed">
          <strong>Bamba A.</strong> a cherché &ldquo;jupe wax rouge L&rdquo; — tu as cet article en stock à 8 500 FCFA
        </p>
      </div>

      {/* Alerte client risqué */}
      <AlertCard
        text="1 client avec score 2.1/5 en attente de commande — vérifie avant d'accepter."
        type="warning"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Taux conversion" value="24%" up={true} />
        <StatPill label="CA ce mois" value="412 000 F" up={true} />
        <StatPill label="Articles dormants" value="3 articles" up={false} />
        <StatPill label="Réappro suggérés" value="4 références" />
      </div>
    </div>
  )
}

// ── Données intelligence par acteur ──────────────────────────────────────────

const INTELLIGENCE = [
  {
    id: "client",
    label: "Client",
    emoji: "🛍️",
    headline: "Ta mode pilotée par la donnée",
    sub: "Plus jamais de budget dépassé, de tendances ratées ou d'articles achetés au mauvais prix. Ton tableau de bord personnel anticipe tes envies.",
    features: [
      {
        icon: <Wallet size={18} />,
        titre: "Budget mensuel intelligent",
        desc: "Fixe un budget mensuel mode. L'app te montre uniquement des suggestions qui y rentrent et t'alerte avant de dépasser.",
      },
      {
        icon: <ClipboardList size={18} />,
        titre: "Rapport du 1er du mois",
        desc: "Chaque mois, reçois un résumé : tes dépenses, tes articles likés non achetés et les tendances de ta zone.",
      },
      {
        icon: <Sparkles size={18} />,
        titre: "Suggestions par morphologie",
        desc: "\"Les personnes avec ta silhouette portent beaucoup les coupes trapèze cette saison\". Conseils basés sur les vraies données de la communauté.",
      },
      {
        icon: <UserCheck size={18} />,
        titre: "Score de confiance",
        desc: "Ton historique de commandes te donne un statut (Standard, Fiable, Premium) qui t'ouvre des avantages exclusifs.",
      },
    ],
    mock: <ClientDashboardMock />,
  },
  {
    id: "couturier",
    label: "Couturier",
    emoji: "✂️",
    headline: "L'intelligence de l'atelier",
    sub: "Sache ce que les clients cherchent avant même qu'ils t'écrivent. Ajuste ton catalogue, anticipe ta charge, maximise tes revenus.",
    features: [
      {
        icon: <TrendingUp size={18} />,
        titre: "Tendances en temps réel",
        desc: "Modèles les plus recherchés, tissus en vogue, occasions à venir (saison mariages, Tabaski...) — données actualisées chaque semaine.",
      },
      {
        icon: <BarChart2 size={18} />,
        titre: "Performance de ton catalogue",
        desc: "Articles vus, likés, commandés. Taux de conversion par création. Articles inactifs depuis 30/60/90 jours.",
      },
      {
        icon: <Lightbulb size={18} />,
        titre: "Conseils IA personnalisés",
        desc: "\"Cette coupe n'est pas dans ton catalogue mais très recherchée\" — suggestions de prix, alertes surcharge de travail.",
      },
      {
        icon: <PieChart size={18} />,
        titre: "Revenus et prévisions",
        desc: "CA mensuel et trimestriel, commandes terminées vs en cours, prévision de charge pour les semaines à venir.",
      },
      {
        icon: <Users size={18} />,
        titre: "Profil client avant d'accepter",
        desc: "Score de confiance, historique et mensurations de chaque client visibles avant de confirmer. Travaille sereinement avec les bons profils.",
      },
      {
        icon: <BarChart2 size={18} />,
        titre: "Classement clients par valeur",
        desc: "Tes meilleurs clients classés par CA généré et nombre de commandes. Identifie ceux qui reviennent régulièrement et fidélise-les.",
      },
      {
        icon: <Bell size={18} />,
        titre: "Relance des clients inactifs",
        desc: "Détection automatique des clients qui n'ont pas commandé depuis 30/60/90 jours — avec suggestion de message de relance personnalisé.",
      },
      {
        icon: <Sparkles size={18} />,
        titre: "Suggestions d'articles ciblées",
        desc: "Quand un client cherche une coupe précise dans ton catalogue, tu reçois une alerte pour proposer le bon modèle au bon moment.",
      },
    ],
    mock: <CouturierDashboardMock />,
  },
  {
    id: "vendeur",
    label: "Vendeur",
    emoji: "🏪",
    headline: "Ta boutique, pilotée par les données",
    sub: "Sais exactement quoi commander, quand le commander et à quel prix le vendre. Fini les stocks dormants et les opportunités manquées.",
    features: [
      {
        icon: <RefreshCw size={18} />,
        titre: "Rotation du stock en temps réel",
        desc: "Identifie tes articles à rotation rapide, lente ou bloquée. Recommandations de réapprovisionnement à 30/60/90 jours.",
      },
      {
        icon: <Lightbulb size={18} />,
        titre: "Opportunités de marché",
        desc: "Top 10 des recherches sans résultat dans ta zone. Ce que tes concurrents ne proposent pas encore — saisis-le en premier.",
      },
      {
        icon: <Bell size={18} />,
        titre: "Calendrier ivoirien intégré",
        desc: "Alertes automatiques : rentrée scolaire, Tabaski, fêtes de fin d'année, saison mariages. Prépare-toi avant tout le monde.",
      },
      {
        icon: <TrendingDown size={18} />,
        titre: "Détection des articles dormants",
        desc: "Repère les articles sans vente depuis 30/60/90 jours. Promotion recommandée automatiquement pour déstocker intelligemment.",
      },
      {
        icon: <Users size={18} />,
        titre: "Classement clients par achat",
        desc: "Top clients classés par CA généré et régularité. Panier moyen par client, fréquence d'achat, score de confiance — tout pour savoir avec qui tu travailles vraiment.",
      },
      {
        icon: <Bell size={18} />,
        titre: "Clients inactifs — relance intelligente",
        desc: "Détection automatique des clients qui n'ont pas acheté depuis 30/60 jours. Suggestion d'article basée sur leurs achats passés pour les faire revenir.",
      },
      {
        icon: <Sparkles size={18} />,
        titre: "Suggestions d'articles ciblées",
        desc: "Quand un client cherche un article précis dans ta boutique, tu reçois une alerte avec le produit correspondant en stock — opportunité de vente directe.",
      },
    ],
    mock: <VendeurDashboardMock />,
  },
]

// ── Section intelligence ──────────────────────────────────────────────────────

function IntelligenceSection() {
  const [active, setActive] = useState("client")
  const actor = INTELLIGENCE.find((a) => a.id === active)!

  return (
    <div>
      {/* Sélecteur */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-tf-gray-soft rounded-full p-1 gap-1">
          {INTELLIGENCE.map((a) => (
            <button
              key={a.id}
              onClick={() => setActive(a.id)}
              aria-pressed={active === a.id}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2 ${
                active === a.id
                  ? "bg-tf-black text-white shadow-sm"
                  : "text-tf-text-muted hover:text-tf-text"
              }`}
            >
              <span className="mr-1.5">{a.emoji}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu 2 colonnes */}
      <div key={active} className="animate-fade-in">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h3 className="font-serif text-h1 text-tf-text mb-3">{actor.headline}</h3>
          <p className="font-sans text-body text-tf-text-muted leading-relaxed">{actor.sub}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Liste des features */}
          <div className="space-y-5">
            {actor.features.map((f, i) => (
              <div
                key={f.titre}
                className="flex gap-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-9 h-9 rounded-lg bg-tf-gold/10 flex items-center justify-center shrink-0 text-tf-gold mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-tf-text text-[15px] mb-1">{f.titre}</h4>
                  <p className="font-sans text-[13px] text-tf-text-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mock dashboard */}
          <div className="lg:sticky lg:top-24">
            <TiltCard>{actor.mock}</TiltCard>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Export principal ──────────────────────────────────────────────────────────

export function HomeSections() {
  return (
    <>
      {/* Section acteurs */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-20">
        <FadeUp>
          <div className="text-center mb-14">
            <h2 className="font-serif text-h1 text-tf-text mb-3">
              Une plateforme pensée pour chacun
            </h2>
            <p className="font-sans text-body text-tf-text-muted mx-auto leading-relaxed whitespace-nowrap">
              Client, couturier ou vendeur.<br />
              TheFriends Shopping résout tes vrais problèmes du quotidien.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={150}>
          <ActorTabs />
        </FadeUp>
      </section>

      {/* Séparateur */}
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="border-t border-tf-border" />
      </div>

      {/* Section intelligence */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-20">
        <FadeUp>
          <div className="text-center mb-14">
            <h2 className="font-serif text-h1 text-tf-text mb-3">
              La donnée travaille pour vous
            </h2>
            <p className="font-sans text-body text-tf-text-muted max-w-2xl mx-auto leading-relaxed">
              Chaque action sur la plateforme génère des données. Ces données deviennent des conseils, des alertes et des prévisions personnalisés pour chaque acteur.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={150}>
          <IntelligenceSection />
        </FadeUp>
      </section>

      {/* Séparateur */}
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="border-t border-tf-border" />
      </div>

      {/* Section "Comment ça marche" */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-20">
        <FadeUp>
          <div className="text-center mb-14">
            <h2 className="font-serif text-h1 text-tf-text mb-3">
              Comment ça marche ?
            </h2>
            <p className="font-sans text-body text-tf-text-muted max-w-xl mx-auto leading-relaxed">
              De la découverte à la livraison — un processus clair et sécurisé.
            </p>
          </div>
        </FadeUp>
        <HowItWorks />
      </section>

      {/* Séparateur */}
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="border-t border-tf-border" />
      </div>

      {/* Bandeau paiements */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-16">
        <PaymentBanner />
      </section>
    </>
  )
}
