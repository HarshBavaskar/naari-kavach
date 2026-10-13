/**
 * Quiet shield. While a trip is on, the app protects with the phone put away:
 *
 * - It never asks on a timer. Stopping at a shop, a signal or a bus stop is
 *   not a reason to make her take the phone out.
 * - It asks only when something looks wrong: a long stop on high-risk ground,
 *   a walk that turns into vehicle speed, a ride that keeps heading away from
 *   the destination, or being late and no longer moving.
 * - Walking on answers a question about standing still. Nothing to tap.
 * - A stop she has said is fine is not asked about again.
 *
 * Works on her own live position only; nothing here is stored.
 */
import { distanceToPolyline, haversine, mapsLink, samplePolyline } from './geo';
import { translate, type TKey } from './i18n';
import { routeTurns, WATCH_SCORE, type Turn } from './journey';
import { hhmm, vibrate } from './sos';
import { say } from './sound';
import { getState, setState, toast, type CheckInWhy, type Trip } from './store';
import { trailAdd, trailEnd } from './trail';
import type { LatLng } from './types';

/** Metres that count as real movement, above normal GPS jitter. */
const MOVE_M = 35;
/** Metres from the chosen route before she counts as off it. */
const OFF_ROUTE_M = 150;
/** Metres from the route end that count as arrived. */
const ARRIVE_M = 60;
/** A fix vaguer than this cannot show movement. */
const MAX_ACCURACY_M = 100;
/** With no usable fix for this long, the shield cannot see her and says so. */
const QUIET_MS = 2 * 60e3;
/** Late means half as long again as the route estimate, and at least this much over. */
const LATE_FACTOR = 1.5;
const LATE_MIN_MS = 5 * 60e3;
/** Late but still moving is only late. It asks once she has also stood still this long, and looks again this often. */
const LATE_STILL_MS = 2 * 60e3;
const LATE_RECHECK_MS = 5 * 60e3;
/** Stopped this long on high-risk ground before it asks. Sooner off her route, or after she said it feels off. */
const STILL_MS = 4 * 60e3;
const STILL_CLOSE_MS = 2.5 * 60e3;
/** A stop she has answered for is not asked about again within this distance. */
const SAME_SPOT_M = 80;
/** Faster than anyone walks or runs for long: 7 m/s is 25 km/h. Held this long and this far, it is a vehicle. */
const FAST_MPS = 7;
const FAST_HOLD_MS = 15e3;
const FAST_MIN_M = 150;
/** A ride is heading away once it is this much farther from the destination than its closest point, for this long. */
const AWAY_M = 400;
const AWAY_HOLD_MS = 60e3;
/** Give a turn cue from this far before the corner, and still give it if a sparse fix lands just past it. */
const CUE_AHEAD_M = 45;
const CUE_PAST_M = 30;
const CUE_STEP_M = 20;

type Fix = LatLng & { at: number };

let lastFixAt = 0;
let prev: Fix | null = null;
let fastFrom: Fix | null = null;
let fastHits = 0;
let closest: { d: number; at: number } | null = null;
let cues: { routeId: string; pts: LatLng[]; turns: Turn[]; done: Set<number> } | null = null;

/** Risk score under a point right now. App sets this from the live risk map. */
let riskAt: (p: LatLng) => number = () => 0;
export function tripSetRisk(fn: (p: LatLng) => number) {
  riskAt = fn;
}

/** Starts a trip. With a route selected it also knows the destination, arrival time and travel mode. */
export function startTrip(uneasy = false) {
  const s = getState();
  const route = s.routes.find((r) => r.id === s.selectedRouteId);
  const now = Date.now();
  const eta = route ? route.durationS * 1000 : 0;
  prev = fastFrom = closest = cues = null;
  fastHits = 0;
  setState({
    trip: {
      startedAt: now,
      stillSince: now,
      destinationLabel: route && s.dest?.kind === 'place' ? s.dest.place.label : undefined,
      etaAt: route ? now + eta : undefined,
      lateAt: route ? now + Math.max(eta * LATE_FACTOR, eta + LATE_MIN_MS) : undefined,
      mode: route ? s.travelMode : undefined,
      uneasy,
      shield: uneasy ? 'watch' : 'calm',
    },
    checkInDue: false,
    tripDone: null,
  });
  toast(translate(s.lang, uneasy ? 'trip.uneasyOn' : 'trip.started'));
}

export function endTrip(arrived = false) {
  const s = getState();
  if (!s.trip) return;
  // The sealed trail is deleted the moment the trip ends: there is nothing left to open.
  trailEnd();
  setState({ trip: null, checkInDue: false, tripDone: s.trip.told ? { label: s.trip.destinationLabel } : null });
  toast(translate(s.lang, arrived ? 'trip.arrived' : 'trip.ended'), arrived ? 'ok' : 'info');
}

/**
 * "Something feels off": one tap, then nothing more to do. The shield watches
 * closely wherever she is, and a trip starts if none is on.
 */
export function tripFeelsOff(on = true) {
  const s = getState();
  if (!s.trip) {
    if (on) startTrip(true);
    return;
  }
  // The tap itself shows she is all right this second, so the stop is timed from now.
  setState({ trip: { ...s.trip, uneasy: on, shield: on ? 'watch' : s.trip.shield, stillSince: Date.now() } });
  toast(translate(s.lang, on ? 'trip.uneasyOn' : 'trip.uneasyOff'), 'info');
}

/** She said she is fine here: remember the spot so this stop is not questioned again. */
export function tripSafe() {
  const s = getState();
  const trip = s.trip;
  if (trip) {
    const okSpots = trip.anchor ? [...(trip.okSpots ?? []), trip.anchor] : trip.okSpots;
    setState({ trip: { ...trip, okSpots, stillSince: Date.now() } });
  }
  setState({ checkInDue: false });
  toast(translate(s.lang, 'trip.checked'));
}

/**
 * True once a walk has held vehicle speed long and far enough. One fast
 * reading is never enough: a single bad GPS position looks exactly like that.
 */
function walkGoneFast(here: Fix) {
  const last = prev;
  if (last && here.at - last.at < 2000) return false;
  prev = here;
  const fast = last && here.at - last.at <= 60e3 && haversine(last, here) / ((here.at - last.at) / 1000) >= FAST_MPS;
  if (!last || !fast) {
    fastFrom = null;
    fastHits = 0;
    return false;
  }
  fastFrom ??= last;
  fastHits++;
  return fastHits >= 2 && here.at - fastFrom.at >= FAST_HOLD_MS && haversine(fastFrom, here) >= FAST_MIN_M;
}

/** True once a ride has kept getting farther from the destination. Drivers take other roads; they do not drive away. */
function rideGoneAway(here: Fix, end: LatLng) {
  const d = haversine(here, end);
  if (!closest || d <= closest.d) {
    closest = { d, at: here.at };
    return false;
  }
  return d - closest.d >= AWAY_M && here.at - closest.at >= AWAY_HOLD_MS;
}

/** Pocket guide: buzz and speak when a turn is just ahead. Two short buzzes for left, one long for right. */
function turnCue(here: LatLng, route: { id: string; coords: [number, number][] }): Trip['cue'] {
  if (cues?.routeId !== route.id) {
    cues = { routeId: route.id, pts: samplePolyline(route.coords, CUE_STEP_M), turns: routeTurns(route.coords), done: new Set() };
  }
  let nearest = 0;
  let best = Infinity;
  cues.pts.forEach((p, i) => {
    const d = haversine(here, p);
    if (d < best) {
      best = d;
      nearest = i;
    }
  });
  const along = nearest * CUE_STEP_M;
  const i = cues.turns.findIndex((t, k) => !cues!.done.has(k) && t.atM - along <= CUE_AHEAD_M && t.atM - along >= -CUE_PAST_M);
  if (i < 0) return undefined;
  cues.done.add(i);
  const dir = cues.turns[i].dir;
  vibrate(dir === 'left' ? [150, 120, 150] : [500]);
  say(translate(getState().lang, dir === 'left' ? 'pocket.left' : 'pocket.right'));
  return { dir, at: Date.now() };
}

function ask(why: CheckInWhy, patch: Partial<Trip> = {}) {
  const trip = getState().trip;
  if (!trip) return;
  setState({ checkInDue: true, checkInWhy: why, trip: { ...trip, ...patch } });
  vibrate([300, 150, 300]);
}

/** Call on every location update. `at` is the time of the fix. */
export function tripOnMove(loc: LatLng & { accuracy?: number }, at = Date.now()) {
  if ((loc.accuracy ?? 0) > MAX_ACCURACY_M) return;
  lastFixAt = Date.now();
  const s = getState();
  const trip = s.trip;
  if (!trip || s.sos !== 'idle') return;
  const here: Fix = { lat: loc.lat, lng: loc.lng, at };
  const spot = { lat: here.lat, lng: here.lng };
  const moved = !trip.anchor || haversine(trip.anchor, spot) >= MOVE_M;

  if (s.checkInDue) {
    // Walking on answers a question about standing still. A question about speed or direction needs her.
    if (moved && trip.anchor && s.checkInWhy !== 'fast' && s.checkInWhy !== 'away') {
      setState({ checkInDue: false, trip: { ...trip, anchor: spot, stillSince: Date.now() } });
      toast(translate(s.lang, 'trip.movedOn'));
    }
    return;
  }

  const route = s.routes.find((r) => r.id === s.selectedRouteId);
  const end = route && { lat: route.coords[route.coords.length - 1][0], lng: route.coords[route.coords.length - 1][1] };
  if (end && haversine(here, end) < ARRIVE_M) return endTrip(true);

  if (trip.mode === 'walk' && !trip.fastAsked && walkGoneFast(here)) return ask('fast', { fastAsked: true });
  if (trip.mode === 'ride' && end && !trip.awayAsked && rideGoneAway(here, end)) return ask('away', { awayAsked: true });

  // A ride may take any road, so only a walk is held to the chosen route.
  const offRoute = route && trip.mode !== 'ride' ? distanceToPolyline(here, route.coords) > OFF_ROUTE_M : false;
  if (offRoute && !trip.offRoute) toast(translate(s.lang, 'trip.offRoute'), 'warn');

  const shield = trip.uneasy || riskAt(here) >= WATCH_SCORE ? 'watch' : 'calm';
  // The ground can turn high-risk under someone who has not moved, when night falls. Time the stop from then.
  const entered = shield === 'watch' && trip.shield !== 'watch';
  if (entered) toast(translate(s.lang, 'trip.watch'), 'info');

  const cue = trip.guide && route && !offRoute ? turnCue(here, route) : undefined;
  if (!moved && !cue && offRoute === Boolean(trip.offRoute) && shield === (trip.shield ?? 'calm')) return;
  if (moved) void trailAdd(spot);

  setState({
    trip: {
      ...trip,
      anchor: moved ? spot : trip.anchor,
      stillSince: moved || entered ? Date.now() : trip.stillSince,
      offRoute,
      shield,
      cue: cue ?? trip.cue,
    },
  });
}

/** Call every second. Asks only when a stop or a late arrival looks wrong. */
export function tripTick() {
  const s = getState();
  const trip = s.trip;
  if (!trip || s.checkInDue || s.sos !== 'idle') return;
  const now = Date.now();
  const seen = tripHasSignal();
  const stillMs = now - trip.stillSince;

  if (trip.lateAt && !trip.lateAsked && now >= trip.lateAt) {
    if (seen && stillMs < LATE_STILL_MS) setState({ trip: { ...trip, lateAt: now + LATE_RECHECK_MS } });
    else ask('late', { lateAsked: true });
    return;
  }
  // Without a live position a stop cannot be told from a lost signal, so it stays quiet.
  if (!seen || trip.shield !== 'watch' || !trip.anchor) return;
  if (trip.okSpots?.some((p) => haversine(p, trip.anchor!) < SAME_SPOT_M)) return;
  if (stillMs >= (trip.offRoute || trip.uneasy ? STILL_CLOSE_MS : STILL_MS)) ask(trip.offRoute ? 'route' : 'still');
}

/** Whether live location is feeding the trip right now. */
export function tripHasSignal() {
  return Date.now() - lastFixAt < QUIET_MS;
}

/* ---------------- Messages for trusted contacts ---------------- */

/** "I am heading to X, arriving by 21:40, here now: link". Built from whole sentences so it translates. */
export function tripStartText() {
  const s = getState();
  const t = (k: TKey, v?: Record<string, string | number>) => translate(s.lang, k, v);
  const trip = s.trip;
  const parts = [
    trip?.destinationLabel && trip.etaAt
      ? t('trip.msg.startTo', { place: trip.destinationLabel, time: hhmm(new Date(trip.etaAt)) })
      : t('trip.msg.start'),
  ];
  if (s.userLoc) parts.push(t('trip.msg.here', { link: mapsLink(s.userLoc) }));
  if (trip?.trail) parts.push(t('trip.msg.trail', { link: trip.trail.link, time: hhmm(new Date(trip.trail.opensAt)) }));
  parts.push(t('trip.msg.sign'));
  return parts.join(' ');
}

export function tripArrivedText(place?: string) {
  const lang = getState().lang;
  return `${place ? translate(lang, 'trip.msg.arrivedAt', { place }) : translate(lang, 'trip.msg.arrived')} ${translate(lang, 'trip.msg.sign')}`;
}
