# Product

## Register

product

## Users

Quatre profils sur une marketplace mode ivoirienne (PWA mobile-first, marché Abidjan) :
- **Client** : tout public, jeune et connecté, achète prêt-à-porter ou commande sur mesure, navigue majoritairement sur réseau 3G instable et appareils d'entrée de gamme (Tecno, Itel, Infinix).
- **Couturier** : artisan local, gère boutique/catalogue, devis, commandes sur mesure et jalons de progression — souvent peu digital, a besoin d'un onboarding simple.
- **Vendeur PAP** : boutique/marque de prêt-à-porter, gère stock, prix, promotions, expéditions.
- **Administrateur** : équipe plateforme, modère et valide vendeurs, gère la plateforme globalement.

Job à faire : acheter ou vendre de la mode en ligne en Côte d'Ivoire avec confiance (taille fiable, paiement protégé, couturiers tenus responsables), dans un contexte de connexion et d'équipement limités.

## Product Purpose

TheFriends Shopping est la première marketplace mode dédiée au marché ivoirien, combinant vente en ligne de prêt-à-porter, couture sur mesure, intelligence artificielle (recommandation, recherche visuelle) et communauté (partage de looks). Elle résout les problèmes structurels de l'achat vestimentaire en ligne en Côte d'Ivoire : tailles non standardisées, couturiers sans vitrine fiable, absence de protection contre les retards/abandons, mode africaine non représentée sur les plateformes généralistes existantes (Jumia, CoinAfrique).

Succès = un client peut acheter en confiance (taille juste, paiement protégé via escrow), un couturier/vendeur peut vendre sans connaissances techniques, et la plateforme devient la référence mode locale en Côte d'Ivoire.

## Brand Personality

Élégant, Chaleureux, Fiable.

- Élégant : serif (Georgia) réservé à la marque et aux prix, or comme signal de qualité jamais décoratif, blanc dominant et espaces généreux.
- Chaleureux : ancrage culturel ivoirien (wax, bazin, kente, artisanat), ton humain dans la communication produit.
- Fiable : transparence sur l'escrow, les pénalités, les scores de confiance — la confiance est le produit autant que la mode.

## Anti-references

Jumia, CoinAfrique : plateformes généralistes sans identité mode, sans personnalisation, qui inspirent une expérience d'achat froide et interchangeable. TheFriends Shopping doit se démarquer visuellement et fonctionnellement de ce gabarit "marketplace générique" — pas de grilles de promos criardes, pas de bannières publicitaires saturées, pas de hiérarchie visuelle plate où tout crie en même temps.

## Design Principles

- **La confiance se voit avant de se lire** : statuts d'escrow, scores, badges (Couturier Fiable, Sur mesure) doivent être visibles dans l'interface, pas enterrés dans des pages secondaires.
- **L'or se mérite** : réservé aux prix, CTA et signaux de valeur réels — jamais une décoration de remplissage. S'il est partout, il ne vaut plus rien.
- **Mobile d'abord, réseau instable toujours** : chaque écran doit rester utilisable en 3G avec un appareil d'entrée de gamme ; pas de dépendance lourde au JS, chargement progressif.
- **Deux écritures, deux rôles** : la serif (Georgia) parle pour la marque et la valeur (prix, titres produits) ; le sans-serif (Inter) sert l'action et la fonction (nav, boutons, formulaires). Ne jamais les confondre.
- **Simplicité pour les non-initiés** : couturiers et vendeurs peu digitaux doivent réussir leurs tâches critiques (publier un article, répondre à une demande) sans formation préalable.

## Accessibility & Inclusion

- WCAG AA minimum, contraste texte ≥ 4.5:1 (texte de grande taille ≥ 3:1), déjà posé comme règle dans la charte graphique.
- Interface utilisable par un public peu alphabétisé numériquement : libellés explicites, icônes redondantes avec le texte, parcours courts.
- Performance contrainte réseau : First Contentful Paint < 2s sur 3G, images compressées/WebP, mode offline partiel pour la navigation catalogue.
- Optimisation appareils d'entrée de gamme (faible RAM/CPU) : éviter les animations lourdes, prioriser le rendu progressif.
