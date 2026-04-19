import { Suspense } from "react";
import { DeckShell } from "@/components/deck/deck-shell";
import { slides } from "@/content/slides.de-ch";

function DeckFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground/80">
      Präsentation wird geladen …
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DeckFallback />}>
      <DeckShell slides={slides} />
    </Suspense>
  );
}
