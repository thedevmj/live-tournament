import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultTournament, type TournamentState } from "./tournament";

const STATE_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(STATE_DIR, "tournament-state.json");

const MAX_STR = 600;
const MAX_ITEMS = 300;
const MAX_MATCHES = 50;
const MAX_STANDINGS = 50;
const MAX_DAYS = 30;
const MAX_SLOTS = 100;
const MAX_ROUNDS = 30;
const MAX_TEAMS = 100;

const STATUSES = new Set(["live", "up", "final"]);
const PULSE_KINDS = new Set(["round", "ace", "timeout", "map", "info"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): boolean {
  return typeof v === "string" && v.length <= MAX_STR;
}

function isStrOpt(v: unknown): boolean {
  return v === undefined || isStr(v);
}

function isNum(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v);
}

function isNumOrNull(v: unknown): boolean {
  return v === null || isNum(v);
}

function isBoolOpt(v: unknown): boolean {
  return v === undefined || typeof v === "boolean";
}

function isList(
  v: unknown,
  item: (x: unknown) => boolean,
  max: number,
): boolean {
  return Array.isArray(v) && v.length <= max && v.every(item);
}

function isStrList(v: unknown): boolean {
  return isList(v, isStr, MAX_ITEMS);
}

function isSide(v: unknown): boolean {
  return (
    isRecord(v) &&
    isStr(v.tag) &&
    isStr(v.name) &&
    isNum(v.seed) &&
    isNum(v.score) &&
    isNum(v.rounds)
  );
}

function isMatch(v: unknown): boolean {
  return (
    isRecord(v) &&
    isStr(v.id) &&
    isStr(v.stage) &&
    isStr(v.bo) &&
    isStr(v.map) &&
    typeof v.status === "string" &&
    STATUSES.has(v.status) &&
    Array.isArray(v.series) &&
    v.series.length === 2 &&
    v.series.every(isNum) &&
    isStrOpt(v.clock) &&
    isStrOpt(v.time) &&
    isStrOpt(v.stream) &&
    isSide(v.a) &&
    isSide(v.b)
  );
}

function isStanding(v: unknown): boolean {
  return (
    isRecord(v) &&
    isNum(v.rank) &&
    isStr(v.tag) &&
    isStr(v.name) &&
    isStr(v.group) &&
    isNum(v.wins) &&
    isNum(v.losses) &&
    isNum(v.rd) &&
    isNum(v.pts)
  );
}

function isPulseEvent(v: unknown): boolean {
  return (
    isRecord(v) &&
    isStr(v.id) &&
    isStr(v.time) &&
    isStr(v.text) &&
    typeof v.kind === "string" &&
    PULSE_KINDS.has(v.kind) &&
    isStrOpt(v.tag)
  );
}

function isScheduleSlot(v: unknown): boolean {
  return (
    isRecord(v) &&
    isStr(v.id) &&
    isStr(v.time) &&
    isStr(v.a) &&
    isStr(v.b) &&
    isStr(v.stage) &&
    isStrOpt(v.stream) &&
    isBoolOpt(v.live)
  );
}

function isScheduleDay(v: unknown): boolean {
  return (
    isRecord(v) &&
    isStr(v.day) &&
    isStr(v.date) &&
    isBoolOpt(v.today) &&
    isList(v.slots, isScheduleSlot, MAX_SLOTS)
  );
}

function isBracketSlot(v: unknown): boolean {
  return (
    isRecord(v) &&
    isStr(v.id) &&
    isStr(v.a) &&
    isStr(v.b) &&
    isNumOrNull(v.ar) &&
    isNumOrNull(v.br) &&
    isBoolOpt(v.live)
  );
}

function isBracketRound(v: unknown): boolean {
  return (
    isRecord(v) &&
    isStr(v.round) &&
    isStrOpt(v.note) &&
    isList(v.slots, isBracketSlot, MAX_SLOTS)
  );
}

function isTeam(v: unknown): boolean {
  return (
    isRecord(v) && isStr(v.tag) && isStr(v.name) && isNum(v.seed)
  );
}

export function isValidState(value: unknown): value is TournamentState {
  if (!isRecord(value)) return false;
  return (
    isMatch(value.featuredMatch) &&
    isList(value.liveMatches, isMatch, MAX_MATCHES) &&
    isList(value.upcomingMatches, isMatch, MAX_MATCHES) &&
    isList(value.finals, isMatch, MAX_MATCHES) &&
    isList(value.standings, isStanding, MAX_STANDINGS) &&
    isList(value.standingsA, isStanding, MAX_STANDINGS) &&
    isList(value.pulse, isPulseEvent, MAX_ITEMS) &&
    isStrList(value.tickerItems) &&
    isList(value.schedule, isScheduleDay, MAX_DAYS) &&
    isList(value.bracket, isBracketRound, MAX_ROUNDS) &&
    isList(value.teamGrid, isTeam, MAX_TEAMS)
  );
}

export async function getTournamentState(): Promise<TournamentState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isValidState(parsed)) return { ...defaultTournament, ...parsed };
  } catch {
    // missing or unreadable file falls through to defaults
  }
  return defaultTournament;
}

export async function saveTournamentState(
  state: TournamentState,
): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export async function resetTournamentState(): Promise<TournamentState> {
  try {
    await fs.unlink(STATE_FILE);
  } catch {
    // already gone
  }
  return defaultTournament;
}
