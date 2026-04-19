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
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground/80">
      Präsentation wird geladen …
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
