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
import { uiStrings } from "@/content/strings.de-ch";

const PRESENTER_STORAGE_KEY = "fhgr-deck-presenter-secret";
const POLL_MS = 4000;
const REACTION_COOLDOWN_MS = 380;
const REACTION_TTL_MS = 4000;
const MAX_REACTION_PARTICLES = 48;

const REACTION_BUTTONS = [
  { emoji: "❤️", label: uiStrings.reactionHeart },
  { emoji: "🔥", label: uiStrings.reactionFire },
  { emoji: "👏", label: uiStrings.reactionClap },
  { emoji: "😮", label: uiStrings.reactionWow },
  { emoji: "🎉", label: uiStrings.reactionParty },
] as const;

function clampIndex(i: number, max: number) {
  return Math.max(0, Math.min(max, i));
}

export function DeckShell({ slides }: { slides: Slides }) {
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

  const [followLive, setFollowLive] = useState(false);
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
      if (followLive) {
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
  }, [followLive, go, index, maxIndex]);

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
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const x = 8 + Math.random() * 84;
          setReactionParticles((prev) => {
            const next = [...prev, { id, emoji, x }];
            if (next.length > MAX_REACTION_PARTICLES) {
              return next.slice(-MAX_REACTION_PARTICLES);
            }
            return next;
          });
          window.setTimeout(() => {
            setReactionParticles((prev) => prev.filter((p) => p.id !== id));
          }, REACTION_TTL_MS);
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

      <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium">
              {uiStrings.slideLabel} {index + 1} {uiStrings.of} {slides.length}
            </span>
            <div
              className="h-1.5 flex-1 min-w-[120px] overflow-hidden rounded-full bg-foreground/10 md:max-w-xs"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={slides.length}
              aria-valuenow={index + 1}
            >
              <div
                className="h-full rounded-full bg-teal-500 transition-[width] duration-300"
                style={{ width: `${((index + 1) / slides.length) * 100}%` }}
              />
            </div>
            {followLive && supabaseReady ? (
              <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-xs font-medium text-teal-800 dark:text-teal-200">
                {uiStrings.synced}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-foreground/15 px-3 py-1.5 text-sm font-medium transition hover:bg-foreground/5"
              onClick={() => go(index - 1)}
              disabled={index === 0}
            >
              {uiStrings.prev}
            </button>
            <button
              type="button"
              className="rounded-full border border-foreground/15 px-3 py-1.5 text-sm font-medium transition hover:bg-foreground/5"
              onClick={() => go(index + 1)}
              disabled={index === maxIndex}
            >
              {uiStrings.next}
            </button>
            <button
              type="button"
              className="rounded-full border border-foreground/15 px-3 py-1.5 text-sm font-medium transition hover:bg-foreground/5"
              onClick={copySlideLink}
            >
              {copyDone ? uiStrings.copied : uiStrings.copyLink}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 md:px-8 md:py-14">
        <SlideRenderer slide={slide} />
      </main>

      <footer className="border-t border-foreground/10 bg-background/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-8">
          <p className="text-sm text-foreground/70">{uiStrings.presenterHint}</p>

          {supabaseReady ? (
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
              <p className="text-sm font-medium">{uiStrings.reactionsTitle}</p>
              <p className="mt-1 text-xs text-foreground/65">{uiStrings.reactionsHint}</p>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label={uiStrings.reactionsTitle}
              >
                {REACTION_BUTTONS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    className="flex h-12 min-w-12 items-center justify-center rounded-xl border border-foreground/15 bg-background text-2xl transition hover:scale-105 hover:border-teal-500/50 hover:bg-teal-500/10 active:scale-95"
                    aria-label={label}
                    title={label}
                    onClick={() => sendReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 md:flex-row md:items-start md:justify-between">
            <label className="flex max-w-md flex-col gap-2 text-sm">
              <span className="font-medium">{uiStrings.followPresenter}</span>
              <span className="text-foreground/65">{uiStrings.followHint}</span>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={followLive}
                  onChange={(e) => setFollowLive(e.target.checked)}
                  disabled={!supabaseReady}
                  className="h-4 w-4 rounded border-foreground/30"
                />
                <span className="text-foreground/80">
                  {supabaseReady ? "Live-Sync aktivieren" : "Supabase nicht konfiguriert"}
                </span>
              </div>
            </label>

            <div className="flex min-w-[260px] flex-col gap-2">
              <button
                type="button"
                className="text-left text-sm font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-300"
                onClick={togglePresenterPanel}
              >
                {presenterOpen ? "Presenter-Modus ausblenden" : uiStrings.presenterMode}
              </button>
              {presenterOpen ? (
                <div className="flex flex-col gap-2 rounded-xl border border-foreground/10 bg-background p-3">
                  <label className="flex flex-col gap-1 text-xs">
                    <span>{uiStrings.presenterKeyLabel}</span>
                    <input
                      type="password"
                      autoComplete="off"
                      className="rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm"
                      placeholder={uiStrings.presenterKeyPlaceholder}
                      value={presenterKeyInput}
                      onChange={(e) => setPresenterKeyInput(e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-foreground/60">{uiStrings.presenterKeyStored}</p>
                  <button
                    type="button"
                    className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                    onClick={persistPresenterKey}
                  >
                    Code für diese Sitzung speichern
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
