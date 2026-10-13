// Supabase Edge Function: sos-alert
// Sends the SOS message and a live location pin to each trusted contact's
// Telegram chat. Contacts must have pressed Start on your bot once so the bot
// is allowed to message them; their numeric chat id goes in the app.
//
// Deploy:
//   supabase secrets set TELEGRAM_BOT_TOKEN=123456:ABC...
//   supabase functions deploy sos-alert --no-verify-jwt
//
// The token never reaches the browser. The browser only sends chat ids,
// the message text and coordinates.

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const API = `https://api.telegram.org/bot${TOKEN}`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Body = { chatIds?: string[]; message?: string; lat?: number; lng?: number; accuracy?: number };

async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
  if (!TOKEN) return new Response('Bot token not configured', { status: 500, headers: cors });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: cors });
  }

  const chatIds = (body.chatIds ?? []).filter((id) => /^-?\d{3,20}$/.test(id)).slice(0, 10);
  const message = (body.message ?? '').slice(0, 600);
  if (!chatIds.length || !message) return new Response('Nothing to send', { status: 400, headers: cors });

  const hasLoc = typeof body.lat === 'number' && typeof body.lng === 'number';
  const results = await Promise.all(
    chatIds.map(async (chat_id) => {
      const okText = await tg('sendMessage', { chat_id, text: message, disable_web_page_preview: false });
      const okLoc = hasLoc
        ? await tg('sendLocation', { chat_id, latitude: body.lat, longitude: body.lng, horizontal_accuracy: Math.min(1500, body.accuracy ?? 50) })
        : true;
      return okText && okLoc;
    }),
  );

  const sent = results.filter(Boolean).length;
  return new Response(JSON.stringify({ sent, total: chatIds.length }), {
    status: sent ? 200 : 502,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
