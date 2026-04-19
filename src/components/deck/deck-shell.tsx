"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { Slide, Slides } from "@/lib/deck/schema";
import { SlideRenderer } from "@/components/deck/slide-renderer";
import {
  ReactionOverlay,
  type ReactionParticle,
} from "@/components/deck/reaction-overlay";
import {
  buildEmojiBurst,
  fireConfettiForIntensity,
  recordBurstIntensity,
} from "@/lib/reactions/reaction-burst";
import { uiStrings } from "@/content/strings.de-ch";

const PRESENTER_STORAGE_KEY = "fhgr-deck-presenter-secret";
const POLL_MS = 4000;
const REACTION_COOLDOWN_MS = 260;
const REACTION_CLEANUP_MS = 5600;
const MAX_REACTION_PARTICLES = 200;

const REACTION_BUTTONS = [
  { emoji: "❤️", label: uiStrings.reactionHeart },
  { emoji: "🔥", label: uiStrings.reactionFire },
  { emoji: "👏", label: uiStrings.reactionClap },
  { emoji: "😮", label: uiStrings.reactionWow },
  { emoji: "🎉", label: uiStrings.reactionParty },
  { emoji: "💀", label: uiStrings.reactionSkull },
  { emoji: "😭", label: uiStrings.reactionSob },
  { emoji: "🤡", label: uiStrings.reactionClown },
  { emoji: "✨", label: uiStrings.reactionSparkle },
  { emoji: "💯", label: uiStrings.reactionHundred },
  { emoji: "🐐", label: uiStrings.reactionGoat },
  { emoji: "🫡", label: uiStrings.reactionSalute },
  { emoji: "🧢", label: uiStrings.reactionCap },
  { emoji: "🤝", label: uiStrings.reactionHandshake },
  { emoji: "🍿", label: uiStrings.reactionPopcorn },
  { emoji: "👀", label: uiStrings.reactionEyes },
  { emoji: "🫶", label: uiStrings.reactionHeartHands },
  { emoji: "🤯", label: uiStrings.reactionMindBlown },
] as const;

function clampIndex(i: number, max: number) {
  return Math.max(0, Math.min(max, i));
}

export function DeckShell({
  slides,
  variant = "audience",
}: {
  slides: Slides;
  variant?: "audience" | "presenter";
}) {
  const isPresenterView = variant === "presenter";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const maxIndex = slides.length - 1;
  const sessionId = process.env.NEXT_PUBLIC_DECK_SESSION_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(supabaseUrl && supabaseAnon && sessionId);

  const index = useMemo(() => {
    const raw = searchParams.get("s");
    const n = raw === null ? 0 : Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return 0;
    return clampIndex(n, maxIndex);
  }, [searchParams, maxIndex]);

  const [followLive, setFollowLive] = useState(() => variant === "audience");
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [presenterKeyInput, setPresenterKeyInput] = useState("");
  const [presenterSecret, setPresenterSecret] = useState("");
  const [copyDone, setCopyDone] = useState(false);
  const [reactionParticles, setReactionParticles] = useState<ReactionParticle[]>(
    [],
  );

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reactionChannelRef = useRef<RealtimeChannel | null>(null);
  const reactionChannelReadyRef = useRef(false);
  const lastReactionSendRef = useRef(0);
  const reactionBurstWindowRef = useRef<number[]>([]);

  const replaceUrl = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("s", String(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const go = useCallback(
    (next: number) => {
      replaceUrl(clampIndex(next, maxIndex));
    },
    [maxIndex, replaceUrl],
  );

  const pushSlideToServer = useCallback(
    async (slideIndex: number) => {
      if (!sessionId || !presenterSecret) return;
      try {
        const res = await fetch("/api/present", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${presenterSecret}`,
          },
          body: JSON.stringify({ slideIndex, sessionId }),
        });
        if (!res.ok) {
          console.error("Present API error", await res.text());
        }
      } catch (e) {
        console.error(e);
      }
    },
    [presenterSecret, sessionId],
  );

  const togglePresenterPanel = () => {
    if (!presenterOpen) {
      if (typeof window !== "undefined") {
        const stored = window.sessionStorage.getItem(PRESENTER_STORAGE_KEY);
        if (stored) {
          setPresenterSecret(stored);
          setPresenterKeyInput(stored);
        }
      }
      setPresenterOpen(true);
      return;
    }
    setPresenterOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (!isPresenterView && followLive) {
        setFollowLive(false);
      }
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(maxIndex);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [followLive, go, index, isPresenterView, maxIndex]);

  useEffect(() => {
    if (!supabaseReady) {
      reactionChannelReadyRef.current = false;
      reactionChannelRef.current = null;
      return;
    }

    const supabase = createClient(supabaseUrl!, supabaseAnon!);
    const channel = supabase
      .channel(`deck-reactions:${sessionId}`, {
        config: { broadcast: { self: true } },
      })
      .on(
        "broadcast",
        { event: "reaction" },
        ({ payload }: { payload?: { emoji?: string } }) => {
          const emoji = payload?.emoji;
          if (!emoji || typeof emoji !== "string") return;
          const intensity = recordBurstIntensity(reactionBurstWindowRef);
          const batch = buildEmojiBurst(emoji, intensity);
          setReactionParticles((prev) =>
            [...prev, ...batch].slice(-MAX_REACTION_PARTICLES),
          );
          void fireConfettiForIntensity(intensity);
          window.setTimeout(() => {
            const ids = new Set(batch.map((b) => b.id));
            setReactionParticles((prev) => prev.filter((p) => !ids.has(p.id)));
          }, REACTION_CLEANUP_MS);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          reactionChannelReadyRef.current = true;
          reactionChannelRef.current = channel;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reactionChannelReadyRef.current = false;
        }
      });

    return () => {
      reactionChannelReadyRef.current = false;
      reactionChannelRef.current = null;
      void channel.unsubscribe();
    };
  }, [sessionId, supabaseAnon, supabaseReady, supabaseUrl]);

  const sendReaction = useCallback((emoji: string) => {
    if (!reactionChannelReadyRef.current || !reactionChannelRef.current) return;
    const now = Date.now();
    if (now - lastReactionSendRef.current < REACTION_COOLDOWN_MS) return;
    lastReactionSendRef.current = now;
    void reactionChannelRef.current.send({
      type: "broadcast",
      event: "reaction",
      payload: { emoji, slideIndex: index },
    });
  }, [index]);

  const fireReaction = useCallback(
    (emoji: string) => {
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
      sendReaction(emoji);
    },
    [sendReaction],
  );

  const resumeLiveFollow = useCallback(() => {
    setFollowLive(true);
  }, []);

  const navigateManual = useCallback(
    (next: number) => {
      if (!isPresenterView) setFollowLive(false);
      go(next);
    },
    [go, isPresenterView],
  );

  useEffect(() => {
    if (!followLive || !supabaseReady) {
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const supabase = createClient(supabaseUrl!, supabaseAnon!);

    const applyRemote = (slideIndex: number | null | undefined) => {
      if (slideIndex === null || slideIndex === undefined) return;
      if (!Number.isFinite(slideIndex)) return;
      const clamped = clampIndex(Math.floor(slideIndex), maxIndex);
      replaceUrl(clamped);
    };

    const fetchOnce = async () => {
      const { data, error } = await supabase
        .from("deck_sessions")
        .select("slide_index")
        .eq("id", sessionId!)
        .maybeSingle();
      if (error) {
        console.error(error);
      }
      applyRemote(data?.slide_index as number | undefined);
    };

    void fetchOnce();

    const channel = supabase
      .channel(`deck-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deck_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const next = (payload.new as { slide_index?: number })?.slide_index;
          applyRemote(next);
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Supabase Realtime channel error");
        }
      });

    channelRef.current = channel;

    pollRef.current = setInterval(() => {
      void fetchOnce();
    }, POLL_MS);

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [followLive, maxIndex, replaceUrl, sessionId, supabaseAnon, supabaseReady, supabaseUrl]);

  useEffect(() => {
    if (!presenterOpen || !presenterSecret || followLive) return;
    void pushSlideToServer(index);
  }, [followLive, index, presenterOpen, presenterSecret, pushSlideToServer]);

  const persistPresenterKey = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PRESENTER_STORAGE_KEY, presenterKeyInput);
    setPresenterSecret(presenterKeyInput);
  };

  const copySlideLink = async () => {
    const url = new URL(window.location.href);
    if (isPresenterView) {
      url.pathname = "/";
    }
    url.searchParams.set("s", String(index));
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const slide: Slide = slides[index]!;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <ReactionOverlay particles={reactionParticles} />

      {!isPresenterView && supabaseReady && !followLive ? (
        <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={resumeLiveFollow}
            className="brutal-pressable border-[3px] border-foreground bg-brutal-accent px-6 py-3 font-sans text-base font-extrabold uppercase tracking-widest text-brutal-accent-fg brutal-shadow"
          >
            {uiStrings.liveResumeCta}
          </button>
          <span className="max-w-[90vw] text-center font-sans text-[11px] font-bold uppercase tracking-wide text-foreground/75">
            {uiStrings.liveResumeHint}
          </span>
        </div>
      ) : null}

      <header className="sticky top-0 z-20 border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 font-sans text-sm font-extrabold uppercase tracking-wide">
            <span>
              {uiStrings.slideLabel} {index + 1} {uiStrings.of} {slides.length}
            </span>
            <div
              className="h-3 flex-1 min-w-[120px] overflow-hidden border-2 border-foreground bg-foreground/5 md:max-w-xs"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={slides.length}
              aria-valuenow={index + 1}
            >
              <div
                className="h-full bg-brutal-accent transition-[width] duration-300"
                style={{ width: `${((index + 1) / slides.length) * 100}%` }}
              />
            </div>
            {!isPresenterView && supabaseReady && followLive ? (
              <span
                className="inline-flex items-center gap-2 border-2 border-foreground bg-brutal-accent px-2.5 py-1 font-sans text-xs font-extrabold text-brutal-accent-fg brutal-shadow-sm"
                title={uiStrings.liveFollowingHint}
              >
                <span className="inline-block h-2 w-2 animate-pulse bg-brutal-accent-fg" aria-hidden />
                {uiStrings.synced}
              </span>
            ) : null}
            {!isPresenterView && supabaseReady && !followLive ? (
              <button
                type="button"
                onClick={resumeLiveFollow}
                className="brutal-pressable inline-flex items-center gap-2 border-[3px] border-foreground bg-brutal-hot px-3 py-1.5 font-sans text-xs font-extrabold uppercase tracking-wide text-white brutal-shadow-sm"
                title={uiStrings.liveResumeHint}
              >
                {uiStrings.liveResumeCta}
                <span className="hidden font-bold normal-case sm:inline">
                  · {uiStrings.liveResumeHint}
                </span>
              </button>
            ) : null}
            {isPresenterView ? (
              <span className="border-2 border-foreground bg-brutal-warn px-2 py-1 font-sans text-xs font-extrabold uppercase tracking-wide text-foreground brutal-shadow-sm">
                {uiStrings.presenterViewBadge}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="brutal-pressable rounded-sm border-[3px] border-foreground bg-background px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide brutal-shadow-sm disabled:opacity-40"
              onClick={() => navigateManual(index - 1)}
              disabled={index === 0}
            >
              {uiStrings.prev}
            </button>
            <button
              type="button"
              className="brutal-pressable rounded-sm border-[3px] border-foreground bg-background px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide brutal-shadow-sm disabled:opacity-40"
              onClick={() => navigateManual(index + 1)}
              disabled={index === maxIndex}
            >
              {uiStrings.next}
            </button>
            <button
              type="button"
              className="brutal-pressable rounded-sm border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow-sm"
              onClick={copySlideLink}
            >
              {copyDone ? uiStrings.copied : uiStrings.copyLink}
            </button>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 md:px-8 md:py-14 ${!isPresenterView && supabaseReady && !followLive ? "pb-28 md:pb-14" : ""}`}
      >
        <SlideRenderer slide={slide} />
      </main>

      <footer className="border-t-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 md:px-8">
          <p className="font-sans text-sm font-bold leading-relaxed text-foreground/80">
            {isPresenterView ? uiStrings.presenterHint : uiStrings.studentHint}
          </p>

          {supabaseReady ? (
            <div className="border-[3px] border-foreground bg-background p-4 brutal-shadow sm:p-6">
              <p className="font-heading text-xl font-bold text-foreground md:text-2xl">
                {uiStrings.reactionsTitle}
              </p>
              <p className="mt-2 font-sans text-sm font-semibold leading-snug text-foreground/75">
                {uiStrings.reactionsHint}
              </p>
              <div
                className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6 sm:gap-3"
                role="group"
                aria-label={uiStrings.reactionsTitle}
              >
                {REACTION_BUTTONS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    className="brutal-pressable flex aspect-square min-h-[3.1rem] items-center justify-center rounded-sm border-[3px] border-foreground bg-background text-[1.45rem] brutal-shadow-sm sm:min-h-[3.25rem] sm:text-2xl md:text-3xl"
                    aria-label={label}
                    title={label}
                    onClick={() => fireReaction(emoji)}
                  >
                    <span className="pointer-events-none select-none leading-none">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {isPresenterView ? (
            <div className="flex flex-col gap-4 border-[3px] border-foreground bg-foreground/[0.04] p-5 brutal-shadow md:flex-row md:items-start md:justify-between">
              <label className="flex max-w-md flex-col gap-2 font-sans text-sm font-bold">
                <span className="font-heading text-base md:text-lg">{uiStrings.followPresenter}</span>
                <span className="font-normal text-foreground/75">{uiStrings.followHint}</span>
                <div className="flex cursor-pointer items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={followLive}
                    onChange={(e) => setFollowLive(e.target.checked)}
                    disabled={!supabaseReady}
                    className="h-5 w-5 rounded-sm border-2 border-foreground accent-[var(--brutal-accent)]"
                  />
                  <span className="font-semibold text-foreground">
                    {supabaseReady ? "Live-Sync aktivieren" : "Supabase nicht konfiguriert"}
                  </span>
                </div>
              </label>

              <div className="flex min-w-[260px] flex-col gap-3">
                <button
                  type="button"
                  className="brutal-pressable text-left font-sans text-sm font-extrabold uppercase tracking-wide text-brutal-accent underline decoration-2 underline-offset-4"
                  onClick={togglePresenterPanel}
                >
                  {presenterOpen ? "Presenter-Modus ausblenden" : uiStrings.presenterMode}
                </button>
                {presenterOpen ? (
                  <div className="flex flex-col gap-3 border-[3px] border-foreground bg-background p-4 brutal-shadow-sm">
                    <label className="flex flex-col gap-1 font-sans text-xs font-extrabold uppercase tracking-wide">
                      <span>{uiStrings.presenterKeyLabel}</span>
                      <input
                        type="password"
                        autoComplete="off"
                        className="cursor-text border-2 border-foreground bg-background px-3 py-2.5 font-medium"
                        placeholder={uiStrings.presenterKeyPlaceholder}
                        value={presenterKeyInput}
                        onChange={(e) => setPresenterKeyInput(e.target.value)}
                      />
                    </label>
                    <p className="font-sans text-xs font-semibold text-foreground/65">
                      {uiStrings.presenterKeyStored}
                    </p>
                    <button
                      type="button"
                      className="brutal-pressable border-[3px] border-foreground bg-brutal-accent px-3 py-2.5 font-sans text-sm font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow-sm"
                      onClick={persistPresenterKey}
                    >
                      Code für diese Sitzung speichern
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
