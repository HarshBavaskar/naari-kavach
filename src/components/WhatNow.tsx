import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FileText, HeartHandshake, Hospital, LifeBuoy, MapPin, Package, Phone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useT, type TKey } from '../lib/i18n';

/** The steps in order. Text lives in i18n; the law behind each line is named there. */
const STEPS: Array<{ id: string; icon: ReactNode }> = [
  { id: 'safe', icon: <MapPin size={18} aria-hidden="true" /> },
  { id: 'care', icon: <Hospital size={18} aria-hidden="true" /> },
  { id: 'keep', icon: <Package size={18} aria-hidden="true" /> },
  { id: 'report', icon: <FileText size={18} aria-hidden="true" /> },
  { id: 'help', icon: <HeartHandshake size={18} aria-hidden="true" /> },
];

/** Free lines she can call from this guide. */
const LINES = ['112', '181', '15100'] as const;

/**
 * What to do after something has happened: steps and rights in plain words.
 * Shipped inside the app, so it opens with no network. Closed until she asks for it.
 */
export function WhatNow() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <section className={`whatnow ${open ? 'is-open' : ''}`}>
      <button className="whatnow__head" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="tool__icon">
          <LifeBuoy size={20} aria-hidden="true" />
        </span>
        <span className="tool__text">
          <strong>{t('now.title')}</strong>
          <span>{t('now.sub')}</span>
        </span>
        <ChevronDown size={18} className="whatnow__chev" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="whatnow__body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          >
            <ol className="whatnow__steps">
              {STEPS.map((s) => (
                <li key={s.id}>
                  <span className="whatnow__icon">{s.icon}</span>
                  <span>
                    <strong>{t(`now.${s.id}` as TKey)}</strong>
                    <small>{t(`now.${s.id}Sub` as TKey)}</small>
                  </span>
                </li>
              ))}
            </ol>
            <div className="whatnow__lines">
              {LINES.map((n) => (
                <a key={n} className="btn btn--quiet" href={`tel:${n}`}>
                  <Phone size={16} aria-hidden="true" /> {n}
                </a>
              ))}
            </div>
            <p className="whatnow__kind">{t('now.kind')}</p>
            <p className="whatnow__note">{t('now.note')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
