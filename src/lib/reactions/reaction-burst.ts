import type { ReactionParticle } from "@/components/deck/reaction-overlay";

export const REACTION_BURST_WINDOW_MS = 1400;
export const MAX_BURST_INTENSITY = 12;

export function recordBurstIntensity(burstTimestampsRef: {
  current: number[];
}): number {
  const now = Date.now();
  burstTimestampsRef.current = burstTimestampsRef.current.filter(
    (t) => now - t <= REACTION_BURST_WINDOW_MS,
  );
  burstTimestampsRef.current.push(now);
  return Math.min(MAX_BURST_INTENSITY, burstTimestampsRef.current.length);
}

export function buildEmojiBurst(
  emoji: string,
  intensity: number,
): ReactionParticle[] {
  const capped = Math.min(MAX_BURST_INTENSITY, Math.max(1, intensity));
  const count = Math.min(72, 5 + capped * 7);
  const particles: ReactionParticle[] = [];

  for (let i = 0; i < count; i++) {
    const fromTop = Math.random() > 0.42;
    particles.push({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 10)}`,
      emoji,
      x: 2 + Math.random() * 96,
      delayMs: Math.random() * 480,
      sizeRem: 1.85 + Math.random() * 1.9 + capped * 0.06,
      durationMs: 2600 + Math.random() * 1600 + capped * 220,
      mode: fromTop ? "fall" : "rise",
    });
  }

  return particles;
}

export async function fireConfettiForIntensity(intensity: number): Promise<void> {
  if (typeof window === "undefined") return;
  const confetti = (await import("canvas-confetti")).default;
  const n = Math.min(MAX_BURST_INTENSITY, Math.max(1, intensity));

  const base = {
    origin: { x: 0.5, y: 0.9 },
    zIndex: 240,
    gravity: 0.9,
    ticks: 280,
    colors: [
      "#14b8a6",
      "#f472b6",
      "#fbbf24",
      "#a78bfa",
      "#38bdf8",
      "#fb7185",
      "#4ade80",
      "#facc15",
    ],
  };

  void confetti({
    ...base,
    particleCount: Math.min(200, 26 + n * 30),
    spread: 58 + n * 8,
    startVelocity: 26 + n * 5,
    scalar: 0.9,
  });

  if (n >= 4) {
    window.setTimeout(() => {
      void confetti({
        ...base,
        particleCount: Math.min(160, 40 + n * 22),
        spread: 100,
        startVelocity: 32 + n * 3,
        scalar: 0.75,
        gravity: 0.75,
      });
    }, 120);
  }

  if (n >= 8) {
    window.setTimeout(() => {
      void confetti({
        ...base,
        particleCount: 90,
        spread: 360,
        startVelocity: 18,
        scalar: 0.65,
        gravity: 1.05,
      });
    }, 220);
  }
}
