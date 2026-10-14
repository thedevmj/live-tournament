"use client";

import { useEffect } from "react";
import { TopBar, Ticker, Footer } from "@/components/chrome";
import {
  Module,
  MatchRow,
  Standings,
  Pulse,
  Stat,
} from "@/components/dashboard";
import { Scorebug } from "@/components/scorebug-enhanced";
import { MatchTimeline } from "@/components/match-timeline";
import { countLiveMatches } from "@/lib/tournament";
import { useLiveTournament } from "@/lib/use-live-tournament";
import type { TournamentState } from "@/lib/tournament";

const seq = (n: number) => ({ "--i": n }) as React.CSSProperties;

function LiveContent({ initialState }: { initialState: TournamentState }) {
  const { state, isConnected, forceUpdate } = useLiveTournament({
    enabled: true,
    onChange: (changes) => {
      console.log("Live changes:", changes);
    },
    onError: (error) => {
      console.error("SSE error:", error);
    },
  });

  const tournamentState = state || initialState;
  const {
    featuredMatch,
    liveMatches,
    upcomingMatches,
    finals,
    standings,
    pulse,
    tickerItems,
  } = tournamentState;
  const allMatches = [featuredMatch, ...liveMatches, ...upcomingMatches, ...finals];
  const railMatches = allMatches.filter((m) => m.id !== featuredMatch.id);
  const liveCount = countLiveMatches(tournamentState);
  const teamsLive = new Set(
    allMatches.flatMap((m) => [m.a.tag, m.b.tag]),
  ).size;

  useEffect(() => {
    if (!isConnected) {
      forceUpdate();
    }
  }, [isConnected, forceUpdate]);

  return (
    <>
      <TopBar active="Live" liveCount={liveCount} />
      <Ticker items={tickerItems} />

      <main className="mx-auto max-w-360 px-5 pt-10 pb-20 md:px-8 md:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-8">
          <div className="flex flex-col gap-4">
            <p className="u-label text-acid">Broadcast desk · Thu 06 Oct</p>
            <h1 className="display text-[clamp(2.6rem,7vw,5.5rem)] text-ink">
              Control room
            </h1>
          </div>
          <div className="flex items-center gap-8 md:gap-12">
            <Stat
              value={String(liveCount).padStart(2, "0")}
              label="Matches live"
            />
            <Stat
              value={String(upcomingMatches.length).padStart(2, "0")}
              label="Up next"
            />
            <Stat
              value={String(teamsLive).padStart(2, "0")}
              label="Teams live"
            />
          </div>
        </div>

        <div className="stagger mt-6 grid gap-4 lg:grid-cols-3">
          <div style={seq(0)} className="flex flex-col gap-4 lg:col-span-2">
            <Scorebug match={featuredMatch} showTimeline />
            <MatchTimeline match={featuredMatch} />
            <Module
              title="Live + up next"
              meta={`Showing ${railMatches.length} of ${allMatches.length}`}
            >
              {railMatches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </Module>
          </div>
          <aside style={seq(1)} className="flex flex-col gap-4">
            <Module title="Pool B standings" meta="Week 4 · Day 3">
              <Standings rows={standings} />
            </Module>
            <Module title="Match pulse" meta="UTC+2">
              <Pulse events={pulse} />
            </Module>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function LiveClient({ initialState }: { initialState: TournamentState }) {
  return <LiveContent initialState={initialState} />;
}