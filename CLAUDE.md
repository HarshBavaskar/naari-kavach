# CLAUDE.md: Naari Kavach

Working guide for Claude (and humans) on this codebase. Read it fully before
changing anything. When this file and the code disagree, the code is the
truth for *how*, and this file is the truth for *why*. Fix whichever is wrong.

---

## 1. What this is

**Naari Kavach** (नारी कवच, "a shield for women") is a free, installable web app
(PWA) for women's everyday safety and safe mobility in Maharashtra. Built by
Team ONYX for the Seva First Innovation Challenge 2026.

It does four things, one per tab:

| Tab | Job | Core file |
|---|---|---|
| Routes | Compare routes by **risk**, not just time | `src/features/RoutesPanel.tsx` |
| Help | Helplines + nearest police stations and hospitals | `src/features/HelpPanel.tsx` |
| Report | Anonymous report of an unsafe spot, feeds the risk map | `src/features/ReportPanel.tsx` |
| Trip | Quiet shield: watches with the phone put away, asks only if something looks wrong | `src/features/TripPanel.tsx` |

Plus the **SOS** control, reachable from every screen: press and hold 1.5 s,
5 s cancel window, then one-tap call 112 / SMS / WhatsApp / share.

### Non-negotiables

These are product rules, not preferences. A change that breaks one is a bug.

1. **Track risk, never people.** The app scores *places and times*. It must
   never ingest, display or infer the identity, face, photo, phone or
   location of any individual other than the user herself. No offender
   registries, no face recognition, no "suspicious person" alerts. This is
   both a legal line (DPDP Act 2023) and the product's core USP.
2. **SOS is never blocked.** No network call, permission prompt, animation,
   loading state or error may sit between the user and `tel:112`. Location
   is fetched in parallel; if it fails, SOS still works with a "no location"
   message.
3. **Free and keyless by default.** `npm run dev` must give a fully working
   app with zero API keys. Paid or keyed services are optional upgrades
   behind env vars and must fall back silently.
4. **Calm under stress.** The user may be scared. Every screen must be usable
   by someone anxious, in the dark, with one hand: few words, big targets,
   icons first, no alarming colours outside SOS, no surprises.
5. **Honest data.** Demo data is labelled "Demo data" on the map and can be
   hidden. Never present generated or sample values as real incidents or
   real statistics. The map also says where it is guessing: a hex scored
   without its shops on the map is drawn fainter and says so when tapped.
   No reports is never treated as proof of safety.
6. **Protect without asking.** The app must not make her check or tap the
   phone again and again. No recurring check-ins, no timers she has to
   reset, no data collection that needs a tap during a walk. A question is
   the rare exception for a strong anomaly, and walking on must be able to
   answer it.

---

## 2. Commands

```bash
npm install          # Node 20+
npm run dev          # http://localhost:5173 (also on LAN for phone testing)
npm run typecheck    # tsc, strict
npm run build        # typecheck + production build to dist/
npm run preview      # serve dist/ on :4173 (service worker active here only)
npm run grid         # rebuild public/data/risk-grid.json (roads + population, no key)
```

Phone testing: `npm run dev`, open the LAN URL on the phone. Geolocation
needs HTTPS on real devices except `localhost`; use `npx vite --https` with a
local cert or deploy a preview (Vercel/Netlify) to test location and SOS.

---

## 3. Stack

| Concern | Choice | Why |
|---|---|---|
| UI | React 18 + TypeScript (strict) + Vite 5 | Small, fast, no framework lock-in |
| Motion | `framer-motion` 11, wrapped in `<MotionConfig reducedMotion="user">` | Springs, layout animations, OS reduce-motion respected |
| Map | Leaflet 1.9 + OpenStreetMap standard raster tiles, muted and dark-themed with a CSS filter on the tile pane | Free, no key, no account (CARTO now watermarks keyless tiles) |
| Grid | `h3-js` 4, resolution **10** (~130 m hexes) | Uniform cells, cheap neighbour math |
| Icons | `lucide-react` (outline) + hand-drawn SVG for logo, map markers, guide | One icon family, crisp at any DPR |
| Fonts | Anek Devanagari Variable (display, `wdth` axis) + Mukta (body), self-hosted via Fontsource | Indian foundry (Ek Type), full Devanagari for Marathi/Hindi, works offline |
| State | Tiny custom store on `useSyncExternalStore` (`src/lib/store.ts`) | No dependency, persisted keys only |
| Backend (optional) | Supabase free tier: Postgres + PostGIS, one Edge Function | Shared reports + Telegram SOS |

No CSS framework. Plain CSS with tokens. No router: four tabs are state.

---

## 4. Directory map

```
src/
  main.tsx                 Fonts, tokens, MotionConfig, service worker registration
  App.tsx                  Layout (desktop panel / mobile sheet), global effects:
                           geolocation watch, POI fetch, risk grid memo, trip timer
  styles/
    tokens.css             ALL colours, radii, spacing, type scale, motion tokens (+ dark)
    global.css             Component styles, BEM-ish class names
  lib/
    config.ts              Endpoints, H3 resolution, SOS timings, helplines
    types.ts               Shared types (Report, Poi, RiskCell, RouteOption...)
    store.ts               Global store, persistence, toast(), uid()
    i18n.ts                en / mr / hi strings, useT()
    risk.ts                Risk engine (weights, signals, time factor, grid)
    sun.ts                 Sunrise and sunset from date and place, no network
    journey.ts             Route profile: quiet stretches, open-place gap, turns, best place to wait
    routes.ts              Route ranking against the grid
    services.ts            Overpass, Photon, Nominatim, OSRM / ORS clients
    trip.ts                Quiet shield: no timer, asks only on a long stop on high-risk ground,
                           speed and ride anomalies, late and stopped; pocket guide, contact messages
    pocket.ts              Earphone SOS: three presses of the earphone button start the countdown
    trail.ts               Sealed trail: positions encrypted on the phone, opened only if she does not arrive
    sound.ts               Web Audio ring and siren (no audio files)
    sos.ts                 Location fix, SOS message, sms/wa links, Supabase calls
    geo.ts                 Haversine, polyline sampling, formatting, PRNG
    demo.ts                Clearly flagged demo reports
    complaint.ts           Offline police-complaint draft template
  components/
    MapView.tsx            Leaflet map: hex layer (canvas), routes (SVG), markers
    SosButton.tsx          Press-and-hold control (signature element)
    SosOverlay.tsx         Countdown → active SOS actions
    CheckInPrompt.tsx      "Are you okay?" for a real anomaly → 60 s or 30 s grace → SOS
    WhatNow.tsx            Offline steps and rights for after something has happened (Help)
    TrailView.tsx          What a contact sees on opening a sealed-trail link
    FakeCall.tsx           Fake incoming call screen (Help → Quick tools)
    Alarm.tsx              Siren that follows `alarm` in the store, plus a stop pill
    CrashGuard.tsx         Error boundary: keeps Call 112 on screen if a render fails
    Journey.tsx            JourneyCard (route profile) and WalkPreview (route playback)
    Chrome.tsx             TopBar, BottomNav, PanelTabs, Sheet, Legend, Zoom,
                           ReportPin, Toast, OfflineBanner
    Intro.tsx              One-time-per-session kinetic intro
    Logo.tsx               Kavach Mandala mark (static + animated intro)
    logoGeometry.ts        Generated from brand/geometry.json, never hand-edit
    Illustration.tsx       Geometric empty-state art
    ui.tsx                 PanelTitle, Segmented, Chip, Section
  features/                One panel per tab
brand/
  mark*.svg, lockup-*.svg     Logo files (true transparency, text outlined)
  app-icon.svg/.png, favicon.svg
  brand-sheet.html/.png       Identity guidelines (construction, sizes, colour, misuse)
  geometry.json               Exact mark geometry (source for src/components/logoGeometry.ts)
  tools/build_brand.py        Regenerates everything above from one construction
docs/screenshots/            Current UI captures for the pitch deck
public/
  manifest.webmanifest, sw.js, icon.svg, favicon.svg, app-icon-*.png
  data/risk-grid.json      Output of /pipeline: no-way-out, people nearby, and optional dark and crime
                           per hex. Built for Greater Mumbai and Thane. Absent = those signals skipped
supabase/
  schema.sql               reports table, RLS, hotspot view, sealed-trail tables
  functions/sos-alert/     Telegram alert edge function
  functions/trail/         Sealed trail: holds locked points, releases them when she is overdue or on SOS
pipeline/
  build_place_grid.mjs     OSM roads + Meta population → no-way-out and people per hex (no key)
  build_risk_grid.py       VIIRS night lights + NCRB → dark and crime per hex (needs downloads)
```

---

## 5. Architecture

### 5.1 Data flow

```
          one-off / monthly                         live, in the browser
 ┌──────────────────────────────┐      ┌───────────────────────────────────────────┐
 │ pipeline/build_risk_grid.py  │      │ Overpass ─▶ POIs (police, hospital,       │
 │  VIIRS night lights → dark   │      │             shops, bus stops)             │
 │  NCRB district rate → crime  │      │ User + cloud + demo reports               │
 └──────────────┬───────────────┘      │ Clock (time-of-day factor)                │
                │ public/data/          └───────────────────┬───────────────────────┘
                ▼ risk-grid.json                            ▼
            ┌──────────────────── buildContext() ── scoreCell() ────────────────────┐
            │                         risk grid (H3 res 10, ~1.5k cells)             │
            └──────┬───────────────────────────┬────────────────────────────┬────────┘
                   ▼                           ▼                            ▼
             Hex heat layer            rankRoutes() on OSRM/ORS       avoid_polygons for ORS
```

### 5.2 Risk engine (`src/lib/risk.ts`)

```
place(cell) = 0.7 × Σ wᵢ·sᵢ / Σ wᵢ  over PRESENT place signals
score(cell) = 100 × clamp( (place + (1 − place) × 0.55 × reports) × timeFactor )

signal       weight  source                         0 → 1 means
darkness     0.20    pipeline (VIIRS)                bright → dark
isolation    0.20    Overpass POIs + people (HRSL)   busy or lived-in → empty
noExit       0.15    pipeline (OSM road graph)       side turns close by → none for 500 m
areaCrime    0.15    pipeline (NCRB district)        lowest → highest district rate
helpFar      0.10    nearest police/hospital         < 0 m → ≥ 2.5 km
reports      pull    user/cloud/demo reports         none → many recent, severe

timeFactor   1.00 day · 1.15 dusk/dawn · 1.35 night
```

- **Reports only raise a score.** They are not averaged in with a weight: no
  reports may only mean nobody here uses the app yet, so it must never pull
  a score down. `REPORT_PULL` (0.55) is how far a full report signal closes
  the gap between the place score and 1.
- **Place signals alone are capped at 0.7** (`PLACE_CEIL`), so with no reports
  the emptiest stretch reads moderate in daylight and high only after dark.
- **Isolation** is `1 − max(places, homes)`. Places are mapped shops and
  stalls (×0.45 at night, and down to ×0.6 in heavy rain from Open-Meteo).
  Homes are people living in the hex and its ring, from Meta's satellite
  based population layer: 1,500 people count as fully lived-in, worth 0.5 by
  day and 0.3 at night.
- **No way out** scores how far a walker is committed before the next side
  turn: 0 under 120 m, 1 from 500 m. Dead ends count 1.5×, foot bridges,
  skywalks and underpasses 2×. Flyovers, highways and private roads are not scored.
- **The map says where it is guessing.** A hex with 300 or more residents but
  no mapped place is `blind`: shops are unmapped, not absent. Outside the
  pipeline's area a hex with nothing mapped is `thin` and its isolation is a
  fixed 0.6. Both are drawn at 60% opacity and say so in the tap popup.
- Inside the pipeline's area a hex missing from the file has no road and no
  residents (open ground, water). It is left blank unless someone reported it.

- The time bands follow the real sun, worked out on the phone in
  `src/lib/sun.ts` (no network): day is sunrise to sunset, dusk is the two
  hours after sunset, dawn the 90 minutes before sunrise, night the rest. A
  6:30 pm walk in December is scored as dark. Only near the poles does it
  fall back to clock hours (19–21, 5–7, 21–5).
- A route is scored for when she will be on each part of it
  (`factorsAlong`): a walk that starts in daylight and ends after dark shows it.

- Reports decay with a **21-day half-life** and spread over the hex plus two
  rings (1, 0.55, 0.25). Severity per category lives in `SEVERITY`.
- Missing place signals are **skipped and the rest renormalised**, so the map
  still works with no pipeline file and no network.
- Weights, the 0.7 cap and the 0.55 pull are starting guesses. Tune them only
  with pilot evidence, and note the change and reason in the commit message.
- Levels for colour: `<20` hidden, `20–38` lv1, `38–55` lv2, `55–72` lv3, `≥72` lv4.

### 5.3 Routing (`src/lib/services.ts`, `src/lib/routes.ts`)

1. With `VITE_ORS_KEY`: OpenRouteService with `alternative_routes` and
   `avoid_polygons` = hexes at level 4 (excluding the start and end hexes),
   plus the plain OSRM routes so "fastest" is still visible.
2. Without: FOSSGIS OSRM (`routing.openstreetmap.de`, foot or car) with
   `alternatives=3`.
3. `rankRoutes` samples every 40 m, ranks by `0.7 × mean + 0.3 × max` risk,
   tags `safest` (rank 1) and `fastest` (min duration).

### 5.4 SOS state machine

```
 idle ──hold 1.5 s──▶ countdown (5 s, Cancel / Esc) ──0──▶ active ──"I'm safe now"──▶ idle
   ▲                        │ cancel                          │
   └────────────────────────┘                                 ├─ tel:112 (always first, focused)
 trip anomaly    ─▶ CheckInPrompt (60 s) ─timeout/"Send SOS"──┘├─ sms: all contacts
                                                               ├─ wa.me (first contact)
                                                               ├─ navigator.share / copy
                                                               ├─ sound alarm (siren, toggle)
                                                               └─ Supabase sos-alert → Telegram (if configured)
```

- Location fix starts at the *beginning* of the countdown, falls back to the
  last watched position, then to a "no location" message.
- A tap shorter than 280 ms never triggers; it nudges and shows "Hold for SOS".
- Keyboard: hold Space/Enter on the focused button.
- **Earphone SOS** (`src/lib/pocket.ts`, opt-in): three presses of the
  earphone button within 3 s start the same countdown, with the phone in her
  bag. Browsers hand media buttons only to a page that is playing sound, so
  a silent loop plays while it is armed (other audio may pause). Phones send
  a double press as "next" and a triple as "previous"; both are counted.

### 5.5 Trip shield

The trip protects with the phone put away (`src/lib/trip.ts`, called from the
location watch in `App.tsx`). **There is no timer and no routine check-in.**
Stopping at a shop, a signal or a bus stop is never a reason to ask.

- Within 60 m of the route end the trip ends itself ("You have arrived").
- Moving more than 150 m off the selected route shows one calm toast.
- No usable fix for 2 minutes (denied, indoors, desktop): the shield cannot
  see her, says so in the panel, and stays quiet. SOS still works.
- Started from a route ("Start trip shield"), the trip knows its destination
  and arrival time. If she is half as long again over the route estimate (at
  least 5 minutes over) **and** has stood still for 2 minutes, it asks once.
  Late but still walking is only late: it looks again every 5 minutes.

**Quiet shield.** It asks only when something looks wrong, and this is the
product's differentiator. Keep it button-free:

- **A long stop on high-risk ground.** `tripSetRisk` gives the trip the live
  risk score at her position. At 55 or more (level 3) the shield is `watch`:
  it asks after 4 minutes without movement, or 2.5 if she is also off her
  route. On calmer ground it never asks about a stop. One calm toast when
  watching starts, none when it ends. The stop is timed from the moment the
  ground became high-risk, so nightfall does not trigger an instant question.
- **Walking on answers it.** If she moves 35 m while a question about a stop
  is open, it closes itself. Nothing to tap.
- **A stop she has answered for is remembered.** "Yes, I'm safe" stores that
  spot in memory; it is not asked about again within 80 m.
- **Feels off** (Help → Quick tools, active trip). One tap, then nothing more
  to do: the shield watches closely wherever she is (2.5 minutes), and a trip
  starts if none is on.
- **A walk that stops being a walk.** On a walking trip, two fast readings in
  a row (7 m/s or more, held 15 s over 150 m) ask "Are you okay?" at once. One
  far-apart pair of fixes is never enough: a bad GPS position looks the same.
  Asked once per trip, since she may have taken a rickshaw by choice.
- **Ride watch.** A ride is not held to the planned road. It is questioned only
  when it is 400 m farther from the destination than its closest point, for a
  minute. This works for any auto, bus or cab, not only app cabs.
- **Pocket guide** (opt-in per trip). Turns are found from the route's shape
  (`routeTurns`); two short buzzes mean left, one long means right, with a
  spoken cue for phones that cannot vibrate. The phone stays in her pocket.

`tripTick()` runs every second from `App.tsx`. On an anomaly:
`checkInDue = true` (with `checkInWhy`: still, route, late, fast or away) →
`CheckInPrompt` → `sos = 'active'` if unanswered. The grace is 60 s for a
question about a stop (still, route, late), with a buzz every 15 s, and 30 s
for fast and away. The trip anchor and answered spots live in memory only.
The screen is kept awake during a trip (Wake Lock) because browsers stop
location when the phone locks.

**Sealed trail** (`src/lib/trail.ts`, opt-in per trip, needs Supabase). Her
route is recorded so it exists if she does not arrive, without anyone being
able to follow her:

- Each position is encrypted on the phone (AES-GCM, key made on the phone).
- The key travels only in the link she sends with "Tell my contacts", after
  the `#`, which browsers never send to a server. The server cannot read a point.
- The `trail` function releases the locked points only after the time she
  was due (the late time plus 10 minutes, or 60 minutes for a trip with no
  route), or once she raises SOS. Before that a contact sees "Sealed".
- Ending the trip or arriving deletes it. Anything left is deleted after 24 hours.

"Tell my contacts" in the active trip opens one SMS to all trusted contacts
(share sheet when none are saved) with the destination, arrival time and her
current location. If she sent it, the Trip tab offers "Say I arrived" once the
trip ends. Nothing is sent without her tap.

### 5.5a Tools around the core flows

| Tool | Where | Notes |
|---|---|---|
| Fake call | Help → Quick tools | Rings `config.fakeCallDelayS` after the tap, shows her first contact's name (or "Home"). Sound is unlocked in the tap (`primeSound`). SOS closes it. |
| Loud alarm | Help → Quick tools, SOS sheet | `alarm` in the store drives `Alarm.tsx`. Stop from the pill, the tile, the SOS sheet, or "I'm safe now". Sound only, no screen flashing. |
| Why this area | Tap the map | Popup lists the signals behind the hex (`whyHtml` in `MapView.tsx`). Says so when reports may include demo data. Off on the Report tab. |
| Risk for a time | Routes → "Risk for" | `planWhen` (now, day, evening, night) re-scores the map and re-ranks routes. The legend shows "not live" until reset. |
| Safer route to help | Help → place row | Sets `dest` + `pendingRoute`; Routes finds the route on arrival. The arrow still opens Maps for turn-by-turn. |
| Journey profile | Routes, under the selected route | `buildJourney`: risk strip, the hardest part (the quiet stretch that adds up to the most risk) with up to two reasons and the last named open place before it, the longest stretch with no side turn, when it gets dark, longest gap between open places (places likely open late at night). Tapping the hardest part shows it on the map. The gap is hidden until the shop data has loaded. |
| Route preview | "Preview this route" | Plays the route on the map with what the shield would do and where the turns are. Always tagged "Preview". Also the stage demo. |
| Daylight budget | Routes | Sunset from `sun.ts`: "Leave within 17 min to arrive before dark". Shown only for the live time. |
| Best place to wait | Help | `waitSpot`: nearest named open place on low-risk ground within 300 m, police and hospitals preferred. |
| Crash guard | `main.tsx`, around each panel | A render error shows Call 112 and helplines instead of a blank page. A panel error leaves the map and SOS alone. |
| Feels off | Help → Quick tools, active trip | `tripFeelsOff`: one tap makes the shield watch closely everywhere and starts a trip if none is on. Nothing more to do after the tap. |
| Earphone SOS | Help → Quick tools, active trip | `pocket.ts`: three presses of the earphone button start the SOS countdown. Opt-in, because the silent loop it needs can pause other audio. Hidden where the browser has no Media Session. |
| If something happened | Help | `WhatNow.tsx`: offline steps and rights (safe place, free treatment under BNSS 397, evidence, Zero FIR under BNSS 173, 181 and 15100). Closed until she opens it. Carries the date it was last checked; recheck the law before changing a line. |
| Ward complaint | Report → Your reports | `civicDraft`: one letter to the municipal ward office for every spot she reported that the city can fix (poor lighting, isolated stretch, unsafe transport stop). Places only; reports about a person are left out. |
| Sealed trail | Active trip (cloud only) | See §5.5. The contact's view is `TrailView.tsx`, opened by a `#trail=<id>.<key>` link. |
| Rain | Risk engine | `fetchRain` (Open-Meteo, hourly, two days): rain in the scored hour counts open places for less, including for "Risk for: Night". The tap popup says "Rain is keeping people indoors". |

### 5.6 State

- `src/lib/store.ts` holds everything global. **Persisted** keys:
  `lang, contacts, reports, showDemo, guideSeen` (localStorage, try/catch).
  Everything else is session-only.
- Component-local UI state (open/closed, form fields) stays in the component.
- Never persist location history anyone can read. The only readable stored
  coordinates are the user's own reports. The one exception is the sealed
  trail (§5.5), and only because it meets all of these: she turns it on per
  trip, each point is encrypted on her phone, the key never reaches a
  server, the server releases nothing before she is overdue or raises SOS,
  and it is deleted on arrival and after 24 hours at most. Do not add any
  other stored trail, and do not weaken any of those conditions.

---

## 6. Data sources

| Source | Used for | Key? | Limits / etiquette |
|---|---|---|---|
| OpenStreetMap via Overpass (`overpass-api.de`, then `maps.mail.ru`, `overpass.private.coffee`, `overpass.kumi.systems`) | Police, hospitals, activity POIs | No | Cached per ~1 km; refetch only after moving 1.2 km. Next mirror starts only on failure or after 4 s of silence; first answer cancels the rest |
| Photon (`photon.komoot.io`, OSM data) | Quick police + hospital list while Overpass loads | No | Two requests per refetch; no phone numbers |
| Nominatim | Place search | No | ≥450 ms debounce, ≥3 chars, max 1 req/s |
| FOSSGIS OSRM | Routes | No | Fair use; no bulk requests |
| OpenRouteService | Risk-avoiding routes | Free key | Optional |
| OpenStreetMap tiles (`tile.openstreetmap.org`) | Basemap | No | Keep attribution visible; light use only (OSMF tile policy), move to a paid or self-hosted tile source before heavy traffic |
| OpenStreetMap roads via Overpass (pipeline) | No-way-out stretches per hex | No | Offline only, `npm run grid`. Extracts are cached in `pipeline/raw/osm`; the mirrors often time out on large boxes, so tiles are kept small |
| Meta High Resolution Settlement Layer (`dataforgood-fb-data` on AWS, CC BY 4.0) | People living near each hex, so an unmapped street is not scored as empty | No | Offline only; read by HTTP range request, about 30 m pixels, a modelled estimate |
| Open-Meteo (`api.open-meteo.com`) | Rain by the hour, for the isolation signal | No | One request per POI refetch; free for non-commercial use, needs a plan before commercial launch |
| NASA VIIRS Black Marble | Darkness (pipeline) | Earthdata login | Offline only |
| NCRB Crime in India | District baseline (pipeline) | No | Offline only; district level, not street |
| Supabase | Shared reports, SOS function | Free project | Optional |

**Not used, on purpose:** the Maharashtra Police FIR portal (sexual-offence
FIRs are excluded from public upload, entries are station-level, scraping
breaks the terms) and any CCTV feed. A police partnership would send
**zone-level advisories** only, never identities.

Adding a source: it must describe places or times, have a licence that allows
this use, degrade gracefully when down, and be added to this table.

---

## 7. Design system

### 7.1 Principles

- **Flat.** No gradients, no drop shadows, no glows, no blur, no glass.
- **Borderless.** Separate with surface steps (`--surface` → `--surface-2` →
  `--surface-3`), not lines. The only outlines allowed: focus rings, the
  1 px `--surface-3` outline on floating menus, and map-marker halos.
- **Calm.** Cool mist base, indigo ink, muted risk ramp. Red is reserved for
  SOS and "high risk". Nothing pulses at idle.
- **Icons first, words second.** Every action and section has an icon. Labels
  are 1–3 words. Body text is the exception, not the rule.
- **One memorable thing.** The SOS hold ring and the variable-width kinetic
  type are the brand moments. Everything else stays quiet.

### 7.2 Colour tokens (`src/styles/tokens.css`)

| Token | Light | Role |
|---|---|---|
| `--bg` | `#F3F5FA` | App background (cool mist) |
| `--surface` / `-2` / `-3` | `#FFF` / `#E9EDF7` / `#DDE3F2` | Panels, cards, pressed/hover |
| `--ink` / `-2` / `-3` | `#18213F` / `#4E5778` / `#8790AE` | Text levels |
| `--primary` | `#4152D9` | **The** accent: active states, primary buttons, route |
| `--sos` | `#E5364F` | SOS and destination only |
| `--safe` | `#12A27A` | "I'm safe", safest tag |
| `--caution` | `#F0A020` | Warnings, demo chip |
| `--risk-0…4` | sage → sand → clay → rose | Map hexes and meters only |

Every colour has a dark-mode value. Text on a tinted fill uses that family's
`-ink` token. Never hard-code a hex in a component; add a token.

### 7.3 Type

- **Display:** `Anek Devanagari Variable`, weight 600–660, `wdth` 100 (titles),
  104–112 (wordmark, SOS label). Animate `wdth` for kinetic moments only.
- **Body:** `Mukta` 400/500/600, 16 px base, line-height 1.5.
- Scale (rem): 0.75 · 0.875 · 1 · 1.125 · 1.3125 · 1.5 · 1.875 · 2.25 · 3.
- Numbers that count or time: `font-variant-numeric: tabular-nums`.
- Sentence case everywhere. No ALL CAPS labels. No eyebrow labels.

### 7.4 Shape lock (radius by hierarchy)

| Element | Radius |
|---|---|
| Sheet / side panel / dialogs | 28 px (`--r-sheet`) |
| Cards, route cards, tiles, list rows | 16–18 px (`--r-card`) |
| Buttons, inputs, segmented control | 14 px (`--r-btn`) |
| Icon buttons | 12 px |
| Chips, tags, pills, nav indicator | full (`--r-pill`) |
| SOS button | circle |

### 7.5 Spacing and targets

4 px base (`--s-1` … `--s-10`). Use `gap`, not stacked margins. Minimum
tap target **44 × 44 px**; primary actions 52 px tall; SOS 64 px (mobile nav)
and 96 px (desktop float).

### 7.6 Iconography

- `lucide-react` outline icons only, default stroke. Sizes: 16 (inline),
  18–20 (buttons), 22 (nav), 26 (report tiles).
- Decorative icons get `aria-hidden="true"`; icon-only buttons get
  `aria-label`.
- Custom SVG (inline, token colours) for: the Kavach Mandala logo (§7.7), police/hospital markers,
  user dot, route end, report pin, guide SOS glyph, empty-state art.
- No emoji in UI. No cartoon figures or mascots; illustrations are geometric
  (hex lattice + route) to keep the tone steady.

### 7.7 Logo: the Kavach Mandala

- **Meaning:** a woman at the centre (red bindi as her head, sari with a
  two-line pallu border) inside eight interlocking crescents that turn toward
  her like cupped hands. Eight = the ashta directions of a rangoli: protection
  on every side. Woman first, protection around her, never a cage or a badge.
- **Construction:** 8 circles r 16.5 on an orbit of 29.5, each minus a twin
  shifted 6.2 inward. Crescent *i* is masked by the disc of crescent *i+1*
  (+1.6 gap), so every crescent passes under its clockwise neighbour. Figure
  scaled 1.16 about (50, 53). All in a 100 × 100 artboard.
- **Responsive versions:** full mark ≥ 64 px; simple mark (one pallu line,
  tighter gap) 24 to 63 px; favicon art below 24 px. `Logo` picks automatically
  by `size`.
- **Colour:** crescents alternate indigo `#4152D9` / deep indigo `#2B3699`;
  the bindi is always bindi red `#E5364F`. Mono, black, reverse and night
  versions live in `/brand`.
- **Wordmark:** "Naari Kavach" in Anek Devanagari 660 at 104 % width,
  tracking −8; "नारी कवच" in Anek 560 below. Text is outlined in the SVGs.
- **Change it only through `brand/tools/build_brand.py`**, then regenerate
  `logoGeometry.ts` so the app and brand files never drift.
- Never stretch, rotate, recolour, add effects, or put the mark in a shield.

### 7.8 Layout

- **Mobile (< 900 px):** full-bleed map, floating top bar (brand, language,
  locate), icon legend, bottom sheet (peek 232 px / 78 vh, drag the handle or
  tap it), bottom nav with SOS raised in the centre and captioned "Hold".
- **Desktop (≥ 900 px):** 420 px side panel (brand bar, segmented tabs,
  scrolling content), map to the right, zoom control, floating SOS bottom
  right with "Hold for SOS".

---

## 8. Motion

### 8.1 Frequency gate (decide in this order)

| How often it is seen | Motion allowed |
|---|---|
| 100+ times a day (tab switch, typing, scroll) | Cross-fade ≤ 160 ms or nothing. Tabs never slide. |
| Tens a day (press, select) | ≤ 150 ms, `scale(0.97–0.98)` on press, colour transitions |
| Occasional (sheet, toast, dialog, route results) | Springs `stiffness 380–520, damping 32–40` |
| Rare (intro, SOS, report saved) | The signature moments below |

### 8.2 Signature moments (keep, don't multiply)

1. **Intro** (once per session, ≤ 1.9 s, tap/key skips): the eight crescents
   arrive one by one while the ring turns 40° into place, the figure rises,
   the bindi lands last; wordmark letters open from `wdth 75` to `100`,
   Devanagari tracks in.
2. **SOS hold ring**: linear fill over 1.5 s, springs back if released.
3. **Countdown digits**: each number rises in while widening `wdth 75 → 100`.
4. **Route draw-on**: selected route traces from start to end (900 ms).
5. **Report ripple**: two rings expand from the saved pin.
6. **Kinetic panel titles**: `wdth 76 → 100` on mount.

### 8.3 Rules

- Animate `transform`, `opacity`, `stroke-dashoffset`, `font-variation-settings` only.
- Easing for non-spring timing: `cubic-bezier(0.22, 1, 0.36, 1)` (out). Never
  ease-in on entrances. Exits faster than entrances.
- Nothing loops at idle except the user-location ring (2.4 s, low opacity)
  and the active-SOS beacon. The SOS button does **not** pulse at rest:
  calm wins over attention-grabbing.
- `prefers-reduced-motion: reduce` must collapse everything to fades
  (MotionConfig + the CSS block at the end of `global.css`).
- Never put a framer `layoutId` element inside a tab panel. Once it has
  animated, the panel never finishes its exit and the next tab stays blank.
  `Segmented` slides its thumb with CSS for this reason. `layoutId` is fine in
  the nav and panel tabs, which never unmount.

---

## 9. UX for someone who is scared

- One primary action per screen, visually dominant, bottom-reachable.
- SOS is on every screen, in the same place, captioned, and needs a hold,
  not a tap. A cancel window always follows.
- In the active SOS sheet, "Call 112" is first and receives focus.
- Copy is short and steady: "SOS is on", "I'm safe now". Never "Danger!",
  never exclamation marks, never blame.
- Empty states show what to do next in one line.
- Errors say what happened and what still works ("Helplines still work offline").
- Long names wrap (2-line clamp), never overflow or hide the action buttons.
- Test with: screen at 320 px wide, font size 200 %, one thumb, dark mode.

---

## 10. Copy and i18n

- All UI strings live in `src/lib/i18n.ts`. `en` is complete; `mr` and `hi`
  override what they translate and fall back to English.
- Sentence case. Plain verbs. **No em dashes.** No filler words. Avoid
  "AI-sounding" vocabulary (seamless, empower, elevate, unlock, journey...).
- An action keeps one name end to end:

| Button | Result toast |
|---|---|
| Save report | Report saved. Risk map updated. |
| Start trip | Trip started. Put the phone away. |
| Yes, I'm safe | Okay. Watching quietly again. |
| I'm safe now | SOS ended |

- New string: add the key to `en`, then `mr` and `hi` when the translation is
  checked by a native speaker. Unchecked machine translation is worse than English.
- Switching language sets `<html lang>`; Devanagari renders in Anek/Mukta.

---

## 11. Accessibility checklist (per change)

- [ ] Keyboard: every control reachable, visible focus ring (`--focus`), Esc closes overlays.
- [ ] SOS dialogs use `role="alertdialog"`, `aria-modal`, live regions for countdown/location.
- [ ] Contrast ≥ 4.5:1 for text in both themes (check `-ink` on `-soft` pairs).
- [ ] Targets ≥ 44 px. No text below 12 px.
- [ ] Icons have labels where they are the only content.
- [ ] Works with reduced motion and at 200 % zoom without horizontal scroll.

---

## 12. How to…

**Add a report category:** `ReportCategory` in `types.ts` → `SEVERITY` in
`risk.ts` → `CATS` (icon) in `ReportPanel.tsx` → `report.cat.*` strings →
`CAT_TEXT` in `complaint.ts` → the `check` constraint in `supabase/schema.sql`.

**Add a risk signal:** extend `RiskSignals`, give it a weight in `WEIGHTS`,
compute it in `scoreCell` returning `null` when unavailable, document it in
§5.2 and §6. A static layer goes in `pipeline/build_place_grid.mjs` as one
short key per hex, and into `StaticGrid`.

**Cover another city:** add a region to `REGIONS` in
`pipeline/build_place_grid.mjs` (small fetch tiles, plus the boxes it is
valid for), then `npm run grid -- --region <name>`. The app reads `cover`
from the file, so nothing else changes.

**Add a language:** add the `Lang` union member, a dict in `i18n.ts`,
`langLabels`/`langNames`, and check fonts cover the script.

**Add a tab:** avoid it. Four tabs + SOS is the ceiling for a stressed user.
Prefer a section inside an existing tab.

---

## 13. Verification loop

1. `npm run typecheck && npm run build`, zero errors, no new warnings.
2. `npm run preview`, then check at 390 × 844 (mobile) and 1440 × 900
   (desktop), light and dark: Routes (empty, results), Help, Report (tile
   selected), Trip (active), SOS (hold, countdown, active).
3. Screenshot with Playwright (Chromium is at `/opt/pw-browsers`). Intercept
   tiles/Overpass/OSRM/Nominatim with fixtures when offline.
4. On a real phone over HTTPS: `tel:112` opens the dialer, `sms:` pre-fills
   all contacts, location permission prompt appears once.
5. Look for: overflowing text, clipped buttons, wrong-theme flashes, motion
   that plays when reduce-motion is on.

---

## 14. Deploy (free)

Any static host. Build command `npm run build`, output `dist/`.

- **Vercel / Netlify:** import the repo, set env vars from `.env.example` if used.
- **Azure Static Web Apps (free plan):** app location `/`, output `dist`.
- The service worker only caches same-origin files; never cache tiles or APIs.

---

## 15. Known limits (web)

- Browsers pause GPS and timers when the tab is closed or the phone locks
  (especially iOS). Trip check-ins and live location need the app open.
  A native app is the post-pilot path for background protection.
- `sms:` cannot send silently; the user taps send.
- The alarm and fake-call ring are only as loud as the phone's media volume,
  and a silent switch can mute them on iOS.
- Public OSM routing servers are best-effort; show the error state, never hang.
- Earphone SOS depends on the browser passing headset buttons to a page
  playing silent audio. It is checked in code and in a desktop browser, not
  yet on real phones and headsets. Test on devices before relying on it.
- The sealed trail's server function is written and its rules are tested
  against a stand-in, but it has not run on a live Supabase project yet.
- The no-way-out and people layers exist only for Greater Mumbai and Thane.
  Elsewhere the map falls back to mapped places and says the score is a guess.

---

## 16. Don't

- Don't add face recognition, person tracking, offender lists or any "who is
  dangerous" feature. See §1.
- Don't put anything between the SOS hold and `tel:112`.
- Don't add gradients, shadows, glows, glassmorphism, emoji, or a second accent colour.
- Don't make the SOS button pulse at rest or make tabs slide.
- Don't store location history or send user identifiers with reports. The
  sealed trail is the single exception and only on the terms in §5.6.
- Don't add a recurring check-in, a timer she has to reset, or any prompt
  that fires just because she stopped. See §1, rule 6.
- Don't let "no reports" lower a score, or paint an unmapped area as dangerous.
- Don't ship demo data unlabelled.
- Don't use em dashes in UI copy or docs.
