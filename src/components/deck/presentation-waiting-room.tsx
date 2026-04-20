import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { uiStrings } from "@/content/strings.de-ch";
import { WaitingRoomDuckGame } from "@/components/deck/waiting-room-duck-game";
import { cn } from "@/lib/utils";

interface PresentationWaitingRoomProps {
  mode: "audience" | "presenter";
  sessionLoading: boolean;
  onStartPresentation?: () => void;
  startPending?: boolean;
  startError?: string | null;
}

/** Non-interactive replicas of header controls for the explainer (pointer-events none). */
function DemoPrevNext() {
  return (
    <span
      className="mx-1 inline-flex shrink-0 items-center gap-1 align-[-0.12em]"
      aria-hidden
    >
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-sm border-[3px] border-foreground bg-background brutal-shadow-sm",
        )}
      >
        <ChevronLeft className="size-[0.95rem] shrink-0" strokeWidth={2.5} aria-hidden />
      </span>
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-sm border-[3px] border-foreground bg-background brutal-shadow-sm",
        )}
      >
        <ChevronRight className="size-[0.95rem] shrink-0" strokeWidth={2.5} aria-hidden />
      </span>
    </span>
  );
}

function DemoLiveButton() {
  return (
    <span
      className={cn(
        "mx-1 inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-sm border-[3px] border-foreground bg-background px-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] brutal-shadow-sm align-[-0.12em]",
      )}
      aria-hidden
    >
      {uiStrings.synced}
    </span>
  );
}

function DemoFeedbackButton() {
  return (
    <span
      className={cn(
        "mx-1 inline-flex size-8 shrink-0 items-center justify-center rounded-sm border-[3px] border-foreground bg-brutal-hot text-white brutal-shadow-sm align-[-0.12em]",
      )}
      aria-hidden
    >
      <MessageCircle className="size-4" strokeWidth={2.5} aria-hidden />
    </span>
  );
}

function DemoReactionChips() {
  return (
    <span className="mx-1 inline-flex shrink-0 items-center gap-1 align-[-0.12em]" aria-hidden>
      {(["❤️", "🔥", "👏"] as const).map((emoji) => (
        <span
          key={emoji}
          className="inline-flex size-8 items-center justify-center rounded-sm border-[3px] border-foreground bg-background text-[0.95rem] leading-none brutal-shadow-sm"
        >
          <span className="pointer-events-none select-none leading-none">{emoji}</span>
        </span>
      ))}
    </span>
  );
}

const itemClass =
  "font-mono text-[13px] font-medium leading-6 text-foreground/90 sm:text-[14px]";

const DEFAULT_AUDIENCE_URL = "https://whois.duby.io";

function audienceJoinHref(): string {
  const raw = process.env.NEXT_PUBLIC_AUDIENCE_URL?.trim();
  if (!raw) return DEFAULT_AUDIENCE_URL;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function audienceJoinLabel(): string {
  try {
    return new URL(audienceJoinHref()).host;
  } catch {
    return "whois.duby.io";
  }
}

export function PresentationWaitingRoom({
  mode,
  sessionLoading,
  onStartPresentation,
  startPending = false,
  startError = null,
}: PresentationWaitingRoomProps) {
  const isPresenter = mode === "presenter";

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col justify-start overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6",
        "[-webkit-overflow-scrolling:touch]",
      )}
    >
      <div className="mx-auto w-full max-w-2xl shrink-0 border-[3px] border-foreground bg-background p-4 brutal-shadow sm:p-6 md:p-8">
        <div className="border-[3px] border-foreground bg-brutal-accent/20 px-4 py-6 text-center brutal-shadow-sm sm:px-6 sm:py-8">
          <p className="font-heading text-lg font-bold leading-snug text-foreground sm:text-xl">
            {uiStrings.preStartJoinLead}
          </p>
          <a
            href={audienceJoinHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-heading mt-3 block break-words text-3xl font-bold leading-none tracking-tight text-brutal-accent sm:mt-4 sm:text-4xl md:text-5xl"
          >
            {audienceJoinLabel()}
          </a>
        </div>

        <WaitingRoomDuckGame />

        <p className="mt-6 font-heading text-xl font-bold leading-tight text-foreground sm:mt-8 sm:text-2xl md:text-3xl">
          {uiStrings.preStartTitle}
        </p>
        <div className="mt-4 flex items-center gap-2.5" aria-hidden>
          <span className="h-[3px] flex-1 bg-foreground" />
          <span className="h-3 w-10 shrink-0 border-[3px] border-foreground bg-brutal-accent/25 brutal-shadow-sm" />
          <span className="h-[3px] w-16 shrink-0 bg-foreground" />
        </div>

        <ul className="mt-5 list-none space-y-3.5">
          <li className={itemClass}>
            <p className="text-foreground/90">
              {uiStrings.preStartExplainNavBefore} <DemoPrevNext />{" "}
              {uiStrings.preStartExplainNavAfter}
            </p>
          </li>
          <li className={itemClass}>
            <p className="text-foreground/90">
              {uiStrings.preStartExplainLiveBefore} <DemoLiveButton />{" "}
              {uiStrings.preStartExplainLiveAfter}
            </p>
          </li>
          <li className={itemClass}>
            <p className="text-foreground/90">
              {uiStrings.preStartExplainFeedbackBefore} <DemoFeedbackButton />{" "}
              {uiStrings.preStartExplainFeedbackAfter}
            </p>
          </li>
          <li className={itemClass}>
            <p className="text-foreground/90">
              {uiStrings.preStartExplainReactionsBefore} <DemoReactionChips />{" "}
              {uiStrings.preStartExplainReactionsAfter}
            </p>
          </li>
          <li className={itemClass}>{uiStrings.preStartExplainPolls}</li>
        </ul>

        {isPresenter ? (
          <div className="mt-8 flex flex-col gap-3 border-t-[3px] border-foreground pt-6">
            <button
              type="button"
              disabled={sessionLoading || startPending || !onStartPresentation}
              onClick={onStartPresentation}
              className="brutal-pressable border-[3px] border-foreground bg-brutal-accent px-4 py-3 font-sans text-sm font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow-sm disabled:opacity-45"
            >
              {startPending ? uiStrings.preStartStarting : uiStrings.preStartCta}
            </button>
            {startError ? (
              <p className="font-sans text-sm font-bold text-red-700 dark:text-red-400" role="alert">
                {startError}
              </p>
            ) : null}
            <p className="font-sans text-[11px] font-semibold leading-snug text-foreground/65">
              {uiStrings.preStartPresenterNote}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
