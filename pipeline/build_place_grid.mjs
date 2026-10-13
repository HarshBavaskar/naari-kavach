/**
 * Naari Kavach place layers. Keyless: OpenStreetMap roads (Overpass) and
 * Meta's public population raster. No account, no API key.
 *
 * Builds public/data/risk-grid.json: one entry per H3 cell (resolution 10, the
 * same resolution the web app uses) with two layers about places:
 *
 *   x  no way out, 0..1. How far a walker is committed before the next side
 *      turn, from the road network alone. Skywalks, foot bridges, underpasses
 *      and dead ends count for more. 1 = a long stretch with no exit.
 *   p  people living in the hex and its ring of neighbours, from Meta's High
 *      Resolution Settlement Layer (built from satellite building detection,
 *      so it does not depend on how well a neighbourhood is mapped).
 *
 * Every hex with a road or with people nearby gets an entry, so inside the
 * covered area a missing hex means open ground or water and the app leaves it blank.
 * `dark` and `crime` already in the file (build_risk_grid.py) are kept.
 *
 * Run from the project root:
 *   npm run grid                      # region mumbai-thane
 *   npm run grid -- --offline         # use cached roads only, no Overpass calls
 *   npm run grid -- --no-people       # skip the population raster
 *
 * Road extracts are cached in pipeline/raw/osm (git-ignored). Delete a file
 * there to fetch it again. Be gentle with the public Overpass mirrors.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { cellToLatLng, gridDisk, latLngToCell } = require('h3-js');

const RES = 10;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'data', 'risk-grid.json');
const RAW = path.join(HERE, 'raw', 'osm');

/** [south, west, north, east]. `tiles` are fetched; `cover` is the area the layers are valid for. */
const REGIONS = {
  'mumbai-thane': {
    tiles: {
      'mumbai-south': [18.89, 72.77, 19.02, 72.99],
      'mumbai-mid': [19.02, 72.77, 19.15, 72.99],
      // Split in two: the public mirrors time out on the whole northern band.
      'mumbai-north-a': [19.15, 72.77, 19.215, 72.96],
      'mumbai-north-b': [19.215, 72.77, 19.28, 72.96],
      thane: [19.17, 72.93, 19.29, 73.01],
    },
    // Greater Mumbai and Thane city. Leaves out the port and Navi Mumbai across the creek.
    cover: [
      [18.89, 72.77, 19.02, 72.905],
      [19.0, 72.905, 19.02, 72.965],
      [19.02, 72.77, 19.15, 72.965],
      [19.15, 72.77, 19.28, 72.96],
      [19.17, 72.93, 19.29, 73.01],
    ],
  },
};

const MIRRORS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const WALKABLE =
  'trunk|primary|secondary|tertiary|residential|unclassified|living_street|service|pedestrian|footway|path|steps|trunk_link|primary_link|secondary_link|tertiary_link';
const POP_URL = (lat, lng) =>
  `https://dataforgood-fb-data.s3.amazonaws.com/hrsl-cogs/hrsl_general/v1.5/cog_globallat_${Math.floor(lat / 10) * 10}_lon_${Math.floor(lng / 10) * 10}_general-v1.5.2.tif`;

/** Metres between points sampled along a road. Matches the app's route sampling. */
const STEP_M = 40;
/** A stretch shorter than this always has a way out close by; one this long or more scores 1. */
const EXIT_NEAR_M = 120;
const EXIT_FAR_M = 500;
/** From a dead end the only way out is back. A bridge or tunnel on foot has walls or a drop on both sides. */
const DEAD_END_FACTOR = 1.5;
const ENCLOSED_FACTOR = 2;
/** Layers below these are left out of the file to keep it small. */
const MIN_X = 0.05;
const MIN_PEOPLE = 20;

const ON_FOOT = new Set(['footway', 'steps', 'path', 'pedestrian']);
/** Highways and ramps: nobody chooses them on foot, and they have no side turns by design. */
const FAST = new Set(['trunk', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link']);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const RAD = Math.PI / 180;
function metres(aLat, aLng, bLat, bLng) {
  const x = (bLng - aLng) * RAD * Math.cos(((aLat + bLat) / 2) * RAD);
  const y = (bLat - aLat) * RAD;
  return Math.sqrt(x * x + y * y) * 6371000;
}

async function loadRoads(name, box) {
  const file = path.join(RAW, `${name}_roads.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')).elements;
  if (flag('offline')) throw new Error(`${file} is missing and --offline is set`);
  const query = `[out:json][timeout:170][bbox:${box.join(',')}];way[highway~"^(${WALKABLE})$"];out tags geom;`;
  for (const url of MIRRORS) {
    try {
      console.log(`fetching ${name} roads from ${new URL(url).host}`);
      const res = await fetch(url, {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain', 'User-Agent': 'naari-kavach-pipeline/0.1' },
        signal: AbortSignal.timeout(280000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const json = JSON.parse(text);
      // Overpass answers 200 with a remark when it ran out of time or memory part-way.
      if (json.remark) throw new Error(json.remark);
      fs.mkdirSync(RAW, { recursive: true });
      fs.writeFileSync(file, text);
      return json.elements;
    } catch (err) {
      console.log(`  ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error(`no Overpass mirror answered for ${name}`);
}

/**
 * No-way-out score per hex. Roads become a graph; runs of road between two
 * real junctions (three or more ways meeting) are one stretch, and every
 * point on it is scored by how long that stretch is.
 */
function noExit(ways, inCover) {
  const nodeEdges = new Map();
  const edgeLen = [];
  const samples = [];
  /** Every hex a road passes through, scored or not. */
  const roads = new Set();
  const key = (g) => `${g.lat.toFixed(7)},${g.lon.toFixed(7)}`;
  const link = (k, e) => {
    const a = nodeEdges.get(k);
    if (a) a.push(e);
    else nodeEdges.set(k, [e]);
  };
  let roadM = 0;

  for (const w of ways) {
    const g = w.geometry;
    const t = w.tags ?? {};
    // A road she may not enter is neither a place to walk nor a way out.
    if (!g || g.length < 2 || t.access === 'private' || t.access === 'no') continue;
    const onFoot = ON_FOOT.has(t.highway);
    const bridged = (t.bridge && t.bridge !== 'no') || (t.tunnel && t.tunnel !== 'no');
    // Flyovers and road tunnels are for vehicles: part of the graph, never scored.
    const scored = !FAST.has(t.highway) && (onFoot || !bridged);
    const enclosed = onFoot && bridged;
    let carry = 0;
    for (let i = 1; i < g.length; i++) {
      const a = g[i - 1];
      const b = g[i];
      const d = metres(a.lat, a.lon, b.lat, b.lon);
      const e = edgeLen.length;
      edgeLen.push(d);
      link(key(a), e);
      link(key(b), e);
      let pos = STEP_M - carry;
      while (pos <= d) {
        const f = pos / d;
        const lat = a.lat + (b.lat - a.lat) * f;
        const lng = a.lon + (b.lon - a.lon) * f;
        if (inCover(lat, lng)) {
          roadM += STEP_M;
          roads.add(latLngToCell(lat, lng, RES));
          if (scored) samples.push({ lat, lng, e, enclosed });
        }
        pos += STEP_M;
      }
      carry = (carry + d) % STEP_M;
    }
  }

  // Join edges through every point where exactly two meet: that is one road carrying on, not a junction.
  const parent = Int32Array.from(edgeLen, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (const a of nodeEdges.values()) if (a.length === 2) parent[find(a[0])] = find(a[1]);
  const stretch = new Float64Array(edgeLen.length);
  edgeLen.forEach((d, i) => (stretch[find(i)] += d));
  const deadEnd = new Uint8Array(edgeLen.length);
  for (const a of nodeEdges.values()) if (a.length === 1) deadEnd[find(a[0])] = 1;

  const sum = new Map();
  let noExitM = 0;
  for (const s of samples) {
    const r = find(s.e);
    const reach = stretch[r] * (deadEnd[r] ? DEAD_END_FACTOR : 1) * (s.enclosed ? ENCLOSED_FACTOR : 1);
    const score = Math.min(1, Math.max(0, (reach - EXIT_NEAR_M) / (EXIT_FAR_M - EXIT_NEAR_M)));
    if (score >= 0.5) noExitM += STEP_M;
    const h = latLngToCell(s.lat, s.lng, RES);
    const o = sum.get(h);
    if (o) {
      o.n++;
      o.v += score;
    } else sum.set(h, { n: 1, v: score });
  }
  const x = new Map();
  for (const [h, o] of sum) x.set(h, o.v / o.n);
  return { x, roads, roadKm: roadM / 1000, scoredKm: (samples.length * STEP_M) / 1000, noExitKm: noExitM / 1000 };
}

/** People per hex plus its ring of neighbours, read from the raster by HTTP range requests. */
async function people(cover, inCover) {
  const { fromUrl } = await import('geotiff');
  const south = Math.min(...cover.map((b) => b[0]));
  const west = Math.min(...cover.map((b) => b[1]));
  const north = Math.max(...cover.map((b) => b[2]));
  const east = Math.max(...cover.map((b) => b[3]));
  const url = POP_URL(south, west);
  console.log(`reading population from ${url.split('/').pop()}`);
  const img = await (await fromUrl(url)).getImage();
  const [ox, oy] = img.getOrigin();
  const [rx, ry] = img.getResolution();
  const x0 = Math.floor((west - ox) / rx);
  const x1 = Math.ceil((east - ox) / rx);
  const y0 = Math.floor((north - oy) / ry);
  const y1 = Math.ceil((south - oy) / ry);
  const data = (await img.readRasters({ window: [x0, y0, x1, y1] }))[0];
  const w = x1 - x0;
  const own = new Map();
  let total = 0;
  for (let r = 0; r < y1 - y0; r++) {
    for (let c = 0; c < w; c++) {
      const v = data[r * w + c];
      if (!(v > 0)) continue;
      const lat = oy + (y0 + r + 0.5) * ry;
      const lng = ox + (x0 + c + 0.5) * rx;
      if (!inCover(lat, lng)) continue;
      total += v;
      const h = latLngToCell(lat, lng, RES);
      own.set(h, (own.get(h) ?? 0) + v);
    }
  }
  const near = new Map();
  for (const [h, v] of own) for (const n of gridDisk(h, 1)) near.set(n, (near.get(n) ?? 0) + v);
  return { near, total, source: url.split('/').pop() };
}

async function main() {
  const regionName = opt('region', 'mumbai-thane');
  const region = REGIONS[regionName];
  if (!region) throw new Error(`unknown region ${regionName}. Known: ${Object.keys(REGIONS).join(', ')}`);
  const inCover = (lat, lng) => region.cover.some((b) => lat >= b[0] && lat <= b[2] && lng >= b[1] && lng <= b[3]);

  // Tiles overlap, so the same road can arrive twice.
  const ways = new Map();
  for (const [name, box] of Object.entries(region.tiles)) {
    for (const w of await loadRoads(name, box)) ways.set(w.id, w);
  }
  console.log(`${ways.size.toLocaleString()} roads`);
  const exits = noExit([...ways.values()], inCover);

  let pop = null;
  if (!flag('no-people')) {
    try {
      pop = await people(region.cover, inCover);
    } catch (err) {
      console.log(`population skipped: ${err.message}`);
    }
  }

  // Layers from the other pipeline script stay in the file.
  const kept = {};
  let keptSources = {};
  try {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    keptSources = { dark: old.sources?.dark ?? null, crime: old.sources?.crime ?? null };
    for (const [h, c] of Object.entries(old.cells ?? {})) {
      const e = {};
      if (c.dark !== undefined) e.dark = c.dark;
      if (c.crime !== undefined) e.crime = c.crime;
      if (Object.keys(e).length) kept[h] = e;
    }
  } catch {
    /* no file yet */
  }

  const cells = {};
  for (const h of new Set([...exits.roads, ...(pop ? pop.near.keys() : []), ...Object.keys(kept)])) {
    const [lat, lng] = cellToLatLng(h);
    const entry = { ...kept[h] };
    if (inCover(lat, lng)) {
      const x = exits.x.get(h) ?? 0;
      const p = pop?.near.get(h) ?? 0;
      if (x >= MIN_X) entry.x = Math.round(x * 100) / 100;
      if (p >= MIN_PEOPLE) entry.p = Math.round(p);
    }
    // Every hex with a road is listed, even with nothing to say about it: inside the
    // covered area, a hex missing from the file is open ground or water.
    if (Object.keys(entry).length || exits.roads.has(h)) cells[h] = entry;
  }

  const stats = {
    roadKm: Math.round(exits.roadKm),
    scoredKm: Math.round(exits.scoredKm),
    noExitKm: Math.round(exits.noExitKm),
    people: pop ? Math.round(pop.total) : null,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({
      generated: new Date().toISOString().slice(0, 19) + 'Z',
      resolution: RES,
      region: regionName,
      cover: region.cover,
      sources: { ...keptSources, exits: 'OpenStreetMap roads via Overpass', people: pop?.source ?? null },
      stats,
      cells,
    }),
  );
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`wrote ${Object.keys(cells).length.toLocaleString()} cells to ${OUT} (${kb} KB)`);
  console.log(stats);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
