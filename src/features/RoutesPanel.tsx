import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownUp, CarTaxiFront, Clock, Footprints, LoaderCircle, LocateFixed, MapPin, MapPinned, MessageSquareWarning, Moon, Route, Search, ShieldCheck, Sun, Sunset, TriangleAlert, X, Zap } from 'lucide-react';
import { RouteArt } from '../components/Illustration';
import { useEffect, useMemo, useRef, useState } from 'react';
import { JourneyCard } from '../components/Journey';
import { buildJourney } from '../lib/journey';
import { PanelTitle, Segmented } from '../components/ui';
import { config } from '../lib/config';
import { formatDistance, formatDuration, haversine } from '../lib/geo';
import { useT } from '../lib/i18n';
import { gridDisk } from 'h3-js';
import { buildContext, cellAt, level, riskLabelKey } from '../lib/risk';
import { rankRoutes } from '../lib/routes';
import { fetchRoutes, searchPlaces, type Place } from '../lib/services';
import { hhmm } from '../lib/sos';
import { sunTimes } from '../lib/sun';
import { getState, setState, useStore } from '../lib/store';
import { startTrip } from '../lib/trip';
import type { Endpoint, LatLng, Report, RiskCell, RouteOption } from '../lib/types';

type Props = {
  ctx: ReturnType<typeof buildContext>;
  grid: RiskCell[];
  reports: Report[];
};

export function RoutesPanel({ ctx, grid, reports }: Props) {
  const t = useT();
  const routes = useStore((s) => s.routes);
  const selected = useStore((s) => s.selectedRouteId);
  const mode = useStore((s) => s.travelMode);
  const locStatus = useStore((s) => s.locStatus);
  const planWhen = useStore((s) => s.planWhen);
  const pois = useStore((s) => s.pois);
  const picked = routes.find((r) => r.id === selected);
  const journey = useMemo(() => (picked ? buildJourney(picked, ctx, pois) : null), [picked, ctx, pois]);
  // The destination lives in the store so it survives tab switches and Help can set it.
  const to = useStore((s) => s.dest);
  const pending = useStore((s) => s.pendingRoute);

  const [from, setFrom] = useState<Endpoint>({ kind: 'me' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');

  const resolve = (e: Endpoint): LatLng => {
    if (e.kind === 'place') return e.place;
    const s = getState();
    return s.userLoc ?? s.mapCenter;
  };

  const find = async (dest = to, m = mode) => {
    if (!dest) return;
    setStatus('loading');
    try {
      const a = resolve(from);
      const b = resolve(dest);
      // Ask ORS (if configured) to steer around the hottest hexes, but never the ones at the ends.
      const ends = new Set([...gridDisk(cellAt(a), 1), ...gridDisk(cellAt(b), 1)]);
      const avoid = haversine(a, b) > 300
        ? grid.filter((c) => level(c.score) >= 4 && !ends.has(c.h3)).map((c) => c.h3).slice(0, 80)
        : [];
      const raw = await fetchRoutes(a, b, m, avoid);
      const ranked = rankRoutes(raw, ctx, reports);
      if (!ranked.length) {
        setStatus('empty');
        setState({ routes: [], selectedRouteId: null });
        return;
      }
      setStatus('idle');
      setState({ routes: ranked, selectedRouteId: ranked[0].id });
    } catch {
      setStatus('error');
    }
  };

  const swap = () => {
    if (!to) return;
    setFrom(to);
    setState({ dest: from });
  };

  // Help asked for a route ("Safer route to ..."): find it as soon as this panel shows.
  useEffect(() => {
    if (!pending) return;
    setState({ pendingRoute: false });
    if (to) find(to);
  }, [pending]); // eslint-disable-line react-hooks/exhaustive-deps

  // A new planning time changes every score, so rank the routes again.
  const lastWhen = useRef(planWhen);
  useEffect(() => {
    if (lastWhen.current === planWhen) return;
    lastWhen.current = planWhen;
    if (to && getState().routes.length) find(to);
  }, [planWhen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="panel-body">
      <PanelTitle>{t('map.title')}</PanelTitle>
      <Guide />

      {locStatus === 'denied' && <p className="note note--caution">{t('map.locDenied', { city: config.defaultCityLabel })}</p>}

      <div className="od">
        <div className="od__rail" aria-hidden="true">
          <span className="od__dot od__dot--from" />
          <span className="od__line" />
          <span className="od__dot od__dot--to" />
        </div>
        <div className="od__fields">
          <PlaceField label={t('map.from')} value={from} allowMe onChange={(e) => e && setFrom(e)} />
          <PlaceField
            label={t('map.to')}
            value={to}
            onChange={(e) => {
              setState({ dest: e });
              if (e) find(e);
              else setState({ routes: [], selectedRouteId: null });
            }}
            autoFocus={false}
          />
        </div>
        <button className="icon-btn od__swap" type="button" onClick={swap} aria-label="Swap start and destination" disabled={!to}>
          <ArrowDownUp size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="row">
        <Segmented
          label="Travel mode"
          value={mode}
          onChange={(v) => {
            setState({ travelMode: v });
            if (to) find(to, v);
          }}
          options={[
            { value: 'walk', label: t('map.walk'), icon: <Footprints size={16} aria-hidden="true" /> },
            { value: 'ride', label: t('map.ride'), icon: <CarTaxiFront size={16} aria-hidden="true" /> },
          ]}
        />
      </div>

      <div className="when">
        <span className="when__label">{t('map.when')}</span>
        <Segmented
          label={t('map.when')}
          value={planWhen}
          onChange={(v) => setState({ planWhen: v })}
          options={[
            { value: 'now', label: t('map.when.now'), icon: <Clock size={16} aria-hidden="true" /> },
            { value: 'day', label: t('map.when.day'), icon: <Sun size={16} aria-hidden="true" /> },
            { value: 'dusk', label: t('map.when.dusk'), icon: <Sunset size={16} aria-hidden="true" /> },
            { value: 'night', label: t('map.when.night'), icon: <Moon size={16} aria-hidden="true" /> },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {status === 'loading' && (
          <motion.div key="l" className="state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoaderCircle className="spin" size={20} aria-hidden="true" /> {t('map.finding')}
          </motion.div>
        )}
        {status === 'error' && (
          <motion.p key="e" className="note note--sos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {t('map.routeError')}
          </motion.p>
        )}
        {status === 'empty' && (
          <motion.p key="n" className="note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {t('map.noRoutes')}
          </motion.p>
        )}
        {status === 'idle' && routes.length === 0 && (
          <motion.div key="i" className="illus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RouteArt />
            <p>{t('map.empty')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'idle' && routes.length > 0 && (
        <motion.ul className="routes" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
          {routes.map((r) => (
            <RouteCard key={r.id} r={r} on={r.id === selected} onSelect={() => setState({ selectedRouteId: r.id })} />
          ))}
        </motion.ul>
      )}

      {status === 'idle' && picked && journey && <JourneyCard route={picked} journey={journey} />}
      {planWhen === 'now' && <Daylight tripS={status === 'idle' ? picked?.durationS : undefined} />}

      {routes.length > 0 && (
        <div className="row row--gap">
          <button className="btn btn--primary btn--lg grow" type="button" 
            onClick={() => {
              if (!getState().trip) startTrip();
              setState({ tab: 'trip' });
            }}
          >
            <ShieldCheck size={18} aria-hidden="true" /> {t('map.startTrip')}
          </button>
          <button className="btn btn--quiet btn--lg" type="button" onClick={() => setState({ routes: [], selectedRouteId: null })}>
            {t('map.clear')}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Daylight budget: how long until dark, and whether this trip fits in it.
 * Sunset is worked out on the phone from the date and place.
 */
function Daylight({ tripS }: { tripS?: number }) {
  const t = useT();
  const at = useStore((s) => s.userLoc ?? s.mapCenter);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60e3);
    return () => window.clearInterval(id);
  }, []);
  const sun = useMemo(() => sunTimes(new Date(now), at), [now, at]);
  if (!sun) return null;

  const set = sun.sunset.getTime();
  const dark = now < sun.sunrise.getTime() || now >= set;
  const time = hhmm(dark ? sun.sunrise : sun.sunset);
  const min = t('map.min');
  // Minutes she can still wait before leaving and arrive in daylight.
  const slackS = tripS === undefined ? 0 : (set - now) / 1000 - tripS;
  const text = dark
    ? t('sun.darkNow', { time })
    : tripS === undefined
      ? t('sun.darkIn', { dur: formatDuration((set - now) / 1000, min), time })
      : slackS < 0
        ? t('sun.after', { time })
        : slackS > 2 * 3600
          ? t('sun.before', { time })
          : t('sun.leaveBy', { dur: formatDuration(slackS, min), time });

  // Only the cases that call for a decision get the caution tint.
  const warn = dark || (tripS !== undefined && slackS <= 2 * 3600);
  return (
    <p className={`daylight ${warn ? 'is-warn' : ''}`}>
      {dark ? <Moon size={16} aria-hidden="true" /> : <Sunset size={16} aria-hidden="true" />}
      {text}
    </p>
  );
}

function RouteCard({ r, on, onSelect }: { r: RouteOption; on: boolean; onSelect: () => void }) {
  const t = useT();
  const lv = level(r.risk);
  return (
    <motion.li variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
      <motion.button type="button" className={`route-card ${on ? 'is-on' : ''}`} onClick={onSelect} aria-pressed={on} whileTap={{ scale: 0.985 }}>
        <div className="route-card__top">
          <span className="route-card__time">{formatDuration(r.durationS, t('map.min'))}</span>
          <span className="route-card__dist">{formatDistance(r.distanceM, t('map.km'))}</span>
          <span className="route-card__tags">
            {r.tags.includes('safest') && (
              <span className="tag tag--safe">
                <ShieldCheck size={13} aria-hidden="true" /> {t('map.safest')}
              </span>
            )}
            {r.tags.includes('fastest') && (
              <span className="tag tag--primary">
                <Zap size={13} aria-hidden="true" /> {t('map.fastest')}
              </span>
            )}
          </span>
        </div>
        <div className="meter" aria-label={`${t(riskLabelKey(r.risk) as 'map.risk.low')}, ${r.risk} of 100`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className={`meter__seg ${i <= lv ? `is-lv${lv}` : ''}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>
        <div className="route-card__meta">
          <span className={`risk-label is-lv${lv}`}>
            {lv <= 1 ? <ShieldCheck size={15} aria-hidden="true" /> : <TriangleAlert size={15} aria-hidden="true" />}
            {t(riskLabelKey(r.risk) as 'map.risk.low')}
          </span>
          {r.hotMeters > 0 && (
            <span title={`${r.hotMeters} ${t('map.hotStretch')}`}>
              <Route size={15} aria-hidden="true" /> {formatDistance(r.hotMeters)} {t('map.hotShort')}
            </span>
          )}
          {r.reportsNear > 0 && (
            <span title={`${r.reportsNear} ${t('map.reportsNear')}`}>
              <MapPinned size={15} aria-hidden="true" /> {r.reportsNear} {t('map.reportsShort')}
            </span>
          )}
        </div>
      </motion.button>
    </motion.li>
  );
}

function PlaceField({
  label,
  value,
  onChange,
  allowMe,
  autoFocus,
}: {
  label: string;
  value: Endpoint | null;
  onChange: (e: Endpoint | null) => void;
  allowMe?: boolean;
  autoFocus?: boolean;
}) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `pf-${label}`;

  const shown = value?.kind === 'me' ? t('map.myLocation') : value?.kind === 'place' ? value.place.label : '';

  useEffect(() => {
    if (!open || q.trim().length < 3) {
      setResults([]);
      return;
    }
    setBusy(true);
    const id = window.setTimeout(() => {
      const near = getState().userLoc ?? getState().mapCenter;
      searchPlaces(q.trim(), near, lang)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setBusy(false));
    }, 450);
    return () => window.clearTimeout(id);
  }, [q, open, lang]);

  return (
    <div className="pf">
      <label className="pf__label" htmlFor={`${listId}-in`}>
        {label}
      </label>
      <div className="pf__box">
        {value?.kind === 'me' && !open ? <LocateFixed size={16} className="pf__icon is-me" aria-hidden="true" /> : <Search size={16} className="pf__icon" aria-hidden="true" />}
        <input
          id={`${listId}-in`}
          ref={inputRef}
          className="pf__input"
          placeholder={t('map.searchPlaceholder')}
          value={open ? q : shown}
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          onFocus={() => {
            setOpen(true);
            setQ(value?.kind === 'place' ? value.place.label : '');
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 160)}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) {
              onChange({ kind: 'place', place: results[0] });
              inputRef.current?.blur();
            }
            if (e.key === 'Escape') inputRef.current?.blur();
          }}
        />
        {busy && open && <LoaderCircle size={16} className="spin pf__icon" aria-hidden="true" />}
        {!open && value && value.kind === 'place' && (
          <button className="pf__clear" type="button" aria-label={`Clear ${label}`} onClick={() => onChange(allowMe ? { kind: 'me' } : null)}>
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && (results.length > 0 || allowMe) && (
          <motion.ul
            id={listId}
            role="listbox"
            className="pf__list"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            {allowMe && (
              <li role="option" aria-selected={value?.kind === 'me'}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ kind: 'me' }); inputRef.current?.blur(); }}>
                  <LocateFixed size={16} aria-hidden="true" />
                  <span>
                    <strong>{t('map.myLocation')}</strong>
                  </span>
                </button>
              </li>
            )}
            {results.map((p) => (
              <li key={p.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange({ kind: 'place', place: p });
                    inputRef.current?.blur();
                  }}
                >
                  <MapPin size={16} aria-hidden="true" />
                  <span>
                    <strong>{p.label}</strong>
                    <small>{p.sub}</small>
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** First-run guide: three icon tiles, two words each. Dismissed once, remembered. */
function Guide() {
  const t = useT();
  const seen = useStore((s) => s.guideSeen);
  return (
    <AnimatePresence initial={false}>
      {!seen && (
        <motion.section
          className="guide"
          aria-label={t('guide.title')}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
          style={{ overflow: 'hidden' }}
        >
          <div className="guide__head">
            <h3>{t('guide.title')}</h3>
            <button className="btn btn--quiet guide__ok" type="button" onClick={() => setState({ guideSeen: true })}>
              {t('guide.ok')}
            </button>
          </div>
          <ol className="guide__steps">
            <li className="guide__step">
              <span className="guide__icon is-sos" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" opacity="0.45" />
                  <path d="M12 3a9 9 0 0 1 9 9" />
                  <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="guide__text">
                <strong>{t('guide.sos')}</strong>
                <span>{t('guide.sosSub')}</span>
              </span>
            </li>
            <li className="guide__step">
              <span className="guide__icon" aria-hidden="true">
                <Route size={20} />
              </span>
              <span className="guide__text">
                <strong>{t('guide.route')}</strong>
                <span>{t('guide.routeSub')}</span>
              </span>
            </li>
            <li className="guide__step">
              <span className="guide__icon is-safe" aria-hidden="true">
                <MessageSquareWarning size={20} />
              </span>
              <span className="guide__text">
                <strong>{t('guide.report')}</strong>
                <span>{t('guide.reportSub')}</span>
              </span>
            </li>
          </ol>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
