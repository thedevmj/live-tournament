export type Status = "live" | "up" | "final";

export type Side = {
  tag: string;
  name: string;
  seed: number;
  score: number;
  rounds: number;
};

export type Match = {
  id: string;
  stage: string;
  bo: string;
  map: string;
  status: Status;
  clock?: string;
  time?: string;
  stream?: string;
  series: [number, number];
  a: Side;
  b: Side;
};

export type Standing = {
  rank: number;
  tag: string;
  name: string;
  group: string;
  wins: number;
  losses: number;
  rd: number;
  pts: number;
};

export type PulseEvent = {
  id: string;
  time: string;
  tag?: string;
  text: string;
  kind: "round" | "ace" | "timeout" | "map" | "info";
};

export const featuredMatch: Match = {
  id: "sf1",
  stage: "SEMIFINAL 1",
  bo: "BO3",
  map: "MAP 2 · FOUNDRY",
  status: "live",
  clock: "07:42",
  stream: "STREAM A",
  series: [1, 0],
  a: {
    tag: "NOVA",
    name: "Nova Esports",
    seed: 1,
    score: 1,
    rounds: 9,
  },
  b: {
    tag: "KRAIT",
    name: "Krait Gaming",
    seed: 4,
    score: 0,
    rounds: 7,
  },
};

export const liveMatches: Match[] = [
  {
    id: "sf2",
    stage: "SEMIFINAL 2",
    bo: "BO3",
    map: "MAP 1 · SANDLINE",
    status: "live",
    clock: "11:03",
    stream: "STREAM B",
    series: [0, 0],
    a: {
      tag: "SABLE",
      name: "Sable Five",
      seed: 3,
      score: 0,
      rounds: 6,
    },
    b: {
      tag: "EMBER",
      name: "Ember Collective",
      seed: 5,
      score: 0,
      rounds: 11,
    },
  },
  {
    id: "qf3",
    stage: "QUARTERFINAL 3",
    bo: "BO3",
    map: "MAP 1 · ASHTRAY",
    status: "live",
    clock: "04:17",
    stream: "STREAM C",
    series: [0, 0],
    a: {
      tag: "RIFT",
      name: "Rift Union",
      seed: 9,
      score: 0,
      rounds: 3,
    },
    b: {
      tag: "ORBIT",
      name: "Orbit FC",
      seed: 6,
      score: 0,
      rounds: 10,
    },
  },
];

export const upcomingMatches: Match[] = [
  {
    id: "sf3",
    stage: "SEMIFINAL 3",
    bo: "BO3",
    map: "MAP 1 · TBD",
    status: "up",
    time: "21:30",
    stream: "STREAM A",
    series: [0, 0],
    a: {
      tag: "TITAN",
      name: "Titan Union",
      seed: 2,
      score: 0,
      rounds: 0,
    },
    b: {
      tag: "AXIOM",
      name: "Axiom Prime",
      seed: 7,
      score: 0,
      rounds: 0,
    },
  },
  {
    id: "qf4",
    stage: "QUARTERFINAL 4",
    bo: "BO3",
    map: "MAP 1 · TBD",
    status: "up",
    time: "22:15",
    stream: "STREAM B",
    series: [0, 0],
    a: {
      tag: "MONO",
      name: "Monolithic",
      seed: 8,
      score: 0,
      rounds: 0,
    },
    b: {
      tag: "VERTEX",
      name: "Vertex Six",
      seed: 10,
      score: 0,
      rounds: 0,
    },
  },
];

export const finals: Match[] = [
  {
    id: "f1",
    stage: "LOWER FINAL",
    bo: "BO3",
    map: "MAP 3 · OVERPASS",
    status: "final",
    series: [2, 1],
    a: {
      tag: "HALCYON",
      name: "Halcyon Reign",
      seed: 11,
      score: 2,
      rounds: 13,
    },
    b: {
      tag: "DUST",
      name: "Dust District",
      seed: 12,
      score: 1,
      rounds: 8,
    },
  },
];

export const standings: Standing[] = [
  { rank: 1, tag: "NOVA", name: "Nova Esports", group: "B", wins: 4, losses: 0, rd: 22, pts: 12 },
  { rank: 2, tag: "KRAIT", name: "Krait Gaming", group: "B", wins: 3, losses: 1, rd: 11, pts: 9 },
  { rank: 3, tag: "SABLE", name: "Sable Five", group: "B", wins: 2, losses: 2, rd: 2, pts: 6 },
  { rank: 4, tag: "EMBER", name: "Ember Collective", group: "B", wins: 2, losses: 2, rd: -1, pts: 6 },
  { rank: 5, tag: "RIFT", name: "Rift Union", group: "B", wins: 1, losses: 3, rd: -9, pts: 3 },
  { rank: 6, tag: "DUST", name: "Dust District", group: "B", wins: 0, losses: 4, rd: -25, pts: 0 },
];

export const pulse: PulseEvent[] = [
  { id: "p-01", time: "21:12", tag: "NOVA", kind: "map", text: "Closes out map one 13–9 on Foundry" },
  { id: "p-02", time: "21:19", tag: "KRAIT", kind: "timeout", text: "Tactical timeout called · side switch incoming" },
  { id: "p-03", time: "21:26", tag: "NOVA", kind: "ace", text: "Ryze plants, then denies the retake — ACE" },
  { id: "p-04", time: "21:31", tag: "SABLE", kind: "round", text: "Sable break EMBER hold on A to stay alive" },
  { id: "p-05", time: "21:33", tag: "EMBER", kind: "round", text: "Instant answer — EMBER retake B, 10–6" },
  { id: "p-06", time: "21:37", tag: "ORBIT", kind: "ace", text: "Vassal posts a 5k clutch down 1v4" },
];

export const tickerItems: string[] = [
  "NOVA 1–0 KRAIT · MAP 2 9–7",
  "EMBER 11–6 SABLE · MAP 1",
  "ORBIT 10–3 RIFT · MAP 1",
  "HALCYON 2–1 DUST · FINAL",
  "TITAN v AXIOM 21:30 · STREAM A",
  "MONO v VERTEX 22:15 · STREAM B",
  "POOL B LEADER · NOVA 12 PTS",
  "NEXT STAGE DRAWS 14 OCT",
];

export const standingsA: Standing[] = [
  { rank: 1, tag: "ORBIT", name: "Orbit FC", group: "A", wins: 4, losses: 0, rd: 19, pts: 12 },
  { rank: 2, tag: "TITAN", name: "Titan Union", group: "A", wins: 3, losses: 1, rd: 9, pts: 9 },
  { rank: 3, tag: "AXIOM", name: "Axiom Prime", group: "A", wins: 2, losses: 2, rd: 3, pts: 6 },
  { rank: 4, tag: "MONO", name: "Monolithic", group: "A", wins: 2, losses: 2, rd: -2, pts: 6 },
  { rank: 5, tag: "VERTEX", name: "Vertex Six", group: "A", wins: 1, losses: 3, rd: -7, pts: 3 },
  { rank: 6, tag: "HALCYON", name: "Halcyon Reign", group: "A", wins: 0, losses: 4, rd: -22, pts: 0 },
];

export type Slot = {
  id: string;
  time: string;
  a: string;
  b: string;
  stage: string;
  stream?: string;
  live?: boolean;
};

export type ScheduleDay = {
  day: string;
  date: string;
  today?: boolean;
  slots: Slot[];
};

export const schedule: ScheduleDay[] = [
  {
    day: "Wed",
    date: "05 Oct",
    slots: [
      { id: "w-1", time: "19:00", a: "NOVA", b: "MONO", stage: "Pool B", stream: "A" },
      { id: "w-2", time: "20:30", a: "SABLE", b: "RIFT", stage: "Pool B", stream: "B" },
      { id: "w-3", time: "22:00", a: "KRAIT", b: "DUST", stage: "Pool B", stream: "A" },
      { id: "w-4", time: "23:30", a: "EMBER", b: "RIFT", stage: "Pool B", stream: "C" },
    ],
  },
  {
    day: "Thu",
    date: "06 Oct",
    today: true,
    slots: [
      { id: "t-1", time: "18:30", a: "ORBIT", b: "RIFT", stage: "Semifinal 2", stream: "A", live: true },
      { id: "t-2", time: "20:00", a: "TITAN", b: "VERTEX", stage: "Semifinal 1", stream: "B" },
      { id: "t-3", time: "21:30", a: "SABLE", b: "EMBER", stage: "Quarterfinal", stream: "A", live: true },
      { id: "t-4", time: "23:00", a: "NOVA", b: "KRAIT", stage: "Upper final", stream: "A", live: true },
    ],
  },
  {
    day: "Fri",
    date: "07 Oct",
    slots: [
      { id: "f-1", time: "19:00", a: "MONO", b: "AXIOM", stage: "Lower bracket", stream: "B" },
      { id: "f-2", time: "20:30", a: "DUST", b: "HALCYON", stage: "Lower bracket", stream: "C" },
      { id: "f-3", time: "22:00", a: "ORBIT", b: "SABLE", stage: "Lower final", stream: "A" },
    ],
  },
];

export type BracketSlot = {
  id: string;
  a: string;
  b: string;
  ar: number | null;
  br: number | null;
  live?: boolean;
};

export type BracketRound = {
  round: string;
  note?: string;
  slots: BracketSlot[];
};

export const bracket: BracketRound[] = [
  {
    round: "Quarterfinals",
    slots: [
      { id: "q-1", a: "NOVA", b: "DUST", ar: 2, br: 0 },
      { id: "q-2", a: "KRAIT", b: "MONO", ar: 2, br: 1 },
      { id: "q-3", a: "SABLE", b: "RIFT", ar: 2, br: 0 },
      { id: "q-4", a: "EMBER", b: "ORBIT", ar: 1, br: 2 },
    ],
  },
  {
    round: "Semifinals",
    note: "Nov 6",
    slots: [
      { id: "s-1", a: "NOVA", b: "KRAIT", ar: null, br: null, live: true },
      { id: "s-2", a: "SABLE", b: "EMBER", ar: null, br: null, live: true },
    ],
  },
  {
    round: "Grand final",
    note: "Nov 8",
    slots: [{ id: "g-1", a: "TBD", b: "TBD", ar: null, br: null }],
  },
];

export const teamGrid: { tag: string; name: string; seed: number }[] = [
  { tag: "NOVA", name: "Nova Esports", seed: 1 },
  { tag: "TITAN", name: "Titan Union", seed: 2 },
  { tag: "SABLE", name: "Sable Five", seed: 3 },
  { tag: "KRAIT", name: "Krait Gaming", seed: 4 },
  { tag: "EMBER", name: "Ember Collective", seed: 5 },
  { tag: "ORBIT", name: "Orbit FC", seed: 6 },
  { tag: "AXIOM", name: "Axiom Prime", seed: 7 },
  { tag: "MONO", name: "Monolithic", seed: 8 },
  { tag: "RIFT", name: "Rift Union", seed: 9 },
  { tag: "VERTEX", name: "Vertex Six", seed: 10 },
  { tag: "HALCYON", name: "Halcyon Reign", seed: 11 },
  { tag: "DUST", name: "Dust District", seed: 12 },
];