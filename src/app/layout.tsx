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

export const metadata: Metadata = {
  title: "Marc Duby · FHGR Zukunft 1",
  description:
    "Werdegang, Learnings und Hürden – Präsentation für Studierende der FHGR (de-CH).",
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
