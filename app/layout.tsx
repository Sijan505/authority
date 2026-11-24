import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Newsreader, Tiro_Devanagari_Hindi } from "next/font/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { Analytics } from "@/components/Analytics";
import { AppTabBar } from "@/components/AppTabBar";
import { InquiryForm } from "@/components/Inquiry";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { copy } from "@/content/copy";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const tiro = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  subsets: ["devanagari"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: copy.meta.title, template: "%s · Authority" },
  description: copy.meta.description,
  openGraph: { title: copy.meta.title, description: copy.meta.description, siteName: "Authority", type: "website" },
};

export const viewport: Viewport = { themeColor: "#fcfbf0" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${newsreader.variable} ${hanken.variable} ${tiro.variable} antialiased`}>
      <body className="flex min-h-svh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ivory focus:p-2 focus:text-ink">
          Skip to content
        </a>
        {/* Without JS nothing would mark scroll reveals as shown, so show them outright. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <SiteHeader />
        <div id="main" className="flex-1">
          {children}
        </div>
        <SiteFooter />
        <AppTabBar />
        <InquiryForm />
        <Analytics />
        <VercelAnalytics />
      </body>
    </html>
  );
}
