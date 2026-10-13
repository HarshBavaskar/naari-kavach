import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from 'framer-motion';
import { useRef, useState } from 'react';
import { config } from '../lib/config';
import { useT } from '../lib/i18n';
import { vibrate } from '../lib/sos';
import { setState, toast, useStore } from '../lib/store';

/**
 * The signature control. Press and hold: a ring fills over 1.5 s, then the
 * cancel countdown opens. A quick tap only nudges and explains, so pockets
 * and stray taps never send an alert.
 */
export function SosButton({ variant }: { variant: 'nav' | 'float' }) {
  const t = useT();
  const sos = useStore((s) => s.sos);
  const progress = useMotionValue(0);
  const dash = useTransform(progress, (p) => p);
  const scale = useTransform(progress, [0, 1], [1, 0.94]);
  const ctl = useRef<AnimationPlaybackControls | null>(null);
  const startedAt = useRef(0);
  const [holding, setHolding] = useState(false);
  const [nudge, setNudge] = useState(0);

  const start = () => {
    if (sos !== 'idle') return;
    startedAt.current = performance.now();
    setHolding(true);
    vibrate(15);
    ctl.current?.stop();
    ctl.current = animate(progress, 1, {
      duration: (config.sosHoldMs / 1000) * (1 - progress.get()),
      ease: 'linear',
      onComplete: () => {
        setHolding(false);
        vibrate([60, 40, 60]);
        setState({ sos: 'countdown' });
        progress.set(0);
      },
    });
  };

  const stop = () => {
    if (!holding) return;
    setHolding(false);
    ctl.current?.stop();
    if (performance.now() - startedAt.current < 280) {
      setNudge((n) => n + 1);
      if (variant === 'nav') toast(t('sos.hold'), 'info');
    }
    animate(progress, 0, { duration: 0.25, ease: [0.22, 1, 0.36, 1] });
  };

  const size = variant === 'nav' ? 64 : 96;
  const r = size / 2 - 4;

  return (
    <div className={`sos sos--${variant}`}>
      <motion.button
        type="button"
        className="sos__btn"
        aria-label={t('sos.hold')}
        aria-describedby={variant === 'float' ? 'sos-hint' : undefined}
        style={{ width: size, height: size, scale }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          start();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') stop();
        }}
        onBlur={stop}
        key={nudge}
        animate={nudge ? { x: [0, -5, 5, -3, 3, 0] } : undefined}
        transition={{ duration: 0.36 }}
      >
        <svg className="sos__ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} className="sos__track" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            className="sos__progress"
            style={{ pathLength: dash, rotate: -90, originX: '50%', originY: '50%' }}
          />
        </svg>
        <span className="sos__label">SOS</span>
      </motion.button>
      {variant === 'float' && (
        <motion.span id="sos-hint" className="sos__hint" animate={{ opacity: 1 }} initial={false}>
          {holding ? t('sos.holding') : t('sos.hold')}
        </motion.span>
      )}
    </div>
  );
}
