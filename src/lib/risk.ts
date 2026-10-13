import { cellToLatLng, gridDisk, latLngToCell } from 'h3-js';
import { config } from './config';
import { haversine } from './geo';
import { sunTimes } from './sun';
import type { LatLng, PlanWhen, Poi, Rain, Report, ReportCategory, RiskCell, RiskSignals } from './types';

/**
 * Risk engine. Tracks places and times, never people.
 *
 * place = Σ wᵢ·signalᵢ / Σ wᵢ   over the place signals that are present
 * score = 100 * clamp( (place + (1 - place) × REPORT_PULL × reports) × timeFactor )
 *
 * Signals are 0..1 where 1 = less safe. A missing place signal is skipped and
 * the remaining weights are renormalised, so the map degrades gracefully when
 * a data source is unavailable (no pipeline file, Overpass down).
 *
 * Reports only ever raise a score. No reports is not proof of safety: it may
 * just mean nobody here uses the app yet, so it must not pull a score down.
 */

export type PlaceSignal = Exclude<keyof RiskSignals, 'reports'>;

export const WEIGHTS: Record<PlaceSignal, number> = {
  darkness: 0.2,
  isolation: 0.2,
  areaCrime: 0.15,
  helpFar: 0.1,
  noExit: 0.15,
};

/** How far many recent, severe reports close the gap between the place score and 1. */
export const REPORT_PULL = 0.55;
/**
 * Place signals alone never fill the scale. With no reports, the emptiest
 * stretch reads moderate in daylight and reaches high only after dark.
 */
const PLACE_CEIL = 0.7;

export const SEVERITY: Record<ReportCategory, number> = {
  harassment: 1,
  followed: 1,
  unsafe_transport: 0.8,
  poor_lighting: 0.6,
  isolated: 0.6,
  other: 0.5,
};

/** Reports lose half their weight every 21 days. */
const HALF_LIFE_MS = 21 * 24 * 3600 * 1000;

/**
 * Static layers produced by /pipeline, per hex. Optional.
 * dark, crime: night lights and the NCRB district baseline.
 * x: no way out, 0..1. p: people living in the hex and its ring.
 */
export type StaticGrid = Record<string, { dark?: number; crime?: number; x?: number; p?: number }>;
/** `cover` lists the [south, west, north, east] boxes the x and p layers were built for. */
export type StaticData = { cells: StaticGrid; cover: number[][] };

/** People living in a hex and its ring that make a street lived-in: about 14,000 per km². */
const PEOPLE_FULL = 1500;
/** Homes put eyes and ears on a street, but fewer than open shops do, and fewer still once people are indoors for the night. */
const HOME_WEIGHT = 0.5;
const HOME_WEIGHT_NIGHT = 0.3;
/** This many residents with no place on the map nearby means the shops are unmapped, not absent. */
const BLIND_PEOPLE = 300;
/** Where nothing is mapped and there is no population layer, emptiness is a guess and counts for this much. */
const UNSURE_ISOLATION = 0.6;
/** Rain this heavy (mm in the hour) empties a street about as far as it will. */
const RAIN_HEAVY_MM = 4;
/** Share of the people outdoors that heavy rain sends inside. */
const RAIN_EMPTIES = 0.4;

/** How long after sunset, and before sunrise, the streets still count as dusk and dawn. */
const DUSK_MS = 2 * 3600e3;
const DAWN_MS = 1.5 * 3600e3;

/**
 * 1.00 by day, 1.15 at dusk and dawn, 1.35 at night. The bands follow the
 * real sun at `at`, so a 6:30 pm walk in winter is scored as dark.
 */
export function timeFactor(d = new Date(), at: LatLng = config.defaultCenter) {
  const sun = sunTimes(d, at);
  if (!sun) {
    const h = d.getHours();
    return h >= 21 || h < 5 ? 1.35 : h >= 19 || h < 7 ? 1.15 : 1;
  }
  const t = d.getTime();
  const rise = sun.sunrise.getTime();
  const set = sun.sunset.getTime();
  if (t >= rise && t < set) return 1;
  if ((t >= set && t < set + DUSK_MS) || (t < rise && t >= rise - DAWN_MS)) return 1.15;
  return 1.35;
}

/**
 * Time factor at each of `n` points of a trip that starts at the scored time
 * and takes `durationS`. A route is judged for when she will be on each part
 * of it, so a walk that starts in daylight and ends after dark shows it.
 */
export function factorsAlong(ctx: Context, durationS: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => timeFactor(new Date(ctx.at + (i / Math.max(1, n - 1)) * durationS * 1000), ctx.place));
}

/** The clock time the map is scored for, so tonight's walk can be checked this afternoon. */
export function planDate(when: PlanWhen, now = new Date()) {
  if (when === 'now') return now;
  const d = new Date(now);
  d.setHours(when === 'day' ? 12 : when === 'dusk' ? 20 : 23, 0, 0, 0);
  return d;
}

export function isNight(d = new Date()) {
  const h = d.getHours();
  return h >= 20 || h < 6;
}

/** Millimetres of rain forecast for the hour that holds `t`. 0 when there is no forecast for it. */
export function rainAt(rain: Rain | null, t: number) {
  if (!rain) return 0;
  for (let i = rain.at.length - 1; i >= 0; i--) {
    if (rain.at[i] <= t) return t - rain.at[i] < 3600e3 ? rain.mm[i] : 0;
  }
  return 0;
}

/** Spread a value over a hex and its two rings: 1, 0.55, 0.25. Smooths the map. */
function spread(m: Map<string, number>, c: string, w: number) {
  const ring1 = new Set(gridDisk(c, 1));
  for (const n of gridDisk(c, 2)) {
    const f = n === c ? 1 : ring1.has(n) ? 0.55 : 0.25;
    m.set(n, (m.get(n) ?? 0) + w * f);
  }
}

type Context = {
  reportHeat: Map<string, number>;
  activity: Map<string, number>;
  help: Poi[];
  staticData: StaticData | null;
  tf: number;
  night: boolean;
  /** 0 dry to 1 heavy rain at the scored hour. */
  wet: number;
  /** The moment and place the context is scored for. */
  at: number;
  place: LatLng;
};

export function buildContext(
  reports: Report[],
  pois: Poi[],
  staticData: StaticData | null,
  now = new Date(),
  place: LatLng = config.defaultCenter,
  rain: Rain | null = null,
): Context {
  const res = config.h3Resolution;
  const reportHeat = new Map<string, number>();
  for (const r of reports) {
    const age = Math.max(0, now.getTime() - r.at);
    const w = SEVERITY[r.category] * Math.pow(0.5, age / HALF_LIFE_MS);
    spread(reportHeat, latLngToCell(r.lat, r.lng, res), w);
  }
  const activity = new Map<string, number>();
  const help: Poi[] = [];
  for (const p of pois) {
    if (p.kind === 'activity') {
      spread(activity, latLngToCell(p.lat, p.lng, res), 1);
    } else help.push(p);
  }
  return {
    reportHeat,
    activity,
    help,
    staticData,
    tf: timeFactor(now, place),
    night: isNight(now),
    wet: Math.min(1, rainAt(rain, now.getTime()) / RAIN_HEAVY_MM),
    at: now.getTime(),
    place,
  };
}

/** `tf` overrides the context's time factor, for scoring a point at a later moment of a trip. */
export function scoreCell(h3: string, ctx: Context, tf = ctx.tf): RiskCell {
  const [lat, lng] = cellToLatLng(h3);
  const heat = ctx.reportHeat.get(h3) ?? 0;
  const st = ctx.staticData?.cells[h3];
  const covered =
    st !== undefined || Boolean(ctx.staticData?.cover.some((b) => lat >= b[0] && lat <= b[2] && lng >= b[1] && lng <= b[3]));
  // Inside the area the pipeline covered, a hex missing from the file has no road and nobody
  // living near it: open ground or water. Nowhere she walks, so it is left blank unless reported.
  if (covered && st === undefined && heat === 0) {
    return { h3, score: 0, signals: { reports: 0, darkness: null, isolation: null, areaCrime: null, helpFar: null, noExit: null } };
  }

  let helpFar: number | null = null;
  // No activity POIs at all means the full set has not loaded, not that the area is empty.
  const mapped = ctx.activity.size ? (ctx.activity.get(h3) ?? 0) : null;
  // Shops and stalls close at night, and rain sends people indoors.
  const places = mapped === null ? null : Math.min(1, (mapped * (ctx.night ? 0.45 : 1) * (1 - RAIN_EMPTIES * ctx.wet)) / 5);
  const people = covered ? (st?.p ?? 0) : null;
  const homes = people === null ? null : Math.min(1, people / PEOPLE_FULL) * (ctx.night ? HOME_WEIGHT_NIGHT : HOME_WEIGHT);
  // Outside the pipeline's area there is no way to tell an empty street from an unmapped one.
  const thin = !covered && mapped === 0;
  const isolation = thin ? UNSURE_ISOLATION : places === null && homes === null ? null : 1 - Math.max(places ?? 0, homes ?? 0);
  if (ctx.help.length) {
    let best = Infinity;
    for (const p of ctx.help) best = Math.min(best, haversine({ lat, lng }, p));
    helpFar = Math.min(1, best / 2500);
  }

  const signals: RiskSignals = {
    reports: Math.min(1, heat / 2),
    darkness: st?.dark ?? null,
    isolation,
    areaCrime: st?.crime ?? null,
    helpFar,
    noExit: covered ? (st?.x ?? 0) : null,
  };

  let num = 0;
  let den = 0;
  for (const k of Object.keys(WEIGHTS) as PlaceSignal[]) {
    const v = signals[k];
    if (v === null) continue;
    num += WEIGHTS[k] * v;
    den += WEIGHTS[k];
  }
  const place = den === 0 ? 0 : (num / den) * PLACE_CEIL;
  const base = place + (1 - place) * REPORT_PULL * (signals.reports ?? 0);
  const score = Math.round(Math.min(1, base * tf) * 100);
  const cell: RiskCell = { h3, score, signals };
  if (mapped === 0 && (people ?? 0) >= BLIND_PEOPLE) cell.blind = true;
  if (thin) cell.thin = true;
  if (ctx.wet >= 0.5 && (mapped ?? 0) > 0) cell.wet = true;
  return cell;
}

export function buildGrid(center: LatLng, ctx: Context, rings = config.gridRings): RiskCell[] {
  const c = latLngToCell(center.lat, center.lng, config.h3Resolution);
  return gridDisk(c, rings).map((h) => scoreCell(h, ctx));
}

export function cellAt(p: LatLng) {
  return latLngToCell(p.lat, p.lng, config.h3Resolution);
}

export type RiskLevel = 0 | 1 | 2 | 3 | 4;
export function level(score: number): RiskLevel {
  if (score < 20) return 0;
  if (score < 38) return 1;
  if (score < 55) return 2;
  if (score < 72) return 3;
  return 4;
}

export function riskLabelKey(score: number) {
  return score < 35 ? 'map.risk.low' : score < 60 ? 'map.risk.moderate' : 'map.risk.high';
}
