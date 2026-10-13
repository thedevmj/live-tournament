"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, FormEvent } from "react";
import { Module } from "@/components/dashboard";
import type {
  BracketRound,
  Match,
  PulseEvent,
  ScheduleDay,
  Side,
  Slot,
  Standing,
  Status,
  TournamentState,
} from "@/lib/tournament";

type TabKey =
  | "matches"
  | "standings"
  | "schedule"
  | "bracket"
  | "ticker"
  | "pulse"
  | "teams";

const TABS: { key: TabKey; label: string }[] = [
  { key: "matches", label: "Matches" },
  { key: "standings", label: "Standings" },
  { key: "schedule", label: "Schedule" },
  { key: "bracket", label: "Bracket" },
  { key: "ticker", label: "Ticker" },
  { key: "pulse", label: "Pulse" },
  { key: "teams", label: "Teams" },
];

const inputBase =
  "w-full border border-line bg-void px-2.5 py-2 text-sm text-ink placeholder:text-ink-mute";

const btnBase =
  "inline-flex items-center justify-center gap-3 px-6 py-3.5 text-sm font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const btnStyles = {
  primary: "bg-acid text-void hover:bg-acid-deep",
  outline: "text-ink ring-1 ring-line hover:bg-panel hover:ring-ink-mute",
  ghost: "text-ink-dim hover:text-ink hover:bg-panel-2",
  danger: "text-live ring-1 ring-live/40 hover:bg-live/10",
} as const;

type BtnVariant = keyof typeof btnStyles;

function Btn({
  variant = "primary",
  small = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`${small ? "u-label px-3 py-2" : btnBase} ${btnStyles[variant]} ${className}`}
    />
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="u-label text-ink-mute">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  nullable = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  nullable?: boolean;
}) {
  return (
    <Field
      label={label}
      type="number"
      value={value === null ? "" : String(value)}
      onChange={(v) => {
        if (v === "" && nullable) {
          onChange(null);
          return;
        }
        const n = Number(v);
        onChange(Number.isFinite(n) ? Math.trunc(n) : 0);
      }}
    />
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="u-label text-ink-mute">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="u-label invisible select-none">{label}</span>
      <label className="flex h-[38px] items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-acid"
        />
        <span className="u-label text-ink-mute">{label}</span>
      </label>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-live/40 bg-live/5 px-4 py-3">
      <span className="text-sm text-live">{message}</span>
    </div>
  );
}

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

type Patch = (fn: (state: TournamentState) => TournamentState) => void;

export function AdminPanel() {
  const [phase, setPhase] = useState<"checking" | "login" | "panel">(
    "checking",
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [published, setPublished] = useState<TournamentState | null>(null);
  const [draft, setDraft] = useState<TournamentState | null>(null);
  const [tab, setTab] = useState<TabKey>("matches");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const flash = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) {
        window.clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  const loadState = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/state", { cache: "no-store" });
      if (res.status === 401) {
        setPhase("login");
        return;
      }
      if (!res.ok) {
        setError("Couldn't load tournament state.");
        setPhase("panel");
        return;
      }
      const data = (await res.json()) as TournamentState;
      setDraft(data);
      setPublished(data);
      setPhase("panel");
    } catch {
      setError("Couldn't reach the server.");
      setPhase("login");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await res.json()) as { authed: boolean };
        if (cancelled) return;
        if (data.authed) await loadState();
        else setPhase("login");
      } catch {
        if (!cancelled) setPhase("login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadState]);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoggingIn(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setAuthError(data?.error ?? "Sign-in failed.");
        return;
      }
      setPassword("");
      await loadState();
    } catch {
      setAuthError("Couldn't reach the server.");
    } finally {
      setLoggingIn(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.status === 401) {
        setPhase("login");
        return;
      }
      if (!res.ok) {
        setError("Publish failed — the server rejected the state.");
        return;
      }
      setPublished(draft);
      flash("Published · live site updated");
    } catch {
      setError("Publish failed — server unreachable.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(published);
    setError(null);
    flash("Edits discarded");
  };

  const resetAll = async () => {
    if (
      !window.confirm(
        "Reset all content to the built-in defaults? Your edits will be lost.",
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/admin/state", { method: "DELETE" });
      if (res.status === 401) {
        setPhase("login");
        return;
      }
      if (!res.ok) {
        setError("Reset failed.");
        return;
      }
      const data = (await res.json()) as TournamentState;
      setDraft(data);
      setPublished(data);
      setError(null);
      flash("Reset to defaults");
    } catch {
      setError("Reset failed — server unreachable.");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    setDraft(null);
    setPublished(null);
    setPassword("");
    setAuthError(null);
    setPhase("login");
  };

  const patch: Patch = (fn) =>
    setDraft((current) => (current ? fn(current) : current));

  const dirty =
    draft !== null &&
    published !== null &&
    JSON.stringify(draft) !== JSON.stringify(published);

  if (phase === "checking" || (phase === "panel" && (!draft || !published))) {
    return (
      <div className="flex flex-col gap-4">
        <div className="panel animate-pulse">
          <div className="panel-head">
            <span className="u-label text-ink-mute">Loading state…</span>
          </div>
          <div className="flex flex-col gap-3 px-5 py-6">
            <div className="h-8 w-1/3 bg-panel-2" />
            <div className="h-24 bg-panel-2" />
            <div className="h-24 bg-panel-2" />
          </div>
        </div>
      </div>
    );
  }

  if (phase === "login") {
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex flex-col gap-3">
          <p className="u-label text-acid">Restricted · staff only</p>
          <h1 className="display text-[clamp(2rem,5vw,3.2rem)] text-ink">
            Admin access
          </h1>
        </div>
        <section className="panel">
          <header className="panel-head">
            <h2 className="u-label text-ink">Sign in</h2>
            <span className="u-label text-ink-mute">Session · 12h</span>
          </header>
          <form onSubmit={submitLogin} className="flex flex-col gap-4 px-5 py-6">
            <Field
              label="Password"
              type="password"
              value={password}
              placeholder="••••••••"
              onChange={setPassword}
            />
            {authError && <ErrorBlock message={authError} />}
            <button
              type="submit"
              disabled={loggingIn}
              aria-busy={loggingIn}
              className={`${btnBase} ${btnStyles.primary}`}
            >
              {loggingIn ? "Checking…" : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  // phase === "panel" with both snapshots present (guaranteed by guards above,
  // but TypeScript needs the binding below to be non-null).
  const state = draft as TournamentState;
  const dirtyFlag = dirty;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div className="flex flex-col gap-3">
          <p className="u-label text-acid">Control room · admin</p>
          <h1 className="display text-[clamp(2rem,5vw,3.4rem)] text-ink">
            Tournament control
          </h1>
          <span
            className={`u-label w-fit ${dirtyFlag ? "text-live" : "text-acid"}`}
          >
            {dirtyFlag ? "Unpublished changes" : "Live · in sync"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Btn onClick={publish} disabled={!dirtyFlag || saving}>
            {saving ? "Publishing…" : "Publish changes"}
          </Btn>
          <Btn variant="outline" onClick={discard} disabled={!dirtyFlag}>
            Discard
          </Btn>
          <Btn variant="danger" onClick={resetAll}>
            Reset defaults
          </Btn>
          <Btn variant="ghost" small onClick={logout}>
            Log out
          </Btn>
        </div>
      </div>

      {error && <ErrorBlock message={error} />}

      <nav
        aria-label="Admin sections"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`u-label shrink-0 border-b-2 px-4 py-3 transition-colors ${
              tab === item.key
                ? "border-acid text-ink"
                : "border-transparent text-ink-mute hover:text-ink-dim"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "matches" && <MatchesTab state={state} patch={patch} />}
      {tab === "standings" && <StandingsTab state={state} patch={patch} />}
      {tab === "schedule" && <ScheduleTab state={state} patch={patch} />}
      {tab === "bracket" && <BracketTab state={state} patch={patch} />}
      {tab === "ticker" && <TickerTab state={state} patch={patch} />}
      {tab === "pulse" && <PulseTab state={state} patch={patch} />}
      {tab === "teams" && <TeamsTab state={state} patch={patch} />}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-5 bottom-5 z-50 flex justify-center md:justify-end"
      >
        {notice && (
          <div className="pointer-events-auto border border-acid bg-panel px-4 py-3">
            <span className="u-label text-acid">{notice}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function setKey<K extends keyof TournamentState>(
  state: TournamentState,
  key: K,
  value: TournamentState[K],
): TournamentState {
  return { ...state, [key]: value } as TournamentState;
}

function newMatch(): Match {
  return {
    id: uid(),
    stage: "NEW STAGE",
    bo: "BO3",
    map: "MAP 1 · TBD",
    status: "up",
    time: "00:00",
    stream: "STREAM A",
    series: [0, 0],
    a: { tag: "TBD", name: "TBD", seed: 0, score: 0, rounds: 0 },
    b: { tag: "TBD", name: "TBD", seed: 0, score: 0, rounds: 0 },
  };
}

function MatchEditor({
  match,
  onChange,
  onRemove,
}: {
  match: Match;
  onChange: (m: Match) => void;
  onRemove?: () => void;
}) {
  const set = (patchValue: Partial<Match>) => onChange({ ...match, ...patchValue });
  const setSide = (key: "a" | "b", patchSide: Partial<Side>) =>
    onChange({ ...match, [key]: { ...match[key], ...patchSide } });

  return (
    <div className="flex flex-col gap-4 border-t border-line px-4 py-5 first:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <span className="u-label text-acid">{match.id}</span>
        {onRemove && (
          <Btn variant="danger" small onClick={onRemove}>
            Remove
          </Btn>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field
          label="Stage"
          value={match.stage}
          onChange={(v) => set({ stage: v })}
        />
        <Field
          label="Format"
          value={match.bo}
          onChange={(v) => set({ bo: v })}
        />
        <SelectField
          label="Status"
          value={match.status}
          options={["live", "up", "final"]}
          onChange={(v) => set({ status: v as Status })}
        />
        <Field
          label="Map"
          value={match.map}
          onChange={(v) => set({ map: v })}
        />
        <Field
          label={match.status === "live" ? "Clock" : "Start time"}
          value={(match.status === "live" ? match.clock : match.time) ?? ""}
          onChange={(v) =>
            match.status === "live" ? set({ clock: v }) : set({ time: v })
          }
        />
        <Field
          label="Stream"
          value={match.stream ?? ""}
          onChange={(v) => set({ stream: v })}
        />
        <NumField
          label="Series A"
          value={match.series[0]}
          onChange={(n) => set({ series: [n ?? 0, match.series[1]] })}
        />
        <NumField
          label="Series B"
          value={match.series[1]}
          onChange={(n) => set({ series: [match.series[0], n ?? 0] })}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(["a", "b"] as const).map((key) => (
          <fieldset
            key={key}
            className="flex flex-col gap-3 border border-line bg-void p-4"
          >
            <legend className="u-label px-1 text-ink-mute">
              Side {key.toUpperCase()}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Tag"
                value={match[key].tag}
                onChange={(v) => setSide(key, { tag: v })}
              />
              <Field
                label="Name"
                value={match[key].name}
                onChange={(v) => setSide(key, { name: v })}
              />
              <NumField
                label="Seed"
                value={match[key].seed}
                onChange={(n) => setSide(key, { seed: n ?? 0 })}
              />
              <NumField
                label="Score"
                value={match[key].score}
                onChange={(n) => setSide(key, { score: n ?? 0 })}
              />
              <NumField
                label="Rounds"
                value={match[key].rounds}
                onChange={(n) => setSide(key, { rounds: n ?? 0 })}
              />
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function MatchesTab({
  state,
  patch,
}: {
  state: TournamentState;
  patch: Patch;
}) {
  type ListKey = "liveMatches" | "upcomingMatches" | "finals";
  const groups: { key: ListKey; title: string }[] = [
    { key: "liveMatches", title: "Live matches" },
    { key: "upcomingMatches", title: "Upcoming" },
    { key: "finals", title: "Results" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Module title="Featured match" meta="Hero scorebug · home + live">
        <MatchEditor
          match={state.featuredMatch}
          onChange={(next) =>
            patch((d) => ({ ...d, featuredMatch: next }))
          }
        />
      </Module>
      {groups.map((group) => {
        const list = state[group.key];
        return (
          <Module
            key={group.key}
            title={group.title}
            meta={`${list.length} match${list.length === 1 ? "" : "es"}`}
          >
            <div className="flex flex-col">
              {list.map((m) => (
                <MatchEditor
                  key={m.id}
                  match={m}
                  onChange={(next) =>
                    patch((d) =>
                      setKey(
                        d,
                        group.key,
                        d[group.key].map((x) => (x.id === m.id ? next : x)),
                      ),
                    )
                  }
                  onRemove={() =>
                    patch((d) =>
                      setKey(
                        d,
                        group.key,
                        d[group.key].filter((x) => x.id !== m.id),
                      ),
                    )
                  }
                />
              ))}
              <div className="border-t border-line px-4 py-4">
                <Btn
                  variant="outline"
                  small
                  onClick={() =>
                    patch((d) => setKey(d, group.key, [...d[group.key], newMatch()]))
                  }
                >
                  + Add match
                </Btn>
              </div>
            </div>
          </Module>
        );
      })}
    </div>
  );
}

function StandingRow({
  row,
  index,
  rows,
  onRows,
}: {
  row: Standing;
  index: number;
  rows: Standing[];
  onRows: (next: Standing[]) => void;
}) {
  const setRow = (patchValue: Partial<Standing>) =>
    onRows(
      rows.map((r, i) => (i === index ? { ...r, ...patchValue } : r)),
    );
  const remove = () => onRows(rows.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-4 border-t border-line px-4 py-4 first:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <span className="u-label text-acid">
          {row.tag} · {row.group}
        </span>
        <Btn variant="danger" small onClick={remove}>
          Remove
        </Btn>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <NumField
          label="Rank"
          value={row.rank}
          onChange={(n) => setRow({ rank: n ?? 0 })}
        />
        <Field
          label="Tag"
          value={row.tag}
          onChange={(v) => setRow({ tag: v })}
        />
        <Field
          label="Name"
          value={row.name}
          onChange={(v) => setRow({ name: v })}
        />
        <Field
          label="Group"
          value={row.group}
          onChange={(v) => setRow({ group: v })}
        />
        <NumField
          label="Wins"
          value={row.wins}
          onChange={(n) => setRow({ wins: n ?? 0 })}
        />
        <NumField
          label="Losses"
          value={row.losses}
          onChange={(n) => setRow({ losses: n ?? 0 })}
        />
        <NumField
          label="Points"
          value={row.pts}
          onChange={(n) => setRow({ pts: n ?? 0 })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:max-w-md">
        <NumField
          label="Round diff"
          value={row.rd}
          onChange={(n) => setRow({ rd: n ?? 0 })}
        />
      </div>
    </div>
  );
}

function StandingsTab({
  state,
  patch,
}: {
  state: TournamentState;
  patch: Patch;
}) {
  const table = (label: string, key: "standings" | "standingsA") => {
    const rows = state[key];
    return (
      <Module title={label} meta={`${rows.length} teams`}>
        <div className="flex flex-col">
          {rows.map((row, i) => (
            <StandingRow
              key={`${row.tag}-${i}`}
              row={row}
              index={i}
              rows={rows}
              onRows={(next) => patch((d) => setKey(d, key, next))}
            />
          ))}
          <div className="border-t border-line px-4 py-4">
            <Btn
              variant="outline"
              small
              onClick={() =>
                patch((d) =>
                  setKey(d, key, [
                    ...rows,
                    {
                      rank: rows.length + 1,
                      tag: "NEW",
                      name: "New Team",
                      group: key === "standings" ? "B" : "A",
                      wins: 0,
                      losses: 0,
                      rd: 0,
                      pts: 0,
                    },
                  ]),
                )
              }
            >
              + Add team
            </Btn>
          </div>
        </div>
      </Module>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {table("Pool A", "standingsA")}
      {table("Pool B", "standings")}
    </div>
  );
}

function ScheduleTab({
  state,
  patch,
}: {
  state: TournamentState;
  patch: Patch;
}) {
  const setDays = (next: ScheduleDay[]) =>
    patch((d) => setKey(d, "schedule", next));

  return (
    <div className="flex flex-col gap-4">
      {state.schedule.map((day, di) => {
        const setDay = (next: ScheduleDay) =>
          setDays(
            state.schedule.map((d, i) => (i === di ? next : d)),
          );
        return (
          <Module
            key={`${day.day}-${di}`}
            title={`${day.day} · ${day.date}`}
            meta={`${day.slots.length} slot${day.slots.length === 1 ? "" : "s"}`}
          >
            <div className="flex flex-col">
              <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-5">
                <Field
                  label="Day"
                  value={day.day}
                  onChange={(v) => setDay({ ...day, day: v })}
                />
                <Field
                  label="Date"
                  value={day.date}
                  onChange={(v) => setDay({ ...day, date: v })}
                />
                <CheckField
                  label="Today"
                  checked={!!day.today}
                  onChange={(v) => setDay({ ...day, today: v })}
                />
                <div className="flex items-end justify-end md:col-span-2">
                  <Btn
                    variant="danger"
                    small
                    onClick={() =>
                      setDays(state.schedule.filter((_, i) => i !== di))
                    }
                  >
                    Remove day
                  </Btn>
                </div>
              </div>
              {day.slots.map((slot, si) => {
                const setSlot = (next: Slot) =>
                  setDay({
                    ...day,
                    slots: day.slots.map((s, j) => (j === si ? next : s)),
                  });
                return (
                  <div
                    key={slot.id}
                    className="grid grid-cols-2 gap-3 border-t border-line px-4 py-3 md:grid-cols-7"
                  >
                    <Field
                      label="Time"
                      value={slot.time}
                      onChange={(v) => setSlot({ ...slot, time: v })}
                    />
                    <Field
                      label="Side A"
                      value={slot.a}
                      onChange={(v) => setSlot({ ...slot, a: v })}
                    />
                    <Field
                      label="Side B"
                      value={slot.b}
                      onChange={(v) => setSlot({ ...slot, b: v })}
                    />
                    <Field
                      label="Stage"
                      value={slot.stage}
                      onChange={(v) => setSlot({ ...slot, stage: v })}
                    />
                    <Field
                      label="Stream"
                      value={slot.stream ?? ""}
                      onChange={(v) => setSlot({ ...slot, stream: v })}
                    />
                    <CheckField
                      label="Live"
                      checked={!!slot.live}
                      onChange={(v) => setSlot({ ...slot, live: v })}
                    />
                    <div className="flex items-end justify-end">
                      <Btn
                        variant="danger"
                        small
                        onClick={() =>
                          setDay({
                            ...day,
                            slots: day.slots.filter((_, j) => j !== si),
                          })
                        }
                      >
                        Remove
                      </Btn>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-line px-4 py-3">
                <Btn
                  variant="outline"
                  small
                  onClick={() =>
                    setDay({
                      ...day,
                      slots: [
                        ...day.slots,
                        {
                          id: uid(),
                          time: "00:00",
                          a: "TBD",
                          b: "TBD",
                          stage: "TBD",
                        },
                      ],
                    })
                  }
                >
                  + Add slot
                </Btn>
              </div>
            </div>
          </Module>
        );
      })}
      <div>
        <Btn
          variant="outline"
          onClick={() =>
            setDays([
              ...state.schedule,
              { day: "New", date: "01 Jan", slots: [] },
            ])
          }
        >
          + Add day
        </Btn>
      </div>
    </div>
  );
}

function BracketTab({
  state,
  patch,
}: {
  state: TournamentState;
  patch: Patch;
}) {
  const setRounds = (next: BracketRound[]) =>
    patch((d) => setKey(d, "bracket", next));

  return (
    <div className="flex flex-col gap-4">
      {state.bracket.map((round, ri) => {
        const setRound = (next: BracketRound) =>
          setRounds(
            state.bracket.map((r, i) => (i === ri ? next : r)),
          );
        return (
          <Module
            key={`${round.round}-${ri}`}
            title={round.round}
            meta={`${round.slots.length} slot${round.slots.length === 1 ? "" : "s"}`}
          >
            <div className="flex flex-col">
              <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-4">
                <Field
                  label="Round name"
                  value={round.round}
                  onChange={(v) => setRound({ ...round, round: v })}
                />
                <Field
                  label="Note"
                  value={round.note ?? ""}
                  onChange={(v) => setRound({ ...round, note: v })}
                />
                <div className="flex items-end justify-end md:col-span-2">
                  <Btn
                    variant="danger"
                    small
                    onClick={() =>
                      setRounds(state.bracket.filter((_, i) => i !== ri))
                    }
                  >
                    Remove round
                  </Btn>
                </div>
              </div>
              {round.slots.map((slot, si) => {
                const setSlot = (next: typeof slot) =>
                  setRound({
                    ...round,
                    slots: round.slots.map((s, j) =>
                      j === si ? next : s,
                    ),
                  });
                return (
                  <div
                    key={slot.id}
                    className="grid grid-cols-2 gap-3 border-t border-line px-4 py-3 md:grid-cols-7"
                  >
                    <Field
                      label="Side A"
                      value={slot.a}
                      onChange={(v) => setSlot({ ...slot, a: v })}
                    />
                    <NumField
                      label="Score A"
                      value={slot.ar}
                      nullable
                      onChange={(n) => setSlot({ ...slot, ar: n })}
                    />
                    <Field
                      label="Side B"
                      value={slot.b}
                      onChange={(v) => setSlot({ ...slot, b: v })}
                    />
                    <NumField
                      label="Score B"
                      value={slot.br}
                      nullable
                      onChange={(n) => setSlot({ ...slot, br: n })}
                    />
                    <CheckField
                      label="Live"
                      checked={!!slot.live}
                      onChange={(v) => setSlot({ ...slot, live: v })}
                    />
                    <div className="flex items-end justify-end md:col-span-2">
                      <Btn
                        variant="danger"
                        small
                        onClick={() =>
                          setRound({
                            ...round,
                            slots: round.slots.filter((_, j) => j !== si),
                          })
                        }
                      >
                        Remove
                      </Btn>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-line px-4 py-3">
                <Btn
                  variant="outline"
                  small
                  onClick={() =>
                    setRound({
                      ...round,
                      slots: [
                        ...round.slots,
                        { id: uid(), a: "TBD", b: "TBD", ar: null, br: null },
                      ],
                    })
                  }
                >
                  + Add slot
                </Btn>
              </div>
            </div>
          </Module>
        );
      })}
      <div>
        <Btn
          variant="outline"
          onClick={() =>
            setRounds([
              ...state.bracket,
              { round: "New round", slots: [] },
            ])
          }
        >
          + Add round
        </Btn>
      </div>
    </div>
  );
}

function TickerTab({
  state,
  patch,
}: {
  state: TournamentState;
  patch: Patch;
}) {
  const items = state.tickerItems;
  const setItems = (next: string[]) =>
    patch((d) => setKey(d, "tickerItems", next));

  return (
    <Module title="Ticker" meta={`${items.length} items · marquee feed`}>
      <div className="flex flex-col">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-end gap-3 border-t border-line px-4 py-3 first:border-t-0"
          >
            <div className="min-w-0 flex-1">
              <Field
                label={`Item ${i + 1}`}
                value={item}
                onChange={(v) =>
                  setItems(items.map((x, j) => (j === i ? v : x)))
                }
              />
            </div>
            <Btn
              variant="danger"
              small
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >
              Remove
            </Btn>
          </div>
        ))}
        <div className="border-t border-line px-4 py-3">
          <Btn variant="outline" small onClick={() => setItems([...items, "NEW ITEM"])}>
            + Add item
          </Btn>
        </div>
      </div>
    </Module>
  );
}

function PulseTab({
  state,
  patch,
}: {
  state: TournamentState;
  patch: Patch;
}) {
  const events = state.pulse;
  const setEvents = (next: PulseEvent[]) =>
    patch((d) => setKey(d, "pulse", next));

  return (
    <Module title="Match pulse" meta={`${events.length} events · live page`}>
      <div className="flex flex-col">
        {events.map((event, i) => {
          const setEvent = (patchValue: Partial<PulseEvent>) =>
            setEvents(
              events.map((e, j) =>
                j === i ? { ...e, ...patchValue } : e,
              ),
            );
          return (
            <div
              key={event.id}
              className="grid grid-cols-2 gap-3 border-t border-line px-4 py-3 first:border-t-0 md:grid-cols-6"
            >
              <Field
                label="Time"
                value={event.time}
                onChange={(v) => setEvent({ time: v })}
              />
              <Field
                label="Tag"
                value={event.tag ?? ""}
                onChange={(v) => setEvent({ tag: v })}
              />
              <SelectField
                label="Kind"
                value={event.kind}
                options={["round", "ace", "timeout", "map", "info"]}
                onChange={(v) =>
                  setEvent({ kind: v as PulseEvent["kind"] })
                }
              />
              <div className="col-span-2 min-w-0 md:col-span-2">
                <Field
                  label="Text"
                  value={event.text}
                  onChange={(v) => setEvent({ text: v })}
                />
              </div>
              <div className="flex items-end justify-end">
                <Btn
                  variant="danger"
                  small
                  onClick={() => setEvents(events.filter((_, j) => j !== i))}
                >
                  Remove
                </Btn>
              </div>
            </div>
          );
        })}
        <div className="border-t border-line px-4 py-3">
          <Btn
            variant="outline"
            small
            onClick={() =>
              setEvents([
                ...events,
                {
                  id: uid(),
                  time: "00:00",
                  tag: "",
                  kind: "info",
                  text: "New pulse event",
                },
              ])
            }
          >
            + Add event
          </Btn>
        </div>
      </div>
    </Module>
  );
}

function TeamsTab({
  state,
  patch,
}: {
  state: TournamentState;
  patch: Patch;
}) {
  const teams = state.teamGrid;
  const setTeams = (
    next: { tag: string; name: string; seed: number }[],
  ) => patch((d) => setKey(d, "teamGrid", next));

  return (
    <Module title="The field" meta={`${teams.length} crews · home grid`}>
      <div className="flex flex-col">
        {teams.map((team, i) => (
          <div
            key={i}
            className="grid grid-cols-2 gap-3 border-t border-line px-4 py-3 first:border-t-0 md:grid-cols-4"
          >
            <Field
              label="Tag"
              value={team.tag}
              onChange={(v) =>
                setTeams(
                  teams.map((t, j) => (j === i ? { ...t, tag: v } : t)),
                )
              }
            />
            <Field
              label="Name"
              value={team.name}
              onChange={(v) =>
                setTeams(
                  teams.map((t, j) => (j === i ? { ...t, name: v } : t)),
                )
              }
            />
            <NumField
              label="Seed"
              value={team.seed}
              onChange={(n) =>
                setTeams(
                  teams.map((t, j) =>
                    j === i ? { ...t, seed: n ?? 0 } : t,
                  ),
                )
              }
            />
            <div className="flex items-end justify-end">
              <Btn
                variant="danger"
                small
                onClick={() => setTeams(teams.filter((_, j) => j !== i))}
              >
                Remove
              </Btn>
            </div>
          </div>
        ))}
        <div className="border-t border-line px-4 py-3">
          <Btn
            variant="outline"
            small
            onClick={() =>
              setTeams([
                ...teams,
                { tag: "NEW", name: "New Crew", seed: teams.length + 1 },
              ])
            }
          >
            + Add team
          </Btn>
        </div>
      </div>
    </Module>
  );
}
