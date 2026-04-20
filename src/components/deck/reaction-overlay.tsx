"use client";

export interface ReactionParticle {
  id: string;
  emoji: string;
  x: number;
  delayMs?: number;
  sizeRem?: number;
  durationMs?: number;
  mode?: "rise" | "fall";
  /** CSS timing function for the travel animation */
  timingFn?: string;
}

export function ReactionOverlay({ particles }: { particles: ReactionParticle[] }) {
  if (particles.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => {
        const delay = p.delayMs ?? 0;
        const durationSec = ((p.durationMs ?? 3400) / 1000).toFixed(2);
        const size = p.sizeRem ?? 3;
        const ease = p.timingFn ?? "cubic-bezier(0.22, 1, 0.36, 1)";
        const anim =
          p.mode === "fall" ? "deck-reaction-fall" : "deck-reaction-rise";
        return (
          <span
            key={p.id}
            className={`deck-reaction-particle absolute select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] ${p.mode === "fall" ? "top-0" : "bottom-[10%]"}`}
            style={{
              left: `${p.x}%`,
              fontSize: `${size}rem`,
              animation: `${anim} ${durationSec}s ${ease} ${delay}ms 1 normal both`,
            }}
          >
            {p.emoji}
          </span>
        );
      })}
    </div>
  );
}
