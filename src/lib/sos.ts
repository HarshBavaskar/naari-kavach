import { cloudEnabled, config } from './config';
import { mapsLink } from './geo';
import { translate } from './i18n';
import type { Contact, Lang, LatLng, Report } from './types';

export type Fix = LatLng & { accuracy?: number };

/** One-shot high-accuracy position with a short timeout. Never throws. */
export function getFix(timeoutMs = 8000): Promise<Fix | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 },
    );
  });
}

export const hhmm = (d = new Date()) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export function sosMessage(lang: Lang, fix: Fix | null) {
  if (!fix) return translate(lang, 'sos.messageNoLoc', { time: hhmm() });
  return translate(lang, 'sos.message', {
    link: mapsLink(fix),
    acc: Math.max(5, Math.round(fix.accuracy ?? 30)),
    time: hhmm(),
  });
}

/** Normalise Indian mobile numbers to +91XXXXXXXXXX for sms: and wa.me links. */
export function normalisePhone(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith('91')) return `+${d}`;
  if (d.length === 11 && d.startsWith('0')) return `+91${d.slice(1)}`;
  return raw.trim();
}

export function isValidIndianMobile(raw: string) {
  const d = raw.replace(/\D/g, '').replace(/^(91|0)/, '');
  return /^[6-9]\d{9}$/.test(d);
}

export function smsLink(contacts: Contact[], body: string) {
  const to = contacts.map((c) => normalisePhone(c.phone)).join(',');
  // `?&body=` is the form both Android and iOS Messages accept.
  return `sms:${to}?&body=${encodeURIComponent(body)}`;
}

export function whatsappLink(body: string, contact?: Contact) {
  const num = contact ? normalisePhone(contact.phone).replace('+', '') : '';
  return `https://wa.me/${num}?text=${encodeURIComponent(body)}`;
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

/* ---------------- Optional cloud (Supabase) ---------------- */

const headers = () => ({
  apikey: config.supabaseAnonKey,
  Authorization: `Bearer ${config.supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

/** Sends Telegram alerts through the `sos-alert` edge function. Returns false when cloud is off. */
export async function cloudSos(fix: Fix | null, contacts: Contact[], message: string): Promise<boolean> {
  if (!cloudEnabled) return false;
  const chatIds = contacts.map((c) => c.telegramChatId).filter(Boolean);
  if (!chatIds.length) return false;
  try {
    const res = await fetch(`${config.supabaseUrl}/functions/v1/sos-alert`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ chatIds, message, lat: fix?.lat, lng: fix?.lng, accuracy: fix?.accuracy }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Shares a report anonymously. Coordinates are rounded to ~11 m; no user id is sent. */
export async function cloudReport(r: Report): Promise<boolean> {
  if (!cloudEnabled) return false;
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/reports`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'return=minimal' },
      body: JSON.stringify({
        lat: Number(r.lat.toFixed(4)),
        lng: Number(r.lng.toFixed(4)),
        category: r.category,
        note: r.note?.slice(0, 280) ?? null,
        happened_at: new Date(r.at).toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function cloudFetchReports(center: LatLng): Promise<Report[]> {
  if (!cloudEnabled) return [];
  const d = 0.05;
  const q = new URLSearchParams({
    select: 'id,lat,lng,category,note,happened_at',
    lat: `gte.${center.lat - d}`,
    lng: `gte.${center.lng - d}`,
    happened_at: `gte.${new Date(Date.now() - 90 * 864e5).toISOString()}`,
    limit: '1000',
  });
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/reports?${q}&lat=lte.${center.lat + d}&lng=lte.${center.lng + d}`, {
      headers: headers(),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ id: string; lat: number; lng: number; category: Report['category']; note: string | null; happened_at: string }>;
    return rows.map((r) => ({
      id: `cloud-${r.id}`,
      lat: r.lat,
      lng: r.lng,
      category: r.category,
      note: r.note ?? undefined,
      at: new Date(r.happened_at).getTime(),
      source: 'cloud' as const,
    }));
  } catch {
    return [];
  }
}
