"use client"

import { createContext, useContext, useEffect } from "react"
import { useShopTheme, ShopTheme, DEFAULT_THEME } from "./useShopTheme"

interface ThemeContextValue {
  theme: ShopTheme
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  isLoading: false,
})

export function useThemeContext() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  shopId: number
  children: React.ReactNode
}

/**
 * Applique le thème d'une boutique en injectant des CSS variables sur le conteneur.
 * À envelopper autour de /boutique/[id] uniquement.
 *
 * Variables CSS générées :
 *   --tf-shop-primary     → couleur principale
 *   --tf-shop-secondary   → couleur secondaire
 *   --tf-shop-bg          → fond
 *   --tf-shop-text        → texte
 *   --tf-shop-accent      → accent
 *   --tf-shop-font-title  → police des titres
 *   --tf-shop-font-body   → police du corps
 */
export function ShopThemeProvider({ shopId, children }: ThemeProviderProps) {
  const { data: theme, isLoading } = useShopTheme(shopId)
  const activeTheme = theme ?? DEFAULT_THEME

  useEffect(() => {
    const root = document.getElementById(`shop-theme-${shopId}`)
    if (!root || !theme) return

    root.style.setProperty("--tf-shop-primary", activeTheme.couleur_principale)
    root.style.setProperty("--tf-shop-secondary", activeTheme.couleur_secondaire)
    root.style.setProperty("--tf-shop-bg", activeTheme.couleur_fond)
    root.style.setProperty("--tf-shop-text", activeTheme.couleur_texte)
    root.style.setProperty("--tf-shop-accent", activeTheme.couleur_accent)
    root.style.setProperty("--tf-shop-font-title", `'${activeTheme.police_titres}', Georgia, serif`)
    root.style.setProperty("--tf-shop-font-body", `'${activeTheme.police_corps}', Inter, sans-serif`)
  }, [activeTheme, shopId, theme])

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, isLoading }}>
      <div
        id={`shop-theme-${shopId}`}
        style={{ backgroundColor: activeTheme.couleur_fond, color: activeTheme.couleur_texte }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

/**
 * Version prévisualisation pour l'éditeur de thème dans le dashboard.
 * Prend un thème en prop au lieu de le fetcher.
 */
export function ShopThemePreview({
  theme,
  children,
}: {
  theme: ShopTheme
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        backgroundColor: theme.couleur_fond,
        color: theme.couleur_texte,
        // @ts-ignore — CSS variables custom
        "--tf-shop-primary": theme.couleur_principale,
        "--tf-shop-secondary": theme.couleur_secondaire,
        "--tf-shop-bg": theme.couleur_fond,
        "--tf-shop-text": theme.couleur_texte,
        "--tf-shop-accent": theme.couleur_accent,
        "--tf-shop-font-title": `'${theme.police_titres}', Georgia, serif`,
        "--tf-shop-font-body": `'${theme.police_corps}', Inter, sans-serif`,
      }}
    >
      {children}
    </div>
  )
}
