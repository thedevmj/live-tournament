import type { ReactNode } from "react";
import type { Match, PulseEvent, Side, Standing } from "@/lib/tournament";
import { LiveClock } from "@/components/live-clock";

export function Module({
  title,
  meta,
  children,
  id,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="panel flex scroll-mt-24 flex-col">
      <header className="panel-head">
        <h2 className="u-label text-ink">{title}</h2>
        {meta && <span className="u-label text-ink-mute">{meta}</span>}
      </header>
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="numeral text-[clamp(1.6rem,3vw,2.2rem)] text-ink">
        {value}
      </span>
      <span className="u-label text-ink-mute">{label}</span>
    </div>
  );
}

function SideBlock({ side, align }: { side: Side; align: "left" | "right" }) {
  const right = align === "right";
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
    </div>
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
          className={`h-2.5 flex-1 ${c === "a" ? "bg-acid" : "bg-ink/25"}`}
        />
      ))}
    </div>
  );
}

export function Scorebug({ match }: { match: Match }) {
  const { a, b } = match;
  const total = a.rounds + b.rounds;
  const aShare = total ? (a.rounds / total) * 100 : 50;

  return (
    <section className="panel scanlines relative overflow-hidden">
      <div className="stripes h-[3px]" aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel-2/60 px-4 py-2.5 md:px-6">
        <span className="flex items-center gap-2">
          <span className="dot-live h-2 w-2 bg-live" aria-hidden="true" />
          <span className="u-label text-live">Live</span>
        </span>
        <span className="u-label text-ink">{match.stage}</span>
        <span className="u-label text-ink-mute">{match.bo}</span>
        <span className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
          <span
            className={`h-2 w-2 ${match.series[0] > 0 ? "bg-acid" : "bg-ink/15"}`}
          />
          <span
            className={`h-2 w-2 ${match.series[1] > 0 ? "bg-acid" : "bg-ink/15"}`}
          />
          <span className="u-label ml-1 text-ink-mute">series</span>
        </span>
        <span className="u-label ml-auto text-ink-mute">
          {match.map} · {match.stream}
        </span>
      </div>

      <div className="grid gap-8 px-5 py-8 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-10 md:px-8 md:py-10">
        <SideBlock side={a} align="right" />
        <div className="flex flex-col items-center justify-center gap-3 border-y border-line py-6 md:border-y-0 md:px-12">
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
          <span className="u-label text-acid">Round {total + 1}</span>
        </div>
        <SideBlock side={b} align="left" />
      </div>

      <div className="border-t border-line px-5 py-4 md:px-8">
        <div className="flex items-center justify-between">
          <span className="u-label text-ink-dim">Round history</span>
          <span className="u-label text-ink-mute">First to 13</span>
        </div>
        <div className="mt-3">
          <RoundHistory a={a.rounds} b={b.rounds} />
        </div>
        <div className="mt-3 flex h-[6px] overflow-hidden ring-1 ring-line">
          <span className="h-full bg-acid" style={{ width: `${aShare}%` }} />
          <span className="h-full bg-ink/20" style={{ width: `${100 - aShare}%` }} />
        </div>
      </div>
    </section>
  );
}

export function MatchRow({ match }: { match: Match }) {
  const score =
    match.status === "live"
      ? `${match.a.rounds}–${match.b.rounds}`
      : match.status === "final"
        ? `${match.a.score}–${match.b.score}`
        : "vs";

  return (
    <div className="row-hit flex flex-col gap-2 border-b border-line px-4 py-3.5 last:border-b-0 md:flex-row md:items-center md:gap-5 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {match.status === "live" ? (
          <span className="flex items-center gap-1.5">
            <span className="dot-live h-1.5 w-1.5 bg-live" aria-hidden="true" />
            <span className="u-label text-live">Live</span>
          </span>
        ) : match.status === "up" ? (
          <span className="u-label text-acid">{match.time}</span>
        ) : (
          <span className="u-label text-ink-mute">Final</span>
        )}
        <span className="hidden u-label truncate text-ink-mute md:inline">
          {match.stage}
        </span>
      </div>

      <div className="flex flex-1 items-baseline gap-2.5">
        <span className="truncate text-sm font-bold tracking-tight text-ink">
          {match.a.tag}
        </span>
        <span
          className={`mono text-sm font-bold ${
            match.status === "up" ? "text-ink-mute" : "text-acid"
          }`}
        >
          {score}
        </span>
        <span className="truncate text-sm font-bold tracking-tight text-ink">
          {match.b.tag}
        </span>
        <span className="hidden truncate u-label text-ink-mute md:inline">
          · {match.bo} · {match.map}
        </span>
      </div>

      <span className="u-label shrink-0 text-ink-mute">
        {match.status === "live"
          ? `${match.clock} · round ${match.a.rounds + match.b.rounds + 1}`
          : match.status === "up"
            ? match.time
            : match.map}
      </span>
    </div>
  );
}

export function Standings({ rows }: { rows: Standing[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Pool B standings</caption>
        <thead>
          <tr className="u-label text-ink-mute">
            <th scope="col" className="px-4 py-2.5 font-normal md:px-5">
              #
            </th>
            <th scope="col" className="px-2 py-2.5 font-normal">
              Team
            </th>
            <th scope="col" className="px-2 py-2.5 text-right font-normal">
              W–L
            </th>
            <th
              scope="col"
              className="hidden px-2 py-2.5 text-right font-normal sm:table-cell"
            >
              RD
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal md:px-5">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.tag}
              className={`row-hit border-t border-line first:border-t-0 ${
                r.rank === 1 ? "bg-acid/[0.05]" : ""
              }`}
            >
              <td className="u-label px-4 py-3 text-ink-mute md:px-5">
                {r.rank.toString().padStart(2, "0")}
              </td>
              <td className="px-2 py-3">
                <span className="flex flex-col justify-center leading-tight">
                  <span
                    className={`text-sm font-bold ${
                      r.rank <= 2 ? "text-acid" : "text-ink"
                    }`}
                  >
                    {r.tag}
                  </span>
                  <span className="u-label mt-1 hidden text-ink-mute lg:block">
                    {r.name}
                  </span>
                </span>
              </td>
              <td className="px-2 py-3 text-right">
                <span className="mono text-sm text-ink-dim">
                  {r.wins}–{r.losses}
                </span>
              </td>
              <td className="hidden px-2 py-3 text-right sm:table-cell">
                <span
                  className={`mono text-sm ${
                    r.rd >= 0 ? "text-ink-dim" : "text-live"
                  }`}
                >
                  {r.rd >= 0 ? "+" : ""}
                  {r.rd}
                </span>
              </td>
              <td className="px-4 py-3 text-right md:px-5">
                <span className="mono text-sm font-bold text-ink">{r.pts}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pulse({ events }: { events: PulseEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e) => (
        <li
          key={e.id}
          className="flex gap-3 border-t border-line px-4 py-3 first:border-t-0 md:px-5"
        >
          <span className="mono mt-0.5 shrink-0 text-xs text-acid">{e.time}</span>
          <span className="flex min-w-0 flex-col gap-1">
            {e.tag && <span className="u-label text-ink">{e.tag}</span>}
            <span className="text-sm leading-snug text-ink-dim">{e.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}