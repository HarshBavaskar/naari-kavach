import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useT, type TKey } from '../lib/i18n';
import { vibrate } from '../lib/sos';
import { setState, useStore, type CheckInWhy } from '../lib/store';
import { tripSafe } from '../lib/trip';

/**
 * Seconds before an unanswered question becomes SOS. A question about a stop
 * waits longer: walking on answers it, and the phone may be in her bag.
 */
const GRACE_S: Record<CheckInWhy, number> = { still: 60, route: 60, late: 60, fast: 30, away: 30 };
/** Buzz again this often while it waits, so a phone in a pocket is still felt. */
const BUZZ_EVERY_S = 15;

/** Something on the trip looks wrong: ask once, escalate to SOS after a grace period. */
export function CheckInPrompt() {
  const due = useStore((s) => s.checkInDue);
  const sos = useStore((s) => s.sos);
  return <AnimatePresence>{due && sos === 'idle' && <Prompt key="p" />}</AnimatePresence>;
}

function Prompt() {
  const t = useT();
  const why = useStore((s) => s.checkInWhy);
  const grace = GRACE_S[why];
  const [n, setN] = useState(grace);

  useEffect(() => {
    const id = window.setInterval(() => setN((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (n === 0) setState({ sos: 'active', checkInDue: false });
    else if (n % BUZZ_EVERY_S === 0) vibrate([300, 150, 300]);
  }, [n]);

  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ci-title"
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        <h2 id="ci-title">{t('trip.due.title')}</h2>
        <p>
          {t(`trip.due.${why}` as TKey)} <strong className="tabular">{n}s</strong>
        </p>
        <div className="dialog__bar" aria-hidden="true">
          <motion.span initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: grace, ease: 'linear' }} />
        </div>
        <button className="btn btn--safe btn--lg btn--block" type="button" onClick={tripSafe} autoFocus>
          {t('trip.due.safe')}
        </button>
        <button className="btn btn--sos btn--lg btn--block" type="button" onClick={() => setState({ sos: 'active', checkInDue: false })}>
          {t('trip.due.help')}
        </button>
      </motion.div>
    </motion.div>
  );
}
