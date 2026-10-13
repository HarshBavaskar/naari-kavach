import { haversine, samplePolyline } from './geo';
import { cellAt, factorsAlong, scoreCell, buildContext } from './risk';
import type { RawRoute } from './services';
import type { Report, RouteOption } from './types';

type Ctx = ReturnType<typeof buildContext>;

/**
 * Score each candidate route against the risk grid and tag the safest and fastest.
 * Ranking: 70% mean risk along the route + 30% worst stretch, so one very bad
 * block is not hidden by a long safe walk.
 */
export function rankRoutes(raw: RawRoute[], ctx: Ctx, reports: Report[]): RouteOption[] {
  const cache = new Map<string, number>();
  const score = (h: string, tf: number) => {
    const key = `${h}:${tf}`;
    let v = cache.get(key);
    if (v === undefined) {
      v = scoreCell(h, ctx, tf).score;
      cache.set(key, v);
    }
    return v;
  };

  const STEP = 40;
  const seen = new Set<string>();
  const options: RouteOption[] = [];

  raw.forEach((r, i) => {
    // De-duplicate near-identical alternatives (ORS + OSRM can overlap).
    const sig = `${Math.round(r.distanceM / 50)}:${r.coords.length > 2 ? r.coords[Math.floor(r.coords.length / 2)].map((n) => n.toFixed(3)).join(',') : ''}`;
    if (seen.has(sig)) return;
    seen.add(sig);

    const pts = samplePolyline(r.coords, STEP);
    // Each point is scored for the time she reaches it, not for the moment of the search.
    const tfs = factorsAlong(ctx, r.durationS, pts.length);
    let sum = 0;
    let max = 0;
    let hot = 0;
    pts.forEach((p, k) => {
      const s = score(cellAt(p), tfs[k]);
      sum += s;
      max = Math.max(max, s);
      if (s >= 60) hot += STEP;
    });
    const mean = pts.length ? sum / pts.length : 0;

    let near = 0;
    for (const rep of reports) {
      if (pts.some((p) => haversine(p, rep) < 80)) near++;
    }

    options.push({
      id: `r${i}`,
      coords: r.coords,
      distanceM: r.distanceM,
      durationS: r.durationS,
      risk: Math.round(mean * 0.7 + max * 0.3),
      hotMeters: hot,
      reportsNear: near,
      tags: [],
    });
  });

  if (!options.length) return options;
  options.sort((a, b) => a.risk - b.risk || a.durationS - b.durationS);
  options[0].tags.push('safest');
  const fastest = options.reduce((a, b) => (b.durationS < a.durationS ? b : a));
  if (options.length > 1) fastest.tags.push('fastest');
  return options.slice(0, 3);
}
