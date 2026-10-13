import { AnimatePresence, motion, useAnimationControls, useDragControls, type PanInfo } from 'framer-motion';
import { Check, Info, Languages, LifeBuoy, LocateFixed, MessageSquareWarning, Minus, Plus, Route, ShieldCheck, Timer, TriangleAlert, WifiOff } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { langLabels, langNames, useT } from '../lib/i18n';
import { setState, useStore } from '../lib/store';
import type { Lang, Tab } from '../lib/types';
import { Logo } from './Logo';
import { SosButton } from './SosButton';

const TABS: Array<{ id: Tab; icon: ReactNode; key: 'nav.map' | 'nav.help' | 'nav.report' | 'nav.trip' }> = [
  { id: 'map', icon: <Route size={22} aria-hidden="true" />, key: 'nav.map' },
  { id: 'help', icon: <LifeBuoy size={22} aria-hidden="true" />, key: 'nav.help' },
  { id: 'report', icon: <MessageSquareWarning size={22} aria-hidden="true" />, key: 'nav.report' },
  { id: 'trip', icon: <Timer size={22} aria-hidden="true" />, key: 'nav.trip' },
];

export function TopBar({ onLocate }: { onLocate: () => void }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const [open, setOpen] = useState(false);
  return (
    <div className="topbar">
      <div className="brand">
        <Logo size={32} />
        <span className="brand__text">
          <span className="brand__word">{t('app.name')}</span>
          <span className="brand__deva" lang="mr">नारी कवच</span>
        </span>
      </div>
      <div className="topbar__actions">
        <div className="lang">
          <button className="pill-btn" type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={t('lang.label')} onClick={() => setOpen((o) => !o)}>
            <span className="pill-btn__lang">
              <Languages size={16} aria-hidden="true" />
              {langLabels[lang]}
            </span>
          </button>
          <AnimatePresence>
            {open && (
              <motion.ul
                className="lang__menu"
                role="listbox"
                aria-label={t('lang.label')}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
              >
                {(Object.keys(langNames) as Lang[]).map((l) => (
                  <li key={l} role="option" aria-selected={l === lang}>
                    <button
                      type="button"
                      lang={l}
                      onClick={() => {
                        setState({ lang: l });
                        document.documentElement.lang = l === 'en' ? 'en' : l;
                        setOpen(false);
                      }}
                    >
                      {langNames[l]}
                      {l === lang && <Check size={16} aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <button className="pill-btn pill-btn--icon" type="button" onClick={onLocate} aria-label={t('map.locate')}>
          <LocateFixed size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Mobile: four tabs around a centre SOS. Indicator slides with layoutId. */
export function BottomNav() {
  const t = useT();
  const tab = useStore((s) => s.tab);
  const item = (x: (typeof TABS)[number]) => {
    const on = x.id === tab;
    return (
      <button
        key={x.id}
        type="button"
        className={`nav__item ${on ? 'is-on' : ''}`}
        aria-current={on ? 'page' : undefined}
        onClick={() => setState({ tab: x.id, sheetExpanded: x.id !== 'report' })}
      >
        {on && <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
        <span className="nav__icon">{x.icon}</span>
        <span className="nav__label">{t(x.key)}</span>
      </button>
    );
  };
  return (
    <nav className="nav" aria-label="Main">
      {TABS.slice(0, 2).map(item)}
      <div className="nav__sos">
        <SosButton variant="nav" />
        <span className="nav__sos-label" aria-hidden="true">{t('nav.sos')}</span>
      </div>
      {TABS.slice(2).map(item)}
    </nav>
  );
}

/** Desktop: segmented tabs at the top of the side panel. */
export function PanelTabs() {
  const t = useT();
  const tab = useStore((s) => s.tab);
  return (
    <div className="ptabs" role="tablist" aria-label="Main">
      {TABS.map((x) => {
        const on = x.id === tab;
        return (
          <button key={x.id} role="tab" aria-selected={on} type="button" className={`ptabs__item ${on ? 'is-on' : ''}`} onClick={() => setState({ tab: x.id })}>
            {on && <motion.span layoutId="ptab-thumb" className="ptabs__thumb" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
            <span className="ptabs__content">
              {x.icon}
              {t(x.key)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mobile bottom sheet with two snap points. Drag the handle or tap it.
 * Collapsed keeps the panel title visible so the map stays usable.
 */
export function Sheet({ children }: { children: ReactNode }) {
  const expanded = useStore((s) => s.sheetExpanded);
  const controls = useAnimationControls();
  const drag = useDragControls();
  const [h, setH] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => setH(window.innerHeight);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const full = Math.round(h * 0.78);
  const peek = 232;
  const collapsedY = full - peek;

  useEffect(() => {
    controls.start({ y: expanded ? 0 : collapsedY, transition: { type: 'spring', stiffness: 380, damping: 40 } });
  }, [expanded, collapsedY, controls]);

  const onEnd = (_: unknown, info: PanInfo) => {
    const goUp = info.velocity.y < -300 || (info.velocity.y < 300 && info.offset.y < -60);
    const goDown = info.velocity.y > 300 || info.offset.y > 60;
    const next = goUp ? true : goDown ? false : expanded;
    if (next === expanded) controls.start({ y: expanded ? 0 : collapsedY });
    setState({ sheetExpanded: next });
  };

  return (
    <motion.section
      className="sheet"
      style={{ height: full }}
      initial={{ y: collapsedY }}
      animate={controls}
      drag="y"
      dragListener={false}
      dragControls={drag}
      dragConstraints={{ top: 0, bottom: collapsedY }}
      dragElastic={0.06}
      onDragEnd={onEnd}
      aria-label="Panel"
    >
      <button
        type="button"
        className="sheet__handle"
        aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
        aria-expanded={expanded}
        onClick={() => setState({ sheetExpanded: !expanded })}
        onPointerDown={(e) => drag.start(e)}
        style={{ touchAction: 'none' }}
      >
        <span />
      </button>
      <div className="sheet__scroll">{children}</div>
    </motion.section>
  );
}

export function Zoom() {
  const t = useT();
  const z = (d: number) => window.dispatchEvent(new CustomEvent('kavach:zoom', { detail: d }));
  return (
    <div className="zoom">
      <button type="button" aria-label={t('zoom.in')} onClick={() => z(1)}>
        <Plus size={20} aria-hidden="true" />
      </button>
      <button type="button" aria-label={t('zoom.out')} onClick={() => z(-1)}>
        <Minus size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Legend() {
  const t = useT();
  const showDemo = useStore((s) => s.showDemo);
  const planWhen = useStore((s) => s.planWhen);
  return (
    <div className="legend" role="img" aria-label={`${t('map.legend.title')}: ${t('map.legend.low')} to ${t('map.legend.high')}`}>
      <span className="legend__row">
        <ShieldCheck size={16} className="legend__lo" aria-hidden="true" />
        <span className="legend__ramp" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} style={{ background: `var(--risk-${i})` }} />
          ))}
        </span>
        <TriangleAlert size={16} className="legend__hi" aria-hidden="true" />
      </span>
      {showDemo && (
        <button className="legend__demo" type="button" onClick={() => setState({ showDemo: false })} title="Hide demo reports">
          {t('map.demoData')} <span aria-hidden="true">×</span>
        </button>
      )}
      {planWhen !== 'now' && (
        <button className="legend__demo" type="button" onClick={() => setState({ planWhen: 'now' })} title={t('map.when.now')}>
          {t(`map.when.${planWhen}`)}, {t('map.notLive')} <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}

export function ReportPin() {
  const tab = useStore((s) => s.tab);
  return (
    <AnimatePresence>
      {tab === 'report' && (
        <motion.div
          className="report-pin"
          aria-hidden="true"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 26 }}
        >
          <svg width="40" height="52" viewBox="0 0 40 52">
            <path d="M20 2C10 2 3 9.6 3 19c0 12.6 17 31 17 31s17-18.4 17-31C37 9.6 30 2 20 2z" fill="var(--sos)" />
            <circle cx="20" cy="19" r="6" fill="var(--surface)" />
          </svg>
          <span className="report-pin__tip" />
          <span className="report-pin__shadow" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  return (
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.tone}`}
            initial={{ y: -16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
          >
            {toast.tone === 'ok' ? <Check size={18} aria-hidden="true" /> : toast.tone === 'warn' ? <TriangleAlert size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OfflineBanner() {
  const t = useT();
  const [off, setOff] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOff(false);
    const of = () => setOff(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', of);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', of);
    };
  }, []);
  return (
    <AnimatePresence>
      {off && (
        <motion.div className="offline" role="status" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <WifiOff size={16} aria-hidden="true" /> {t('common.offline')}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
