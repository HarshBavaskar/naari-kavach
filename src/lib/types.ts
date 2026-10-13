export type LatLng = { lat: number; lng: number };

export type Lang = 'en' | 'mr' | 'hi';

export type ReportCategory =
  | 'harassment'
  | 'followed'
  | 'poor_lighting'
  | 'isolated'
  | 'unsafe_transport'
  | 'other';

export type Report = {
  id: string;
  lat: number;
  lng: number;
  category: ReportCategory;
  note?: string;
  /** epoch ms of when it happened (not when it was filed) */
  at: number;
  source: 'local' | 'demo' | 'cloud';
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  /** Optional, only used when Supabase + Telegram bot are configured. */
  telegramChatId?: string;
};

export type Poi = {
  id: string;
  lat: number;
  lng: number;
  kind: 'police' | 'hospital' | 'activity';
  name?: string;
  phone?: string;
  /** Activity place likely open after dark: fuel station, rail station, tagged 24/7. */
  late?: boolean;
};

export type RiskSignals = {
  reports: number | null;
  darkness: number | null;
  isolation: number | null;
  areaCrime: number | null;
  helpFar: number | null;
  /** How far a walker is committed before the next side turn. */
  noExit: number | null;
};

export type RiskCell = {
  h3: string;
  score: number; // 0..100
  signals: RiskSignals;
  /** People live here but no shop or stall is on the map, so the score leans on homes and roads. */
  blind?: boolean;
  /** Nothing is mapped here and there is no population layer: the score is a rough guess. */
  thin?: boolean;
  /** Rain at the scored hour is keeping people indoors. */
  wet?: boolean;
};

/** Hourly rain forecast for the area: epoch ms of each hour and millimetres in it. */
export type Rain = { at: number[]; mm: number[] };

export type RouteOption = {
  id: string;
  coords: [number, number][]; // [lat, lng]
  distanceM: number;
  durationS: number;
  risk: number; // 0..100
  hotMeters: number; // metres through cells scoring >= 60
  reportsNear: number;
  tags: Array<'safest' | 'fastest'>;
};

export type TravelMode = 'walk' | 'ride';

export type Place = { id: string; label: string; sub: string; lat: number; lng: number };

/** One end of a route: her live position or a searched place. */
export type Endpoint = { kind: 'me' } | { kind: 'place'; place: Place };

/** Time of day the risk map is scored for. */
export type PlanWhen = 'now' | 'day' | 'dusk' | 'night';

export type Tab = 'map' | 'help' | 'report' | 'trip';
