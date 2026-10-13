import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav, Legend, OfflineBanner, PanelTabs, ReportPin, Sheet, Toast, TopBar, Zoom } from './components/Chrome';
import { Alarm } from './components/Alarm';
import { CheckInPrompt } from './components/CheckInPrompt';
import { CrashGuard } from './components/CrashGuard';
import { FakeCall } from './components/FakeCall';
import { Intro } from './components/Intro';
import { WalkPreview } from './components/Journey';
import { MapView } from './components/MapView';
import { SosButton } from './components/SosButton';
import { SosOverlay } from './components/SosOverlay';
import { TrailView } from './components/TrailView';
import { HelpPanel } from './features/HelpPanel';
import { ReportPanel } from './features/ReportPanel';
import { RoutesPanel } from './features/RoutesPanel';
import { TripPanel } from './features/TripPanel';
import { config } from './lib/config';
import { demoReports } from './lib/demo';
import { haversine } from './lib/geo';
import { buildContext, buildGrid, cellAt, planDate, scoreCell, type StaticData } from './lib/risk';
import { fetchHelpPois, fetchPois, fetchRain } from './lib/services';
import { cloudFetchReports } from './lib/sos';
import { getState, setState, useStore } from './lib/store';
import { tripOnMove, tripSetRisk, tripTick } from './lib/trip';
import type { LatLng, Rain, Report } from './lib/types';

function useWide() {
  const q = '(min-width: 900px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

function introSeen() {
  try {
    return sessionStorage.getItem('kavach:intro') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const wide = useWide();
  const tab = useStore((s) => s.tab);
  const lang = useStore((s) => s.lang);
  const reports = useStore((s) => s.reports);
  const showDemo = useStore((s) => s.showDemo);
  const pois = useStore((s) => s.pois);
  const mapCenter = useStore((s) => s.mapCenter);

  const [intro, setIntro] = useState(() => !introSeen());
  const [staticData, setStaticData] = useState<StaticData | null>(null);
  const [rain, setRain] = useState<Rain | null>(null);
  const [cloud, setCloud] = useState<Report[]>([]);
  const [demoAnchor, setDemoAnchor] = useState<LatLng>(config.defaultCenter);
  const [clock, setClock] = useState(() => Date.now());
  const located = useRef(false);

  const endIntro = useCallback(() => {
    setIntro(false);
    try {
      sessionStorage.setItem('kavach:intro', '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Location: watch while the app is open. Browsers stop this when the tab closes.
  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ locStatus: 'unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        setState({ userLoc: loc, locStatus: 'granted', focus: loc });
      },
      (e) => setState({ locStatus: e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const loc = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        setState({ userLoc: loc, locStatus: 'granted' });
        tripOnMove(loc, p.timestamp);
        if (!located.current) {
          located.current = true;
          setState({ focus: loc });
          setDemoAnchor(loc);
        }
      },
      (e) => setState({ locStatus: e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Optional pipeline output per hex: no-way-out stretches, people living nearby, night lights, NCRB baseline.
  useEffect(() => {
    fetch('/data/risk-grid.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Partial<StaticData> | null) => j?.cells && Object.keys(j.cells).length && setStaticData({ cells: j.cells, cover: j.cover ?? [] }))
      .catch(() => undefined);
  }, []);

  // POIs + cloud reports refetch when the view moves far enough.
  const lastFetch = useRef<LatLng | null>(null);
  useEffect(() => {
    const c = mapCenter;
    if (lastFetch.current && haversine(lastFetch.current, c) < 1200) return;
    lastFetch.current = c;
    // Drop answers for a place the map has already left.
    const current = () => lastFetch.current === c;
    let full = false;
    setState({ poiStatus: 'loading' });
    // Quick police + hospital list first; the full Overpass set replaces it when it lands.
    fetchHelpPois(c).then((p) => {
      if (current() && !full && p.length) setState({ pois: p, poiStatus: 'ready' });
    });
    fetchPois(c)
      .then((p) => {
        full = true;
        if (current()) setState({ pois: p, poiStatus: 'ready' });
      })
      .catch(() => {
        if (current() && getState().poiStatus === 'loading') setState({ poiStatus: 'error' });
      });
    cloudFetchReports(c).then(setCloud);
    fetchRain(c).then((r) => {
      if (current()) setRain(r);
    });
  }, [mapCenter]);

  // Keep the screen on during a trip: browsers stop location when the phone locks.
  const tripOn = useStore((s) => s.trip !== null);
  useEffect(() => {
    if (!tripOn || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let off = false;
    const hold = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (off) l.release().catch(() => undefined);
          else lock = l;
        })
        .catch(() => undefined);
    };
    hold();
    document.addEventListener('visibilitychange', hold);
    return () => {
      off = true;
      document.removeEventListener('visibilitychange', hold);
      lock?.release().catch(() => undefined);
    };
  }, [tripOn]);

  // Clock tick: re-score every 5 minutes (time-of-day factor) and check trips every second.
  useEffect(() => {
    const id = window.setInterval(tripTick, 1000);
    const id2 = window.setInterval(() => setClock(Date.now()), 5 * 60e3);
    return () => {
      window.clearInterval(id);
      window.clearInterval(id2);
    };
  }, []);

  const allReports = useMemo(
    () => [...reports, ...cloud, ...(showDemo ? demoReports(demoAnchor) : [])],
    [reports, cloud, showDemo, demoAnchor],
  );

  const planWhen = useStore((s) => s.planWhen);
  // `ctx` is scored for the planning time she picked; `liveCtx` is always the real now.
  // demoAnchor is her first located position, so dusk follows the sun where she is.
  const liveCtx = useMemo(
    () => buildContext(allReports, pois, staticData, new Date(clock), demoAnchor, rain),
    [allReports, pois, staticData, clock, demoAnchor, rain],
  );
  const ctx = useMemo(
    () => (planWhen === 'now' ? liveCtx : buildContext(allReports, pois, staticData, planDate(planWhen, new Date(clock)), demoAnchor, rain)),
    [liveCtx, allReports, pois, staticData, clock, planWhen, demoAnchor, rain],
  );
  // The trip shield reads the live risk under her feet.
  useEffect(() => tripSetRisk((p) => scoreCell(cellAt(p), liveCtx).score), [liveCtx]);
  const centerCell = cellAt(mapCenter);
  // Recompute only when the centre crosses into a new hex, not on every pixel of panning.
  const gridCenter = useMemo(() => mapCenter, [centerCell]); // eslint-disable-line react-hooks/exhaustive-deps
  const grid = useMemo(() => buildGrid(gridCenter, ctx), [gridCenter, ctx]);

  const content = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tab}
        className="tab"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.16, ease: [0.23, 1, 0.32, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
      >
        {/* A broken panel must not take the map and SOS button down with it. */}
        <CrashGuard compact>
          {tab === 'map' && <RoutesPanel ctx={ctx} grid={grid} reports={allReports} />}
          {tab === 'help' && <HelpPanel ctx={liveCtx} />}
          {tab === 'report' && <ReportPanel />}
          {tab === 'trip' && <TripPanel />}
        </CrashGuard>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className={`app ${wide ? 'is-wide' : 'is-narrow'} tab-${tab}`}>
      <MapView grid={grid} />
      <ReportPin />
      <header className="chrome-top">
        {!wide && <TopBar onLocate={locate} />}
        <OfflineBanner />
      </header>
      <Legend />

      {wide ? (
        <>
          <aside className="panel" aria-label="Panel">
            <TopBar onLocate={locate} />
            <PanelTabs />
            <div className="panel__scroll">{content}</div>
          </aside>
          <Zoom />
          <div className="float-sos">
            <SosButton variant="float" />
          </div>
        </>
      ) : (
        <>
          <Sheet>{content}</Sheet>
          <BottomNav />
        </>
      )}

      <Toast />
      <WalkPreview ctx={ctx} />
      <TrailView />
      <Alarm />
      <FakeCall />
      <CheckInPrompt />
      <SosOverlay />
      <AnimatePresence>{intro && <Intro onDone={endIntro} />}</AnimatePresence>
    </div>
  );
}
