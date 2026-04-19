import type { Metadata } from "next";
import { Halant, Nunito_Sans } from "next/font/google";
import "./globals.css";

const halant = Halant({
  variable: "--font-halant",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
      className={`${halant.variable} ${nunitoSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans font-medium antialiased">
        {children}
      </body>
    </html>
  );
}
