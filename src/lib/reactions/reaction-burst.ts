import type { ReactionParticle } from "@/components/deck/reaction-overlay";

export const REACTION_BURST_WINDOW_MS = 1400;
export const MAX_BURST_INTENSITY = 12;

const REACTION_TIMING_FNS = [
  "cubic-bezier(0.22, 1, 0.36, 1)",
  "cubic-bezier(0.4, 0, 0.2, 1)",
  "cubic-bezier(0.34, 1.35, 0.64, 1)",
  "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  "cubic-bezier(0.55, 0.06, 0.68, 0.19)",
  "cubic-bezier(0.17, 0.67, 0.83, 0.67)",
] as const;

function pickTimingFn(): string {
  return REACTION_TIMING_FNS[
    Math.floor(Math.random() * REACTION_TIMING_FNS.length)
  ]!;
}

/** rem — wide spread with a few tiny / chunky outliers */
function randomParticleSizeRem(intensity: number): number {
  const roll = Math.random();
  const base = 0.75 + Math.pow(Math.random(), 0.5) * 3.6;
  const outlier =
    roll > 0.94 ? 1.15 + Math.random() * 0.9 : roll < 0.08 ? -0.35 - Math.random() * 0.35 : 0;
  return Math.max(0.55, base + outlier + intensity * 0.075);
}

/** ms — mix of quick darts, cruisers, and slow drifters */
function randomTravelDurationMs(intensity: number): number {
  const band = Math.random();
  const i = intensity * 140;
  if (band < 0.22) {
    return 950 + Math.random() * 850 + i * 0.55;
  }
  if (band < 0.55) {
    return 1750 + Math.random() * 1400 + i * 0.75;
  }
  if (band < 0.82) {
    return 2800 + Math.random() * 1600 + i;
  }
  return 3800 + Math.random() * 2600 + i * 1.1;
}

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
      delayMs: Math.random() * 620,
      sizeRem: randomParticleSizeRem(capped),
      durationMs: randomTravelDurationMs(capped),
      timingFn: pickTimingFn(),
      mode: fromTop ? "fall" : "rise",
    });
  }

  return particles;
}
