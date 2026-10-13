import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cellToBoundary, cellToLatLng, latLngToCell } from 'h3-js';
import { config } from '../lib/config';
import { translate, type TKey } from '../lib/i18n';
import { level, planDate, riskLabelKey, timeFactor } from '../lib/risk';
import { getState, setState, useStore } from '../lib/store';
import type { Poi, RiskCell } from '../lib/types';

// Calm, low-opacity fills: the map should inform without alarming.
const FILL_OPACITY = [0, 0.18, 0.24, 0.3, 0.34];
/** A hex scored without its shops on the map is drawn fainter: less sure, so less ink. */
const BLIND_FADE = 0.6;

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

const POLICE_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2.5c2.4 1.7 5.2 2.6 8 2.7v5.4c0 5.1-3.3 8.6-8 10.4-4.7-1.8-8-5.3-8-10.4V5.2c2.8-.1 5.6-1 8-2.7z" fill="currentColor"/></svg>';
const HOSPITAL_SVG =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" fill="currentColor"/></svg>';

function poiIcon(p: Poi) {
  return L.divIcon({
    className: `poi poi--${p.kind}`,
    html: `<span class="poi__chip">${p.kind === 'police' ? POLICE_SVG : HOSPITAL_SVG}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const meIcon = L.divIcon({
  className: 'me',
  html: '<span class="me__ring"></span><span class="me__dot"></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const previewIcon = L.divIcon({
  className: 'pv',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const endIcon = L.divIcon({
  className: 'route-end',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Plain reasons behind a hex's colour, for the tap-to-explain popup. All text comes from i18n. */
function whyHtml(c: RiskCell) {
  const s = getState();
  const t = (k: TKey) => translate(s.lang, k);
  const sig = c.signals;
  const why: string[] = [];
  if ((sig.reports ?? 0) >= 0.05) why.push(t(s.showDemo ? 'why.reportsDemo' : 'why.reports'));
  if ((sig.noExit ?? 0) >= 0.5) why.push(t('why.noExit'));
  if ((sig.isolation ?? 0) >= 0.6 && !c.thin) why.push(t(c.blind ? 'why.fewHomes' : 'why.isolation'));
  if (c.wet) why.push(t('why.rain'));
  if ((sig.darkness ?? 0) >= 0.5) why.push(t('why.dark'));
  if ((sig.helpFar ?? 0) >= 0.5) why.push(t('why.helpFar'));
  if ((sig.areaCrime ?? 0) >= 0.5) why.push(t('why.crime'));
  const lv = level(c.score);
  // Say so when the shops here are not on the map, whatever the colour came out as.
  const blind = c.blind || c.thin ? `<p class="why__note">${t(c.thin ? 'why.thin' : 'why.blind')}</p>` : '';
  if (lv === 0) return `<strong class="why__title">${t('why.none')}</strong>${blind}`;
  if (!why.length) why.push(t('why.mixed'));
  if (timeFactor(planDate(s.planWhen), s.mapCenter) > 1) why.push(t('why.night'));
  return `<strong class="why__title is-lv${lv}">${t(riskLabelKey(c.score) as TKey)}</strong><ul class="why__list">${why.map((w) => `<li>${w}</li>`).join('')}</ul>${blind}`;
}

type Props = { grid: RiskCell[] };

export function MapView({ grid }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const hexLayer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.LayerGroup | null>(null);
  const poiLayer = useRef<L.LayerGroup | null>(null);
  const meMarker = useRef<L.Marker | null>(null);
  const canvas = useRef<L.Canvas | null>(null);
  const cells = useRef(new Map<string, RiskCell>());

  const routes = useStore((s) => s.routes);
  const selected = useStore((s) => s.selectedRouteId);
  const pois = useStore((s) => s.pois);
  const userLoc = useStore((s) => s.userLoc);
  const focus = useStore((s) => s.focus);
  const ripple = useStore((s) => s.ripple);
  const tab = useStore((s) => s.tab);

  // Init once
  useEffect(() => {
    if (!el.current || map.current) return;
    const s = getState();
    const m = L.map(el.current, {
      center: [s.mapCenter.lat, s.mapCenter.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: false,
    });
    m.attributionControl.setPrefix(false);
    m.attributionControl.setPosition('topright');
    map.current = m;

    // One keyless tile set for both themes; the dark look is a CSS filter on the tile pane.
    L.tileLayer(config.tiles.url, { attribution: config.tiles.attribution, maxZoom: 19 }).addTo(m);

    m.createPane('risk');
    m.getPane('risk')!.style.zIndex = '350';
    canvas.current = L.canvas({ pane: 'risk', padding: 0.3 });
    hexLayer.current = L.layerGroup().addTo(m);
    routeLayer.current = L.layerGroup().addTo(m);
    poiLayer.current = L.layerGroup().addTo(m);

    const syncPin = () => {
      const pin = document.querySelector('.report-pin__tip');
      if (!pin || !el.current) return;
      const a = pin.getBoundingClientRect();
      const b = el.current.getBoundingClientRect();
      const ll = m.containerPointToLatLng([a.left + a.width / 2 - b.left, a.top + a.height / 2 - b.top]);
      setState({ pinLoc: { lat: ll.lat, lng: ll.lng } });
    };
    let t = 0;
    m.on('moveend', () => {
      const c = m.getCenter();
      window.clearTimeout(t);
      t = window.setTimeout(() => setState({ mapCenter: { lat: c.lat, lng: c.lng } }), 250);
      syncPin();
    });
    (m as unknown as { _syncPin: () => void })._syncPin = syncPin;

    // Tap the map to see why that spot has its colour. Off while placing a report pin.
    m.on('click', (e) => {
      if (getState().tab === 'report') return;
      const cell = cells.current.get(latLngToCell(e.latlng.lat, e.latlng.lng, config.h3Resolution));
      if (!cell) return;
      const wide = window.innerWidth >= 900;
      L.popup({
        className: 'why',
        closeButton: false,
        maxWidth: 240,
        autoPanPaddingTopLeft: wide ? [452, 80] : [16, 120],
        autoPanPaddingBottomRight: wide ? [16, 16] : [16, 260],
      })
        .setLatLng(cellToLatLng(cell.h3))
        .setContent(whyHtml(cell))
        .openOn(m);
    });

    const onZoom = (e: Event) => m.setZoom(m.getZoom() + (e as CustomEvent<number>).detail);
    window.addEventListener('kavach:zoom', onZoom);
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      window.removeEventListener('kavach:zoom', onZoom);
      m.remove();
      map.current = null;
    };
  }, []);

  // Risk hexes (canvas for speed). The pane fades on each redraw so updates read as change.
  useEffect(() => {
    const m = map.current;
    const layer = hexLayer.current;
    if (!m || !layer || !canvas.current) return;
    layer.clearLayers();
    cells.current = new Map(grid.map((c) => [c.h3, c]));
    const ramp = [0, 1, 2, 3, 4].map((i) => cssVar(`--risk-${i}`));
    for (const c of grid) {
      const lv = level(c.score);
      if (lv === 0) continue;
      const ring = cellToBoundary(c.h3) as [number, number][];
      L.polygon(ring, {
        renderer: canvas.current,
        stroke: false,
        fillColor: ramp[lv],
        fillOpacity: FILL_OPACITY[lv] * (c.blind || c.thin ? BLIND_FADE : 1),
        interactive: false,
      }).addTo(layer);
    }
    const pane = m.getPane('risk');
    if (pane) {
      pane.animate?.([{ opacity: 0.35 }, { opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.22,1,0.36,1)' });
    }
  }, [grid]);

  // Routes: unselected first, selected on top with a draw-on animation.
  useEffect(() => {
    const layer = routeLayer.current;
    const m = map.current;
    if (!layer || !m) return;
    layer.clearLayers();
    m.closePopup();
    if (!routes.length) return;
    const ordered = [...routes.filter((r) => r.id !== selected), ...routes.filter((r) => r.id === selected)];
    for (const r of ordered) {
      const isSel = r.id === selected;
      const casing = L.polyline(r.coords, {
        className: `route-casing ${isSel ? 'is-selected' : ''}`,
        weight: isSel ? 11 : 8,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(layer);
      const line = L.polyline(r.coords, {
        className: `route ${isSel ? 'is-selected' : ''}`,
        weight: isSel ? 6 : 4,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layer);
      line.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setState({ selectedRouteId: r.id });
      });
      if (isSel) {
        const path = line.getElement() as SVGPathElement | undefined;
        const cpath = casing.getElement() as SVGPathElement | undefined;
        if (path && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const len = path.getTotalLength();
          for (const p of [path, cpath]) {
            if (!p) continue;
            p.style.strokeDasharray = `${len}`;
            p.style.strokeDashoffset = `${len}`;
            p.getBoundingClientRect();
            p.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.65,0,0.35,1)';
            p.style.strokeDashoffset = '0';
          }
          window.setTimeout(() => {
            for (const p of [path, cpath]) if (p) p.style.strokeDasharray = '';
          }, 950);
        }
        L.marker(r.coords[r.coords.length - 1], { icon: endIcon, interactive: false }).addTo(layer);
      }
    }
    const sel = routes.find((r) => r.id === selected) ?? routes[0];
    const wide = window.innerWidth >= 900;
    m.fitBounds(L.latLngBounds(sel.coords), {
      paddingTopLeft: wide ? [460, 80] : [32, 90],
      paddingBottomRight: wide ? [60, 60] : [32, Math.round(window.innerHeight * 0.45)],
      maxZoom: 17,
    });
  }, [routes, selected]);

  // Police + hospital markers (activity POIs feed the risk engine only, not drawn).
  useEffect(() => {
    const layer = poiLayer.current;
    if (!layer) return;
    layer.clearLayers();
    for (const p of pois) {
      if (p.kind === 'activity') continue;
      L.marker([p.lat, p.lng], { icon: poiIcon(p), title: p.name ?? p.kind, keyboard: false })
        .on('click', () => setState({ tab: 'help', sheetExpanded: true }))
        .addTo(layer);
    }
  }, [pois]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!userLoc) {
      meMarker.current?.remove();
      meMarker.current = null;
      return;
    }
    if (!meMarker.current) meMarker.current = L.marker([userLoc.lat, userLoc.lng], { icon: meIcon, interactive: false, zIndexOffset: 1000 }).addTo(m);
    else meMarker.current.setLatLng([userLoc.lat, userLoc.lng]);
  }, [userLoc]);

  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    m.flyTo([focus.lat, focus.lng], Math.max(m.getZoom(), 16), { duration: 0.8 });
    setState({ focus: null });
  }, [focus]);

  // Route preview: a marker that walks the selected route.
  const previewPos = useStore((s) => s.previewPos);
  const previewMarker = useRef<L.Marker | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!previewPos) {
      previewMarker.current?.remove();
      previewMarker.current = null;
    } else if (!previewMarker.current) {
      previewMarker.current = L.marker([previewPos.lat, previewPos.lng], { icon: previewIcon, interactive: false, zIndexOffset: 900 }).addTo(m);
    } else previewMarker.current.setLatLng([previewPos.lat, previewPos.lng]);
  }, [previewPos]);

  // An opened sealed trail, for the contact who holds its link: her route and where she was last.
  const trail = useStore((s) => s.trail);
  useEffect(() => {
    const m = map.current;
    if (!m || !trail?.length) return;
    const path = trail.map((p) => [p.lat, p.lng] as [number, number]);
    const group = L.layerGroup([
      L.polyline(path, { className: 'route-casing is-selected', weight: 11, lineCap: 'round', lineJoin: 'round', interactive: false }),
      L.polyline(path, { className: 'route is-selected', weight: 6, lineCap: 'round', lineJoin: 'round', interactive: false }),
      L.marker(path[path.length - 1], { icon: endIcon, interactive: false }),
    ]).addTo(m);
    return () => {
      group.remove();
    };
  }, [trail]);

  // Ripple where a report was saved.
  useEffect(() => {
    const m = map.current;
    if (!m || !ripple) return;
    const icon = L.divIcon({ className: 'ripple', html: '<span></span><span></span>', iconSize: [120, 120], iconAnchor: [60, 60] });
    const mk = L.marker([ripple.lat, ripple.lng], { icon, interactive: false }).addTo(m);
    const t = window.setTimeout(() => mk.remove(), 1600);
    return () => {
      window.clearTimeout(t);
      mk.remove();
    };
  }, [ripple]);

  // Re-sync the report pin after the sheet settles on tab change.
  useEffect(() => {
    if (tab !== 'report') return;
    const t = window.setTimeout(() => (map.current as unknown as { _syncPin?: () => void })?._syncPin?.(), 450);
    return () => window.clearTimeout(t);
  }, [tab]);

  return <div ref={el} className="map" role="application" aria-label="Map with risk overlay" />;
}
