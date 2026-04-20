import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presenter Login · FHGR",
  robots: { index: false, follow: false },
};

export default function PresentLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
