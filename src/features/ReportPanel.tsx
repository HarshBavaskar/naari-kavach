import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, CarTaxiFront, CircleHelp, FileText, Footprints, Landmark, LightbulbOff, MapPin, NotebookPen, Plus, ShieldAlert, Trash2, TreePine } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { PanelTitle, Section, Segmented } from '../components/ui';
import { civicDraft, complaintDraft, isCivic } from '../lib/complaint';
import { useT, type TKey } from '../lib/i18n';
import { cloudReport } from '../lib/sos';
import { getState, setState, toast, uid, useStore } from '../lib/store';
import type { Report, ReportCategory } from '../lib/types';

const CATS: Array<{ id: ReportCategory; icon: ReactNode }> = [
  { id: 'harassment', icon: <ShieldAlert size={26} strokeWidth={1.75} aria-hidden="true" /> },
  { id: 'followed', icon: <Footprints size={26} strokeWidth={1.75} aria-hidden="true" /> },
  { id: 'poor_lighting', icon: <LightbulbOff size={26} strokeWidth={1.75} aria-hidden="true" /> },
  { id: 'isolated', icon: <TreePine size={26} strokeWidth={1.75} aria-hidden="true" /> },
  { id: 'unsafe_transport', icon: <CarTaxiFront size={26} strokeWidth={1.75} aria-hidden="true" /> },
  { id: 'other', icon: <CircleHelp size={26} strokeWidth={1.75} aria-hidden="true" /> },
];

type When = 'now' | 'today' | 'week';
const WHEN_OFFSET: Record<When, number> = { now: 0, today: 3 * 3600e3, week: 3 * 864e5 };

export function ReportPanel() {
  const t = useT();
  const reports = useStore((s) => s.reports);
  const [cat, setCat] = useState<ReportCategory | null>(null);
  const [when, setWhen] = useState<When>('now');
  const [note, setNote] = useState('');
  const [err, setErr] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const mine = reports.filter((r) => r.source === 'local').sort((a, b) => b.at - a.at);

  const submit = () => {
    if (!cat) {
      setErr(true);
      return;
    }
    const s = getState();
    const at = s.pinLoc ?? s.mapCenter;
    const r: Report = {
      id: uid(),
      lat: at.lat,
      lng: at.lng,
      category: cat,
      note: note.trim() || undefined,
      at: Date.now() - WHEN_OFFSET[when],
      source: 'local',
    };
    setState((st) => ({ reports: [...st.reports, r], ripple: { id: Date.now(), lat: r.lat, lng: r.lng } }));
    cloudReport(r);
    toast(t('report.saved'));
    setCat(null);
    setNote('');
    setWhen('now');
    setNoteOpen(false);
  };

  return (
    <div className="panel-body">
      <PanelTitle sub={t('report.sub')}>{t('report.title')}</PanelTitle>

      <Section title={t('report.what')}>
        <div className="tiles" role="group" aria-label={t('report.what')}>
          {CATS.map((c) => {
            const on = cat === c.id;
            return (
              <motion.button
                key={c.id}
                type="button"
                className={`tile ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setCat(on ? null : c.id);
                  setErr(false);
                }}
              >
                <span className="tile__icon">{c.icon}</span>
                <span className="tile__label">{t(`report.cat.${c.id}` as TKey)}</span>
                <AnimatePresence>
                  {on && (
                    <motion.span className="tile__check" aria-hidden="true" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24">
                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {err && (
            <motion.p className="field-error" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {t('report.pickCategory')}
            </motion.p>
          )}
        </AnimatePresence>
      </Section>

      <p className="hint where-hint">
        <MapPin size={18} aria-hidden="true" /> {t('report.pinHere')}
      </p>

      <Section title={t('report.when')} icon={<CalendarClock />}>
        <Segmented
          label={t('report.when')}
          value={when}
          onChange={setWhen}
          options={[
            { value: 'now', label: t('report.now') },
            { value: 'today', label: t('report.today') },
            { value: 'week', label: t('report.week') },
          ]}
        />
      </Section>

      {noteOpen ? (
        <Section icon={<NotebookPen />} title={<label htmlFor="report-note">{t('report.note')}</label>} aside={<span className="count">{note.length}/280</span>}>
          <textarea
            id="report-note"
            className="textarea"
            rows={3}
            maxLength={280}
            autoFocus
            placeholder={t('report.notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Section>
      ) : (
        <button className="btn btn--quiet btn--block" type="button" onClick={() => setNoteOpen(true)}>
          <Plus size={18} aria-hidden="true" /> {t('report.addDetail')}
        </button>
      )}

      <motion.button className="btn btn--primary btn--lg btn--block" type="button" onClick={submit} whileTap={{ scale: 0.98 }}>
        {t('report.submit')}
      </motion.button>

      {mine.length > 0 && (
        <Section title={t('report.yours')} icon={<FileText />}>
          <ul className="my-reports">
            <AnimatePresence initial={false}>
              {mine.map((r) => (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  className="my-report"
                >
                  <button className="my-report__main" type="button" onClick={() => setState({ focus: { lat: r.lat, lng: r.lng } })}>
                    <strong>{t(`report.cat.${r.category}` as TKey)}</strong>
                    <small>{new Date(r.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={t('report.complaint')}
                    title={t('report.complaint')}
                    onClick={() => navigator.clipboard?.writeText(complaintDraft(r)).then(() => toast(t('report.copied')))}
                  >
                    <FileText size={18} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={t('report.delete')}
                    onClick={() => setState((s) => ({ reports: s.reports.filter((x) => x.id !== r.id) }))}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {/* Dark and deserted spots are the city's to fix: one letter for all of them. */}
          {mine.some(isCivic) && (
            <button
              className="btn btn--quiet btn--block"
              type="button"
              onClick={() => navigator.clipboard?.writeText(civicDraft(mine)).then(() => toast(t('report.civicCopied')))}
            >
              <Landmark size={18} aria-hidden="true" /> {t('report.civic')}
            </button>
          )}
        </Section>
      )}
    </div>
  );
}
