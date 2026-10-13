import type { Metadata } from "next";
import { TopBar, Ticker, Footer } from "@/components/chrome";
import { Chess3D } from "@/components/chess3d";
import { countLiveMatches } from "@/lib/tournament";
import { getTournamentState } from "@/lib/store";

export const metadata: Metadata = {
  title: "Chess — OVERTIME",
};

export const dynamic = "force-dynamic";

export default async function ChessPage() {
  const state = await getTournamentState();

  return (
    <>
      <TopBar active="Chess" liveCount={countLiveMatches(state)} />
      <Ticker items={state.tickerItems} />

      <section className="mx-auto max-w-[1440px] px-5 pt-10 md:px-8 md:pt-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div className="flex flex-col gap-2">
            <p className="u-label text-acid">Intermission · warm-up</p>
            <h1 className="display text-[clamp(1.9rem,4.5vw,3rem)] text-ink">
              Analysis board
            </h1>
          </div>
          <span className="u-label text-ink-mute">Three.js · WebGL</span>
        </div>

        <Chess3D />
      </section>

      <div className="mt-14">
        <Footer />
      </div>
    </>
  );
}
