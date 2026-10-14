"use client";

import { useState, useMemo, useCallback } from "react";
import type { BracketSlot, BracketRound } from "@/lib/tournament";
import { teamGrid } from "@/lib/tournament";

interface BracketProps {
  rounds: BracketRound[];
  selectedTeam?: string;
  onTeamSelect?: (team: string) => void;
  className?: string;
}

interface TeamInfo {
  tag: string;
  name: string;
  seed: number;
}

const teamInfoMap = new Map<string, TeamInfo>(
  teamGrid.map((t) => [t.tag, t])
);

function BracketConnector({
  start,
  end,
  color = "var(--line)",
  animated = false,
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color?: string;
  animated?: boolean;
}) {
  const midX = (start.x + end.x) / 2;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: Math.min(start.x, end.x),
        top: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      }}
      aria-hidden="true"
    >
      <path
        d={`M${start.x - Math.min(start.x, end.x)} ${start.y - Math.min(start.y, end.y)} 
           Q${midX - Math.min(start.x, end.x)} ${start.y - Math.min(start.y, end.y)} 
           ${midX - Math.min(start.x, end.x)} ${end.y - Math.min(start.y, end.y)} 
           Q${midX - Math.min(start.x, end.x)} ${end.y - Math.min(start.y, end.y)} 
           ${end.x - Math.min(start.x, end.x)} ${end.y - Math.min(start.y, end.y)}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        style={{
          strokeDasharray: animated ? "8,4" : "none",
          animation: animated ? "dash 1s linear infinite" : "none",
        }}
      />
    </svg>
  );
}

function BracketMatch({
  slot,
  _index,
  _roundIndex,
  highlightedTeam,
  onTeamClick,
}: {
  slot: BracketSlot;
  _index: number;
  _roundIndex: number;
  highlightedTeam?: string;
  onTeamClick?: (team: string) => void;
}) {
  const decided = slot.ar !== null && slot.br !== null;
  const aWon = decided ? (slot.ar! > slot.br! ? true : false) : null;
  const aHighlighted = highlightedTeam === slot.a;
  const bHighlighted = highlightedTeam === slot.b;
  const isLive = slot.live;

  const handleTeamClick = (team: string) => {
    onTeamClick?.(team);
  };

  return (
    <div
      className={`relative flex flex-col group ${
        isLive ? "ring-1 ring-acid/50" : ""
      }`}
      style={{ zIndex: isLive ? 10 : 1 }}
    >
      {isLive && (
        <div className="absolute -inset-1 bg-acid/10 rounded-lg animate-pulse-acid pointer-events-none" />
      )}
      
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2.5 ${
          aWon === true ? "bg-acid/10" : ""
        }`}
      >
        <button
          onClick={() => handleTeamClick(slot.a)}
          className={`flex-1 text-left display text-sm tracking-wide truncate ${
            aWon === true
              ? "text-acid font-bold"
              : aWon === false
                ? "opacity-50"
                : "text-ink"
          } ${aHighlighted ? "bg-acid/20 outline outline-1 outline-acid" : ""}`}
          aria-label={`${slot.a} ${aWon === true ? "won" : aWon === false ? "lost" : "playing"}`}
        >
          {slot.a}
        </button>
        <span className="mono text-sm font-bold text-ink shrink-0">
          {slot.ar === null ? "" : slot.ar}
        </span>
      </div>
      
      <div className="mx-3 h-px bg-line" aria-hidden="true" />
      
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2.5 ${
          aWon === false ? "bg-acid/10" : ""
        }`}
      >
        <button
          onClick={() => handleTeamClick(slot.b)}
          className={`flex-1 text-left display text-sm tracking-wide truncate ${
            aWon === false
              ? "text-acid font-bold"
              : aWon === true
                ? "opacity-50"
                : "text-ink"
          } ${bHighlighted ? "bg-acid/20 outline outline-1 outline-acid" : ""}`}
          aria-label={`${slot.b} ${aWon === false ? "won" : aWon === true ? "lost" : "playing"}`}
        >
          {slot.b}
        </button>
        <span className="mono text-sm font-bold text-ink shrink-0">
          {slot.br === null ? "" : slot.br}
        </span>
      </div>

      {!decided && !isLive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="u-label text-ink-mute/50">TBD</span>
        </div>
      )}
    </div>
  );
}

function BracketRoundView({
  round,
  roundIndex,
  highlightedTeam,
  onTeamClick,
  showConnectors = true,
}: {
  round: BracketRound;
  roundIndex: number;
  highlightedTeam?: string;
  onTeamClick?: (team: string) => void;
  showConnectors?: boolean;
}) {
  return (
    <div
      className="relative flex flex-col gap-3"
      role="list"
      aria-label={`${round.round} bracket`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="display text-lg text-ink">{round.round}</span>
        {round.note && (
          <span className="u-label text-ink-mute">{round.note}</span>
        )}
      </div>
      
      <div className="flex flex-col gap-3" role="list">
        {round.slots.map((slot, i) => (
          <div
            key={slot.id}
            ref={(el) => (matchRefs.current[i] = el)}
            role="listitem"
            className="relative"
          >
            <BracketMatch
              slot={slot}
              index={i}
              roundIndex={roundIndex}
              highlightedTeam={highlightedTeam}
              onTeamClick={onTeamClick}
            />
            
            {showConnectors && i < round.slots.length - 1 && (
              <BracketConnector
                start={{ x: 100, y: 100 }}
                end={{ x: 100, y: 100 }}
                color="var(--line)"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Bracket({
  rounds,
  selectedTeam,
  onTeamSelect,
  className = "",
}: BracketProps) {
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(selectedTeam || null);
  const [keyboardNavIndex, setKeyboardNavIndex] = useState(0);

  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    rounds.forEach((round) => {
      round.slots.forEach((slot) => {
        teams.add(slot.a);
        teams.add(slot.b);
      });
    });
    return Array.from(teams);
  }, [rounds]);

  const handleTeamClick = useCallback(
    (team: string) => {
      setHighlightedTeam((prev) => (prev === team ? null : team));
      onTeamSelect?.(team);
    },
    [onTeamSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setKeyboardNavIndex((prev) => Math.min(prev + 1, allTeams.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setKeyboardNavIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (allTeams[keyboardNavIndex]) {
            handleTeamClick(allTeams[keyboardNavIndex]);
          }
          break;
        case "Escape":
          setHighlightedTeam(null);
          break;
      }
    },
    [allTeams, keyboardNavIndex, handleTeamClick]
  );

  const highlightedTeamInfo = highlightedTeam
    ? teamInfoMap.get(highlightedTeam)
    : null;

  return (
    <div
      className={`stagger grid gap-4 md:grid-cols-3 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="tree"
      aria-label="Tournament bracket"
    >
      {rounds.map((round, i) => (
        <div
          key={round.round}
          className="flex flex-col gap-3"
          role="treeitem"
          aria-level={2}
          aria-posinset={i + 1}
          aria-setsize={rounds.length}
          aria-label={round.round}
          aria-selected={focusedRound === i}
        >
          <BracketRoundView
            round={round}
            roundIndex={i}
            highlightedTeam={highlightedTeam}
            onTeamClick={handleTeamClick}
            showConnectors={i < rounds.length - 1}
          />
        </div>
      ))}

      {highlightedTeamInfo && (
        <div
          className="fixed bottom-4 right-4 z-50 panel p-4 max-w-xs animate-slide-up"
          role="dialog"
          aria-label={`${highlightedTeamInfo.name} path to final`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="display text-xl text-acid">{highlightedTeamInfo.tag}</span>
            <span className="u-label text-ink-dim">{highlightedTeamInfo.name}</span>
            <span className="u-label ml-auto text-ink-mute">Seed #{highlightedTeamInfo.seed}</span>
          </div>
          <TeamPathDisplay team={highlightedTeamInfo.tag} rounds={rounds} />
          <button
            onClick={() => setHighlightedTeam(null)}
            className="mt-3 w-full u-label text-ink-mute hover:text-ink transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function TeamPathDisplay({
  team,
  rounds,
}: {
  team: string;
  rounds: BracketRound[];
}) {
  const path = useMemo(() => {
    const matches: Array<{ round: string; opponent: string; result: "win" | "loss" | "pending" }> = [];
    
    rounds.forEach((round) => {
      round.slots.forEach((slot) => {
        if (slot.a === team || slot.b === team) {
          const opponent = slot.a === team ? slot.b : slot.a;
          let result: "win" | "loss" | "pending" = "pending";
          
          if (slot.ar !== null && slot.br !== null) {
            const teamScore = slot.a === team ? slot.ar : slot.br;
            const oppScore = slot.a === team ? slot.br : slot.ar;
            result = teamScore > oppScore ? "win" : "loss";
          }
          
          matches.push({ round: round.round, opponent, result });
        }
      });
    });
    
    return matches;
  }, [team, rounds]);

  if (path.length === 0) {
    return <p className="u-label text-ink-mute">No matches found for this team</p>;
  }

  return (
    <div className="space-y-2">
      {path.map((match, _i) => (
        <div
          key={match.round}
          className="flex items-center justify-between p-2 bg-panel-2/50 rounded border border-line"
        >
          <div className="flex items-center gap-2">
            <span className="u-label text-ink-mute">{match.round}</span>
            <span className="display text-sm text-ink">vs {match.opponent}</span>
          </div>
          <span
            className={`u-label px-2 py-0.5 rounded text-xs ${
              match.result === "win"
                ? "bg-acid/20 text-acid"
                : match.result === "loss"
                  ? "bg-live/20 text-live"
                  : "bg-ink/10 text-ink-mute"
            }`}
          >
            {match.result === "win" ? "W" : match.result === "loss" ? "L" : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}