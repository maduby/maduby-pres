"use client";

import { useEffect, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import type { Slide } from "@/lib/deck/schema";
import { uiStrings } from "@/content/strings.de-ch";
import { useDeckPoll } from "@/components/deck/live-poll-provider";

export type LivePollSlideModel = Extract<Slide, { kind: "livePoll" }>;

function PollBars({
  options,
  tallies,
  status,
}: {
  options: string[];
  tallies: number[];
  status: "live" | "results";
}) {
  const total = tallies.reduce((a, b) => a + b, 0);
  return (
    <div className="mt-6 space-y-4">
      {options.map((label, i) => {
        const count = tallies[i] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
        const widthPct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={`${i}-${label}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 font-sans text-[11px] font-extrabold uppercase tracking-wide text-foreground sm:text-xs">
              <span className="min-w-0 flex-1 leading-snug">{label}</span>
              <span className="shrink-0 tabular-nums text-foreground/80">
                {count}
                <span className="text-foreground/55"> · {pct}%</span>
              </span>
            </div>
            <div className="h-5 overflow-hidden border-[3px] border-foreground bg-foreground/[0.08] sm:h-6">
              <motion.div
                className="h-full bg-brutal-accent"
                initial={false}
                animate={{ width: `${widthPct}%` }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 32,
                  mass: 0.85,
                }}
              />
            </div>
          </div>
        );
      })}
      <p className="pt-1 font-sans text-[11px] font-bold uppercase tracking-wide text-foreground/55">
        {status === "live" ? uiStrings.pollTotalVotesLive : uiStrings.pollTotalVotesFinal}{" "}
        <span className="tabular-nums text-foreground">{total}</span>
      </p>
    </div>
  );
}

export function LivePollSlideContent({
  slide,
  slideIndex,
  activeSlideIndex,
}: {
  slide: LivePollSlideModel;
  slideIndex: number;
  activeSlideIndex: number;
}) {
  const {
    supabaseReady,
    isPresenterView,
    audiencePollDisabled,
    snapshot,
    audienceHasVoted,
    registerPollSlide,
    beginLivePoll,
    endLivePoll,
    submitVote,
  } = useDeckPoll();

  useLayoutEffect(() => {
    if (slideIndex !== activeSlideIndex) {
      registerPollSlide(null);
      return;
    }
    registerPollSlide({
      slideIndex,
      question: slide.question,
      options: slide.options,
    });
    return () => registerPollSlide(null);
  }, [activeSlideIndex, registerPollSlide, slide.options, slide.question, slideIndex]);

  const snap =
    snapshot && snapshot.slideIndex === slideIndex && slideIndex === activeSlideIndex
      ? snapshot
      : null;

  return (
    <div className="flex min-h-0 flex-col gap-4 py-2 sm:gap-6 sm:py-2 md:py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="inline-flex items-center border-[3px] border-foreground bg-brutal-hot px-2 py-1 font-sans text-[10px] font-extrabold uppercase tracking-[0.2em] text-white brutal-shadow-sm sm:text-xs">
          {slide.kicker ?? uiStrings.pollKickerBadge}
        </p>
        {!supabaseReady ? (
          <span className="font-sans text-[11px] font-bold uppercase text-foreground/60">
            {uiStrings.pollSupabaseRequired}
          </span>
        ) : null}
      </div>

      <h2 className="font-heading text-xl font-bold leading-tight tracking-tight text-balance sm:text-2xl md:text-4xl lg:text-5xl">
        {slide.question}
      </h2>

      {isPresenterView ? (
        <div className="space-y-6">
          {!supabaseReady ? (
            <ul className="list-inside list-disc space-y-2 font-sans text-sm font-semibold text-foreground/85">
              {slide.options.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          ) : !snap ? (
            <div className="space-y-4">
              <p className="font-sans text-sm font-semibold text-foreground/80">
                {uiStrings.pollPresenterIntro}
              </p>
              <ul className="grid gap-2 font-sans text-sm font-bold uppercase tracking-wide text-foreground/90 sm:grid-cols-2 sm:gap-3 lg:gap-4 lg:text-base xl:text-lg">
                {slide.options.map((o) => (
                  <li
                    key={o}
                    className="border-2 border-foreground bg-background px-3 py-2 brutal-shadow-sm sm:px-4 sm:py-3 lg:px-6 lg:py-4 xl:px-7 xl:py-5"
                  >
                    {o}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="brutal-pressable inline-flex border-[3px] border-foreground bg-brutal-accent px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow sm:text-sm lg:px-6 lg:py-3 lg:text-base"
                onClick={beginLivePoll}
              >
                {uiStrings.pollStartLive}
              </button>
            </div>
          ) : snap.status === "live" ? (
            <div className="space-y-4">
              <PollBars options={snap.options} tallies={snap.tallies} status="live" />
              <button
                type="button"
                className="brutal-pressable border-[3px] border-foreground bg-brutal-warn px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-warn-fg brutal-shadow sm:text-sm lg:px-6 lg:py-3 lg:text-base"
                onClick={endLivePoll}
              >
                {uiStrings.pollStopLive}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-sans text-sm font-extrabold uppercase tracking-wide text-foreground/75">
                {uiStrings.pollEndedPresenter}
              </p>
              <PollBars options={snap.options} tallies={snap.tallies} status="results" />
              <button
                type="button"
                className="brutal-pressable border-[3px] border-foreground bg-brutal-accent px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow sm:text-sm lg:px-6 lg:py-3 lg:text-base"
                onClick={beginLivePoll}
              >
                {uiStrings.pollStartAgain}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {!supabaseReady ? (
            <p className="font-sans text-sm font-semibold text-foreground/70">
              {uiStrings.pollAudienceOffline}
            </p>
          ) : audiencePollDisabled && !snap ? (
            <div className="space-y-4">
              <p className="font-sans text-sm font-semibold text-foreground/85">
                {uiStrings.pollAudiencePasswordMode}
              </p>
              <ul className="grid gap-2 font-sans text-sm font-bold uppercase tracking-wide text-foreground/90 sm:grid-cols-2 sm:gap-3 lg:gap-4 lg:text-base">
                {slide.options.map((o) => (
                  <li
                    key={o}
                    className="border-2 border-foreground bg-background px-3 py-2 opacity-80 brutal-shadow-sm sm:px-4 sm:py-3"
                  >
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          ) : !snap ? (
            <p className="font-sans text-sm font-semibold text-foreground/80">
              {uiStrings.pollAudienceWaiting}
            </p>
          ) : snap.status === "live" ? (
            <>
              <PollBars options={snap.options} tallies={snap.tallies} status="live" />
              <div className="border-t-[3px] border-foreground pt-5">
                {audiencePollDisabled ? (
                  <p className="border-[3px] border-foreground bg-foreground/[0.06] px-4 py-3 font-sans text-sm font-extrabold uppercase tracking-wide text-foreground brutal-shadow-sm">
                    {uiStrings.pollAudiencePasswordMode}
                  </p>
                ) : audienceHasVoted ? (
                  <p className="border-[3px] border-foreground bg-brutal-accent/15 px-4 py-3 font-sans text-sm font-extrabold uppercase tracking-wide text-foreground brutal-shadow-sm">
                    {uiStrings.pollAudienceThanks}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="font-sans text-sm font-semibold leading-snug text-foreground/85">
                      {uiStrings.pollAudienceVotePrompt}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:gap-4">
                      {snap.options.map((opt, i) => (
                        <button
                          key={`${opt}-${i}`}
                          type="button"
                          className="brutal-pressable border-[3px] border-foreground bg-background px-4 py-3 text-left font-sans text-sm font-extrabold uppercase tracking-wide text-foreground brutal-shadow-sm sm:py-4 sm:text-base lg:px-6 lg:py-5 lg:text-lg xl:px-8 xl:py-6 xl:text-xl"
                          onClick={() => submitVote(i)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="font-sans text-sm font-extrabold uppercase tracking-wide text-foreground/75">
                {uiStrings.pollAudienceClosed}
              </p>
              <PollBars options={snap.options} tallies={snap.tallies} status="results" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
