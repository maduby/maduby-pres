"use client";

import { BrutalGradientChip } from "@/components/deck/brutal-gradient-chip";

export function BigSwagOverlay({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[250] flex items-center justify-center bg-foreground/[0.14] backdrop-blur-[3px]"
      aria-hidden
    >
      <div className="deck-swag-blast-pop px-4">
        <BrutalGradientChip
          label="SWAG"
          className="!mx-0 !border-[5px] !px-6 !py-4 !text-[clamp(2.25rem,11vw,7.5rem)] !tracking-[0.14em] sm:!border-[6px] sm:!px-10 sm:!py-7 sm:!tracking-[0.18em] md:!tracking-[0.2em] brutal-shadow-lg"
        />
      </div>
    </div>
  );
}
