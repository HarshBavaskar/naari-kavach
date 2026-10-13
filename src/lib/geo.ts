import type { LatLng } from './types';

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversine(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Points every `stepM` metres along a polyline of [lat, lng]. */
export function samplePolyline(coords: [number, number][], stepM = 40): LatLng[] {
  const out: LatLng[] = [];
  if (coords.length === 0) return out;
  out.push({ lat: coords[0][0], lng: coords[0][1] });
  let carry = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = { lat: coords[i - 1][0], lng: coords[i - 1][1] };
    const b = { lat: coords[i][0], lng: coords[i][1] };
    const seg = haversine(a, b);
    if (seg === 0) continue;
    let d = stepM - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
      d += stepM;
    }
    carry = seg - (d - stepM);
  }
  const last = coords[coords.length - 1];
  out.push({ lat: last[0], lng: last[1] });
  return out;
}

/** Shortest distance in metres from a point to a polyline of [lat, lng]. Flat maths, fine at city scale. */
export function distanceToPolyline(p: LatLng, coords: [number, number][]) {
  if (coords.length === 0) return Infinity;
  const kx = Math.cos(rad(p.lat)) * 111320;
  const ky = 110540;
  let ax = (coords[0][1] - p.lng) * kx;
  let ay = (coords[0][0] - p.lat) * ky;
  let best = Math.hypot(ax, ay);
  for (let i = 1; i < coords.length; i++) {
    const bx = (coords[i][1] - p.lng) * kx;
    const by = (coords[i][0] - p.lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    ax = bx;
    ay = by;
  }
  return best;
}

export function formatDistance(m: number, kmLabel = 'km') {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} ${kmLabel}`;
}

export function formatDuration(s: number, minLabel = 'min') {
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} ${minLabel}`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} ${minLabel}`;
}

export function mapsLink(p: LatLng) {
  return `https://maps.google.com/?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

export function directionsLink(p: LatLng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

/** Deterministic PRNG so demo data is stable between reloads. */
export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
