/**
 * Journey profile: what a route is like metre by metre, so she can see the
 * quiet stretches, the gaps between open places and the turns before she
 * leaves. Describes places and times only.
 */
import { haversine, samplePolyline } from './geo';
import { cellAt, factorsAlong, level, scoreCell, buildContext, REPORT_PULL, WEIGHTS, type RiskLevel } from './risk';
import type { LatLng, Poi, RiskSignals, RouteOption } from './types';

type Ctx = ReturnType<typeof buildContext>;

/** Metres between profile points. */
export const STEP_M = 40;
/** A place counts as on the way if it is this close to the route. */
const NEAR_M = 70;
/** Score from which a stretch counts as quiet and the trip shield watches closely (risk level 3). */
export const WATCH_SCORE = 55;
/** Shorter runs than this are noise, not a stretch. */
const MIN_STRETCH_M = 80;
/** How far she should have to walk to a place to wait. */
const WAIT_RADIUS_M = 300;
/** From this no-way-out value a point counts as part of a stretch with no side turn. */
const NO_EXIT = 0.5;
/** How far back from the hardest part to look for a place she could stop at first. */
const BEFORE_M = 400;
/** A signal has to average this much over the hardest part to be named as a reason. */
const REASON_MIN: Partial<Record<keyof RiskSignals, number>> = { noExit: 0.5, isolation: 0.6, helpFar: 0.5, reports: 0.05, darkness: 0.5 };

export type Stretch = { fromM: number; lengthM: number };
export type Turn = { atM: number; dir: 'left' | 'right' };
/** The stretch of a route that asks the most of her, why, and the last open place before it. */
export type Hardest = Stretch & { at: LatLng; why: Array<keyof RiskSignals>; before: Poi | null };

export type Journey = {
  points: LatLng[];
  scores: number[];
  levels: RiskLevel[];
  /** Time factor at each point: above 1 means dusk, dawn or night by then. */
  factors: number[];
  quiet: Stretch[];
  hardest: Hardest | null;
  /** Longest stretch with no side turn. Null where the road layer does not reach. */
  exitM: number | null;
  /** Whether a place with people sits beside the route at each point. */
  stops: boolean[];
  /** Longest stretch with no such place. Null while the places have not loaded. */
  gapM: number | null;
  /** The gap counted only places likely open after dark. */
  late: boolean;
  turns: Turn[];
};

/** How much a signal moves the score, for ordering the reasons. */
const pull = (k: keyof RiskSignals) => (k === 'reports' ? REPORT_PULL : WEIGHTS[k]);

/** A place she could step into: police and hospitals always, other places by day, only late ones at night. */
const isRefuge = (p: Poi, night: boolean) => p.kind !== 'activity' || !night || Boolean(p.late);

/** Runs of consecutive points that pass `test`, at least `minM` long. */
function runs(n: number, test: (i: number) => boolean, minM: number): Stretch[] {
  const out: Stretch[] = [];
  let run = -1;
  for (let i = 0; i <= n; i++) {
    const on = i < n && test(i);
    if (on && run < 0) run = i;
    if (!on && run >= 0) {
      const lengthM = (i - run) * STEP_M;
      if (lengthM >= minM) out.push({ fromM: run * STEP_M, lengthM });
      run = -1;
    }
  }
  return out;
}

export function buildJourney(route: RouteOption, ctx: Ctx, pois: Poi[]): Journey {
  const points = samplePolyline(route.coords, STEP_M);
  const factors = factorsAlong(ctx, route.durationS, points.length);
  const cells = points.map((p, i) => scoreCell(cellAt(p), ctx, factors[i]));
  const scores = cells.map((c) => c.score);

  const quiet = runs(scores.length, (i) => scores[i] >= WATCH_SCORE, MIN_STRETCH_M);
  const noExit = runs(cells.length, (i) => (cells[i].signals.noExit ?? 0) >= NO_EXIT, MIN_STRETCH_M);

  const open = pois.filter((p) => isRefuge(p, ctx.night));
  const beside = (pt: LatLng, p: Poi) => Math.abs(p.lat - pt.lat) < 0.001 && Math.abs(p.lng - pt.lng) < 0.001 && haversine(pt, p) <= NEAR_M;
  const stops = points.map((pt) => open.some((p) => beside(pt, p)));
  let gap = 0;
  let since = 0;
  for (const s of stops) {
    since = s ? 0 : since + 1;
    gap = Math.max(gap, since);
  }

  // The hardest part is the quiet stretch that adds up to the most risk, not simply the longest.
  let hardest: Hardest | null = null;
  let worst = 0;
  for (const q of quiet) {
    const a = q.fromM / STEP_M;
    const b = a + q.lengthM / STEP_M;
    const sum = scores.slice(a, b).reduce((x, y) => x + y, 0);
    if (sum <= worst) continue;
    worst = sum;
    const mean = (k: keyof RiskSignals) => cells.slice(a, b).reduce((x, c) => x + (c.signals[k] ?? 0), 0) / (b - a);
    const why = (Object.keys(REASON_MIN) as Array<keyof RiskSignals>)
      .filter((k) => mean(k) >= REASON_MIN[k]!)
      .sort((x, y) => pull(y) * mean(y) - pull(x) * mean(x))
      .slice(0, 2);
    // Walk back from the start of the stretch to the nearest place she could find by name.
    let before: Poi | null = null;
    for (let i = a; i >= Math.max(0, a - BEFORE_M / STEP_M) && !before; i--) {
      before = open.find((p) => (p.kind !== 'activity' || p.name) && beside(points[i], p)) ?? null;
    }
    hardest = { ...q, at: points[Math.floor((a + b) / 2)], why, before };
  }

  return {
    points,
    scores,
    levels: scores.map(level),
    factors,
    quiet,
    hardest,
    exitM: cells.some((c) => c.signals.noExit !== null) ? Math.max(0, ...noExit.map((s) => s.lengthM)) : null,
    stops,
    // No activity places at all means the full set has not loaded, not that the street is empty.
    gapM: ctx.activity.size ? gap * STEP_M : null,
    late: ctx.night,
    turns: routeTurns(route.coords),
  };
}

/** Real turns along a route, from its shape alone: where the heading swings by 50 degrees or more. */
export function routeTurns(coords: [number, number][]): Turn[] {
  const step = 20;
  const pts = samplePolyline(coords, step);
  const bearing = (a: LatLng, b: LatLng) =>
    (Math.atan2((b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180), b.lat - a.lat) * 180) / Math.PI;
  const turns: Turn[] = [];
  let last = -10;
  for (let i = 2; i < pts.length - 2; i++) {
    const swing = ((bearing(pts[i], pts[i + 2]) - bearing(pts[i - 2], pts[i]) + 540) % 360) - 180;
    // One corner shows up at several neighbouring points; keep the first.
    if (Math.abs(swing) < 50 || i - last <= 3) continue;
    turns.push({ atM: i * step, dir: swing > 0 ? 'right' : 'left' });
    last = i;
  }
  return turns;
}

/**
 * Best place to wait near `origin`: an open place on low-risk ground, close by.
 * Police and hospitals are preferred. Unnamed shops are skipped so she can find it.
 */
export function waitSpot(origin: LatLng, pois: Poi[], ctx: Ctx): (Poi & { d: number }) | null {
  let best: (Poi & { d: number }) | null = null;
  let bestCost = Infinity;
  for (const p of pois) {
    if (!isRefuge(p, ctx.night) || (p.kind === 'activity' && !p.name)) continue;
    const d = haversine(origin, p);
    if (d > WAIT_RADIUS_M) continue;
    const cost = scoreCell(cellAt(p), ctx).score + d / 10 - (p.kind === 'activity' ? 0 : 15);
    if (cost < bestCost) {
      bestCost = cost;
      best = { ...p, d };
    }
  }
  return best;
}
