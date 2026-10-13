import { motion } from 'framer-motion';
import { useId } from 'react';
import { BODY, CRESCENTS, FIGURE_TRANSFORM, GAP, HEAD, NEIGHBOUR, PALLU, RADIUS } from './logoGeometry';

/**
 * The Kavach Mandala: a woman (bindi head, sari with pallu border) held inside
 * eight interlocking crescents. Geometry is shared with /brand so the app mark
 * and the brand files are identical. Masks give true transparency, so the mark
 * sits on any surface in light or dark.
 */
type Tone = 'brand' | 'onPrimary';

const tones: Record<Tone, { a: string; b: string; fig: string }> = {
  brand: { a: 'var(--primary)', b: 'var(--logo-deep, var(--primary-strong))', fig: 'var(--primary)' },
  onPrimary: { a: 'var(--primary-ink)', b: 'var(--logo-soft, #C3CAFF)', fig: 'var(--primary-ink)' },
};

function Defs({ id, simple }: { id: string; simple?: boolean }) {
  return (
    <defs>
      {CRESCENTS.map((_, i) => (
        <mask key={i} id={`${id}c${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <circle cx={NEIGHBOUR[i][0]} cy={NEIGHBOUR[i][1]} r={RADIUS + (simple ? 1.2 : GAP)} fill="#000" />
        </mask>
      ))}
      <mask id={`${id}f`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect width="100" height="100" fill="#fff" />
        <path d={PALLU[0]} fill="none" stroke="#000" strokeWidth={simple ? 2.6 : 2} strokeLinecap="round" />
        {!simple && <path d={PALLU[1]} fill="none" stroke="#000" strokeWidth={0.9} strokeLinecap="round" />}
      </mask>
    </defs>
  );
}

export function Logo({ size = 32, tone = 'brand' }: { size?: number; tone?: Tone }) {
  const id = useId().replace(/:/g, '');
  const t = tones[tone];
  const simple = size < 64;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <Defs id={id} simple={simple} />
      {CRESCENTS.map((d, i) => (
        <path key={i} d={d} fill={i % 2 ? t.b : t.a} mask={`url(#${id}c${i})`} />
      ))}
      <g transform={FIGURE_TRANSFORM}>
        <path d={BODY} fill={t.fig} mask={`url(#${id}f)`} />
        <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill="var(--sos)" />
      </g>
    </svg>
  );
}

/**
 * Intro: the crescents arrive one after another, turning into place around her
 * (protection assembling), the figure rises, the bindi lands last.
 */
export function LogoAnimated({ size = 112 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  const t = tones.onPrimary;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <Defs id={id} />
      <motion.g
        initial={{ rotate: -40, scale: 0.86 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: '50px', originY: '50px' }}
      >
        {CRESCENTS.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill={i % 2 ? t.b : t.a}
            mask={`url(#${id}c${i})`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ originX: '50px', originY: '50px' }}
            transition={{ delay: 0.08 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
          />
        ))}
      </motion.g>
      <g transform={FIGURE_TRANSFORM}>
        <motion.path
          d={BODY}
          fill={t.fig}
          mask={`url(#${id}f)`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx={HEAD.cx}
          cy={HEAD.cy}
          r={HEAD.r}
          fill="var(--sos)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ originX: `${HEAD.cx}px`, originY: `${HEAD.cy}px` }}
          transition={{ delay: 0.95, type: 'spring', stiffness: 520, damping: 18 }}
        />
      </g>
    </svg>
  );
}
