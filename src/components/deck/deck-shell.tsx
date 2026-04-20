"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MessageCircle,
  Presentation,
  Users,
  X,
} from "lucide-react";
import type { Slides } from "@/lib/deck/schema";
import { DeckSlideSwiper } from "@/components/deck/deck-slide-swiper";
import { LivePollProvider } from "@/components/deck/live-poll-provider";
import { PresentationWaitingRoom } from "@/components/deck/presentation-waiting-room";
import { VisitorPasswordUnlockForm } from "@/components/deck/visitor-password-unlock-form";
import { FeedbackDrawer } from "@/components/ui/feedback-drawer";
import { BigSwagOverlay } from "@/components/deck/big-swag-overlay";
import { BrutalGradientChip } from "@/components/deck/brutal-gradient-chip";
import {
  ReactionOverlay,
  type ReactionParticle,
} from "@/components/deck/reaction-overlay";
import { buildEmojiBurst, recordBurstIntensity } from "@/lib/reactions/reaction-burst";
import { uiStrings } from "@/content/strings.de-ch";
import { cn } from "@/lib/utils";

const PRESENTER_STORAGE_KEY = "fhgr-deck-presenter-secret";
const PRESENTER_HOLDER_KEY = "fhgr-presenter-holder";
const FEEDBACK_SIDEBAR_KEY = "fhgr-feedback-sidebar-open";
const PRESENTER_QUICK_CONTROLS_KEY = "fhgr-presenter-quick-controls-open";
/** REST fallback interval if a Realtime event is missed (primary sync is WebSocket). */
const POLL_MS = 8000;
const REACTION_COOLDOWN_MS = 260;
const REACTION_CLEANUP_MS = 5600;
const MAX_REACTION_PARTICLES = 200;
/** How long the full-screen SWAG overlay stays visible after a trigger. */
const SWAG_BLAST_OVERLAY_MS = 1200;
const SWAG_BLAST_SEND_COOLDOWN_MS = 1500;

type FeedbackEmojiItem = { emoji: string; label: string };
type FeedbackSwagItem = {
  label: string;
  /** `swag-blast` Realtime broadcast + full-screen SWAG overlay (not emoji particles). */
  swagBlast: true;
};
type FeedbackReactionItem = FeedbackEmojiItem | FeedbackSwagItem;

function isSwagFeedbackItem(item: FeedbackReactionItem): item is FeedbackSwagItem {
  return "swagBlast" in item && item.swagBlast === true;
}

const REACTION_BUTTONS: FeedbackReactionItem[] = [
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
  { label: uiStrings.reactionSwag, swagBlast: true },
];

function clampIndex(i: number, max: number) {
  return Math.max(0, Math.min(max, i));
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
  const hasSlideParam = searchParams.has("s");

  const maxIndex = slides.length - 1;
  const sessionId = process.env.NEXT_PUBLIC_DECK_SESSION_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(supabaseUrl && supabaseAnon && sessionId);

  const [sessionRow, setSessionRow] = useState<{
    loaded: boolean;
    presentationStartedAt: string | null;
    presentationPaused: boolean;
  }>(() => ({
    loaded: !supabaseReady,
    presentationStartedAt: null,
    presentationPaused: false,
  }));
  const [presenterTransportPending, setPresenterTransportPending] = useState(false);
  const [startPresentationError, setStartPresentationError] = useState<string | null>(null);
  const [startPresentationPending, setStartPresentationPending] = useState(false);
  const [elapsedNowMs, setElapsedNowMs] = useState(() => Date.now());
  const [presenterResumeReady, setPresenterResumeReady] = useState(
    () => !isPresenterView || hasSlideParam,
  );
  const openedPresentationOnceRef = useRef(false);
  const [visitorPreviewUnlocked, setVisitorPreviewUnlocked] = useState(false);
  const [visitorHeaderUnlockOpen, setVisitorHeaderUnlockOpen] = useState(false);

  const livePresentationStarted =
    supabaseReady && Boolean(sessionRow.presentationStartedAt);
  const deckNavUnlocked =
    !supabaseReady ||
    livePresentationStarted ||
    (!isPresenterView && visitorPreviewUnlocked);
  const presentationPaused = sessionRow.presentationPaused;
  const audiencePollPreviewLocked =
    !isPresenterView && visitorPreviewUnlocked && !livePresentationStarted;

  const index = useMemo(() => {
    const raw = searchParams.get("s");
    const n = raw === null ? 0 : Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return 0;
    return clampIndex(n, maxIndex);
  }, [searchParams, maxIndex]);

  const indexRef = useRef(index);

  const [followLive, setFollowLive] = useState(() => variant === "audience");
  const [presenterOpen, setPresenterOpen] = useState(false);
  const [presenterKeyInput, setPresenterKeyInput] = useState("");
  const [presenterSecret, setPresenterSecret] = useState("");
  const [leaseLost, setLeaseLost] = useState(false);
  const [leaseTakeoverPending, setLeaseTakeoverPending] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [presenterQuickControlsOpen, setPresenterQuickControlsOpen] = useState(true);
  const [reactionParticles, setReactionParticles] = useState<ReactionParticle[]>(
    [],
  );
  const [swagBlastVisible, setSwagBlastVisible] = useState(false);
  const [presenceCount, setPresenceCount] = useState<number | null>(null);
  const presenceKeyRef = useRef<string | null>(null);
  const presenceSessionRef = useRef<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reactionChannelRef = useRef<RealtimeChannel | null>(null);
  const reactionChannelReadyRef = useRef(false);
  const lastReactionSendRef = useRef(0);
  const reactionBurstWindowRef = useRef<number[]>([]);
  const holderIdRef = useRef<string | null>(null);
  const swagBlastHideTimerRef = useRef<number | null>(null);
  const lastSwagBlastSendRef = useRef(0);

  const triggerSwagBlastOverlay = useCallback(() => {
    startTransition(() => {
      setSwagBlastVisible(true);
    });
    if (swagBlastHideTimerRef.current !== null) {
      clearTimeout(swagBlastHideTimerRef.current);
    }
    swagBlastHideTimerRef.current = window.setTimeout(() => {
      swagBlastHideTimerRef.current = null;
      startTransition(() => {
        setSwagBlastVisible(false);
      });
    }, SWAG_BLAST_OVERLAY_MS);
  }, []);

  const startedAtMs = useMemo(() => {
    const raw = sessionRow.presentationStartedAt;
    if (!raw) return null;
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : null;
  }, [sessionRow.presentationStartedAt]);

  const elapsedLabel = useMemo(() => {
    if (startedAtMs === null) return null;
    return formatElapsed(Math.max(0, elapsedNowMs - startedAtMs));
  }, [elapsedNowMs, startedAtMs]);

  const replaceUrl = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("s", String(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const visitorPreviewLogout = useCallback(async () => {
    try {
      await fetch("/api/visitor-unlock/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
    startTransition(() => setVisitorPreviewUnlocked(false));
    replaceUrl(0);
  }, [replaceUrl]);

  useEffect(() => {
    if (isPresenterView || typeof window === "undefined") return;
    if (!sessionId) return;
    let cancelled = false;
    void fetch("/api/visitor-unlock/status", { credentials: "include" })
      .then((r) => r.json() as Promise<{ unlocked?: boolean }>)
      .then((body) => {
        if (cancelled) return;
        if (body.unlocked) {
          startTransition(() => setVisitorPreviewUnlocked(true));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isPresenterView, sessionId]);

  useEffect(() => {
    if (!visitorPreviewUnlocked) return;
    startTransition(() => setVisitorHeaderUnlockOpen(false));
  }, [visitorPreviewUnlocked]);

  const go = useCallback(
    (next: number) => {
      replaceUrl(clampIndex(next, maxIndex));
    },
    [maxIndex, replaceUrl],
  );

  const pushSlideToServer = useCallback(
    async (slideIndex: number) => {
      const holder = holderIdRef.current;
      if (!sessionId || !holder) return;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (presenterSecret) {
        headers.Authorization = `Bearer ${presenterSecret}`;
      }
      try {
        const res = await fetch("/api/present", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ slideIndex, sessionId, holderId: holder }),
        });
        if (res.status === 409) {
          startTransition(() => setLeaseLost(true));
          return;
        }
        if (res.ok) {
          startTransition(() => setLeaseLost(false));
          return;
        }
        console.error("Present API error", await res.text());
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

  const setFeedbackPersisted = useCallback((open: boolean) => {
    setFeedbackOpen(open);
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(FEEDBACK_SIDEBAR_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const setPresenterQuickControlsPersisted = useCallback((open: boolean) => {
    setPresenterQuickControlsOpen(open);
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(PRESENTER_QUICK_CONTROLS_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  useLayoutEffect(() => {
    indexRef.current = index;
  }, [index]);

  useLayoutEffect(() => {
    if (!isPresenterView || typeof window === "undefined") return;
    try {
      let id = window.localStorage.getItem(PRESENTER_HOLDER_KEY);
      if (!id) {
        id = window.sessionStorage.getItem(PRESENTER_HOLDER_KEY);
      }
      if (!id) {
        id = globalThis.crypto.randomUUID();
      }
      window.localStorage.setItem(PRESENTER_HOLDER_KEY, id);
      holderIdRef.current = id;
    } catch {
      holderIdRef.current = globalThis.crypto.randomUUID();
    }
  }, [isPresenterView]);

  useEffect(() => {
    if (startedAtMs === null) return;
    const id = window.setInterval(() => {
      setElapsedNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [startedAtMs]);

  useEffect(() => {
    if (!supabaseReady || !sessionId || !supabaseUrl || !supabaseAnon) {
      return;
    }

    let cancelled = false;

    const apply = (row: {
      presentation_started_at?: string | null;
      presentation_paused?: boolean | null;
    }) => {
      if (cancelled) return;
      const at = row.presentation_started_at;
      const iso = typeof at === "string" ? at : at != null ? String(at) : null;
      const hasStarted = Object.prototype.hasOwnProperty.call(row, "presentation_started_at");
      const hasPaused = Object.prototype.hasOwnProperty.call(row, "presentation_paused");
      const paused = row.presentation_paused === true;
      startTransition(() => {
        setSessionRow((prev) => ({
          loaded: true,
          presentationStartedAt: hasStarted ? iso : prev.presentationStartedAt,
          presentationPaused: hasPaused ? paused : prev.presentationPaused,
        }));
      });
    };

    const fetchOnce = async () => {
      const supabase = createClient(supabaseUrl, supabaseAnon);
      const { data, error } = await supabase
        .from("deck_sessions")
        .select("presentation_started_at, presentation_paused")
        .eq("id", sessionId)
        .maybeSingle();
      if (error) {
        console.error(error);
        apply({ presentation_started_at: null, presentation_paused: false });
        return;
      }
      apply(
        (data ?? {}) as {
          presentation_started_at?: string | null;
          presentation_paused?: boolean | null;
        },
      );
    };

    startTransition(() => {
      setSessionRow((prev) => ({ ...prev, loaded: false }));
    });
    void fetchOnce();

    const supabase = createClient(supabaseUrl, supabaseAnon);
    const channel = supabase
      .channel(`deck-session-meta-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deck_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            presentation_started_at?: string | null;
            presentation_paused?: boolean | null;
          };
          apply(row);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void channel.unsubscribe();
    };
  }, [sessionId, supabaseAnon, supabaseReady, supabaseUrl]);

  useEffect(() => {
    if (!deckNavUnlocked && sessionRow.loaded && index !== 0) {
      replaceUrl(0);
    }
  }, [deckNavUnlocked, sessionRow.loaded, index, replaceUrl]);

  useEffect(() => {
    if (isPresenterView || !sessionRow.loaded) return;
    if (!livePresentationStarted) {
      openedPresentationOnceRef.current = false;
      startTransition(() => {
        setFollowLive(false);
      });
      return;
    }
    if (!openedPresentationOnceRef.current) {
      openedPresentationOnceRef.current = true;
      startTransition(() => {
        setFollowLive(true);
      });
    }
  }, [isPresenterView, livePresentationStarted, sessionRow.loaded]);

  useEffect(() => {
    if (!isPresenterView) {
      startTransition(() => {
        setPresenterResumeReady(true);
      });
      return;
    }

    if (
      hasSlideParam ||
      !livePresentationStarted ||
      !supabaseReady ||
      !sessionId ||
      !supabaseUrl ||
      !supabaseAnon
    ) {
      startTransition(() => {
        setPresenterResumeReady(true);
      });
      return;
    }

    let cancelled = false;
    startTransition(() => {
      setPresenterResumeReady(false);
    });

    const syncPresenterSlide = async () => {
      const supabase = createClient(supabaseUrl, supabaseAnon);
      const { data, error } = await supabase
        .from("deck_sessions")
        .select("slide_index")
        .eq("id", sessionId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error(error);
        startTransition(() => {
          setPresenterResumeReady(true);
        });
        return;
      }

      const raw = data?.slide_index;
      const next =
        typeof raw === "number" && Number.isFinite(raw)
          ? clampIndex(Math.floor(raw), maxIndex)
          : 0;

      if (!hasSlideParam || next !== indexRef.current) {
        replaceUrl(next);
        return;
      }

      startTransition(() => {
        setPresenterResumeReady(true);
      });
    };

    void syncPresenterSlide();

    return () => {
      cancelled = true;
    };
  }, [
    hasSlideParam,
    isPresenterView,
    livePresentationStarted,
    maxIndex,
    replaceUrl,
    sessionId,
    supabaseAnon,
    supabaseReady,
    supabaseUrl,
  ]);

  const isMdUp = useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia("(min-width: 768px)");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );

  useEffect(() => {
    try {
      const v = window.sessionStorage.getItem(FEEDBACK_SIDEBAR_KEY);
      if (v === "1") {
        startTransition(() => {
          setFeedbackOpen(true);
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isPresenterView) return;
    try {
      const v = window.sessionStorage.getItem(PRESENTER_QUICK_CONTROLS_KEY);
      if (v === "0") {
        startTransition(() => {
          setPresenterQuickControlsOpen(false);
        });
      }
    } catch {
      /* ignore */
    }
  }, [isPresenterView]);

  const releasePresenterLease = useCallback(
    async (keepalive = false) => {
      const holder = holderIdRef.current;
      if (!isPresenterView || !sessionId || !holder) return false;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (presenterSecret) {
        headers.Authorization = `Bearer ${presenterSecret}`;
      }

      try {
        const res = await fetch("/api/present/release", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ sessionId, holderId: holder }),
          keepalive,
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [isPresenterView, presenterSecret, sessionId],
  );

  useEffect(() => {
    if (!isPresenterView || !sessionId) return;

    const onPageHide = () => {
      const holder = holderIdRef.current;
      if (!holder) return;

      const payload = JSON.stringify({ sessionId, holderId: holder });
      if (navigator.sendBeacon) {
        const sent = navigator.sendBeacon(
          "/api/present/release",
          new Blob([payload], { type: "application/json" }),
        );
        if (sent) return;
      }

      void fetch("/api/present/release", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [isPresenterView, sessionId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (!deckNavUnlocked) {
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
  }, [deckNavUnlocked, followLive, go, index, isPresenterView, maxIndex]);

  useEffect(() => {
    return () => {
      if (swagBlastHideTimerRef.current !== null) {
        clearTimeout(swagBlastHideTimerRef.current);
        swagBlastHideTimerRef.current = null;
      }
    };
  }, []);

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
          window.setTimeout(() => {
            const ids = new Set(batch.map((b) => b.id));
            setReactionParticles((prev) => prev.filter((p) => !ids.has(p.id)));
          }, REACTION_CLEANUP_MS);
        },
      )
      .on("broadcast", { event: "swag-blast" }, () => {
        triggerSwagBlastOverlay();
      })
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
  }, [sessionId, supabaseAnon, supabaseReady, supabaseUrl, triggerSwagBlastOverlay]);

  useEffect(() => {
    if (!supabaseReady || !sessionId) {
      return;
    }

    if (presenceSessionRef.current !== sessionId) {
      presenceSessionRef.current = sessionId;
      presenceKeyRef.current = globalThis.crypto.randomUUID();
    }
    const presenceKey = presenceKeyRef.current!;

    const supabase = createClient(supabaseUrl!, supabaseAnon!);
    const channel = supabase
      .channel(`deck-presence:${sessionId}`, {
        config: {
          presence: { key: presenceKey },
        },
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPresenceCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const tracked = await channel.track({
            joined_at: new Date().toISOString(),
            role: variant,
          });
          if (tracked !== "ok") {
            console.error("Presence track error", tracked);
          }
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          startTransition(() => {
            setPresenceCount(null);
          });
        }
      });

    return () => {
      startTransition(() => {
        setPresenceCount(null);
      });
      void channel.unsubscribe();
    };
  }, [sessionId, supabaseAnon, supabaseReady, supabaseUrl, variant]);

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

  const sendSwagBlast = useCallback(() => {
    triggerSwagBlastOverlay();
    const now = Date.now();
    if (now - lastSwagBlastSendRef.current < SWAG_BLAST_SEND_COOLDOWN_MS) return;
    lastSwagBlastSendRef.current = now;
    if (!reactionChannelReadyRef.current || !reactionChannelRef.current) return;
    void reactionChannelRef.current.send({
      type: "broadcast",
      event: "swag-blast",
      payload: {},
    });
  }, [triggerSwagBlastOverlay]);

  const fireSwagBlast = useCallback(() => {
    try {
      navigator.vibrate?.(12);
    } catch {
      /* ignore */
    }
    sendSwagBlast();
  }, [sendSwagBlast]);

  const navigateManual = useCallback(
    (next: number) => {
      if (!deckNavUnlocked) return;
      if (!isPresenterView) setFollowLive(false);
      go(next);
    },
    [deckNavUnlocked, go, isPresenterView],
  );

  const startPresentation = useCallback(async () => {
    const holder = holderIdRef.current;
    if (!sessionId || !holder) return;
    setStartPresentationError(null);
    setStartPresentationPending(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (presenterSecret) {
        headers.Authorization = `Bearer ${presenterSecret}`;
      }
      const res = await fetch("/api/present/start", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ sessionId, holderId: holder }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        startedAt?: string;
        error?: string;
        message?: string;
      };

      const mapStartFailureMessage = (): string => {
        const code = body.error;
        const msg = typeof body.message === "string" ? body.message : "";
        if (code === "lease_denied") return uiStrings.preStartLeaseError;
        if (code === "session_not_found") return uiStrings.preStartErrorSessionRow;
        if (res.status === 401 || code === "Unauthorized") return uiStrings.preStartErrorAuth;
        if (res.status === 503) return uiStrings.preStartErrorConfig;
        if (res.status === 400 && code === "Invalid session") return uiStrings.preStartErrorSessionRow;
        if (code === "supabase_rpc" && msg) {
          const hintMigration =
            /presenter_start_presentation|schema cache|function.*not exist/i.test(msg);
          if (hintMigration) return uiStrings.preStartErrorMigration;
          return `${uiStrings.preStartGenericError} ${msg.slice(0, 180)}`;
        }
        if (msg && res.status >= 500) {
          return `${uiStrings.preStartGenericError} ${msg.slice(0, 180)}`;
        }
        return uiStrings.preStartGenericError;
      };

      if (!res.ok) {
        startTransition(() => {
          setStartPresentationError(mapStartFailureMessage());
        });
        return;
      }
      if (typeof body.startedAt === "string" && body.startedAt.length > 0) {
        startTransition(() => {
          setSessionRow((prev) => ({
            ...prev,
            loaded: true,
            presentationStartedAt: body.startedAt!,
            presentationPaused: false,
          }));
        });
      }
    } catch {
      startTransition(() => {
        setStartPresentationError(uiStrings.preStartGenericError);
      });
    } finally {
      startTransition(() => {
        setStartPresentationPending(false);
      });
    }
  }, [presenterSecret, sessionId]);

  useEffect(() => {
    if (!followLive || !supabaseReady || !livePresentationStarted) {
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
      if (!livePresentationStarted || presentationPaused) return;
      if (slideIndex === null || slideIndex === undefined) return;
      if (!Number.isFinite(slideIndex)) return;
      const clamped = clampIndex(Math.floor(slideIndex), maxIndex);
      if (clamped === indexRef.current) return;
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
  }, [
    followLive,
    livePresentationStarted,
    maxIndex,
    presentationPaused,
    replaceUrl,
    sessionId,
    supabaseAnon,
    supabaseReady,
    supabaseUrl,
  ]);

  useEffect(() => {
    if (
      !isPresenterView ||
      !livePresentationStarted ||
      presentationPaused ||
      followLive ||
      !presenterResumeReady ||
      !sessionId ||
      !holderIdRef.current
    )
      return;
    void pushSlideToServer(index);
  }, [
    followLive,
    index,
    isPresenterView,
    livePresentationStarted,
    presentationPaused,
    presenterResumeReady,
    sessionId,
    pushSlideToServer,
  ]);

  const tryClaimPresenterLease = useCallback(
    async (force: boolean): Promise<boolean | null> => {
      const holder = holderIdRef.current;
      if (!isPresenterView || !supabaseReady || !sessionId || !holder || followLive) {
        return null;
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (presenterSecret) {
        headers.Authorization = `Bearer ${presenterSecret}`;
      }
      try {
        const res = await fetch("/api/present/claim", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ sessionId, holderId: holder, force }),
        });
        if (!res.ok) return false;
        const body = (await res.json()) as { ok?: boolean };
        return body.ok === true;
      } catch {
        return false;
      }
    },
    [followLive, isPresenterView, presenterSecret, sessionId, supabaseReady],
  );

  useEffect(() => {
    if (!isPresenterView || !supabaseReady || !sessionId || followLive) return;
    const holder = holderIdRef.current;
    if (!holder) return;

    const tick = async () => {
      const ok = await tryClaimPresenterLease(false);
      if (ok === true) {
        startTransition(() => setLeaseLost(false));
      } else if (ok === false) {
        startTransition(() => setLeaseLost(true));
      }
    };

    void tick();
    const intervalId = window.setInterval(tick, leaseLost ? 4000 : 35000);
    return () => clearInterval(intervalId);
  }, [followLive, isPresenterView, leaseLost, sessionId, supabaseReady, tryClaimPresenterLease]);

  const takeoverPresenterLease = useCallback(async () => {
    setLeaseTakeoverPending(true);
    try {
      const ok = await tryClaimPresenterLease(true);
      if (ok === true) {
        startTransition(() => setLeaseLost(false));
      }
    } finally {
      setLeaseTakeoverPending(false);
    }
  }, [tryClaimPresenterLease]);

  const persistPresenterKey = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PRESENTER_STORAGE_KEY, presenterKeyInput);
    setPresenterSecret(presenterKeyInput);
  };

  const logoutPresenter = useCallback(async () => {
    try {
      await releasePresenterLease(true);
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/present/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore */
    }
    window.location.href = "/present/login";
  }, [releasePresenterLease]);

  const setPresentationPausedRemote = useCallback(
    async (paused: boolean) => {
      const holder = holderIdRef.current;
      if (!sessionId || !holder) return;
      setPresenterTransportPending(true);
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (presenterSecret) {
          headers.Authorization = `Bearer ${presenterSecret}`;
        }
        const res = await fetch("/api/present/pause", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ sessionId, holderId: holder, paused }),
        });
        if (!res.ok) {
          console.error("Pause API", await res.text());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPresenterTransportPending(false);
      }
    },
    [presenterSecret, sessionId],
  );

  const stopPresentationRemote = useCallback(async () => {
    const holder = holderIdRef.current;
    if (!sessionId || !holder) return;
    setPresenterTransportPending(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (presenterSecret) {
        headers.Authorization = `Bearer ${presenterSecret}`;
      }
      const res = await fetch("/api/present/stop", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ sessionId, holderId: holder }),
      });
      if (!res.ok) {
        console.error("Stop API", await res.text());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPresenterTransportPending(false);
    }
  }, [presenterSecret, sessionId]);

  const feedbackBody = supabaseReady ? (
    <div
      className="flex min-h-0 flex-1 flex-col border-[3px] border-foreground bg-background brutal-shadow md:flex-none"
      role="group"
      aria-label={uiStrings.liveFeedbackTitle}
    >
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] md:flex-none md:overflow-visible"
      >
        <div className="grid grid-cols-4 gap-1.5 p-2 min-[360px]:grid-cols-5 min-[440px]:grid-cols-6 min-[520px]:grid-cols-7 md:hidden">
          {REACTION_BUTTONS.map((item) => (
            <button
              key={isSwagFeedbackItem(item) ? "swag-blast" : item.emoji}
              type="button"
              className="brutal-pressable flex aspect-square min-h-0 w-full items-center justify-center rounded-sm border-2 border-foreground bg-background text-[0.95rem] leading-none brutal-shadow-sm min-[360px]:text-[1.05rem] min-[440px]:text-[1.15rem] min-[520px]:text-[1.2rem]"
              aria-label={item.label}
              onClick={() =>
                isSwagFeedbackItem(item) ? fireSwagBlast() : fireReaction(item.emoji)
              }
            >
              {isSwagFeedbackItem(item) ? (
                <span className="pointer-events-none flex max-h-full max-w-full items-center justify-center overflow-hidden px-0.5">
                  <BrutalGradientChip
                    label="SWAG"
                    className="!mx-0 !max-w-full !border-2 !px-1 !py-0.5 !text-[0.5rem] !leading-none !tracking-[0.12em] min-[360px]:!text-[0.52rem] min-[440px]:!text-[0.55rem] min-[520px]:!text-[0.58rem]"
                  />
                </span>
              ) : (
                <span className="pointer-events-none select-none leading-none">{item.emoji}</span>
              )}
            </button>
          ))}
        </div>
        <div className="hidden grid-cols-3 gap-2 p-2 md:grid md:gap-3 md:p-3">
          {REACTION_BUTTONS.map((item) => (
            <button
              key={isSwagFeedbackItem(item) ? "swag-blast" : item.emoji}
              type="button"
              className="brutal-pressable flex aspect-square min-h-[3.1rem] items-center justify-center rounded-sm border-[3px] border-foreground bg-background text-[1.45rem] brutal-shadow-sm sm:min-h-[3.25rem] sm:text-2xl lg:text-3xl"
              aria-label={item.label}
              onClick={() =>
                isSwagFeedbackItem(item) ? fireSwagBlast() : fireReaction(item.emoji)
              }
            >
              {isSwagFeedbackItem(item) ? (
                <span className="pointer-events-none flex max-h-full max-w-full items-center justify-center overflow-hidden px-0.5">
                  <BrutalGradientChip
                    label="SWAG"
                    className="!mx-0 !max-w-full !border-[3px] !px-1.5 !py-1 !text-[0.62rem] !leading-none !tracking-[0.14em] sm:!text-[0.68rem] lg:!text-[0.72rem]"
                  />
                </span>
              ) : (
                <span className="pointer-events-none select-none leading-none">{item.emoji}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <p className="px-1 font-sans text-xs font-semibold text-foreground/60">
      {uiStrings.reactionsUnavailable}
    </p>
  );

  return (
    <div className="flex h-[100svh] max-h-[100svh] min-h-[100svh] flex-col overflow-hidden bg-background text-foreground">
      <ReactionOverlay particles={reactionParticles} />
      <BigSwagOverlay open={swagBlastVisible} />

      <header className="shrink-0 z-20 border-b-[3px] border-foreground bg-background">
        <div className="mx-auto flex max-w-none flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 font-sans text-sm font-extrabold uppercase tracking-wide">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={deckNavUnlocked ? undefined : "normal-case"}>
                {deckNavUnlocked
                  ? visitorPreviewUnlocked && !livePresentationStarted
                    ? `${uiStrings.preStartHeaderPreviewBadge} · ${uiStrings.slideLabel} ${index + 1} ${uiStrings.of} ${slides.length}`
                    : `${uiStrings.slideLabel} ${index + 1} ${uiStrings.of} ${slides.length}`
                  : uiStrings.preStartHeaderBadge}
              </span>
              {livePresentationStarted && elapsedLabel ? (
                <span
                  className="font-mono text-[11px] font-semibold tabular-nums tracking-tight text-foreground/80 normal-case"
                  title={uiStrings.presentationTimerLabel}
                >
                  {elapsedLabel}
                </span>
              ) : null}
            </div>
            <div
              className="h-3 flex-1 min-w-[120px] overflow-hidden border-2 border-foreground bg-foreground/5 md:max-w-xs"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={slides.length}
              aria-valuenow={deckNavUnlocked ? index + 1 : 0}
            >
              <div
                className="h-full bg-brutal-accent transition-[width] duration-300"
                style={{
                  width: `${((deckNavUnlocked ? index + 1 : 0) / slides.length) * 100}%`,
                }}
              />
            </div>
            {isPresenterView ? (
              <button
                type="button"
                id="presenter-view-toggle"
                aria-pressed={presenterQuickControlsOpen}
                aria-expanded={presenterQuickControlsOpen}
                aria-controls={
                  presenterQuickControlsOpen ? "presenter-quick-controls" : undefined
                }
                title={
                  presenterQuickControlsOpen
                    ? uiStrings.presenterViewToggleAriaHide
                    : uiStrings.presenterViewToggleAriaShow
                }
                aria-label={
                  presenterQuickControlsOpen
                    ? uiStrings.presenterViewToggleAriaHide
                    : uiStrings.presenterViewToggleAriaShow
                }
                onClick={() =>
                  setPresenterQuickControlsPersisted(!presenterQuickControlsOpen)
                }
                className="brutal-pressable inline-flex items-center gap-1.5 border-2 border-foreground bg-brutal-warn px-2 py-1 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-warn-fg brutal-shadow-sm"
              >
                <Presentation className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                {uiStrings.presenterViewBadge}
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="brutal-pressable inline-flex size-10 items-center justify-center rounded-sm border-[3px] border-foreground bg-background font-sans text-xs font-extrabold uppercase tracking-wide brutal-shadow-sm disabled:opacity-40"
              onClick={() => navigateManual(index - 1)}
              disabled={!deckNavUnlocked || index === 0}
              aria-label={uiStrings.prev}
            >
              <ChevronLeft className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
            <button
              type="button"
              className="brutal-pressable inline-flex size-10 items-center justify-center rounded-sm border-[3px] border-foreground bg-background font-sans text-xs font-extrabold uppercase tracking-wide brutal-shadow-sm disabled:opacity-40"
              onClick={() => navigateManual(index + 1)}
              disabled={!deckNavUnlocked || index === maxIndex}
              aria-label={uiStrings.next}
            >
              <ChevronRight className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            </button>
            {!isPresenterView &&
            supabaseReady &&
            !livePresentationStarted &&
            !visitorPreviewUnlocked ? (
              <button
                type="button"
                id="visitor-header-unlock-toggle"
                aria-expanded={visitorHeaderUnlockOpen}
                aria-controls="visitor-header-unlock-panel"
                title={
                  visitorHeaderUnlockOpen
                    ? uiStrings.visitorPasswordHeaderToggleHide
                    : uiStrings.visitorPasswordHeaderToggleShow
                }
                aria-label={
                  visitorHeaderUnlockOpen
                    ? uiStrings.visitorPasswordHeaderToggleHide
                    : uiStrings.visitorPasswordHeaderToggleShow
                }
                onClick={() => setVisitorHeaderUnlockOpen((o) => !o)}
                className={cn(
                  "brutal-pressable inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-[3px] border-foreground bg-background font-sans text-xs font-extrabold uppercase tracking-wide brutal-shadow-sm",
                  visitorHeaderUnlockOpen && "bg-brutal-accent/25",
                )}
              >
                <KeyRound className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              </button>
            ) : null}
            <div className="flex shrink-0 items-center gap-1.5 md:contents">
              {!isPresenterView && supabaseReady ? (
                <button
                  type="button"
                  onClick={() => setFollowLive((v) => !v)}
                  aria-pressed={followLive}
                  disabled={!deckNavUnlocked || !livePresentationStarted}
                  title={
                    !deckNavUnlocked
                      ? undefined
                      : !livePresentationStarted
                        ? uiStrings.visitorLiveFollowDisabledHint
                        : followLive
                          ? uiStrings.liveFollowingHint
                          : uiStrings.liveResumeHint
                  }
                  aria-label={
                    !livePresentationStarted && deckNavUnlocked
                      ? uiStrings.visitorLiveFollowDisabledHint
                      : followLive
                        ? uiStrings.liveToggleTurnOff
                        : uiStrings.liveToggleTurnOn
                  }
                  className={cn(
                    "brutal-pressable inline-flex h-10 shrink-0 items-center justify-center rounded-sm border-[3px] border-foreground px-3 font-sans text-xs font-extrabold uppercase tracking-wide brutal-shadow-sm disabled:opacity-40",
                    followLive
                      ? "brutal-live-follow-pulse"
                      : "bg-background text-foreground",
                  )}
                >
                  {uiStrings.synced}
                </button>
              ) : null}
              {!isPresenterView &&
              visitorPreviewUnlocked &&
              !livePresentationStarted ? (
                <button
                  type="button"
                  onClick={() => void visitorPreviewLogout()}
                  className="brutal-pressable inline-flex h-10 shrink-0 items-center justify-center rounded-sm border-[3px] border-foreground bg-background px-2.5 font-sans text-[10px] font-extrabold uppercase tracking-wide brutal-shadow-sm min-[380px]:text-[11px]"
                >
                  {uiStrings.visitorPreviewEnd}
                </button>
              ) : null}
              {supabaseReady ? (
                <span
                  className="inline-flex h-10 shrink-0 items-center gap-1 rounded-sm border-[3px] border-foreground bg-background px-2 font-sans text-[10px] font-extrabold uppercase leading-none tracking-wide text-foreground brutal-shadow-sm min-[380px]:px-2.5 min-[380px]:text-[11px]"
                  title={uiStrings.viewersOnlineTitle}
                >
                  <Users className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                  <span className="whitespace-nowrap tabular-nums">
                    {presenceCount === null
                      ? uiStrings.viewersOnlinePendingShort
                      : `${presenceCount} ONLINE`}
                  </span>
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setFeedbackPersisted(!feedbackOpen)}
                aria-expanded={feedbackOpen}
                aria-controls="deck-feedback-panel"
                title={
                  feedbackOpen ? uiStrings.feedbackToggleHide : uiStrings.feedbackToggleShow
                }
                aria-label={
                  feedbackOpen ? uiStrings.feedbackCloseSidebarAria : uiStrings.feedbackOpenSidebarAria
                }
                className="brutal-pressable inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-[3px] border-foreground bg-brutal-hot text-white brutal-shadow-sm"
              >
                <MessageCircle className="size-5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {!isPresenterView &&
        supabaseReady &&
        !livePresentationStarted &&
        !visitorPreviewUnlocked &&
        visitorHeaderUnlockOpen ? (
          <div
            id="visitor-header-unlock-panel"
            className="border-t-[3px] border-foreground bg-foreground/[0.04] px-4 py-3 md:px-6"
            role="region"
            aria-label={uiStrings.visitorPasswordModeCta}
          >
            <div className="mx-auto max-w-md">
              <VisitorPasswordUnlockForm
                showHint
                onSuccess={() => {
                  startTransition(() => {
                    setVisitorPreviewUnlocked(true);
                    setVisitorHeaderUnlockOpen(false);
                  });
                }}
              />
            </div>
          </div>
        ) : null}

        {isPresenterView && (leaseLost || presenterQuickControlsOpen) ? (
          <div className="border-t-[3px] border-foreground bg-foreground/[0.03] px-4 py-2.5">
            {leaseLost ? (
              <div
                role="alert"
                className={`border-[3px] border-foreground bg-red-600/15 px-3 py-2.5 text-foreground brutal-shadow-sm dark:bg-red-500/20 ${presenterQuickControlsOpen ? "mb-3" : ""}`}
              >
                <p className="font-sans text-xs font-extrabold uppercase tracking-wide">
                  {uiStrings.presenterLeaseLostBanner}
                </p>
                <p className="mt-1.5 font-sans text-[11px] font-semibold leading-snug text-foreground/85">
                  {uiStrings.presenterLeaseLostDetail}
                </p>
                <button
                  type="button"
                  disabled={leaseTakeoverPending || presenterTransportPending}
                  onClick={() => void takeoverPresenterLease()}
                  className="brutal-pressable mt-3 border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow-sm disabled:opacity-45"
                >
                  {leaseTakeoverPending
                    ? uiStrings.presenterLeaseTakeoverBusy
                    : uiStrings.presenterLeaseTakeover}
                </button>
              </div>
            ) : null}
            {presenterQuickControlsOpen ? (
              <div className="mx-auto flex max-w-none flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-4">
                {livePresentationStarted && supabaseReady ? (
                  <div
                    id="presenter-quick-controls"
                    className="flex flex-wrap items-center gap-2 font-sans text-xs font-extrabold uppercase tracking-wide"
                  >
                    <button
                      type="button"
                      disabled={presenterTransportPending || leaseLost}
                      onClick={() => void setPresentationPausedRemote(!sessionRow.presentationPaused)}
                      className="brutal-pressable border-[3px] border-foreground bg-background px-3 py-2 brutal-shadow-sm disabled:opacity-45"
                    >
                      {sessionRow.presentationPaused
                        ? uiStrings.presenterResume
                        : uiStrings.presenterPause}
                    </button>
                    <button
                      type="button"
                      disabled={presenterTransportPending || leaseLost}
                      onClick={() => void stopPresentationRemote()}
                      className="brutal-pressable border-[3px] border-foreground bg-brutal-warn px-3 py-2 text-brutal-warn-fg brutal-shadow-sm disabled:opacity-45"
                    >
                      {uiStrings.presenterStop}
                    </button>
                  </div>
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-md md:flex-none">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      type="button"
                      className="brutal-pressable w-fit text-left font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent underline decoration-2 underline-offset-4"
                      onClick={togglePresenterPanel}
                    >
                      {presenterOpen ? "Presenter-Modus ausblenden" : uiStrings.presenterMode}
                    </button>
                    <button
                      type="button"
                      className="brutal-pressable w-fit font-sans text-xs font-extrabold uppercase tracking-wide text-foreground/70 underline decoration-2 underline-offset-4"
                      onClick={() => void logoutPresenter()}
                    >
                      {uiStrings.presenterLogout}
                    </button>
                  </div>
                  {presenterOpen ? (
                    <div className="flex flex-col gap-3 border-[3px] border-foreground bg-background p-3 brutal-shadow-sm">
                      <label className="flex flex-col gap-1 font-sans text-xs font-extrabold uppercase tracking-wide">
                        <span>{uiStrings.presenterKeyLabel}</span>
                        <input
                          type="password"
                          autoComplete="off"
                          className="cursor-text border-2 border-foreground bg-background px-3 py-2 font-medium"
                          placeholder={uiStrings.presenterKeyPlaceholder}
                          value={presenterKeyInput}
                          onChange={(e) => setPresenterKeyInput(e.target.value)}
                        />
                      </label>
                      <p className="font-sans text-[11px] font-semibold text-foreground/65">
                        {uiStrings.presenterKeyStored}
                      </p>
                      <button
                        type="button"
                        className="brutal-pressable border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow-sm"
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
        ) : null}
      </header>

      {!isPresenterView && livePresentationStarted && presentationPaused ? (
        <div
          role="status"
          className="shrink-0 border-b-[3px] border-foreground bg-brutal-warn/35 px-4 py-2 text-center font-sans text-xs font-extrabold uppercase tracking-wide text-foreground"
        >
          {uiStrings.audiencePausedBanner}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:min-w-0">
          <div className="flex min-h-0 flex-1 items-stretch px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 lg:px-7 lg:py-6">
            <div className="relative mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden border-[3px] border-foreground bg-foreground/[0.06] brutal-shadow">
              <LivePollProvider
                sessionId={sessionId}
                supabaseReady={supabaseReady}
                supabaseUrl={supabaseUrl}
                supabaseAnon={supabaseAnon}
                slideIndex={index}
                isPresenterView={isPresenterView}
                audiencePollDisabled={audiencePollPreviewLocked}
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  {deckNavUnlocked ? (
                    <DeckSlideSwiper
                      slides={slides}
                      activeIndex={index}
                      onNavigate={navigateManual}
                    />
                  ) : (
                    <PresentationWaitingRoom
                      mode={isPresenterView ? "presenter" : "audience"}
                      sessionLoading={supabaseReady && !sessionRow.loaded}
                      onStartPresentation={
                        isPresenterView ? () => void startPresentation() : undefined
                      }
                      startPending={startPresentationPending}
                      startError={startPresentationError}
                      onVisitorUnlocked={() =>
                        startTransition(() => setVisitorPreviewUnlocked(true))
                      }
                    />
                  )}
                </div>
              </LivePollProvider>
            </div>
          </div>
        </div>

        <aside
          id="deck-feedback-panel"
          aria-label={uiStrings.liveFeedbackTitle}
          className={`hidden shrink-0 flex-col border-foreground bg-background brutal-shadow transition-[width] duration-200 ease-out md:flex md:h-full md:border-l-[3px] md:border-t-0 ${
            feedbackOpen ? "md:w-[min(22rem,32vw)]" : "md:w-14"
          }`}
        >
          {feedbackOpen ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b-[3px] border-foreground bg-background px-3 py-3 md:px-4">
                <p className="min-w-0 font-heading text-lg font-bold leading-tight text-foreground md:text-xl">
                  {uiStrings.liveFeedbackTitle}
                </p>
                <button
                  type="button"
                  className="brutal-pressable inline-flex size-10 shrink-0 items-center justify-center border-[3px] border-foreground bg-background brutal-shadow-sm"
                  onClick={() => setFeedbackPersisted(false)}
                  aria-label={uiStrings.feedbackCloseSidebarAria}
                >
                  <X className="size-4" strokeWidth={2.5} aria-hidden />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:overflow-y-auto">
                <div className="flex min-h-0 flex-1 flex-col px-3 py-3 md:px-4 md:py-4">
                  {feedbackBody}
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFeedbackPersisted(true)}
              className="brutal-pressable flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 border-0 bg-brutal-accent/20 px-0 py-6 font-sans text-[11px] font-extrabold uppercase leading-snug tracking-widest text-foreground brutal-shadow-sm [writing-mode:vertical-rl]"
              aria-label={uiStrings.feedbackOpenSidebarAria}
            >
              {uiStrings.feedbackTabVertical}
            </button>
          )}
        </aside>
      </div>

      {!isMdUp ? (
        <FeedbackDrawer
          title={uiStrings.liveFeedbackTitle}
          open={feedbackOpen}
          onOpenChange={setFeedbackPersisted}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b-[3px] border-foreground pb-3">
            <p className="min-w-0 font-heading text-lg font-bold leading-tight text-foreground">
              {uiStrings.liveFeedbackTitle}
            </p>
            <button
              type="button"
              className="brutal-pressable inline-flex size-10 shrink-0 items-center justify-center border-[3px] border-foreground bg-background brutal-shadow-sm"
              onClick={() => setFeedbackPersisted(false)}
              aria-label={uiStrings.feedbackCloseSidebarAria}
            >
              <X className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3">{feedbackBody}</div>
        </FeedbackDrawer>
      ) : null}
    </div>
  );
}
