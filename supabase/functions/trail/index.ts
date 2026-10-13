// Supabase Edge Function: trail (sealed trail)
//
// Keeps a trip's locked positions and hands them out only when she is overdue
// or has raised SOS. This function never sees a position: the phone encrypts
// each one, and the key lives only in the link her contacts hold.
//
// Deploy:
//   supabase functions deploy trail --no-verify-jwt
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
// The tables have row level security on with no policies, so only this
// function can read or write them.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
  auth: { persistSession: false },
});

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** A trail may open at most this far ahead, and is deleted this long after it was made. */
const MAX_AHEAD_MS = 12 * 3600e3;
const KEEP_MS = 24 * 3600e3;
/** One point every 30 s for a day is under this. More than this is not a trip. */
const MAX_POINTS = 3000;

type Body = { op?: string; id?: string; token?: string; opensAt?: string; box?: string };

const ID = /^[\w-]{12,32}$/;
const TOKEN = /^[\w-]{16,64}$/;
const BOX = /^[\w-]{20,400}$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function hash(token: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The trail row, but only for the phone that made it. */
async function owned(id: string, token: string) {
  const { data } = await db.from('trails').select('id, token_hash').eq('id', id).maybeSingle();
  return data && data.token_hash === (await hash(token)) ? data : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const { op, id = '', token = '' } = body;
  if (!ID.test(id)) return json({ error: 'Bad id' }, 400);

  if (op === 'read') {
    const { data: trail } = await db.from('trails').select('opens_at, alarm, created_at').eq('id', id).maybeSingle();
    if (!trail || Date.now() - new Date(trail.created_at).getTime() > KEEP_MS) return json({ state: 'gone' });
    // Sealed until she is overdue or has raised SOS. A contact with the link cannot follow her before that.
    if (!trail.alarm && Date.now() < new Date(trail.opens_at).getTime()) return json({ state: 'sealed', opensAt: trail.opens_at });
    const { data: points } = await db.from('trail_points').select('box').eq('trail_id', id).order('seq');
    return json({ state: 'open', boxes: (points ?? []).map((p) => p.box) });
  }

  if (!TOKEN.test(token)) return json({ error: 'Bad token' }, 400);

  if (op === 'open') {
    const opensAt = new Date(body.opensAt ?? '').getTime();
    if (!Number.isFinite(opensAt) || opensAt < Date.now() || opensAt > Date.now() + MAX_AHEAD_MS) return json({ error: 'Bad time' }, 400);
    // Old trails go whenever a new one starts, so nothing outlives a day.
    await db.from('trails').delete().lt('created_at', new Date(Date.now() - KEEP_MS).toISOString());
    const { error } = await db.from('trails').insert({ id, token_hash: await hash(token), opens_at: new Date(opensAt).toISOString() });
    return error ? json({ error: 'Could not start' }, 409) : json({ ok: true });
  }

  if (!(await owned(id, token))) return json({ error: 'Not found' }, 404);

  if (op === 'add') {
    if (!BOX.test(body.box ?? '')) return json({ error: 'Bad point' }, 400);
    const { count } = await db.from('trail_points').select('seq', { count: 'exact', head: true }).eq('trail_id', id);
    if ((count ?? 0) >= MAX_POINTS) return json({ error: 'Full' }, 429);
    const { error } = await db.from('trail_points').insert({ trail_id: id, box: body.box });
    return error ? json({ error: 'Could not add' }, 500) : json({ ok: true });
  }
  if (op === 'alarm') {
    const { error } = await db.from('trails').update({ alarm: true }).eq('id', id);
    return error ? json({ error: 'Could not open' }, 500) : json({ ok: true });
  }
  if (op === 'close') {
    const { error } = await db.from('trails').delete().eq('id', id);
    return error ? json({ error: 'Could not delete' }, 500) : json({ ok: true });
  }
  return json({ error: 'Unknown op' }, 400);
});
