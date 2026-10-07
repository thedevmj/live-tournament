import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { TopBar, Ticker, Footer } from "@/components/chrome";
import { CTA } from "@/components/cta";
import {
  Module,
  Scorebug,
  MatchRow,
  Standings,
  Pulse,
} from "@/components/dashboard";
import type { BracketSlot } from "@/lib/tournament";
import {
  featuredMatch,
  liveMatches,
  upcomingMatches,
  finals,
  standings,
  standingsA,
  tickerItems,
  teamGrid,
  schedule,
  bracket,
  pulse,
} from "@/lib/tournament";

export const metadata: Metadata = {
  title: "OVERTIME — Circuit Major S04",
};

const seq = (n: number) => ({ "--i": n }) as CSSProperties;

function SectionHead({
  kicker,
  title,
  meta,
}: {
  kicker: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div className="flex flex-col gap-2">
        <p className="u-label text-acid">{kicker}</p>
        <h2 className="display text-[clamp(1.9rem,4.5vw,3rem)] text-ink">
          {title}
        </h2>
      </div>
      {meta && <span className="u-label text-ink-mute">{meta}</span>}
    </div>
  );
}

function BracketRow({
  tag,
  score,
  won,
}: {
  tag: string;
  score: number | null;
  won: boolean | null;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2.5 ${
        won === true ? "bg-acid/10" : ""
      }`}
    >
      <span
        className={`display text-sm tracking-wide ${
          won === true ? "text-acid" : won === false ? "opacity-50" : "text-ink"
        }`}
      >
        {tag}
      </span>
      <span className="mono text-sm font-bold text-ink">
        {score === null ? "" : score}
      </span>
    </div>
  );
}

function BracketBox({ slot }: { slot: BracketSlot }) {
  const decided = slot.ar !== null && slot.br !== null;
  const aWon = decided ? (slot.ar! > slot.br! ? true : false) : null;
  return (
    <div
      className={`flex flex-col border bg-panel ${
        slot.live ? "border-acid/50" : "border-line"
      }`}
    >
      {slot.live && <div className="stripes h-[3px]" aria-hidden="true" />}
      <BracketRow tag={slot.a} score={slot.ar} won={aWon} />
      <div className="mx-3 h-px bg-line" aria-hidden="true" />
      <BracketRow tag={slot.b} score={slot.br} won={aWon === null ? null : !aWon} />
    </div>
  );
}

export default function Home() {
  const liveNow = [featuredMatch, ...liveMatches];
  const upNext = [...upcomingMatches, ...finals];

  return (
    <>
      <TopBar active="" />
      <Ticker items={tickerItems} />

      {/* hero */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pt-12 pb-16 md:px-8 md:pt-20 lg:grid-cols-[1fr_minmax(0,46rem)] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <p className="u-label text-acid">Circuit Major · Season 04</p>
          <h1 className="display text-[clamp(2.8rem,8vw,6.4rem)] text-ink">
            Every round.
            <br />
            <span className="text-acid">One feed.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-ink-dim">
            Twelve crews, four pools, seven days. Scores, brackets and
            standings flip the instant the round does — no refresh, no delay.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <CTA href="/live">
              Enter control room
              <span aria-hidden="true">→</span>
            </CTA>
            <CTA href="#schedule" variant="outline">
              View schedule
            </CTA>
          </div>
          <dl className="mt-2 grid w-full max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            <div className="flex flex-col gap-1.5">
              <dt className="u-label text-ink-mute">Runs</dt>
              <dd className="numeral text-[clamp(1.3rem,2.5vw,1.7rem)] text-ink">
                05–13
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="u-label text-ink-mute">Crews</dt>
              <dd className="numeral text-[clamp(1.3rem,2.5vw,1.7rem)] text-ink">
                12
              </dd>
            </div>
            <div className="flex flex-col gap-1.5">
              <dt className="u-label text-ink-mute">Prize</dt>
              <dd className="numeral text-[clamp(1.3rem,2.5vw,1.7rem)] text-ink">
                $1.2M
              </dd>
            </div>
          </dl>
        </div>
        <Scorebug match={featuredMatch} />
      </section>

      {/* live + pulse */}
      <section id="live" className="mx-auto max-w-[1440px] px-5 md:px-8">
        <SectionHead kicker="Right now" title="Live on air" meta="3 streams rolling" />
        <div className="stagger grid gap-4 lg:grid-cols-3">
          <div style={seq(0)} className="flex flex-col gap-4 lg:col-span-2">
            <Module title="Live now" meta="2 matches in progress">
              {liveNow.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </Module>
            <Module title="Up next" meta="Resets 21:30 CET">
              {upNext.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </Module>
          </div>
          <aside style={seq(1)} className="flex flex-col gap-4">
            <Module title="Match pulse" meta="Latest call">
              <Pulse events={pulse} />
            </Module>
          </aside>
        </div>
      </section>

      {/* schedule */}
      <section id="schedule" className="mx-auto max-w-[1440px] px-5 pt-20 md:px-8">
        <SectionHead kicker="Schedule" title="This week" meta="All times CET · LAN Copenhagen" />
        <div className="stagger grid gap-4 md:grid-cols-3">
          {schedule.map((d, i) => (
            <article
              key={d.day}
              style={seq(i)}
              className="panel flex scroll-mt-24 flex-col"
            >
              <header className="panel-head">
                <span className="display text-xl text-ink">{d.day}</span>
                <span className="u-label text-ink-mute">{d.date}</span>
                {d.today && (
                  <span className="u-label ml-auto flex items-center gap-1.5 text-live">
                    <span className="dot-live h-1.5 w-1.5 bg-live" aria-hidden="true" />
                    Today
                  </span>
                )}
              </header>
              <div className="flex flex-col">
                {d.slots.map((s) => (
                  <div
                    key={s.id}
                    className={`row-hit flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 ${
                      s.live ? "bg-acid/[0.04]" : ""
                    }`}
                  >
                    <span className="mono text-sm font-bold text-acid">
                      {s.time}
                    </span>
                    <span className="display text-sm text-ink">{s.a}</span>
                    <span className="u-label text-ink-mute">vs</span>
                    <span className="display text-sm text-ink">{s.b}</span>
                    <span className="u-label ml-auto shrink-0 text-ink-mute">
                      {s.stream ? `STREAM ${s.stream}` : s.stage}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* bracket */}
      <section id="bracket" className="mx-auto max-w-[1440px] px-5 pt-20 md:px-8">
        <SectionHead kicker="Bracket" title="Road to the final" meta="Double elimination" />
        <div className="stagger grid gap-4 md:grid-cols-3">
          {bracket.map((round, i) => (
            <div key={round.round} style={seq(i)} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="display text-lg text-ink">{round.round}</span>
                {round.note && (
                  <span className="u-label text-ink-mute">{round.note}</span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {round.slots.map((slot) => (
                  <BracketBox key={slot.id} slot={slot} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* standings */}
      <section id="standings" className="mx-auto max-w-[1440px] px-5 pt-20 md:px-8">
        <SectionHead kicker="Standings" title="Pools after week 4" meta="Top 2 advance" />
        <div className="stagger grid gap-4 md:grid-cols-2">
          <div style={seq(0)}>
            <Module title="Pool A" meta="4 played">
              <Standings rows={standingsA} />
            </Module>
          </div>
          <div style={seq(1)}>
            <Module title="Pool B" meta="4 played">
              <Standings rows={standings} />
            </Module>
          </div>
        </div>
      </section>

      {/* field */}
      <section className="mx-auto max-w-[1440px] px-5 pt-20 md:px-8">
        <SectionHead kicker="The field" title="All twelve crews" meta="Seeded by qualifiers" />
        <div className="stagger grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {teamGrid.map((t, i) => (
            <div
              key={t.tag}
              style={seq(i)}
              className="group relative overflow-hidden border border-line bg-panel px-4 py-4 transition-colors hover:bg-panel-2"
            >
              <span className="u-label text-ink-mute">#{i + 1}</span>
              <div className="display mt-1 text-2xl text-ink">{t.tag}</div>
              <span className="u-label mt-2 block text-ink-dim">{t.name}</span>
              <span
                className="absolute bottom-0 left-0 h-[2px] w-0 bg-acid transition-all duration-300 group-hover:w-full"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="relative mt-20 overflow-hidden border-y border-line py-14 md:py-20">
        <div className="stripes absolute inset-x-0 top-0 h-[3px]" aria-hidden="true" />
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 px-5 md:flex-row md:items-center md:px-8">
          <h2 className="display text-[clamp(1.9rem,5vw,3.6rem)] text-ink">
            First round drops <span className="text-acid">Wed 19:00</span>
          </h2>
          <CTA href="/live">
            Enter control room
            <span aria-hidden="true">→</span>
          </CTA>
        </div>
      </section>

      <Footer />
    </>
  );
}