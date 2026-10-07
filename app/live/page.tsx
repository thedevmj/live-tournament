import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { TopBar, Ticker, Footer } from "@/components/chrome";
import {
  Module,
  Scorebug,
  MatchRow,
  Standings,
  Pulse,
  Stat,
} from "@/components/dashboard";
import {
  featuredMatch,
  liveMatches,
  upcomingMatches,
  finals,
  standings,
  pulse,
  tickerItems,
} from "@/lib/tournament";

export const metadata: Metadata = {
  title: "Live",
};

const seq = (n: number) => ({ "--i": n }) as CSSProperties;
const allMatches = [featuredMatch, ...liveMatches, ...upcomingMatches, ...finals];
const railMatches = allMatches.filter((m) => m.id !== featuredMatch.id);

export default function LivePage() {
  return (
    <>
      <TopBar active="Live" />
      <Ticker items={tickerItems} />

      <main className="mx-auto max-w-[1440px] px-5 pt-10 pb-20 md:px-8 md:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-8">
          <div className="flex flex-col gap-4">
            <p className="u-label text-acid">Broadcast desk · Thu 06 Oct</p>
            <h1 className="display text-[clamp(2.6rem,7vw,5.5rem)] text-ink">
              Control room
            </h1>
          </div>
          <div className="flex items-center gap-8 md:gap-12">
            <Stat value="03" label="Matches live" />
            <Stat value="02" label="Up next" />
            <Stat value="12" label="Teams live" />
          </div>
        </div>

        <div className="stagger mt-6 grid gap-4 lg:grid-cols-3">
          <div style={seq(0)} className="flex flex-col gap-4 lg:col-span-2">
            <Scorebug match={featuredMatch} />
            <Module title="Live + up next" meta="Showing 5 of 12">
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