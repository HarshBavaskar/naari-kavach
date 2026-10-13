-- Naari Kavach: optional cloud backend (Supabase free tier).
-- Run in the Supabase SQL editor. The app works without this; it only adds
-- shared reports across users and the Telegram SOS function.
--
-- Privacy rules baked into the schema:
--   * No user id, device id, IP or name is stored with a report.
--   * Coordinates are rounded client-side to 4 decimals (~11 m).
--   * Anonymous clients can insert and read reports, never update or delete.

create extension if not exists postgis;

create table if not exists public.reports (
  id           bigint generated always as identity primary key,
  lat          double precision not null check (lat between 15.5 and 22.2),   -- Maharashtra bounding box
  lng          double precision not null check (lng between 72.5 and 80.95),
  category     text not null check (category in ('harassment','followed','poor_lighting','isolated','unsafe_transport','other')),
  note         text check (char_length(note) <= 280),
  happened_at  timestamptz not null check (happened_at <= now() + interval '5 minutes' and happened_at >= now() - interval '30 days'),
  created_at   timestamptz not null default now(),
  geom         geography(point, 4326) generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored
);

create index if not exists reports_geom_idx on public.reports using gist (geom);
create index if not exists reports_happened_idx on public.reports (happened_at desc);

alter table public.reports enable row level security;

drop policy if exists "anon can insert reports" on public.reports;
create policy "anon can insert reports" on public.reports
  for insert to anon, authenticated
  with check (true);

drop policy if exists "anyone can read recent reports" on public.reports;
create policy "anyone can read recent reports" on public.reports
  for select to anon, authenticated
  using (happened_at > now() - interval '90 days');

-- Moderation view for institutions (campus safety team). Grant only to a
-- dedicated role, never to anon. Aggregated to H3-like ~150 m buckets so no
-- single report can be traced back to a doorstep.
create or replace view public.report_hotspots as
select
  round(lat::numeric, 3) as lat_bucket,
  round(lng::numeric, 3) as lng_bucket,
  category,
  count(*)               as reports,
  max(happened_at)       as latest
from public.reports
where happened_at > now() - interval '90 days'
group by 1, 2, 3
having count(*) >= 2;

revoke all on public.report_hotspots from anon;

-- Sealed trail (optional). A trip's positions, encrypted on the phone before
-- they are sent. The key never reaches this database: it lives only in the
-- link she gives her contacts. Rules:
--   * Row level security is on with no policies, so anon clients can neither
--     read nor write. Only the `trail` edge function (service role) can.
--   * The function hands points out only after opens_at, or once alarm is set.
--   * Ending the trip deletes the trail. Anything left is deleted after 24 hours.
create table if not exists public.trails (
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{12,32}$'),
  token_hash  text not null,                       -- SHA-256 of a secret only her phone holds
  opens_at    timestamptz not null check (opens_at <= now() + interval '12 hours'),
  alarm       boolean not null default false,      -- she raised SOS: open now
  created_at  timestamptz not null default now()
);

create table if not exists public.trail_points (
  seq       bigint generated always as identity primary key,
  trail_id  text not null references public.trails(id) on delete cascade,
  box       text not null check (char_length(box) <= 400)   -- iv + ciphertext, base64url
);

create index if not exists trail_points_trail_idx on public.trail_points (trail_id, seq);

alter table public.trails enable row level security;
alter table public.trail_points enable row level security;
revoke all on public.trails from anon, authenticated;
revoke all on public.trail_points from anon, authenticated;
