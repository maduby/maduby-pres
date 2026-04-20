import type { Metadata } from "next";
import { Libre_Baskerville, Montserrat } from "next/font/google";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const siteTitle = "Marc Duby · FHGR Zukunft 1";
const siteDescription =
  "Werdegang, Learnings und Hürden – Präsentation für Studierende der FHGR (de-CH).";

/**
 * Resolves og:url and og:image to an absolute HTTPS URL.
 * Prefer NEXT_PUBLIC_SITE_URL; else NEXT_PUBLIC_AUDIENCE_URL (e.g. whois.duby.io); else Vercel host; else whois.duby.io.
 */
const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_AUDIENCE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://whois.duby.io");

export const metadata: Metadata = {
  metadataBase: new URL(`${metadataBaseUrl}/`),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: siteTitle,
    locale: "de_CH",
    type: "website",
    images: [
      {
        url: "/og/muizenberg.webp",
        width: 2400,
        height: 1600,
        alt: "Muizenberg — Küste, Alltag, Zuhause am Atlantik",
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og/muizenberg.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de-CH"
      className={`${libreBaskerville.variable} ${montserrat.variable} min-h-[100svh] h-[100svh]`}
    >
      <body className="flex min-h-[100svh] flex-col font-sans font-medium antialiased">
        {children}
      </body>
    </html>
  );
}
