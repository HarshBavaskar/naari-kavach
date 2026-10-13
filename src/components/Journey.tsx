import { AnimatePresence, motion } from 'framer-motion';
import { CornerUpLeft, CornerUpRight, Eye, Moon, Play, ShieldCheck, Signpost, Store, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatDistance } from '../lib/geo';
import { useT, type TKey } from '../lib/i18n';
import { buildJourney, STEP_M, WATCH_SCORE, type Journey } from '../lib/journey';
import type { buildContext } from '../lib/risk';
import { getState, setState, useStore } from '../lib/store';
import type { RiskSignals, RouteOption } from '../lib/types';

type Ctx = ReturnType<typeof buildContext>;

/** Words for what makes the hardest part hard. The same lines the map popup uses. */
const REASON: Partial<Record<keyof RiskSignals, TKey>> = {
  noExit: 'why.noExit',
  isolation: 'why.isolation',
  helpFar: 'why.helpFar',
  reports: 'why.reports',
  darkness: 'why.dark',
};
/** A stretch with no side turn is worth a line of its own from this length. */
const EXIT_LINE_M = 200;

const minutes = (route: RouteOption) => Math.max(1, Math.round(route.durationS / 60));

/** Route profile for the selected route: where it gets quiet, when it gets dark, how far apart open places are. */
export function JourneyCard({ route, journey }: { route: RouteOption; journey: Journey }) {
  const t = useT();
  const preview = useStore((s) => s.preview);
  // Neighbouring points of one level become a single bar segment.
  const segs = useMemo(() => {
    const out: Array<{ lv: number; n: number }> = [];
    for (const lv of journey.levels) {
      const last = out[out.length - 1];
      if (last && last.lv === lv) last.n++;
      else out.push({ lv, n: 1 });
    }
    return out;
  }, [journey]);

  const n = journey.points.length;
  const minuteAt = (i: number) => Math.max(1, Math.round((minutes(route) * i) / Math.max(1, n - 1)));
  const hard = journey.hardest;
  const reasons = hard ? hard.why.map((k) => REASON[k]).filter((k): k is TKey => Boolean(k)) : [];
  const darkAt = journey.factors[0] === 1 ? journey.factors.findIndex((f) => f > 1) : -1;

  return (
    <section className="journey" aria-label={t('journey.title')}>
      <div className="journey__bar" aria-hidden="true">
        <div className="journey__stops">
          {journey.gapM !== null && journey.stops.map((on, i) => on && <span key={i} style={{ left: `${(i / Math.max(1, n - 1)) * 100}%` }} />)}
        </div>
        <div className="journey__strip">
          {segs.map((s, i) => (
            <span key={i} className={`is-lv${s.lv}`} style={{ flexGrow: s.n }} />
          ))}
        </div>
      </div>
      {hard ? (
        // Tap to see the hardest part on the map before she leaves.
        <button
          className="journey__line journey__hard"
          type="button"
          onClick={() => setState(window.innerWidth < 900 ? { focus: hard.at, sheetExpanded: false } : { focus: hard.at })}
        >
          <Eye size={16} aria-hidden="true" />
          <span>
            {t('journey.hardest', { len: formatDistance(hard.lengthM), min: minuteAt(hard.fromM / STEP_M) })}
            {reasons.length > 0 && <small>{reasons.map((k) => t(k)).join('. ')}</small>}
          </span>
        </button>
      ) : (
        <p className="journey__line">
          <Eye size={16} aria-hidden="true" />
          {t('journey.noQuiet')}
        </p>
      )}
      {hard?.before?.name && (
        <p className="journey__line">
          <Store size={16} aria-hidden="true" />
          {t('journey.before', { name: hard.before.name })}
        </p>
      )}
      {journey.exitM !== null && journey.exitM >= EXIT_LINE_M && (
        <p className="journey__line">
          <Signpost size={16} aria-hidden="true" />
          {t('journey.noExit', { len: formatDistance(journey.exitM) })}
        </p>
      )}
      {darkAt > 0 && (
        <p className="journey__line">
          <Moon size={16} aria-hidden="true" />
          {t('journey.dark', { min: minuteAt(darkAt) })}
        </p>
      )}
      {journey.gapM !== null && (
        <p className="journey__line">
          <Store size={16} aria-hidden="true" />
          {journey.gapM < 2 * STEP_M ? t('journey.gapNone') : t(journey.late ? 'journey.gapLate' : 'journey.gap', { len: formatDistance(journey.gapM) })}
        </p>
      )}
      <button
        className="btn btn--quiet btn--block"
        type="button"
        onClick={() => setState(preview ? { preview: false, previewPos: null } : { preview: true, sheetExpanded: false })}
      >
        {preview ? <X size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />} {t(preview ? 'journey.stop' : 'journey.preview')}
      </button>
    </section>
  );
}

/** A playback takes at least this long, however short the route, and no step is quicker than STEP_MS. */
const MIN_PLAY_MS = 12000;
const STEP_MS = 330;

/**
 * Plays the selected route on the map so she can rehearse it: where the
 * shield will watch closely and where the turns are. Clearly a preview, not live.
 */
export function WalkPreview({ ctx }: { ctx: Ctx }) {
  const on = useStore((s) => s.preview);
  const route = useStore((s) => s.routes.find((r) => r.id === s.selectedRouteId));
  const pois = useStore((s) => s.pois);
  // Each run gets a fresh id, so its Playback always starts from the first point. The profile is
  // taken once at the start: places loading mid-way must not restart the playback.
  const run = useMemo(() => (on && route ? { id: ++runs, journey: buildJourney(route, ctx, pois) } : null), [on, route]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clearing the routes or picking another one ends the preview.
  useEffect(() => {
    if (on && !route) setState({ preview: false, previewPos: null });
  }, [on, route]);

  return <AnimatePresence>{run && route && <Playback key={run.id} journey={run.journey} total={minutes(route)} />}</AnimatePresence>;
}

let runs = 0;

function Playback({ journey, total }: { journey: Journey; total: number }) {
  const t = useT();
  const [i, setI] = useState(0);
  const last = journey.points.length - 1;

  useEffect(() => {
    const id = window.setInterval(() => setI((v) => v + 1), Math.max(STEP_MS, MIN_PLAY_MS / journey.points.length));
    return () => window.clearInterval(id);
  }, [journey.points.length]);

  useEffect(() => {
    // Still mounted for the exit fade after a stop: leave the map alone then.
    if (!getState().preview) return;
    if (i > last) setState({ preview: false, previewPos: null });
    else setState({ previewPos: journey.points[i] });
  }, [i, journey, last]);

  const idx = Math.min(i, last);
  const watch = journey.scores[idx] >= WATCH_SCORE;
  const turn = journey.turns.find((x) => x.atM - idx * STEP_M >= 0 && x.atM - idx * STEP_M <= 2 * STEP_M);

  return (
    <motion.div
      className="preview-card"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -12, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
    >
      <span className="preview-card__tag">{t('preview.label')}</span>
      <span className="preview-card__text">
        <strong className="tabular">{t('preview.minute', { n: Math.max(1, Math.round((total * idx) / Math.max(1, last))), total })}</strong>
        <span className={watch ? 'is-watch' : ''}>
          {turn ? (
            turn.dir === 'left' ? <CornerUpLeft size={16} aria-hidden="true" /> : <CornerUpRight size={16} aria-hidden="true" />
          ) : watch ? (
            <Eye size={16} aria-hidden="true" />
          ) : (
            <ShieldCheck size={16} aria-hidden="true" />
          )}
          {turn ? t(turn.dir === 'left' ? 'preview.left' : 'preview.right') : t(watch ? 'preview.watch' : 'preview.calm')}
        </span>
      </span>
      <button className="icon-btn" type="button" aria-label={t('journey.stop')} onClick={() => setState({ preview: false, previewPos: null })}>
        <X size={18} aria-hidden="true" />
      </button>
    </motion.div>
  );
}
