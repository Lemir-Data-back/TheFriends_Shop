import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-tf-bg text-tf-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
