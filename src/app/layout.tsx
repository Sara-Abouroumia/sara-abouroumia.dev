import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const DESCRIPTION =
  "Software engineer working across backend systems, web, and mobile.";

export const metadata: Metadata = {
  /**
   * Resolves every relative URL in metadata (canonicals, OG images) against
   * the real origin. Without it Next warns at build time and falls back to
   * localhost, which ships broken absolute URLs to production.
   */
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.role}`,
    template: `%s · ${site.name}`,
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} · ${site.role}`,
    description: DESCRIPTION,
    url: "/",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lora.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            {/* Same 880 as the header and footer, so the page h1 starts at the
                same x as the site name above it. Long-form prose is capped
                inside this column rather than by it — see PROSE in
                components/section.tsx. */}
            <main className="mx-auto w-full max-w-[880px] flex-1 px-6 pt-14 pb-24">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
