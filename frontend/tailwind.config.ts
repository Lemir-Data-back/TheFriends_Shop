import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Palette TheFriends Shopping ───────────────────────────────
      colors: {
        // Couleurs principales
        "tf-black": "#111111",
        "tf-charbon": "#1C1C1C",
        "tf-gold": "#C9A84C",
        "tf-gold-light": "#F0D080",
        "tf-gold-dark": "#B8892A",

        // Fonds et surfaces
        "tf-bg": "#FDFCFA",
        "tf-surface": "#FFFFFF",
        "tf-gray-soft": "#F5F4F1",
        "tf-border": "#E8E4DC",

        // Textes
        "tf-text": "#111111",
        "tf-text-muted": "#7A766F",

        // Sémantiques
        "tf-success": "#2D6A4F",
        "tf-success-bg": "#D8F3DC",
        "tf-error": "#C0392B",
        "tf-error-bg": "#FFCCCC",
        "tf-warning": "#B8892A",
        "tf-warning-bg": "#FFF3CD",
        "tf-info": "#185FA5",
        "tf-info-bg": "#E8F0FB",
      },

      // ─── Typographie ───────────────────────────────────────────────
      fontFamily: {
        serif: ["Georgia", "'Times New Roman'", "serif"],
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-plex-mono)", "'IBM Plex Mono'", "'Courier New'", "monospace"],
      },

      fontSize: {
        "display": ["clamp(40px, 6vw, 72px)", { lineHeight: "1.1", fontWeight: "400" }],
        "h1": ["clamp(28px, 3vw, 36px)", { lineHeight: "1.2", fontWeight: "400" }],
        "h2": ["clamp(20px, 2.5vw, 24px)", { lineHeight: "1.3", fontWeight: "600" }],
        "h3": ["clamp(16px, 2vw, 18px)", { lineHeight: "1.4", fontWeight: "600" }],
        "body": ["15px", { lineHeight: "1.6" }],
        "price": ["clamp(16px, 1.5vw, 22px)", { lineHeight: "1.2", fontWeight: "500" }],
        "label": ["11px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "0.12em" }],
        "nav": ["13px", { lineHeight: "1.2", fontWeight: "500" }],
        "btn": ["13px", { lineHeight: "1", fontWeight: "700" }],
        "micro": ["10px", { lineHeight: "1.3", fontWeight: "400" }],
      },

      // ─── Border radius ─────────────────────────────────────────────
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "16px",
        "2xl": "22px",
        full: "9999px",
      },

      // ─── Espacements ───────────────────────────────────────────────
      spacing: {
        "bottom-nav": "64px",
      },

      // ─── Ombres ────────────────────────────────────────────────────
      boxShadow: {
        card: "0 4px 16px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.12)",
        gold: "0 0 0 3px rgba(201, 168, 76, 0.2)",
      },

      // ─── Breakpoints ───────────────────────────────────────────────
      screens: {
        xs: "375px",
        sm: "390px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },

      // ─── Animations ────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: "150ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
