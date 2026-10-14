import { getTournamentState } from "@/lib/store";
import type { TournamentState } from "@/lib/tournament";

const UPDATE_INTERVAL = 30000;
const HEARTBEAT_INTERVAL = 15000;

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const sendEvent = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      send({ type: "connected", timestamp: Date.now() });

      let lastState: TournamentState | null = null;

      const tick = async () => {
        if (closed) return;
        try {
          const state = await getTournamentState();
          
          if (lastState) {
            const changes = detectChanges(lastState, state);
            if (changes.length > 0) {
              sendEvent("changes", changes);
            }
          }
          
          sendEvent("state", state);
          lastState = state;
        } catch {
          sendEvent("error", { message: "Failed to fetch state" });
        }
      };

      await tick();

      const updateTimer = setInterval(tick, UPDATE_INTERVAL);
      const heartbeatTimer = setInterval(() => {
        send({ type: "heartbeat", timestamp: Date.now() });
      }, HEARTBEAT_INTERVAL);

      return () => {
        closed = true;
        clearInterval(updateTimer);
        clearInterval(heartbeatTimer);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function detectChanges(prev: TournamentState, curr: TournamentState): Array<{
  type: string;
  matchId?: string;
  field?: string;
  prevValue: unknown;
  currValue: unknown;
}> {
  const changes: Array<{
    type: string;
    matchId?: string;
    field?: string;
    prevValue: unknown;
    currValue: unknown;
  }> = [];

  const allPrev = [
    { ...prev.featuredMatch, _key: "featuredMatch" },
    ...prev.liveMatches.map(m => ({ ...m, _key: m.id })),
    ...prev.upcomingMatches.map(m => ({ ...m, _key: m.id })),
    ...prev.finals.map(m => ({ ...m, _key: m.id })),
  ];

  const allCurr = [
    { ...curr.featuredMatch, _key: "featuredMatch" },
    ...curr.liveMatches.map(m => ({ ...m, _key: m.id })),
    ...curr.upcomingMatches.map(m => ({ ...m, _key: m.id })),
    ...curr.finals.map(m => ({ ...m, _key: m.id })),
  ];

  for (const currMatch of allCurr) {
    const prevMatch = allPrev.find(m => m._key === currMatch._key);
    if (!prevMatch) continue;

    const matchId = currMatch._key;
    delete currMatch._key;
    delete prevMatch._key;

    if (prevMatch.status !== currMatch.status) {
      changes.push({
        type: "status",
        matchId,
        field: "status",
        prevValue: prevMatch.status,
        currValue: currMatch.status,
      });
    }

    if (prevMatch.clock !== currMatch.clock && currMatch.clock) {
      changes.push({
        type: "clock",
        matchId,
        field: "clock",
        prevValue: prevMatch.clock,
        currValue: currMatch.clock,
      });
    }

    if (prevMatch.a.rounds !== currMatch.a.rounds) {
      changes.push({
        type: "round",
        matchId,
        field: "a.rounds",
        prevValue: prevMatch.a.rounds,
        currValue: currMatch.a.rounds,
      });
    }

    if (prevMatch.b.rounds !== currMatch.b.rounds) {
      changes.push({
        type: "round",
        matchId,
        field: "b.rounds",
        prevValue: prevMatch.b.rounds,
        currValue: currMatch.b.rounds,
      });
    }

    if (prevMatch.a.score !== currMatch.a.score) {
      changes.push({
        type: "map",
        matchId,
        field: "a.score",
        prevValue: prevMatch.a.score,
        currValue: currMatch.a.score,
      });
    }

    if (prevMatch.b.score !== currMatch.b.score) {
      changes.push({
        type: "map",
        matchId,
        field: "b.score",
        prevValue: prevMatch.b.score,
        currValue: currMatch.b.score,
      });
    }
  }

  return changes;
}