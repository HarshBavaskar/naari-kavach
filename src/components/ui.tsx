import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Kinetic title: the variable width axis opens from condensed to normal on
 * mount. One typographic gesture, reused on every panel, so it reads as the
 * product's voice rather than decoration.
 */
export function PanelTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="panel-title">
      <motion.h2
        initial={{ opacity: 0, fontVariationSettings: "'wdth' 76, 'wght' 480" }}
        animate={{ opacity: 1, fontVariationSettings: "'wdth' 100, 'wght' 620" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.h2>
      {sub && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.3 }}>
          {sub}
        </motion.p>
      )}
    </header>
  );
}

type SegOption<T extends string> = { value: T; label: ReactNode; icon?: ReactNode };

/**
 * The thumb is one element slid with CSS. It must not use a framer `layoutId`:
 * a shared-layout element inside a tab panel stops that panel from ever
 * finishing its exit, which leaves the next tab blank.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  label: string;
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="seg" role="radiogroup" aria-label={label} style={{ '--n': options.length, '--i': index } as CSSProperties}>
      <span className="seg__thumb" aria-hidden="true" />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            className={`seg__opt ${on ? 'is-on' : ''}`}
            onClick={() => onChange(o.value)}
          >
            <span className="seg__content">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  on,
  onClick,
  icon,
  children,
}: {
  on: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      className={`chip ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      layout
      transition={{ type: 'spring', stiffness: 600, damping: 34 }}
    >
      {icon}
      <span>{children}</span>
      {on && (
        <motion.svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" initial={{ width: 0, opacity: 0 }} animate={{ width: 14, opacity: 1 }}>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.svg>
      )}
    </motion.button>
  );
}

export function Section({ title, children, aside, icon }: { title: ReactNode; children: ReactNode; aside?: ReactNode; icon?: ReactNode }) {
  return (
    <section className="section">
      <div className="section__head">
        <h3>
          {icon && <span className="section__icon" aria-hidden="true">{icon}</span>}
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
