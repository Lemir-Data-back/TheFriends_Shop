import Link from "next/link";

export interface FooterShop {
  id: number;
  nom: string;
  slogan?: string | null;
  telephone_contact?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  horaires?: string | null;
}

const linkClass =
  "font-sans text-[13px] text-white/60 hover:text-tf-gold transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold";

/**
 * Footer partagé — un seul composant partout. Sans `shop`, identité TheFriends par
 * défaut. Avec `shop`, les colonnes Marque et Contact reflètent la boutique visitée ;
 * le copyright reste toujours TheFriends (ce n'est pas une info qui varie).
 */
export function Footer({ shop }: { shop?: FooterShop }) {
  const contactItems = shop
    ? [
        shop.telephone_contact && { label: shop.telephone_contact, href: `tel:${shop.telephone_contact}` },
        shop.whatsapp && { label: `WhatsApp : ${shop.whatsapp}`, href: `https://wa.me/${shop.whatsapp.replace(/[^\d]/g, "")}` },
        shop.instagram && { label: `Instagram : @${shop.instagram.replace(/^@/, "")}`, href: `https://instagram.com/${shop.instagram.replace(/^@/, "")}` },
        shop.tiktok && { label: `TikTok : @${shop.tiktok.replace(/^@/, "")}`, href: `https://tiktok.com/@${shop.tiktok.replace(/^@/, "")}` },
      ].filter((x): x is { label: string; href: string } => !!x)
    : [];

  return (
    <footer className="bg-tf-black border-t border-white/10 rounded-t-3xl px-6 py-12">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Marque */}
        <div>
          <p className="font-serif text-[1.4rem] text-tf-gold leading-none mb-1">
            {shop ? shop.nom : "TheFriends"}
          </p>
          {!shop && (
            <p className="font-sans text-[11px] tracking-[0.4em] text-tf-gold/60 uppercase mb-4">Shopping</p>
          )}
          <p className="font-sans text-[13px] text-white/50 leading-relaxed italic">
            {shop ? shop.slogan || "Boutique sur TheFriends Shopping" : "Ta mode, ton style."}
          </p>
        </div>

        {/* Contact */}
        <div>
          <p className="font-sans text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Contact</p>
          {shop ? (
            contactItems.length > 0 ? (
              <ul className="space-y-2">
                {shop.horaires && <li className="font-sans text-[13px] text-white/60">{shop.horaires}</li>}
                {contactItems.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={linkClass}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-[13px] text-white/50">
                <Link href={`/messages?shop=${shop.id}`} className="hover:text-tf-gold transition-colors">
                  Contacter cette boutique via la messagerie
                </Link>
              </p>
            )
          ) : (
            <ul className="space-y-2">
              <li><a href="mailto:contact@thefriends.ci" className={linkClass}>contact@thefriends.ci</a></li>
              <li><a href="tel:+22507000000" className={linkClass}>+225 07 00 00 00 00</a></li>
              <li className="font-sans text-[13px] text-white/60">Abidjan, Côte d&apos;Ivoire</li>
            </ul>
          )}
        </div>
      </div>

      {/* Copyright — toujours TheFriends, ne varie jamais */}
      <div className="max-w-screen-xl mx-auto mt-10 pt-6 border-t border-white/10 text-center">
        <p className="font-sans text-[12px] text-white/30">
          © {new Date().getFullYear()} TheFriends. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
