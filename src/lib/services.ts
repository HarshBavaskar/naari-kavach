/**
 * External services. All free. Each function fails soft: it throws a typed
 * error the UI turns into a clear message, and never blocks SOS or helplines.
 */
import { config } from './config';
import { cellToBoundary } from 'h3-js';
import type { LatLng, Place, Poi, Rain, TravelMode } from './types';

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const ctl = new AbortController();
  const timer = window.setTimeout(() => ctl.abort(), timeoutMs);
  init?.signal?.addEventListener('abort', () => ctl.abort());
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

/* ---------------- Overpass: police, hospitals, activity POIs ---------------- */

type OverpassEl = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const poiCache = new Map<string, Poi[]>();

export async function fetchPois(center: LatLng, radius = config.poiRadius): Promise<Poi[]> {
  const key = `${center.lat.toFixed(2)},${center.lng.toFixed(2)},${radius}`;
  const hit = poiCache.get(key);
  if (hit) return hit;

  const a = `(around:${radius},${center.lat},${center.lng})`;
  const q = `[out:json][timeout:25];(
    nwr["amenity"="police"]${a};
    nwr["amenity"="hospital"]${a};
    nwr["healthcare"="hospital"]${a};
    node["shop"]${a};
    node["amenity"~"^(restaurant|cafe|fast_food|pharmacy|atm|bank|fuel|marketplace)$"]${a};
    node["highway"="bus_stop"]${a};
    node["railway"~"^(station|halt)$"]${a};
  );out center tags;`;

  const data = await firstOf(config.endpoints.overpass, (ep, signal) =>
    fetchJson<{ elements: OverpassEl[] }>(ep, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(q),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal,
    }, 30000),
  );
  const out: Poi[] = [];
  for (const el of data.elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) continue;
    const t = el.tags ?? {};
    const kind: Poi['kind'] =
      t.amenity === 'police' ? 'police' : t.amenity === 'hospital' || t.healthcare === 'hospital' ? 'hospital' : 'activity';
    out.push({
      id: `${el.type}/${el.id}`,
      lat,
      lng,
      kind,
      name: t['name:en'] || t.name,
      phone: t.phone || t['contact:phone'],
      late: kind === 'activity' ? t.opening_hours === '24/7' || t.amenity === 'fuel' || Boolean(t.railway) : undefined,
    });
  }
  poiCache.set(key, out);
  return out;
}

/** Wait this long for a mirror before also asking the next one. */
const HEDGE_MS = 4000;

/**
 * First mirror to answer wins and the rest are cancelled. A mirror that fails
 * hands over at once; a silent one gets HEDGE_MS before the next joins in.
 */
function firstOf<T>(endpoints: readonly string[], run: (ep: string, signal: AbortSignal) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const ctls: AbortController[] = [];
    let next = 0;
    let pending = 0;
    let done = false;
    let timer = 0;
    const launch = () => {
      window.clearTimeout(timer);
      if (done || next >= endpoints.length) return;
      const ctl = new AbortController();
      ctls.push(ctl);
      pending++;
      run(endpoints[next++], ctl.signal).then(
        (v) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          for (const c of ctls) if (c !== ctl) c.abort();
          resolve(v);
        },
        (e) => {
          pending--;
          if (done) return;
          if (next < endpoints.length) launch();
          else if (pending === 0) reject(e);
        },
      );
      if (next < endpoints.length) timer = window.setTimeout(launch, HEDGE_MS);
    };
    launch();
  });
}

/* ---------------- Photon: quick police + hospital lookup ---------------- */

type PhotonFeature = {
  properties: { osm_type: 'N' | 'W' | 'R'; osm_id: number; name?: string };
  geometry: { coordinates: [number, number] };
};

const OSM_TYPE = { N: 'node', W: 'way', R: 'relation' } as const;

/**
 * Fast first answer for the Help tab while Overpass is still working. Same
 * OSM data and ids, but no phone numbers. Never throws: empty means no answer.
 */
export async function fetchHelpPois(center: LatLng, radius = config.poiRadius): Promise<Poi[]> {
  const one = async (kind: 'police' | 'hospital'): Promise<Poi[]> => {
    const params = new URLSearchParams({
      lat: String(center.lat),
      lon: String(center.lng),
      radius: String(radius / 1000),
      limit: '10',
      osm_tag: `amenity:${kind}`,
    });
    try {
      const data = await fetchJson<{ features: PhotonFeature[] }>(`${config.endpoints.photon}?${params}`, undefined, 8000);
      return data.features.map((f) => ({
        id: `${OSM_TYPE[f.properties.osm_type]}/${f.properties.osm_id}`,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        kind,
        name: f.properties.name,
      }));
    } catch {
      return [];
    }
  };
  const [police, hospitals] = await Promise.all([one('police'), one('hospital')]);
  return [...police, ...hospitals];
}

/* ---------------- Open-Meteo: rain by the hour ---------------- */

/**
 * Hourly rain for today and tomorrow near `center`. Rain empties a street, so
 * the risk engine counts open places for less while it falls. Never throws:
 * null means no forecast, and the map is scored as dry.
 */
export async function fetchRain(center: LatLng): Promise<Rain | null> {
  const params = new URLSearchParams({
    latitude: center.lat.toFixed(2),
    longitude: center.lng.toFixed(2),
    hourly: 'precipitation',
    forecast_days: '2',
    timeformat: 'unixtime',
  });
  try {
    const data = await fetchJson<{ hourly: { time: number[]; precipitation: number[] } }>(`${config.endpoints.weather}?${params}`, undefined, 8000);
    return { at: data.hourly.time.map((s) => s * 1000), mm: data.hourly.precipitation };
  } catch {
    return null;
  }
}

/* ---------------- Nominatim geocoding ---------------- */

export type { Place };

export async function searchPlaces(q: string, near: LatLng, lang: string): Promise<Place[]> {
  const d = 0.35;
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    countrycodes: 'in',
    limit: '6',
    addressdetails: '0',
    viewbox: `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`,
    bounded: '0',
    'accept-language': lang === 'en' ? 'en' : `${lang},en`,
  });
  const data = await fetchJson<Array<{ place_id: number; display_name: string; lat: string; lon: string; name?: string }>>(
    `${config.endpoints.nominatim}?${params}`,
  );
  return data.map((p) => {
    const parts = p.display_name.split(', ');
    return {
      id: String(p.place_id),
      label: p.name || parts[0],
      sub: parts.slice(1, 4).join(', '),
      lat: Number(p.lat),
      lng: Number(p.lon),
    };
  });
}

/* ---------------- Routing ---------------- */

export type RawRoute = { coords: [number, number][]; distanceM: number; durationS: number };

async function osrm(from: LatLng, to: LatLng, mode: TravelMode): Promise<RawRoute[]> {
  const base = mode === 'walk' ? config.endpoints.osrmFoot : config.endpoints.osrmCar;
  const url = `${base}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=3&steps=false`;
  const data = await fetchJson<{
    code: string;
    routes: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }>;
  }>(url);
  if (data.code !== 'Ok') return [];
  return data.routes.map((r) => ({
    coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    distanceM: r.distance,
    durationS: r.duration,
  }));
}

/** ORS supports avoid_polygons, so with a key we can steer around hot hexes. */
async function ors(from: LatLng, to: LatLng, mode: TravelMode, avoidH3: string[]): Promise<RawRoute[]> {
  const profile = mode === 'walk' ? 'foot-walking' : 'driving-car';
  const body: Record<string, unknown> = {
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
    alternative_routes: { target_count: 3, weight_factor: 1.6, share_factor: 0.6 },
  };
  if (avoidH3.length) {
    body.options = {
      avoid_polygons: {
        type: 'MultiPolygon',
        coordinates: avoidH3.map((h) => {
          const ring = cellToBoundary(h, true); // [lng, lat]
          return [[...ring, ring[0]]];
        }),
      },
    };
  }
  const data = await fetchJson<{
    features: Array<{ geometry: { coordinates: [number, number][] }; properties: { summary: { distance: number; duration: number } } }>;
  }>(`${config.endpoints.ors}/${profile}/geojson`, {
    method: 'POST',
    headers: { Authorization: config.orsKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return data.features.map((f) => ({
    coords: f.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    distanceM: f.properties.summary.distance,
    durationS: f.properties.summary.duration,
  }));
}

export async function fetchRoutes(from: LatLng, to: LatLng, mode: TravelMode, avoidH3: string[]): Promise<RawRoute[]> {
  if (config.orsKey) {
    try {
      const r = await ors(from, to, mode, avoidH3);
      if (r.length) {
        // Keep the plain OSRM routes as alternatives so the user can still see the fastest option.
        const plain = await osrm(from, to, mode).catch(() => [] as RawRoute[]);
        return [...r, ...plain];
      }
    } catch {
      /* fall through to OSRM */
    }
  }
  return osrm(from, to, mode);
}

