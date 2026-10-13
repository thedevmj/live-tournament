# DESIGN.md — Kingdom of Chess Tournament Platform

Design system generated from the existing codebase (`live-tournament/`), extended for the
take-home assignment's screens: auth, tournament management, matchmaking queue, live board + clock + PGN, leaderboard.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (`@theme` tokens) · Socket.IO client
(Assignment's `class-validator` + Postgres live on the Express/Nest-style server.)

---

## 1. Direction: "Broadcast Control Room"

The codebase already ships a strong, deliberate language — a dark esports-broadcast overlay:
near-black surfaces, hairline borders, one acid-green signal color, condensed variable-width
display type, mono meta labels, scanlines and a LIVE ticker. **This system adopts and formalizes
that language rather than inventing a new one.**

Why it fits the product:

- A live chess tournament *is* a broadcast: clocks, live badges, standings, round history.
- Kids' chess academy, India — the energy should be sharp and modern, not corporate SaaS.
- Zero-radius + hairline borders read as "instrument panel": dense data (leaderboards, PGN)
  stays legible without visual noise.

Anti-goals (see §10): no purple-blue gradients, no glassmorphism cards, no rounded "AI-slop" UI.

---

## 2. Color

### Core palette (extracted from `app/globals.css:3-18`)

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `void` | `#0a0b0d` | App background | — |
| `void-2` | `#0d0f13` | Recessed bands (ticker, footer) | — |
| `panel` | `#111419` | Cards / modules | — |
| `panel-2` | `#171b21` | Raised surface, row hover | — |
| `line` | `#262b33` | 1px borders, rings | — |
| `line-soft` | `#1a1e24` | Intra-panel hairlines | — |
| `ink` | `#f2f4ee` | Primary text | 17.3:1 on void |
| `ink-dim` | `#9ba3ad` | Secondary text | 7.7:1 on void |
| `ink-mute` | `#737b85` | Meta / labels | 4.6:1 on void ⚠️ |
| `acid` | `#c6f832` | Accent, primary action, positive | 15.8:1 on void |
| `acid-deep` | `#95c314` | Accent hover/pressed | — |
| `live` | `#ff4b3e` | LIVE, loss, timeout, danger | 5.8:1 on void |

**Rationale:** one accent (acid) + one alert (live) over a four-step surface ramp
(`void → void-2 → panel → panel-2`). Depth comes from *surface steps and 1px borders* — never
shadows or glows. Acid is the only "brand" color; it means *signal*: live, first place,
primary action, selected state. Red means *time/loss/danger*. Nothing else gets a hue.

### Required refinement (accessibility fix)

`ink-mute` on `panel` computes to **4.3:1** — below WCAG AA (4.5:1) for the 11px `.u-label`
text used in `panel-head` (`components/dashboard.tsx:20`) and table headers.

**Fix:** bump `--ink-mute` from `#737b85` → **`#7c848e`** (≈4.9:1 on panel, 5.2:1 on void).
Visually indistinguishable; one-line change in `app/globals.css:14`.

### New tokens (proposed, assignment surfaces)

| Token | Value | Why |
|---|---|---|
| `board-light` | `#d9ddc8` | Bone/olive light square — harmonizes with acid instead of pure white glare on a dark UI |
| `board-dark` | `#4d5640` | Dark square, olive-tinted (never neutral gray) |
| `board-last-move` | `acid @ 28%` | Last-move highlight reuses the accent — no new hue |
| `board-check` | `live @ 42%` | Check highlight reuses the alert color |

### Semantic mapping (no new hues)

| Meaning | Token |
|---|---|
| Tournament `draft` | `ink-mute` |
| Tournament `open` (joinable) | `acid` |
| Tournament `ongoing` | `live` + `.dot-live` blink |
| Tournament `completed` | `ink-dim` + "FINAL" label |
| Win / Draw / Loss | `acid` / `ink-dim` / `live` |
| Points column | `ink` (never colored — data stays neutral) |

---

## 3. Typography

Families (`app/layout.tsx:5-16`): **Archivo** (variable `wdth` axis) for everything human-readable,
**JetBrains Mono** for machine-readable labels.

| Class | Spec | Use for |
|---|---|---|
| `.u-label` | JetBrains 11px, `0.16em`, uppercase, tabular | Meta, table headers, badges, nav, status chips |
| `.display` | Archivo 800, `wdth 112`, uppercase, `-0.012em`, `lh 0.94` | Headlines, player tags, empty-state titles |
| `.numeral` | Archivo 900, `wdth 64`, tabular, `-0.04em`, `lh 0.76` | Scores, rankings, big stats |
| `.mono` | JetBrains, tabular | Clocks, PGN moves, timestamps, points |
| body | Archivo 400/700, 16px, `lh 1.5` | Prose, forms, errors |

**Hierarchy rule:** every screen reads top-down as `display (what) → u-label (context) →
body/mono (data)`. One `.display` focal point per panel; `.numeral` only for numbers that
matter at a glance (clock, score, rank). Never `.display` for sentences — it's uppercase and
`lh 0.94`.

Fluid sizing: headings use `clamp()` (`display-sm/md/lg`, `clock` in `design-tokens.json`)
so the scorebug and leaderboard don't break between 360px and 1440px.

---

## 4. Spacing & Layout

- **4px base grid** (`space.1..20`). Most-used: `12/16/20/24/32`.
- **Optical exception:** `3px` only for round-history cell gaps (`dashboard.tsx:64`) and thin
  scorebug bars. Don't generalize it.
- Container: `max-w-[1440px]`, gutters `px-5` mobile / `px-8` ≥768px (`chrome.tsx:27`).
- Header: sticky, `h-16`, `bg-void/85` + `backdrop-blur-md`, `z-40`.
- Module rhythm: `panel` → `panel-head` (0.7rem 1rem) → body `px-4/5` + `py-3/4`.
- Tables: `py-3` rows, `px-4/5` cells; first/last column gets the larger gutter.

---

## 5. Shape & Depth

- **`border-radius: 0` everywhere. LOCKED.** Chips, buttons, inputs, modals, avatars — all square.
  The only circles allowed: status dots (`.dot-live`, `h-1.5/w-1.5`) and piece glyphs.
- Borders: `1px solid line`. Two sanctioned 2px usages: active-nav underline, `.stripes` bar.
- **No `box-shadow`.** Depth = surface ramp + `ring-1 ring-line`. (Exception: `backdrop-blur`
  on the sticky header, which is a transparency effect, not a shadow.)
- Focus: `2px solid acid` outline, `2px` offset, `:focus-visible` only (`globals.css:65-68`).

---

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `duration.fast` | 120ms | Hover color swaps |
| `duration.base` | 180ms | Nav links, row hover |
| `duration.slow` | 220ms | `.row-hit` accent bar, structural |
| `duration.enter` | 600ms | `.stagger` entrances (`--i × 75ms`) |
| `duration.ticker` | 52s | Marquee loop (pause on hover) |
| `ease.standard` | `cubic-bezier(0.2, 0.75, 0.25, 1)` | All structural motion |

Purposeful list: blink = live status; ticker = ambient score feed; row bar = pointer feedback;
stagger = first paint only. **Nothing animates on scroll.**

`prefers-reduced-motion: reduce` already disables ticker/blink/stagger (`globals.css:232-247`).
Any new animation (queue pulse, board move flash, toast slide) must be added to that block.

---

## 7. Components

### Buttons (extends `components/cta.tsx`)

Base: `inline-flex items-center gap-3 px-6 py-3.5 text-sm font-bold uppercase tracking-widest transition-colors`
→ 48px tall (≥44px touch target ✓).

| Variant | Style | When |
|---|---|---|
| `primary` | `bg-acid text-void hover:bg-acid-deep` | One per view: Find opponent, Save, Join |
| `outline` | `text-ink ring-1 ring-line hover:bg-panel hover:ring-ink-mute` | Secondary: Cancel, View |
| `ghost` | `text-ink-dim hover:text-ink hover:bg-panel-2` | Tertiary, row actions |
| `danger` | `text-live ring-1 ring-live/40 hover:bg-live/10` | Resign, delete tournament |
| disabled | `opacity-45 cursor-not-allowed`, no hover | Prevent double-submit |
| loading | keep width, swap label for 14px spinner + `aria-busy="true"` | Every mutating action |

### Status chip

`.u-label` + `1px ring` in the semantic color + optional `.dot-live` for `ongoing`.
Square, `px-2.5 py-1`, `gap-1.5`. Never a filled pill — filled color is reserved for primary buttons.

### Panel / Module

`panel` + `panel-head` as-is (`dashboard.tsx:5-25`). New screens (leaderboard, PGN, queue) must
reuse `Module` rather than styling new containers.

### Table (leaderboard, match history)

As `Standings` (`dashboard.tsx:196-272`): `.u-label` header row, `row-hit` rows, `mono` for
numeric columns, rank `01`-padded, leader row `bg-acid/[0.05]`, top-3 tags in `acid`.
Horizontal scroll wrapper on mobile; drop secondary columns before shrinking below 12px.

### States (required by assignment §08)

| State | Recipe |
|---|---|
| Loading | Skeleton rows in `panel-2` blocks, `animate-pulse`; match pairing = spinner + `.u-label` "PAIRING…" |
| Empty | `.display` title + `.u-label` hint + primary CTA; centered in panel, `py-12` |
| Error | `ring-1 ring-live/40 bg-live/5` inline block, `text-live` label, `ink-dim` detail, Retry = outline btn |
| Optimistic | Queue join is optimistic; on socket ack invalidate TanStack Query key |

### Live match chrome (headline screen)

- Clock: `.mono`, `clamp(2.2rem, 4.5vw, 3.6rem)`; active side `ink`, inactive `ink-dim`;
  ≤30s turns `live`; `tabular-nums` prevents layout jitter.
- PGN panel: `panel`, `.u-label` head "MOVE LIST", moves in `mono sm`, `gap` pairs,
  current ply `bg-acid/10`, scroll pinned to bottom.
- Board: square cells, no radius; `board-light/dark`; last move `board-last-move`;
  check `board-check`; legal-move dots `acid @ 45%`.
- Opponent bar: mirrors `Scorebug` side block — tag in `.display`, clock right-aligned.

---

## 8. Accessibility

- Contrast: all core pairs ≥4.5:1 except `ink-mute` on `panel` (fix in §2).
- Focus visible everywhere via global `:focus-visible` (acid outline).
- Touch targets ≥44px (buttons 48px; icon-only controls must add `p-3` min).
- Live region: pairing/game-end announcements via `aria-live="polite"`; clock is *not* live-regioned
  (would spam screen readers) — expose an on-demand "time remaining" instead.
- Status never color-only: always pair color with `.u-label` text (`LIVE`, `FINAL`).
- `sr-only` captions on tables; `aria-hidden` on decorative dots/stripes/scanlines (already used).

---

## 9. Assignment → token map

| Screen | Key tokens |
|---|---|
| Login / auth | `void` bg, `panel` card, primary btn, error state |
| Coach: tournament CRUD | `Module`, form inputs (`ring-line` borders, radius 0), status chips |
| Student: browse/join | `row-hit` tournament rows, `acid` join CTA, empty state |
| Matchmaking queue | `.u-label` "IN QUEUE" + pulsing acid dot, outline Cancel, pairing skeleton |
| Live board | board tokens, clock, PGN panel, danger Resign |
| Leaderboard | `Standings` table, `acid` leader row, `numeral` points |
| README/state docs | loading/empty/error recipes from §7 |

---

## 10. Do / Don't

**Do:** square corners · 1px `line` borders · one acid primary per view · `.u-label` for all meta ·
`mono` for anything that changes numerically · `clamp()` type · reduced-motion coverage.

**Don't:** `rounded-*` classes · `shadow-*` classes · a second accent hue · gradient fills
(body's two radial acid washes are the sanctioned exception — they're <12% alpha and static) ·
glassmorphism · scroll-triggered animation · `.display` for sentences · color without a text label.

### AI-slop check on current code: PASS

No purple/blue defaults, no gratuitous rounded cards, no glass panels, no scroll-jank,
personality-rich type (Archivo variable + JetBrains), gradients are subtle and purposeful.
Only finding: the `ink-mute` contrast miss (§2).

---

## 11. Files

| File | Contents |
|---|---|
| `design-tokens.json` | Machine-readable token set (W3C-style `$value`/`$type`) |
| `design-preview.html` | Self-contained interactive preview — open in a browser |
| `app/globals.css` | Source of truth for CSS custom properties + utilities |

Tailwind v4 wiring already exists: `@theme inline` maps CSS vars → `bg-*`/`text-*` utilities
(`globals.css:20-37`). New tokens = add to `:root`, then to `@theme inline`.
