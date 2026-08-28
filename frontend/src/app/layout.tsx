import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = localFont({
  src: "../fonts/inter-variable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-400.woff2", weight: "400" },
    { path: "../fonts/ibm-plex-mono-500.woff2", weight: "500" },
    { path: "../fonts/ibm-plex-mono-600.woff2", weight: "600" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | TheFriends Shopping",
    default: "TheFriends Shopping — Ta mode, ton style.",
  },
  description:
    "La première plateforme de mode en ligne dédiée à la Côte d'Ivoire. Prêt-à-porter, couture sur mesure, wax, bazin, kente.",
  applicationName: "TheFriends Shopping",
  keywords: ["mode", "Côte d'Ivoire", "wax", "bazin", "couture", "prêt-à-porter", "Abidjan"],
  authors: [{ name: "TheFriends Companies" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "TF Shopping",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "TheFriends Shopping",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-tf-bg text-tf-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
