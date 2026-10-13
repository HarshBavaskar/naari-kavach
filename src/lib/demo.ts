import { mulberry32 } from './geo';
import type { LatLng, Report, ReportCategory } from './types';

/**
 * Demo reports for pitches and testing. They are clearly flagged as `demo`,
 * shown with a "Demo data" chip, and can be hidden. Never mix them into
 * exported data or present them as real incidents.
 */
const CATS: ReportCategory[] = ['poor_lighting', 'isolated', 'harassment', 'followed', 'unsafe_transport', 'poor_lighting', 'isolated'];

export function demoReports(center: LatLng, count = 34): Report[] {
  const rnd = mulberry32(Math.round(center.lat * 1000) * 7 + Math.round(center.lng * 1000));
  const now = Date.now();
  // A few clusters make the heatmap readable, plus scattered singles.
  const clusters = Array.from({ length: 5 }, () => ({
    lat: center.lat + (rnd() - 0.5) * 0.03,
    lng: center.lng + (rnd() - 0.5) * 0.03,
  }));
  return Array.from({ length: count }, (_, i) => {
    const c = i < count * 0.75 ? clusters[i % clusters.length] : center;
    const spread = i < count * 0.75 ? 0.0035 : 0.03;
    return {
      id: `demo-${i}`,
      lat: c.lat + (rnd() - 0.5) * spread,
      lng: c.lng + (rnd() - 0.5) * spread,
      category: CATS[Math.floor(rnd() * CATS.length)],
      at: now - Math.floor(rnd() * 30) * 24 * 3600 * 1000,
      source: 'demo' as const,
    };
  });
}
