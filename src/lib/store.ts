import { useSyncExternalStore } from 'react';
import { config } from './config';
import type { Contact, Endpoint, Lang, LatLng, PlanWhen, Poi, Report, RouteOption, Tab, TravelMode } from './types';

/**
 * Tiny global store (no dependency). Persisted keys go to localStorage,
 * wrapped in try/catch because storage can be blocked (private mode, previews).
 */

export type Trip = {
  startedAt: number;
  /** When she last moved on from the anchor. A long stop is only questioned on high-risk ground. */
  stillSince: number;
  destinationLabel?: string;
  /** Last spot where movement was counted. In memory only, never persisted. */
  anchor?: LatLng;
  /** Stops she has said are fine. Not asked about again. In memory only. */
  okSpots?: LatLng[];
  /** She said something feels off: the shield watches closely wherever she is. */
  uneasy?: boolean;
  /** Sealed trail for this trip: the link her contacts hold and when it opens. */
  trail?: { link: string; opensAt: number };
  offRoute?: boolean;
  /** Set when the trip follows a route: expected arrival, and when to ask if she is late. */
  etaAt?: number;
  lateAt?: number;
  lateAsked?: boolean;
  /** She sent the start message, so offer the "arrived" one when the trip ends. */
  told?: boolean;
  /** How she is travelling, known when the trip follows a route. */
  mode?: TravelMode;
  /** Living shield: 'watch' while she is on high-risk ground, so it asks sooner. */
  shield?: 'calm' | 'watch';
  fastAsked?: boolean;
  awayAsked?: boolean;
  /** Pocket guide: turn cues by vibration and voice. */
  guide?: boolean;
  cue?: { dir: 'left' | 'right'; at: number };
};

/**
 * Why the "Are you okay?" prompt opened: a long stop on high-risk ground, the same
 * off the chosen route, late and stopped, a walk at vehicle speed, or a ride
 * heading away from the destination. Never a timer.
 */
export type CheckInWhy = 'still' | 'route' | 'late' | 'fast' | 'away';

export type SosPhase = 'idle' | 'countdown' | 'active';

type State = {
  // persisted
  lang: Lang;
  contacts: Contact[];
  reports: Report[];
  showDemo: boolean;
  guideSeen: boolean;
  // session
  tab: Tab;
  userLoc: (LatLng & { accuracy?: number }) | null;
  locStatus: 'unknown' | 'granted' | 'denied' | 'unavailable';
  mapCenter: LatLng;
  pois: Poi[];
  poiStatus: 'idle' | 'loading' | 'ready' | 'error';
  routes: RouteOption[];
  selectedRouteId: string | null;
  travelMode: TravelMode;
  focus: LatLng | null; // ask the map to fly here
  sos: SosPhase;
  trip: Trip | null;
  checkInDue: boolean;
  checkInWhy: CheckInWhy;
  toast: { id: number; text: string; tone: 'ok' | 'warn' | 'info' } | null;
  ripple: { id: number; lat: number; lng: number } | null;
  sheetExpanded: boolean;
  pinLoc: LatLng | null; // where the report pin points
  dest: Endpoint | null; // route destination, shared so Help can ask for a route
  pendingRoute: boolean; // Routes should find a route to `dest` as soon as it shows
  planWhen: PlanWhen; // time of day the map and routes are scored for
  fakeCall: 'idle' | 'waiting' | 'ringing' | 'talking';
  alarm: boolean;
  tripDone: { label?: string } | null; // a trip she told contacts about has ended
  preview: boolean; // the selected route is being played back on the map
  previewPos: LatLng | null;
  pocket: boolean; // the earphone button is armed as an SOS trigger
  trail: Array<LatLng & { at: number }> | null; // an opened sealed trail, shown to a contact
};

const PERSIST_KEY = 'kavach:v1';
const PERSISTED: (keyof State)[] = ['lang', 'contacts', 'reports', 'showDemo', 'guideSeen'];

function load(): Partial<State> {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? (JSON.parse(raw) as Partial<State>) : {};
  } catch {
    return {};
  }
}

function save(s: State) {
  try {
    const out: Partial<State> = {};
    for (const k of PERSISTED) (out as Record<string, unknown>)[k] = s[k];
    localStorage.setItem(PERSIST_KEY, JSON.stringify(out));
  } catch {
    /* storage unavailable: app still works in memory */
  }
}


const initial: State = {
  lang: 'en',
  contacts: [],
  reports: [],
  showDemo: true,
  guideSeen: false,
  tab: 'map',
  userLoc: null,
  locStatus: 'unknown',
  mapCenter: { ...config.defaultCenter },
  pois: [],
  poiStatus: 'idle',
  routes: [],
  selectedRouteId: null,
  travelMode: 'walk',
  focus: null,
  sos: 'idle',
  trip: null,
  checkInDue: false,
  checkInWhy: 'still',
  toast: null,
  ripple: null,
  sheetExpanded: false,
  pinLoc: null,
  dest: null,
  pendingRoute: false,
  planWhen: 'now',
  fakeCall: 'idle',
  alarm: false,
  tripDone: null,
  preview: false,
  previewPos: null,
  pocket: false,
  trail: null,
  ...load(),
};

let state: State = initial;
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  if (PERSISTED.some((k) => k in next)) save(state);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

let toastSeq = 0;
export function toast(text: string, tone: 'ok' | 'warn' | 'info' = 'ok') {
  const id = ++toastSeq;
  setState({ toast: { id, text, tone } });
  window.setTimeout(() => {
    if (getState().toast?.id === id) setState({ toast: null });
  }, 3200);
}

export const uid = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));
