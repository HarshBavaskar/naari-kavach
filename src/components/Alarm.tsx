import { AnimatePresence, motion } from 'framer-motion';
import { VolumeX } from 'lucide-react';
import { useEffect } from 'react';
import { useT } from '../lib/i18n';
import { startSiren } from '../lib/sound';
import { setState, useStore } from '../lib/store';

/**
 * Loud alarm. The siren follows `alarm` in the store, so it can be started
 * from Help or the SOS sheet and stopped from anywhere. Whoever sets
 * `alarm: true` must call primeSound() in the same tap.
 */
export function Alarm() {
  const t = useT();
  const on = useStore((s) => s.alarm);
  const sos = useStore((s) => s.sos);

  useEffect(() => {
    if (!on) return;
    return startSiren();
  }, [on]);

  // The SOS sheet has its own stop control; this one covers every other screen.
  return (
    <AnimatePresence>
      {on && sos === 'idle' && (
        <motion.button
          type="button"
          className="alarm-stop"
          onClick={() => setState({ alarm: false })}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 34 }}
        >
          <VolumeX size={20} aria-hidden="true" /> {t('alarm.stop')}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
