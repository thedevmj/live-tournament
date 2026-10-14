"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { LiveClock } from "@/components/live-clock";
import type { Match, Side } from "@/lib/tournament";

interface ScorebugProps {
  match: Match;
  showTimeline?: boolean;
  className?: string;
}

interface RoundEvent {
  round: number;
  winner: "a" | "b";
  type: "standard" | "ace" | "clutch" | "plant" | "defuse";
  timestamp: string;
}

const MOCK_ROUND_EVENTS: RoundEvent[] = [
  { round: 1, winner: "a", type: "standard", timestamp: "00:12" },
  { round: 2, winner: "b", type: "standard", timestamp: "01:45" },
  { round: 3, winner: "a", type: "ace", timestamp: "02:33" },
  { round: 4, winner: "a", type: "standard", timestamp: "03:10" },
  { round: 5, winner: "b", type: "clutch", timestamp: "04:22" },
  { round: 6, winner: "a", type: "standard", timestamp: "05:01" },
  { round: 7, winner: "b", type: "standard", timestamp: "05:55" },
  { round: 8, winner: "a", type: "plant", timestamp: "06:33" },
  { round: 9, winner: "a", type: "standard", timestamp: "07:12" },
  { round: 10, winner: "b", type: "standard", timestamp: "07:58" },
  { round: 11, winner: "a", type: "standard", timestamp: "08:44" },
  { round: 12, winner: "a", type: "defuse", timestamp: "09:20" },
  { round: 13, winner: "a", type: "standard", timestamp: "10:05" },
  { round: 14, winner: "b", type: "standard", timestamp: "10:50" },
  { round: 15, winner: "a", type: "standard", timestamp: "11:33" },
  { round: 16, winner: "b", type: "standard", timestamp: "12:18" },
];

function SideBlock({
  side,
  align,
  showForm = true,
}: {
  side: Side;
  align: "left" | "right";
  showForm?: boolean;
}) {
  const right = align === "right";
  const winRate = side.rounds > 0 ? Math.round((side.rounds / 24) * 100) : 0;

  return (
    <div
      className={`flex flex-col gap-1.5 ${
        right ? "items-end md:text-right" : "items-start md:text-left"
      }`}
    >
      <span className="u-label text-ink-mute">Seed {side.seed}</span>
      <h3 className="display text-[clamp(1.8rem,4.5vw,3rem)] text-ink">
        {side.tag}
      </h3>
      <span className="u-label text-ink-dim">{side.name}</span>
      <span className="numeral mt-3 text-[clamp(4rem,11vw,8.5rem)] text-ink">
        {side.rounds}
      </span>
      {showForm && (
        <div className="flex items-center gap-2 mt-2">
          <span className="u-label text-ink-mute">Map Win%</span>
          <div className="w-24 h-2 bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-acid transition-all duration-500 ease-out"
              style={{ width: `${winRate}%` }}
            />
          </div>
          <span className="u-label mono text-acid">{winRate}%</span>
        </div>
      )}
    </div>
  );
}

function RoundProgressBar({
  aRounds,
  bRounds,
  currentRound,
  maxRounds = 24,
}: {
  aRounds: number;
  bRounds: number;
  currentRound: number;
  maxRounds?: number;
}) {
  const aProgress = (aRounds / maxRounds) * 100;
  const bProgress = (bRounds / maxRounds) * 100;
  const currentProgress = (currentRound / maxRounds) * 100;

  return (
    <div className="relative h-3 bg-ink/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={currentRound} aria-valuemin={0} aria-valuemax={maxRounds}>
      <div
        className="absolute inset-0 bg-gradient-to-r from-acid/20 via-transparent to-live/20"
        style={{ width: `${currentProgress}%` }}
      />
      <div
        className="absolute left-0 top-0 h-full bg-acid"
        style={{ width: `${aProgress}%` }}
      />
      <div
        className="absolute right-0 top-0 h-full bg-live"
        style={{ width: `${bProgress}%` }}
      />
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-ink pointer-events-none"
        style={{ left: `${currentProgress}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

function RoundTimeline({
  events,
  maxRounds = 24,
}: {
  events: RoundEvent[];
  maxRounds?: number;
}) {
  return (
    <div className="relative h-8" role="list" aria-label="Round timeline">
      {events.map((event) => {
        const position = (event.round / maxRounds) * 100;
        const colors = {
          standard: "var(--acid)",
          ace: "var(--live)",
          clutch: "#ffd700",
          plant: "#00ff88",
          defuse: "#ff6b35",
        };
        const color = colors[event.type];

        return (
          <button
            key={event.round}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-200 hover:scale-150 focus:outline-none focus:ring-2 focus:ring-acid focus:ring-offset-2 focus:ring-offset-void"
            style={{
              left: `${position}%`,
              transform: `translate(-50%, -50%)`,
              backgroundColor: color,
            }}
            aria-label={`Round ${event.round}: ${event.type} win at ${event.timestamp}`}
          >
            <span className="sr-only">
              Round {event.round}: {event.type} win at {event.timestamp}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EconomyIndicator({ side }: { side: Side }) {
  const economy = side.rounds >= 10 ? "full" : side.rounds >= 5 ? "half" : "eco";
  const colors = {
    full: "var(--acid)",
    half: "#ffd700",
    eco: "var(--live)",
  };
  const labels = {
    full: "FULL BUY",
    half: "HALF BUY",
    eco: "ECO / FORCE",
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <span
        className="u-label px-2 py-0.5 rounded text-xs"
        style={{ backgroundColor: colors[economy], color: "var(--void)" }}
      >
        {labels[economy]}
      </span>
      <span className="u-label text-ink-mute">
        ${side.rounds * 800 + 1000}
      </span>
    </div>
  );
}

export function Scorebug({
  match,
  showTimeline = true,
  className = "",
}: ScorebugProps) {
  const { a, b } = match;
  const total = a.rounds + b.rounds;
  const currentRound = total + 1;
  const maxRounds = match.bo === "BO3" ? 24 : 30;
  const aShare = total ? (a.rounds / total) * 100 : 50;
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [flashTeam, setFlashTeam] = useState<"a" | "b" | null>(null);
  const prevTotalRef = useRef(total);

  useEffect(() => {
    if (match.status === "live" && prevTotalRef.current !== total) {
      const winner = a.rounds > prevTotalRef.current ? "a" : "b";
      setFlashTeam(winner);
      const timer = setTimeout(() => setFlashTeam(null), 500);
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = total;
  }, [total, a.rounds, b.rounds, match.status]);

  const roundEvents = useMemo(
    () => MOCK_ROUND_EVENTS.filter((e) => e.round <= total),
    [total]
  );

  return (
    <section
      className={`panel scanlines relative overflow-hidden slide-up ${className}`}
      aria-live="polite"
      aria-label={`${match.stage} - ${a.tag} ${a.rounds} vs ${b.rounds} ${b.tag}`}
    >
      <div className="stripes h-[3px]" aria-hidden="true" />
      
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel-2/60 px-4 py-2.5 md:px-6">
        <span className="flex items-center gap-2">
          {match.status === "live" && (
            <>
              <span className="dot-live live-indicator h-2 w-2 bg-live" aria-hidden="true" />
              <span className="u-label text-live">Live</span>
            </>
          )}
          {match.status === "up" && (
            <span className="u-label text-acid">Up Next</span>
          )}
          {match.status === "final" && (
            <span className="u-label text-ink-mute">Final</span>
          )}
        </span>
        <span className="u-label text-ink">{match.stage}</span>
        <span className="u-label text-ink-mute">{match.bo}</span>
        <span className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
          <span
            className={`h-2 w-2 rounded-sm ${
              match.series[0] > 0 ? "bg-acid" : "bg-ink/15"
            }`}
          />
          <span
            className={`h-2 w-2 rounded-sm ${
              match.series[1] > 0 ? "bg-acid" : "bg-ink/15"
            }`}
          />
          <span className="u-label ml-1 text-ink-mute">series</span>
        </span>
        <span className="u-label ml-auto text-ink-mute">
          {match.map} · {match.stream}
        </span>
      </div>

      <div className="grid gap-8 px-5 py-8 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-10 md:px-8 md:py-10">
        <SideBlock side={a} align="right" showForm />
        <div className="flex flex-col items-center justify-center gap-3 border-y border-line py-6 md:border-y-0 md:px-12 scale-in">
          <span className="u-label text-ink-mute">Game clock</span>
          {match.status === "live" && match.clock ? (
            <LiveClock
              initial={match.clock}
              className="mono text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-none text-ink"
            />
          ) : (
            <span className="mono text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-none text-ink-dim">
              —:—
            </span>
          )}
          <span className="u-label text-acid">Round {currentRound} / {maxRounds}</span>
          
          <RoundProgressBar
            aRounds={a.rounds}
            bRounds={b.rounds}
            currentRound={currentRound}
            maxRounds={maxRounds}
          />
        </div>
        <SideBlock side={b} align="left" showForm />
      </div>

      <div className="border-t border-line px-5 py-4 md:px-8 slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="u-label text-ink-dim">Round history</span>
          <span className="u-label text-ink-mute">First to 13</span>
          {showTimeline && total > 0 && (
            <button
              onClick={() => setShowFullTimeline(!showFullTimeline)}
              className="u-label text-acid hover:text-acid-deep transition-colors flex items-center gap-1"
              aria-expanded={showFullTimeline}
            >
              {showFullTimeline ? "Hide" : "Show"} timeline
              <span className="transition-transform" style={{ transform: showFullTimeline ? "rotate(180deg)" : "rotate(0)" }}>
                ▼
              </span>
            </button>
          )}
        </div>
        
        <div className="mt-3">
          <RoundHistory a={a.rounds} b={b.rounds} />
        </div>
        
        <div className="mt-3 flex h-[6px] overflow-hidden ring-1 ring-line">
          <span className="h-full bg-acid transition-all duration-300 ease-out" style={{ width: `${aShare}%` }} />
          <span className="h-full bg-ink/20 transition-all duration-300 ease-out" style={{ width: `${100 - aShare}%` }} />
        </div>

        {showTimeline && total > 0 && (
          <div className="mt-4" role="region" aria-label="Round timeline">
            <RoundTimeline events={roundEvents} maxRounds={maxRounds} />
            <div className="flex justify-between mt-2 text-xs text-ink-mute">
              <span>Round 1</span>
              <span>Round {maxRounds}</span>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <EconomyIndicator side={a} />
          <EconomyIndicator side={b} />
        </div>
      </div>

      {flashTeam && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
          aria-hidden="true"
        >
          <div
            className={`fixed-score-flash ${
              flashTeam === "a" ? "left-1/2 -translate-x-full" : "right-1/2 translate-x-full"
            }`}
            style={{
              animation: "scoreFlash 0.5s var(--ease-out) forwards",
            }}
          >
            <span className="display text-3xl text-void px-4 py-2 rounded">
              +1
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function RoundHistory({ a, b }: { a: number; b: number }) {
  const cells = Array.from({ length: a + b }, (_, i) => (i < a ? "a" : "b")) as (
    | "a"
    | "b"
  )[];
  return (
    <div className="flex gap-[3px]" role="img" aria-label={`Round history ${a}–${b}`}>
      {cells.map((c, i) => (
        <span
          key={i}
          className={`h-2.5 flex-1 transition-all duration-200 ${
            c === "a" ? "bg-acid" : "bg-ink/25"
          }`}
        />
      ))}
    </div>
  );
}