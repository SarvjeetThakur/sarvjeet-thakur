import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { OG_IMAGE, site, SITE_URL } from "@/modules/portfolio";
import { Theme, THEME_COLORS, ThemeProvider } from "@/modules/theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Without metadataBase there is no self-canonical — a www/non-www pair or an
  // indexable preview deployment competes with production — and Next treats a
  // relative OG image as a build error.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: site.meta.title,
  description: site.meta.description,
  verification: {
    google: "EdBKUT1uzBwVqTErRQwSy-tOWqvcsuHtc4fZkLfB2Xw",
  },
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.meta.title,
    description: site.meta.description,
    locale: site.language,
    images: [{ ...OG_IMAGE, alt: site.meta.ogAlt }],
  },
  twitter: {
    // A portfolio is distributed by being shared, so the card is a ranking
    // signal through click-through, not decoration.
    card: "summary_large_image",
    title: site.meta.title,
    description: site.meta.description,
    images: [{ ...OG_IMAGE, alt: site.meta.ogAlt }],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  // One hardcoded dark hex gave a light-theme reader dark browser chrome.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS[Theme.Light] },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS[Theme.Dark] },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets data-theme on <html> before hydration
    <html lang={site.language} className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
