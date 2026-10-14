"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Match } from "@/lib/tournament";

interface TimelineEvent {
  id: string;
  round: number;
  time: string;
  team: "a" | "b";
  type: "kill" | "plant" | "defuse" | "ace" | "clutch" | "entry" | "trade" | "timeout" | "map_start" | "map_end" | "half";
  player?: string;
  description: string;
  importance: "low" | "medium" | "high" | "critical";
}

interface MatchTimelineProps {
  match: Match;
  events?: TimelineEvent[];
  className?: string;
  autoScroll?: boolean;
}

const MOCK_EVENTS: TimelineEvent[] = [
  { id: "e1", round: 1, time: "00:12", team: "a", type: "map_start", description: "Map start - Foundry", importance: "medium" },
  { id: "e2", round: 1, time: "00:45", team: "a", type: "entry", player: "Ryze", description: "Ryze gets opening duel on A site", importance: "low" },
  { id: "e3", round: 1, time: "01:02", team: "a", type: "plant", description: "NOVA plants on A", importance: "medium" },
  { id: "e4", round: 1, time: "01:15", team: "a", type: "defuse", description: "NOVA secures defuse", importance: "high" },
  { id: "e5", round: 2, time: "01:45", team: "b", type: "entry", player: "Viper", description: "Viper entry on B site", importance: "low" },
  { id: "e6", round: 2, time: "02:10", team: "b", type: "plant", description: "KRAIT plants on B", importance: "medium" },
  { id: "e7", round: 2, time: "02:28", team: "b", type: "defuse", description: "KRAIT holds post-plant", importance: "high" },
  { id: "e8", round: 3, time: "02:33", team: "a", type: "ace", player: "Ryze", description: "Ryze 5K ace on pistol round!", importance: "critical" },
  { id: "e9", round: 4, time: "03:10", team: "a", type: "entry", description: "NOVA takes early control", importance: "low" },
  { id: "e10", round: 4, time: "03:45", team: "a", type: "plant", description: "Plant on A", importance: "medium" },
  { id: "e11", round: 4, time: "04:02", team: "a", type: "defuse", description: "NOVA wins retake", importance: "high" },
  { id: "e12", round: 5, time: "04:22", team: "b", type: "clutch", player: "S1mple", description: "S1mple 1v3 clutch on B", importance: "critical" },
  { id: "e13", round: 6, time: "05:01", team: "a", type: "entry", description: "NOVA dominates mid", importance: "low" },
  { id: "e14", round: 6, time: "05:33", team: "a", type: "plant", description: "Plant A", importance: "medium" },
  { id: "e15", round: 7, time: "05:55", team: "b", type: "entry", description: "KRAIT B rush", importance: "low" },
  { id: "e16", round: 7, time: "06:20", team: "b", type: "plant", description: "Plant B", importance: "medium" },
  { id: "e17", round: 8, time: "06:33", team: "a", type: "plant", description: "NOVA fast A execute", importance: "medium" },
  { id: "e18", round: 9, time: "07:12", team: "a", type: "entry", player: "ZywOo", description: "ZywOo double entry", importance: "high" },
  { id: "e19", round: 9, time: "07:45", team: "a", type: "plant", description: "Plant A", importance: "medium" },
  { id: "e20", round: 10, time: "07:58", team: "b", type: "entry", description: "KRAIT anti-eco", importance: "low" },
  { id: "e21", round: 11, time: "08:44", team: "a", type: "entry", description: "NOVA map control", importance: "low" },
  { id: "e22", round: 12, time: "09:20", team: "a", type: "defuse", player: "Ryze", description: "Ryze ninja defuse!", importance: "critical" },
  { id: "e23", round: 13, time: "10:05", team: "a", type: "entry", description: "NOVA closing out", importance: "low" },
  { id: "e24", round: 13, time: "10:30", team: "a", type: "map_end", description: "NOVA wins map 13-9", importance: "critical" },
];

const EVENT_ICONS: Record<TimelineEvent["type"], string> = {
  kill: "⚔",
  plant: "💣",
  defuse: "🔧",
  ace: "⭐",
  clutch: "💎",
  entry: "🎯",
  trade: "↔",
  timeout: "⏸",
  map_start: "🚩",
  map_end: "🏁",
  half: "🔄",
};

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  kill: "var(--ink-dim)",
  plant: "var(--live)",
  defuse: "var(--acid)",
  ace: "#ffd700",
  clutch: "#00ff88",
  entry: "var(--ink)",
  trade: "var(--ink-mute)",
  timeout: "var(--acid)",
  map_start: "var(--acid)",
  map_end: "var(--live)",
  half: "var(--acid)",
};

function TimelineEventItem({
  event,
  index,
  isNew = false,
  match,
}: {
  event: TimelineEvent;
  index: number;
  isNew?: boolean;
  match: Match;
}) {
  const team = event.team === "a" ? match.a : match.b;
  const color = EVENT_COLORS[event.type];
  const icon = EVENT_ICONS[event.type];
  const importanceSizes = {
    low: "w-1.5 h-1.5",
    medium: "w-2 h-2",
    high: "w-2.5 h-2.5",
    critical: "w-3 h-3",
  };

  return (
    <li
      className={`flex gap-3 relative ${
        isNew ? "animate-slide-up" : ""
      }`}
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`${importanceSizes[event.importance]} rounded-full border-2 flex items-center justify-center text-[10px] leading-none transition-all duration-300`}
          style={{
            backgroundColor: event.team === "a" ? "var(--acid)" : "var(--live)",
            borderColor: color,
            boxShadow: event.importance === "critical" ? `0 0 12px ${color}` : "none",
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="h-full w-[2px] bg-line" aria-hidden="true" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="mono text-xs text-ink-mute shrink-0">{event.time}</span>
          <span className="u-label text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: color + "20", color }}>
            Round {event.round}
          </span>
          {event.player && (
            <span className="u-label text-xs text-ink-dim">· {event.player}</span>
          )}
        </div>
        <p className="text-sm text-ink mt-1 leading-snug">
          <span className="font-medium" style={{ color: event.team === "a" ? "var(--acid)" : "var(--live)" }}>
            {team.tag}
          </span>{" "}
          {event.description}
        </p>
      </div>
    </li>
  );
}

function TimelineFilters({
  selectedTypes,
  onChange,
  eventCounts,
}: {
  selectedTypes: Set<TimelineEvent["type"]>;
  onChange: (type: TimelineEvent["type"]) => void;
  eventCounts: Record<TimelineEvent["type"], number>;
}) {
  const allTypes: TimelineEvent["type"][] = [
    "map_start",
    "map_end",
    "plant",
    "defuse",
    "ace",
    "clutch",
    "entry",
    "kill",
    "trade",
    "timeout",
    "half",
  ];

  return (
    <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filter timeline events">
      {allTypes.map((type) => {
        const count = eventCounts[type] || 0;
        const isSelected = selectedTypes.has(type);
        
        if (count === 0 && !isSelected) return null;
        
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`u-label px-2 py-1 rounded transition-all duration-150 ${
              isSelected
                ? "bg-acid text-void font-medium"
                : "bg-ink/10 text-ink-mute hover:text-ink hover:bg-ink/20"
            }`}
            aria-pressed={isSelected}
          >
            <span className="flex items-center gap-1">
              <span aria-hidden="true">{EVENT_ICONS[type]}</span>
              {type.replace("_", " ")}
              <span className="mono text-[10px] opacity-70">({count})</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MatchTimeline({
  match,
  events = MOCK_EVENTS,
  className = "",
  autoScroll = true,
}: MatchTimelineProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<TimelineEvent["type"]>>(new Set());
  const [newEventId, setNewEventId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredEvents = useMemo(() => {
    if (selectedTypes.size === 0) return events;
    return events.filter((e) => selectedTypes.has(e.type));
  }, [events, selectedTypes]);

  const eventCounts = useMemo(() => {
    const counts: Record<TimelineEvent["type"], number> = {} as Record<TimelineEvent["type"], number>;
    events.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }, [events]);

  const toggleType = (type: TimelineEvent["type"]) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const clearFilters = () => setSelectedTypes(new Set());

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filteredEvents.length, autoScroll]);

  useEffect(() => {
    if (!match.status === "live") return;
    
    const interval = setInterval(() => {
      const nextEvent = events.find((e) => !filteredEvents.includes(e));
      if (nextEvent) {
        setNewEventId(nextEvent.id);
        setTimeout(() => setNewEventId(null), 2000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [match.status, events, filteredEvents]);

  const totalEvents = filteredEvents.length;
  const criticalEvents = filteredEvents.filter((e) => e.importance === "critical").length;

  return (
    <div className={`panel ${className}`} role="region" aria-label={`${match.a.tag} vs ${match.b.tag} timeline`}>
      <div className="panel-head">
        <h3 className="u-label text-ink">Match Timeline</h3>
        <div className="flex items-center gap-2">
          <span className="mono text-xs text-ink-dim">
            {totalEvents} events
          </span>
          {criticalEvents > 0 && (
            <span className="u-label text-xs px-1.5 py-0.5 rounded bg-live/20 text-live">
              {criticalEvents} key
            </span>
          )}
        </div>
      </div>

      <TimelineFilters
        selectedTypes={selectedTypes}
        onChange={toggleType}
        eventCounts={eventCounts}
      />

      {selectedTypes.size > 0 && (
        <button
          onClick={clearFilters}
          className="u-label text-acid hover:text-acid-deep mb-3 inline-flex items-center gap-1"
        >
          Clear filters
        </button>
      )}

      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <ul
          ref={listRef}
          className="flex flex-col stagger"
          role="list"
          aria-label="Match events"
        >
          {filteredEvents.map((event, i) => (
            <TimelineEventItem
              key={event.id}
              event={event}
              index={i}
              isNew={newEventId === event.id}
              match={match}
            />
          ))}
          {filteredEvents.length === 0 && (
            <li className="flex items-center justify-center h-32 text-ink-mute">
              No events match current filters
            </li>
          )}
        </ul>
      </div>

      <div className="border-t border-line mt-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-ink-mute">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--acid)" }} />
            {match.a.tag}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--live)" }} />
            {match.b.tag}
          </span>
        </div>
        <button
          onClick={() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="u-label text-ink-mute hover:text-ink transition-colors"
        >
          Scroll to top
        </button>
      </div>
    </div>
  );
}