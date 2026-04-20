"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

const CHANNEL_PREFIX = "deck-poll:";
const EVT_STATE = "deck_poll_state";
const EVT_RESET = "deck_poll_reset";
const EVT_VOTE = "deck_poll_vote";

const HEARTBEAT_MS = 12_000;
/** If "Umfrage live schalten" or a vote fires before Realtime SUBSCRIBED, `send` is a no-op; retry briefly. */
const BROADCAST_RETRY_MS = 12_000;
const BROADCAST_RETRY_INTERVAL_MS = 80;

export interface LivePollSnapshot {
  pollId: string;
  slideIndex: number;
  question: string;
  options: string[];
  tallies: number[];
  status: "live" | "results";
}

export interface PollSlideDefinition {
  slideIndex: number;
  question: string;
  options: string[];
}

interface LivePollContextValue {
  supabaseReady: boolean;
  slideIndex: number;
  isPresenterView: boolean;
  snapshot: LivePollSnapshot | null;
  audienceHasVoted: boolean;
  registerPollSlide: (def: PollSlideDefinition | null) => void;
  beginLivePoll: () => void;
  endLivePoll: () => void;
  submitVote: (optionIndex: number) => void;
}

const LivePollContext = createContext<LivePollContextValue | null>(null);

function isPollStatePayload(x: unknown): x is LivePollSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.pollId === "string" &&
    typeof o.slideIndex === "number" &&
    typeof o.question === "string" &&
    Array.isArray(o.options) &&
    o.options.every((s) => typeof s === "string") &&
    Array.isArray(o.tallies) &&
    o.tallies.every((n) => typeof n === "number") &&
    (o.status === "live" || o.status === "results") &&
    o.tallies.length === o.options.length
  );
}

export function useDeckPoll(): LivePollContextValue {
  const ctx = useContext(LivePollContext);
  if (!ctx) {
    throw new Error("useDeckPoll must be used within LivePollProvider");
  }
  return ctx;
}

export function LivePollProvider({
  children,
  sessionId,
  supabaseReady,
  supabaseUrl,
  supabaseAnon,
  slideIndex,
  isPresenterView,
}: {
  children: React.ReactNode;
  sessionId: string | undefined;
  supabaseReady: boolean;
  supabaseUrl: string | undefined;
  supabaseAnon: string | undefined;
  slideIndex: number;
  isPresenterView: boolean;
}) {
  const [snapshot, setSnapshot] = useState<LivePollSnapshot | null>(null);
  const [audienceHasVoted, setAudienceHasVoted] = useState(false);

  const slideIndexRef = useRef(slideIndex);
  useLayoutEffect(() => {
    slideIndexRef.current = slideIndex;
  }, [slideIndex]);

  const slidePollRef = useRef<PollSlideDefinition | null>(null);
  const registerPollSlide = useCallback((def: PollSlideDefinition | null) => {
    slidePollRef.current = def;
  }, []);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const channelReadyRef = useRef(false);
  const seenVotersRef = useRef<Set<string>>(new Set());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const broadcastRetryIntervalRef = useRef<number | null>(null);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const clearBroadcastRetry = useCallback(() => {
    if (broadcastRetryIntervalRef.current !== null) {
      window.clearInterval(broadcastRetryIntervalRef.current);
      broadcastRetryIntervalRef.current = null;
    }
  }, []);

  const sendBroadcast = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      const ch = channelRef.current;
      if (!channelReadyRef.current || !ch) return;
      await ch.send({ type: "broadcast", event, payload });
    },
    [],
  );

  /** Retries until the channel is ready or timeout (covers SUBSCRIBE race on go-live and votes). */
  const sendBroadcastReliable = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      clearBroadcastRetry();
      const trySend = async (): Promise<boolean> => {
        const ch = channelRef.current;
        if (!channelReadyRef.current || !ch) return false;
        await ch.send({ type: "broadcast", event, payload });
        return true;
      };
      void (async () => {
        if (await trySend()) return;
        const started = Date.now();
        broadcastRetryIntervalRef.current = window.setInterval(() => {
          void (async () => {
            if (Date.now() - started > BROADCAST_RETRY_MS) {
              clearBroadcastRetry();
              return;
            }
            if (await trySend()) clearBroadcastRetry();
          })();
        }, BROADCAST_RETRY_INTERVAL_MS);
      })();
    },
    [clearBroadcastRetry],
  );

  const broadcastReset = useCallback(async () => {
    await sendBroadcast(EVT_RESET, {});
  }, [sendBroadcast]);

  const applyIncomingState = useCallback(
    (payload: LivePollSnapshot) => {
      if (payload.slideIndex !== slideIndexRef.current) return;
      setSnapshot(payload);
      if (!isPresenterView && typeof window !== "undefined") {
        try {
          const key = `deck-poll-voted:${payload.pollId}`;
          if (window.sessionStorage.getItem(key) === "1") {
            setAudienceHasVoted(true);
          } else {
            setAudienceHasVoted(false);
          }
        } catch {
          setAudienceHasVoted(false);
        }
      }
    },
    [isPresenterView],
  );

  const snapshotRef = useRef<LivePollSnapshot | null>(null);
  useLayoutEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    if (!supabaseReady || !sessionId || !supabaseUrl || !supabaseAnon) {
      channelReadyRef.current = false;
      channelRef.current = null;
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);
    const channel = supabase
      .channel(`${CHANNEL_PREFIX}${sessionId}`, {
        config: { broadcast: { self: true } },
      })
      .on(
        "broadcast",
        { event: EVT_STATE },
        ({ payload }: { payload?: unknown }) => {
          if (!isPollStatePayload(payload)) return;
          applyIncomingState(payload);
        },
      )
      .on("broadcast", { event: EVT_RESET }, () => {
        setSnapshot(null);
        if (!isPresenterView) {
          setAudienceHasVoted(false);
        }
        seenVotersRef.current.clear();
      })
      .on(
        "broadcast",
        { event: EVT_VOTE },
        ({ payload }: { payload?: unknown }) => {
          if (!isPresenterView) return;
          if (!payload || typeof payload !== "object") return;
          const p = payload as Record<string, unknown>;
          const pollId = p.pollId;
          const optionIndex = p.optionIndex;
          const voterId = p.voterId;
          if (
            typeof pollId !== "string" ||
            typeof optionIndex !== "number" ||
            typeof voterId !== "string"
          ) {
            return;
          }
          setSnapshot((prev) => {
            if (!prev || prev.pollId !== pollId || prev.status !== "live") return prev;
            if (optionIndex < 0 || optionIndex >= prev.options.length) return prev;
            const dedupe = `${pollId}:${voterId}`;
            if (seenVotersRef.current.has(dedupe)) return prev;
            seenVotersRef.current.add(dedupe);
            const nextTallies = [...prev.tallies];
            nextTallies[optionIndex] += 1;
            const next: LivePollSnapshot = { ...prev, tallies: nextTallies };
            sendBroadcastReliable(EVT_STATE, next as unknown as Record<string, unknown>);
            return next;
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channelReadyRef.current = true;
          channelRef.current = channel;
          if (isPresenterView) {
            const live = snapshotRef.current;
            if (live?.status === "live") {
              void channel.send({
                type: "broadcast",
                event: EVT_STATE,
                payload: live as unknown as Record<string, unknown>,
              });
            }
          }
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          channelReadyRef.current = false;
        }
      });

    return () => {
      channelReadyRef.current = false;
      channelRef.current = null;
      clearHeartbeat();
      clearBroadcastRetry();
      void channel.unsubscribe();
    };
  }, [
    applyIncomingState,
    clearBroadcastRetry,
    clearHeartbeat,
    isPresenterView,
    sendBroadcastReliable,
    sessionId,
    supabaseAnon,
    supabaseReady,
    supabaseUrl,
  ]);

  useEffect(() => {
    if (!isPresenterView || !snapshot || snapshot.status !== "live") {
      clearHeartbeat();
      return;
    }
    heartbeatRef.current = setInterval(() => {
      const s = snapshotRef.current;
      if (s?.status === "live") {
        void sendBroadcast(EVT_STATE, s as unknown as Record<string, unknown>);
      }
    }, HEARTBEAT_MS);
    return clearHeartbeat;
  }, [clearHeartbeat, isPresenterView, sendBroadcast, snapshot]);

  const beginLivePoll = useCallback(() => {
    if (!isPresenterView || !supabaseReady) return;
    const def = slidePollRef.current;
    if (!def || def.slideIndex !== slideIndexRef.current) return;
    const pollId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `poll-${Date.now()}`;
    seenVotersRef.current.clear();
    const next: LivePollSnapshot = {
      pollId,
      slideIndex: def.slideIndex,
      question: def.question,
      options: def.options,
      tallies: def.options.map(() => 0),
      status: "live",
    };
    setSnapshot(next);
    sendBroadcastReliable(EVT_STATE, next as unknown as Record<string, unknown>);
  }, [isPresenterView, sendBroadcastReliable, supabaseReady]);

  const endLivePoll = useCallback(() => {
    if (!isPresenterView) return;
    setSnapshot((prev) => {
      if (!prev || prev.status !== "live") return prev;
      const closed: LivePollSnapshot = { ...prev, status: "results" };
      sendBroadcastReliable(EVT_STATE, closed as unknown as Record<string, unknown>);
      return closed;
    });
  }, [isPresenterView, sendBroadcastReliable]);

  useEffect(() => {
    if (!isPresenterView) return;
    if (!snapshot) return;
    if (snapshot.slideIndex === slideIndex) return;
    void broadcastReset();
    startTransition(() => {
      setSnapshot(null);
    });
    seenVotersRef.current.clear();
    clearHeartbeat();
  }, [broadcastReset, clearHeartbeat, isPresenterView, slideIndex, snapshot]);

  useEffect(() => {
    startTransition(() => {
      setSnapshot((prev) => {
        if (!prev) return prev;
        if (prev.slideIndex === slideIndex) return prev;
        return null;
      });
    });
  }, [slideIndex]);

  useEffect(() => {
    if (snapshot || isPresenterView) return;
    startTransition(() => {
      setAudienceHasVoted(false);
    });
  }, [isPresenterView, snapshot]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!snapshot || isPresenterView) return;
    try {
      const key = `deck-poll-voted:${snapshot.pollId}`;
      const voted = window.sessionStorage.getItem(key) === "1";
      startTransition(() => {
        setAudienceHasVoted(voted);
      });
    } catch {
      startTransition(() => {
        setAudienceHasVoted(false);
      });
    }
  }, [isPresenterView, snapshot]);

  const submitVote = useCallback(
    (optionIndex: number) => {
      if (isPresenterView || !supabaseReady) return;
      const snap = snapshot;
      if (!snap || snap.status !== "live") return;
      if (snap.slideIndex !== slideIndexRef.current) return;
      if (optionIndex < 0 || optionIndex >= snap.options.length) return;
      if (audienceHasVoted) return;
      let voterId: string;
      try {
        const key = "deck-poll-voter-id";
        let id = window.sessionStorage.getItem(key);
        if (!id) {
          id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `v-${Date.now()}`;
          window.sessionStorage.setItem(key, id);
        }
        voterId = id;
        const votedKey = `deck-poll-voted:${snap.pollId}`;
        if (window.sessionStorage.getItem(votedKey) === "1") return;
        window.sessionStorage.setItem(votedKey, "1");
      } catch {
        return;
      }
      setAudienceHasVoted(true);
      sendBroadcastReliable(EVT_VOTE, {
        pollId: snap.pollId,
        optionIndex,
        voterId,
      });
    },
    [audienceHasVoted, isPresenterView, sendBroadcastReliable, snapshot, supabaseReady],
  );

  const value = useMemo(
    () => ({
      supabaseReady: Boolean(supabaseReady),
      slideIndex,
      isPresenterView,
      snapshot,
      audienceHasVoted,
      registerPollSlide,
      beginLivePoll,
      endLivePoll,
      submitVote,
    }),
    [
      supabaseReady,
      slideIndex,
      isPresenterView,
      snapshot,
      audienceHasVoted,
      registerPollSlide,
      beginLivePoll,
      endLivePoll,
      submitVote,
    ],
  );

  return <LivePollContext.Provider value={value}>{children}</LivePollContext.Provider>;
}
