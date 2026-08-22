---
name: TheFriends Shopping
description: Marketplace mode premium ivoirienne — élégance serif/or, clarté du blanc, chaleur de l'artisanat local
colors:
  noir-nuit: "#111111"
  charbon: "#1C1C1C"
  or-principal: "#C9A84C"
  or-clair: "#F0D080"
  or-fonce: "#B8892A"
  blanc-chaud: "#FDFCFA"
  blanc-pur: "#FFFFFF"
  gris-doux: "#F5F4F1"
  beige-bordure: "#E8E4DC"
  texte-discret: "#7A766F"
  vert-succes: "#2D6A4F"
  vert-succes-bg: "#D8F3DC"
  rouge-erreur: "#C0392B"
  rouge-erreur-bg: "#FFCCCC"
  or-avertissement: "#B8892A"
  or-avertissement-bg: "#FFF3CD"
  bleu-info: "#185FA5"
  bleu-info-bg: "#E8F0FB"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(40px, 6vw, 72px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  h1:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(28px, 3vw, 36px)"
    fontWeight: 400
    lineHeight: 1.2
  h2:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(20px, 2.5vw, 24px)"
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(16px, 2vw, 18px)"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  price:
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace"
    fontSize: "clamp(16px, 1.5vw, 22px)"
    fontWeight: 500
    lineHeight: 1.2
  label:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  nav:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  button:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  micro:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.3
  mono:
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace"
    fontSize: "12px"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  2xl: "22px"
  full: "9999px"
spacing:
  bottom-nav: "64px"
components:
  button-primary:
    backgroundColor: "{colors.noir-nuit}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.charbon}"
  button-gold:
    backgroundColor: "{colors.or-principal}"
    textColor: "{colors.noir-nuit}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-gold-hover:
    backgroundColor: "{colors.or-clair}"
  button-outline:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.noir-nuit}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.texte-discret}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "#FFF0F0"
    textColor: "{colors.rouge-erreur}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  product-card:
    backgroundColor: "{colors.blanc-pur}"
    rounded: "{rounded.xl}"
    padding: "12px"
  input-field:
    backgroundColor: "{colors.blanc-pur}"
    textColor: "{colors.noir-nuit}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  monogram-tf:
    backgroundColor: "{colors.noir-nuit}"
    textColor: "{colors.or-principal}"
    typography: "{typography.h1}"
    rounded: "{rounded.2xl}"
---

# Design System: TheFriends Shopping

## 1. Overview

**Creative North Star: "L'Atelier Doré"**

TheFriends Shopping habite la rencontre entre l'atelier de couture ivoirien et la retenue du luxe éditorial. Le blanc domine comme la lumière d'un atelier propre et généreux ; le noir structure comme l'ossature d'un comptoir bien tenu ; l'or n'apparaît qu'aux moments qui comptent — un prix, un bouton d'achat, un badge de confiance — jamais en fond, jamais en remplissage. La serif (Georgia) porte la voix de la marque et de la valeur marchande ; le sans-serif (Inter) porte l'action et la fonction. Cette double écriture n'est pas un choix esthétique gratuit : elle distingue physiquement ce qui se contemple (le produit, le prix, le nom de la maison) de ce qu'on actionne (naviguer, payer, filtrer).

Le système rejette explicitement le gabarit "marketplace générique" de Jumia ou CoinAfrique : pas de bannières promo saturées de couleurs concurrentes, pas de grilles identiques criant toutes en même temps, pas de hiérarchie plate où rien ne se distingue. Ici, la rareté de l'or est la preuve de sa valeur — s'il est partout, il ne vaut plus rien.

**Key Characteristics:**
- Blanc chaud dominant (~70% des surfaces), jamais un blanc froid clinique
- Or réservé aux signaux de valeur réelle : prix, CTA de conversion, badges de confiance, états actifs
- Noir structurant pour l'architecture de page (header, nav, boutons principaux) — jamais décoratif
- Deux écritures typographiques avec des rôles stricts et non interchangeables
- Surfaces plates au repos ; la profondeur n'apparaît qu'en réponse à l'interaction

## 2. Colors

La palette est restreinte et chacune de ses couleurs porte un rôle fonctionnel précis — rien n'est là pour "faire joli".

### Primary
- **Or Principal** (#C9A84C): l'accent de valeur. Prix, CTA de conversion ("Payer", "Acheter"), états actifs de navigation, badges promo, points actifs. Ne jamais l'utiliser en fond pleine page.

### Secondary
- **Noir Nuit** (#111111): la structure. Header, sidebar, boutons principaux, textes forts, fond du monogramme TF. C'est le squelette qui porte tout le reste.
- **Charbon** (#1C1C1C): l'état hover/alt du noir — jamais un noir pur en interaction, toujours cette nuance légèrement adoucie.

### Tertiary
- **Or Clair** (#F0D080): l'état hover de l'or — un reflet, jamais une couleur de repos.
- **Or Foncé** (#B8892A): l'or quand il doit porter du texte sur fond clair (sous-titres SHOPPING, bordures actives) — le ratio de contraste l'exige.

### Neutral
- **Blanc Chaud** (#FDFCFA): le fond de page par défaut, sur 70% des surfaces. Jamais de blanc pur en arrière-plan général.
- **Blanc Pur** (#FFFFFF): réservé aux surfaces qui doivent se détacher du fond — cartes produit, inputs, modales, drawers.
- **Gris Doux** (#F5F4F1): fond alternatif discret — stepper de quantité, input désactivé, hover fantôme.
- **Beige Bordure** (#E8E4DC): toutes les bordures de cartes et séparateurs, jamais de gris pur.
- **Texte Discret** (#7A766F): sous-titres, descriptions, placeholders, métadonnées — jamais le texte principal.

### Sémantiques (réservées aux états fonctionnels)
- **Vert Succès** (#2D6A4F / bg #D8F3DC): couturier fiable, livraison confirmée, paiement réussi.
- **Rouge Erreur** (#C0392B / bg #FFCCCC): litige, erreur de formulaire, rupture de stock.
- **Or Avertissement** (#B8892A / bg #FFF3CD): retard imminent, stock faible, score en baisse — partage la teinte de l'or foncé mais un rôle strictement fonctionnel, jamais décoratif.
- **Bleu Info** (#185FA5 / bg #E8F0FB): statut en cours, commande expédiée, info neutre.

### Named Rules
**La Règle de la Rareté de l'Or.** L'or #C9A84C ne décore jamais une surface ; il signale toujours une valeur réelle (prix, action de conversion, badge mérité). S'il apparaît sur plus de 10% d'un écran donné, c'est qu'il a été mal utilisé.

**La Règle du Texte Interdit.** Jamais de texte blanc sur fond or — le contraste y est insuffisant et la règle est absolue. Sur fond or, le texte est toujours #111111.

## 3. Typography

**Display Font:** Georgia (avec repli 'Times New Roman', serif)
**Body Font:** Inter (avec repli Helvetica Neue, Arial, sans-serif)
**Label/Mono Font:** IBM Plex Mono (repli Courier New, monospace) — réservé aux codes de commande, références produit, et à l'alignement des chiffres (prix, heures, statistiques) dans les tableaux de bord

**Character:** Un contraste éditorial délibéré entre une serif intemporelle et raffinée (la voix de la marque) et une sans-serif neutre et fonctionnelle (la voix de l'interface) — la tension entre élégance et modernité est le point, pas un accident à corriger.

### Hierarchy
- **Display** (Georgia 400, clamp(40px, 6vw, 72px), line-height 1.1): bannière hero, grands titres de landing. Jamais de bold, jamais d'italique.
- **H1** (Georgia 400, clamp(28px, 3vw, 36px), line-height 1.2): titre de page, nom de produit principal.
- **H2** (Inter 600, clamp(20px, 2.5vw, 24px), line-height 1.3): titres de section de dashboard, titres de catégorie.
- **H3** (Inter 600, clamp(16px, 2vw, 18px), line-height 1.4): sous-sections, groupes de filtres.
- **Body** (Inter 400, 14–16px, line-height 1.6): descriptions, contenus, avis clients. Plafond de 65–75ch pour la lisibilité.
- **Prix** (IBM Plex Mono 500, clamp(16px, 1.5vw, 22px), line-height 1.2): toujours en mono pour aligner proprement les chiffres, jamais en serif ni en sans-serif.
- **Label** (Inter 500–600, 10–12px, letter-spacing 0.12em, uppercase): badges, tags, labels de formulaire.
- **Nav** (Inter 500, 13–14px): items de sidebar, bottom nav, onglets.
- **Bouton** (Inter 600–700, 12–14px): CTA, boutons d'action — jamais de serif sur un bouton.
- **Micro** (Inter 400, 10–11px): notes de bas de page, mentions légales, dates.
- **Mono** (IBM Plex Mono 400, 12–14px): codes de commande, références produit, chiffres alignés (prix, heures, stats) dans les tableaux de bord.

### Named Rules
**La Règle des Deux Voix.** Georgia parle pour la marque et la valeur marchande (logo, slogan, titres produits, noms de boutiques) ; Inter parle pour l'action et la fonction (tout le reste). Les deux ne se mélangent jamais dans une même ligne de navigation. Les prix font exception : ils s'affichent en IBM Plex Mono pour aligner proprement les chiffres — une troisième voix réservée aux données numériques (prix, heures, statistiques).

**La Règle du Regular Seul.** Georgia n'est jamais en gras, jamais en italique — la graisse 400 uniquement. En dessous de 14px (web), la serif perd sa lisibilité et ne doit pas être utilisée.

## 4. Elevation

Le système est plat au repos, vivant au survol : aucune surface ne porte d'ombre par défaut, et la profondeur n'apparaît qu'en réponse directe à une interaction (hover, focus). C'est une décision délibérée : un catalogue chargé de cartes en relief permanent fatigue l'œil sur un flux mobile ; la légèreté visuelle prime, et l'ombre devient un signal d'intention plutôt qu'un décor systématique.

### Shadow Vocabulary
- **card** (`box-shadow: 0 4px 16px rgba(0,0,0,0.08)`): ombre discrète au hover des cartes produit — jamais colorée, toujours neutre.
- **card-hover** (`box-shadow: 0 8px 24px rgba(0,0,0,0.12)`): intensification au hover prolongé ou à l'élévation d'une carte active.
- **gold** (`box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.2)`): l'anneau de focus doré — remplace l'ombre grise quand l'élément porte une valeur (input en focus, élément actif).

### Named Rules
**La Règle du Plat-par-Défaut.** Toute surface est plate au repos. L'ombre n'apparaît qu'en réponse à un état (hover, focus, élévation active) — jamais en décor permanent.

## 5. Components

### Buttons
- **Shape:** coins arrondis doux (`rounded-md`, 10px) — ni carrés agressifs, ni pilules.
- **Principal** (`btn-primary`): fond Noir Nuit #111111, texte blanc, hover vers Charbon #1C1C1C. Réservé à la navigation, connexion, confirmation.
- **Or / Conversion** (`btn-gold`): fond Or Principal #C9A84C, texte Noir Nuit #111111 (jamais blanc), hover vers Or Clair #F0D080. Réservé aux actions monétaires : payer, acheter.
- **Contour** (`btn-outline`): fond blanc, texte noir, bordure Beige Bordure #E8E4DC, hover bordure plus sombre. Actions secondaires, retour, annuler.
- **Fantôme** (`btn-ghost`): fond transparent, texte Texte Discret #7A766F, hover fond Gris Doux #F5F4F1. Actions tertiaires, options discrètes.
- **Danger** (`btn-danger`): fond #FFF0F0, texte et bordure Rouge Erreur #C0392B. Signaler, supprimer, litige.
- **Interaction commune:** `active:scale-[0.98]` sur tous les boutons — un léger tassement tactile à l'appui, transition 150ms.

### Chips / Badges
- **Style:** texte uppercase, `letter-spacing` large (tracking widest), padding compact (`px-2 py-0.5`), coins `rounded-sm` (6px).
- **Variantes:** promo (fond noir, texte or), sur-mesure (fond blanc, bordure beige), fiable (fond vert clair, texte vert), stock-faible (fond jaune clair, texte or foncé), rupture (fond rouge clair, texte rouge).
- **Règle:** jamais de fond rouge pour un badge promo — le badge promo est toujours noir/or, signature de la marque.

### Cards / Containers (Carte produit)
- **Corner Style:** `rounded-xl` (16px), jamais moins de 12px.
- **Background:** Blanc Pur #FFFFFF, toujours — jamais le blanc chaud du fond de page.
- **Border:** 1px Beige Bordure #E8E4DC au repos ; au hover, bordure or léger `rgba(201,168,76,0.4)`.
- **Shadow Strategy:** plate au repos, `card-hover` shadow + `translateY(-2px)` au survol (voir Elevation).
- **Image:** ratio 3:4 portrait obligatoire pour le vêtement — jamais de ratio paysage.
- **Internal Padding:** 12px (`p-3`) pour le bloc d'information sous l'image.
- **Hiérarchie interne:** nom de boutique en micro/uppercase tracké, titre produit en Inter 13px medium, prix en IBM Plex Mono toujours en dernier.

### Inputs / Fields
- **Style:** fond blanc, bordure 1px Beige Bordure #E8E4DC, `rounded-md` (10px), placeholder en Texte Discret #7A766F.
- **Focus:** bordure Or Principal #C9A84C + anneau `gold` (`0 0 0 3px rgba(201,168,76,0.2)`) — jamais de bordure bleue générique.
- **Disabled:** fond Gris Doux #F5F4F1, texte Texte Discret #7A766F, curseur not-allowed.
- **Label:** Inter 13px medium, au-dessus du champ, astérisque or si requis.

### Navigation
- Fond Noir Nuit translucide avec `backdrop-blur` (`bg-tf-black/80 backdrop-blur-sm`), fixe en haut.
- Logo : "TheFriends" en Georgia/or, "SHOPPING" en Inter 9px tracking 0.4em/or à 60% d'opacité, empilés verticalement.
- Liens : Inter 13px, blanc à 70% d'opacité au repos, blanc plein au hover.
- Le CTA "Se connecter" reste le seul élément or de la barre de navigation — cohérent avec la Règle de la Rareté de l'Or.

### Monogramme TF (signature)
Carré arrondi (`rounded-2xl`, 22px), ratio 1:1, Georgia Regular. Version digitale par défaut : or sur fond noir. Version inversée pour impression/packaging : noir sur fond or. Utilisé en favicon, app icon PWA, et tout espace trop restreint pour le logo complet.

## 6. Do's and Don'ts

### Do:
- **Do** utiliser Georgia exclusivement pour le nom de marque, le slogan, les titres produits et les noms de boutiques.
- **Do** utiliser IBM Plex Mono exclusivement pour les prix et les autres chiffres alignés (heures, statistiques).
- **Do** réserver l'or #C9A84C aux signaux de valeur réelle : prix, CTA de conversion, badges mérités, états actifs.
- **Do** garder le texte sur fond or toujours en #111111 — jamais blanc.
- **Do** utiliser un ratio image 3:4 (portrait) pour tous les vêtements en carte produit.
- **Do** laisser les surfaces plates au repos ; n'introduire l'ombre qu'en réponse à une interaction.
- **Do** respecter un contraste texte/fond minimum de 4.5:1, et la même exigence pour les placeholders (pas le gris par défaut affaibli).

### Don't:
- **Don't** utiliser l'or en fond pleine page — c'est une décoration, jamais un aplat.
- **Don't** mélanger Georgia et Inter dans une même ligne de navigation.
- **Don't** mettre Georgia en gras ou en italique — 400 Regular uniquement.
- **Don't** descendre sous 14px pour la serif (web) ni sous 10px pour l'interface — illisible sur mobile, contexte d'usage à 80%+ mobile et réseau 3G.
- **Don't** utiliser un fond rouge pour un badge promo — le badge promo reste noir/or, signature de la maison.
- **Don't** reproduire le gabarit "marketplace générique" de Jumia ou CoinAfrique : pas de bannières promo saturées de couleurs concurrentes, pas de grilles de cartes identiques qui crient toutes en même temps, pas de hiérarchie plate où l'or et le noir perdent leur rareté.
- **Don't** ajouter d'ombre colorée — la teinte des ombres reste neutre (`rgba(0,0,0,...)`), jamais teintée d'or ou d'une autre couleur.
