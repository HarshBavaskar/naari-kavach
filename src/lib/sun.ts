/**
 * Sunrise and sunset from the date and the place alone, worked out on the
 * phone with no network. Standard solar position maths, good to a couple of
 * minutes, which is plenty for "is it dark yet".
 */
import type { LatLng } from './types';

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;

/** Sun times for the solar day nearest to `date`. Null only near the poles. */
export function sunTimes(date: Date, at: LatLng): { sunrise: Date; sunset: Date } | null {
  const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAY_MS);
  const lw = -at.lng * RAD;
  const phi = at.lat * RAD;
  const d = date.getTime() / DAY_MS - 0.5 + J1970 - J2000;
  const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = RAD * (357.5291 + 0.98560028 * ds);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(L) * Math.sin(RAD * 23.4397));
  const noon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  // -0.833 degrees: the sun's upper edge on the horizon, allowing for refraction.
  const cosH = (Math.sin(-0.833 * RAD) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH < -1 || cosH > 1) return null;
  const half = Math.acos(cosH) / (2 * Math.PI);
  return { sunrise: fromJulian(noon - half), sunset: fromJulian(noon + half) };
}
