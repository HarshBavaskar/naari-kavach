import { AnimatePresence, motion } from 'framer-motion';
import { Lock, LockOpen, Navigation, Phone, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { mapsLink } from '../lib/geo';
import { useT } from '../lib/i18n';
import { hhmm } from '../lib/sos';
import { setState } from '../lib/store';
import { trailFromHash, trailRead, type TrailState } from '../lib/trail';

/** While sealed, look again this often so it opens by itself when the time comes. */
const RECHECK_MS = 60e3;

/**
 * What a trusted contact sees on opening her sealed-trail link. Sealed until
 * she is overdue or has raised SOS; then her route is unlocked in this
 * browser and drawn on the map. Renders nothing for anyone without a link.
 */
export function TrailView() {
  const t = useT();
  const [link] = useState(() => trailFromHash());
  const [trail, setTrail] = useState<TrailState | null>(null);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    if (!link) return;
    let off = false;
    const load = () =>
      trailRead(link.id, link.key).then((s) => {
        if (off) return;
        setTrail(s);
        if (s.state === 'open' && s.points.length) setState({ trail: s.points, focus: s.points[s.points.length - 1] });
      });
    load();
    const id = window.setInterval(load, RECHECK_MS);
    return () => {
      off = true;
      window.clearInterval(id);
    };
  }, [link]);

  if (!link || !trail) return null;
  const last = trail.state === 'open' ? trail.points[trail.points.length - 1] : null;
  const text =
    trail.state === 'sealed'
      ? t('trail.view.sealed', { time: hhmm(new Date(trail.opensAt)) })
      : trail.state === 'gone'
        ? t('trail.view.gone')
        : trail.state === 'error'
          ? t('trail.view.error')
          : last
            ? t('trail.view.open', { time: hhmm(new Date(last.at)) })
            : t('trail.view.empty');

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          className="trailview"
          role="status"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        >
          <span className={`trailview__icon is-${trail.state}`}>
            {trail.state === 'open' ? (
              <LockOpen size={20} aria-hidden="true" />
            ) : trail.state === 'gone' ? (
              <ShieldCheck size={20} aria-hidden="true" />
            ) : (
              <Lock size={20} aria-hidden="true" />
            )}
          </span>
          <span className="trailview__text">
            <strong>{t('trail.title')}</strong>
            <span>{text}</span>
          </span>
          {last && (
            <>
              <a className="icon-btn" href={mapsLink(last)} target="_blank" rel="noreferrer" aria-label={t('trail.view.maps')}>
                <Navigation size={18} aria-hidden="true" />
              </a>
              <a className="icon-btn" href="tel:112" aria-label={t('sos.call112')}>
                <Phone size={18} aria-hidden="true" />
              </a>
            </>
          )}
          <button className="icon-btn" type="button" aria-label={t('common.close')} onClick={() => setShown(false)}>
            <X size={18} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
