import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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

export const metadata: Metadata = {
  title: {
    default: "Sara Abouroumia",
    template: "%s · Sara Abouroumia",
  },
  description:
    "Software engineer working across backend systems, web, and mobile.",
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
            <main className="mx-auto w-full max-w-[720px] flex-1 px-6 pt-14 pb-24">
              {children}
            </main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
