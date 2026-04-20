import { cn } from "@/lib/utils";

export interface BrutalGradientChipProps {
  label: string;
  className?: string;
  /** When set, label is shown as-is (no forced uppercase). */
  preserveCase?: boolean;
}

/**
 * Reusable neo-brutalist label: mono, uppercase, animated gradient fill.
 * Use from slide content via `{ brutalChip: { label: "SWAG" } }` in `RichTextLine`.
 */
export function BrutalGradientChip({
  label,
  className,
  preserveCase = false,
}: BrutalGradientChipProps) {
  return (
    <span
      className={cn(
        "brutal-gradient-chip relative mx-1 inline-flex items-center justify-center leading-none border-[3px] border-foreground px-2 py-[0.2em] font-mono text-[0.88em] font-extrabold text-brutal-accent-fg brutal-shadow-sm sm:mx-1.5 sm:px-2.5 sm:py-[0.25em] sm:text-[0.9em] md:mx-2",
        preserveCase
          ? "tracking-wide sm:tracking-wide"
          : "uppercase tracking-[0.2em] sm:tracking-[0.22em]",
        className,
      )}
    >
      {preserveCase ? label : label.toUpperCase()}
    </span>
  );
}
