import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Providers } from "@/components/site/Providers";
import { SITE } from "@/lib/site";
import "./globals.css";

const display = localFont({
  src: [
    { path: "./fonts/NotoSerifDisplay-latin.woff2", style: "normal" },
    { path: "./fonts/NotoSerifDisplay-Italic-latin.woff2", style: "italic" },
  ],
  weight: "100 900",
  variable: "--font-noto-display",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62.5% 100%" }],
});

const sans = localFont({
  src: "./fonts/Archivo-latin.woff2",
  weight: "100 900",
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} | ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = {
  themeColor: "#050607",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <a
            href="#main"
            className="brushed-gold sr-only z-50 rounded-control px-4 py-3 text-body-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to Main Content
          </a>
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
