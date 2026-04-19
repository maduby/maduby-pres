"use client";

export interface ReactionParticle {
  id: string;
  emoji: string;
  x: number;
}

export function ReactionOverlay({ particles }: { particles: ReactionParticle[] }) {
  if (particles.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="deck-reaction-particle absolute bottom-[10%] select-none text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:text-6xl"
          style={{
            left: `${p.x}%`,
            animation:
              "deck-reaction-rise 3.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
