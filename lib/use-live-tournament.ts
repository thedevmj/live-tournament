"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TournamentState } from "@/lib/tournament";

type LiveEvent =
  | { type: "connected"; timestamp: number }
  | { type: "heartbeat"; timestamp: number }
  | { type: "state"; data: TournamentState }
  | { type: "changes"; changes: Array<{
      type: string;
      matchId?: string;
      field?: string;
      prevValue: unknown;
      currValue: unknown;
    }> }
  | { type: "error"; message: string };

interface UseLiveTournamentOptions {
  enabled?: boolean;
  onChange?: (changes: LiveEvent["changes"]) => void;
  onError?: (error: Error) => void;
}

export function useLiveTournament({
  enabled = true,
  onChange,
  onError,
}: UseLiveTournamentOptions = {}) {
  const [state, setState] = useState<TournamentState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectRef = useRef<() => void>();

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    const es = new EventSource("/api/live");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data: LiveEvent = JSON.parse(event.data);
        
        switch (data.type) {
          case "state":
            setState(data.data);
            break;
          case "changes":
            if (onChange) onChange(data.changes);
            break;
          case "heartbeat":
            setLastHeartbeat(data.timestamp);
            break;
          case "error":
            if (onError) onError(new Error(data.message));
            break;
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
        reconnectAttempts.current++;
        reconnectTimerRef.current = setTimeout(() => connectRef.current?.(), delay);
      }
    };
  }, [enabled, onChange, onError]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, connect]);

  const forceUpdate = useCallback(async () => {
    try {
      const res = await fetch("/api/live", { method: "GET", cache: "no-store" });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("event: state") || line.startsWith("data:")) {
            try {
              const jsonStr = line.replace(/^event: \w+\n/, "").replace(/^data: /, "");
              const data: LiveEvent = JSON.parse(jsonStr);
              if (data.type === "state") {
                setState(data.data);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Force update failed:", err);
    }
  }, []);

  return {
    state,
    isConnected,
    lastHeartbeat,
    forceUpdate,
  };
}

export function useMatchUpdates(matchId: string, state: TournamentState | null) {
  const match = useMemo(() => {
    if (!state) return null;
    return getMatchById(state, matchId);
  }, [state, matchId]);

  return { match };
}

function getMatchById(state: TournamentState, id: string) {
  if (state.featuredMatch.id === id) return state.featuredMatch;
  const live = state.liveMatches.find(m => m.id === id);
  if (live) return live;
  const upcoming = state.upcomingMatches.find(m => m.id === id);
  if (upcoming) return upcoming;
  return state.finals.find(m => m.id === id) || null;
}