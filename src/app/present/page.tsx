import type { Metadata } from "next";
import { Suspense } from "react";
import { DeckShell } from "@/components/deck/deck-shell";
import { slides } from "@/content/slides.de-ch";

export const metadata: Metadata = {
  title: "Presenter · Marc Duby · FHGR",
  description: "Presenter-Ansicht (nicht für das Publikum teilen).",
  robots: { index: false, follow: false },
};

function DeckFallback() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-background px-6">
      <p className="border-[3px] border-foreground bg-background px-6 py-4 font-heading text-lg font-bold text-foreground brutal-shadow">
        Präsentation wird geladen …
      </p>
    </div>
  );
}

export default function PresentPage() {
  return (
    <Suspense fallback={<DeckFallback />}>
      <DeckShell slides={slides} variant="presenter" />
    </Suspense>
  );
}
