/**
 * Sealed trail. Her route during a trip, locked so that nobody can follow
 * her, yet there if she does not arrive.
 *
 * - Each position is encrypted on the phone (AES-GCM) with a key made on the phone.
 * - The key travels only inside the link she sends her contacts, after the #,
 *   which browsers never send to a server. The server cannot read a point.
 * - The server hands the locked points out only after the time she was due,
 *   or once she raises SOS. Before that even a contact with the link sees "sealed".
 * - Arriving or ending the trip deletes it. Anything left is deleted after a day.
 *
 * Needs the optional Supabase backend (function `trail`). Without it this is off.
 */
import { cloudEnabled, config } from './config';
import { getState } from './store';
import type { LatLng } from './types';

export type TrailPoint = LatLng & { at: number };
export type TrailState =
  | { state: 'sealed'; opensAt: number }
  | { state: 'open'; points: TrailPoint[] }
  | { state: 'gone' }
  | { state: 'error' };

/** Positions closer together in time than this are not worth a request each. */
const EVERY_MS = 30e3;

export const trailEnabled = cloudEnabled && typeof crypto !== 'undefined' && Boolean(crypto.subtle);

const b64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

let live: { id: string; token: string; key: CryptoKey; lastAt: number } | null = null;

async function call<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${config.supabaseUrl}/functions/v1/trail`, {
      method: 'POST',
      headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Starts a sealed trail that opens at `opensAt`. Returns the link for her contacts, or null if it could not start. */
export async function trailStart(opensAt: number) {
  if (!trailEnabled) return null;
  try {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    const id = b64(rand(12));
    const token = b64(rand(16));
    if (!(await call({ op: 'open', id, token, opensAt: new Date(opensAt).toISOString() }))) return null;
    live = { id, token, key, lastAt: 0 };
    const here = getState().userLoc;
    if (here) void trailAdd(here);
    return { link: `${location.origin}/#trail=${id}.${b64(raw)}`, opensAt };
  } catch {
    return null;
  }
}

/** Adds her position to the trail, locked. Does nothing when no trail is on. */
export async function trailAdd(p: LatLng) {
  const t = live;
  if (!t || Date.now() - t.lastAt < EVERY_MS) return;
  t.lastAt = Date.now();
  try {
    const iv = rand(12);
    const point: TrailPoint = { lat: Number(p.lat.toFixed(5)), lng: Number(p.lng.toFixed(5)), at: Date.now() };
    const locked = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, t.key, new TextEncoder().encode(JSON.stringify(point))));
    const box = new Uint8Array(iv.length + locked.length);
    box.set(iv);
    box.set(locked, iv.length);
    void call({ op: 'add', id: t.id, token: t.token, box: b64(box) });
  } catch {
    /* a point that cannot be locked is not sent */
  }
}

/** She arrived or ended the trip: delete the trail. */
export function trailEnd() {
  if (live) void call({ op: 'close', id: live.id, token: live.token });
  live = null;
}

/** SOS: open the trail to her contacts now. */
export function trailAlarm() {
  if (live) void call({ op: 'alarm', id: live.id, token: live.token });
}

/** The id and key from a contact's link, `#trail=<id>.<key>`. */
export function trailFromHash(hash = location.hash) {
  const m = /^#trail=([\w-]{12,32})\.([\w-]{40,48})$/.exec(hash);
  return m ? { id: m[1], key: m[2] } : null;
}

/** What a contact sees: sealed until she is overdue, then her route, unlocked in their browser. */
export async function trailRead(id: string, keyB64: string): Promise<TrailState> {
  const res = await call<{ state: 'sealed' | 'open' | 'gone'; opensAt?: string; boxes?: string[] }>({ op: 'read', id });
  if (!res) return { state: 'error' };
  if (res.state === 'gone') return { state: 'gone' };
  if (res.state === 'sealed') return { state: 'sealed', opensAt: new Date(res.opensAt ?? 0).getTime() };
  try {
    const key = await crypto.subtle.importKey('raw', unb64(keyB64), 'AES-GCM', false, ['decrypt']);
    const points: TrailPoint[] = [];
    for (const b of res.boxes ?? []) {
      const box = unb64(b);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: box.slice(0, 12) }, key, box.slice(12));
      points.push(JSON.parse(new TextDecoder().decode(plain)) as TrailPoint);
    }
    return { state: 'open', points: points.sort((a, b) => a.at - b.at) };
  } catch {
    return { state: 'error' };
  }
}
