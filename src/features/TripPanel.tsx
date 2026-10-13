import { AnimatePresence, motion } from 'framer-motion';
import { CornerUpLeft, CornerUpRight, Eye, Flag, Footprints, Headphones, Lock, MapPinOff, MessageSquareText, Plus, ScanEye, Share2, TriangleAlert, UserRound, Users, Vibrate, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { PanelTitle, Section } from '../components/ui';
import { cloudEnabled } from '../lib/config';
import { mapsLink } from '../lib/geo';
import { useT } from '../lib/i18n';
import { armPocket, disarmPocket, pocketSupported } from '../lib/pocket';
import { getFix, hhmm, isValidIndianMobile, normalisePhone, smsLink, whatsappLink } from '../lib/sos';
import { getState, setState, toast, uid, useStore, type Trip } from '../lib/store';
import { say } from '../lib/sound';
import { trailEnabled, trailStart } from '../lib/trail';
import { endTrip, startTrip, tripArrivedText, tripFeelsOff, tripHasSignal, tripStartText } from '../lib/trip';

/** A trip with no route has no arrival time, so its sealed trail opens after this long. */
const TRAIL_OPEN_MS = 60 * 60e3;
/** Past the "you are late" question by this much before the trail opens, so she is asked first. */
const TRAIL_AFTER_LATE_MS = 10 * 60e3;

export function TripPanel() {
  const t = useT();
  const contacts = useStore((s) => s.contacts);
  const trip = useStore((s) => s.trip);
  const done = useStore((s) => s.tripDone);

  const share = async () => {
    const fix = getFix();
    const f = await fix;
    const where = f ?? getState().mapCenter;
    const text = `${t('app.name')}: ${mapsLink(where)}`;
    if ('share' in navigator) navigator.share({ text }).catch(() => undefined);
    else window.open(whatsappLink(text, contacts[0]), '_blank', 'noreferrer');
  };

  return (
    <div className="panel-body">
      <PanelTitle sub={t('trip.sub')}>{t('trip.title')}</PanelTitle>

      <AnimatePresence mode="wait" initial={false}>
        {trip ? (
          <motion.div key="on" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <ActiveTrip trip={trip} />
          </motion.div>
        ) : (
          <motion.div key="off" className="stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {done && (
              <div className="trip-done">
                <p>
                  <Flag size={18} aria-hidden="true" /> {t('trip.doneTitle')}
                </p>
                <Tell text={() => tripArrivedText(done.label)} label={t('trip.tellArrived')} onTold={() => setState({ tripDone: null })} />
                <button className="btn btn--quiet btn--block" type="button" onClick={() => setState({ tripDone: null })}>
                  {t('trip.dismiss')}
                </button>
              </div>
            )}
            <button className="btn btn--primary btn--lg btn--block" type="button" onClick={() => startTrip()}>
              {t('trip.start')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button className="btn btn--quiet btn--lg btn--block" type="button" onClick={share}>
        <Share2 size={18} aria-hidden="true" /> {t('trip.shareLive')}
      </button>

      <Section title={t('trip.contacts')} icon={<Users />}>
        {contacts.length === 0 && (
          <p className="empty-row">
            <UserRound size={16} aria-hidden="true" /> {t('trip.noContacts')}
          </p>
        )}
        <ul className="contacts">
          <AnimatePresence initial={false}>
            {contacts.map((c) => (
              <motion.li
                key={c.id}
                className="contact"
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span className="contact__avatar" aria-hidden="true">
                  {c.name.trim().charAt(0).toUpperCase() || <UserRound size={16} />}
                </span>
                <span className="contact__text">
                  <strong>{c.name}</strong>
                  <small>{c.phone}</small>
                </span>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={`${t('trip.remove')} ${c.name}`}
                  onClick={() => setState((s) => ({ contacts: s.contacts.filter((x) => x.id !== c.id) }))}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <ContactForm />
      </Section>
    </div>
  );
}

/** Takes the trip as a prop: it stays mounted for the exit fade after the store's trip is already null. */
function ActiveTrip({ trip }: { trip: Trip }) {
  const t = useT();
  const pocket = useStore((s) => s.pocket);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Nothing here counts down to a question. The ring only shows how far along the trip is.
  const span = trip.etaAt ? trip.etaAt - trip.startedAt : 0;
  const frac = span ? Math.min(1, (now - trip.startedAt) / span) : 1;
  const mins = trip.etaAt ? Math.max(0, Math.ceil((trip.etaAt - now) / 60e3)) : Math.floor((now - trip.startedAt) / 60e3);
  const R = 66;
  const C = 2 * Math.PI * R;
  // Re-read each second with the clock above.
  const auto = !tripHasSignal() ? 'off' : trip.uneasy ? 'uneasy' : trip.offRoute ? 'offRoute' : trip.shield === 'watch' ? 'watch' : 'on';
  // A turn cue stays on screen for a few seconds after the buzz.
  const cue = trip.cue && now - trip.cue.at < 8000 ? trip.cue.dir : null;

  const seal = async () => {
    const opensAt = trip.lateAt ? trip.lateAt + TRAIL_AFTER_LATE_MS : Date.now() + TRAIL_OPEN_MS;
    const trail = await trailStart(opensAt);
    const live = getState().trip;
    if (trail && live) setState({ trip: { ...live, trail } });
    toast(t(trail ? 'trail.on' : 'trail.failed'), trail ? 'ok' : 'warn');
  };

  return (
    <div className="trip">
      {trip.destinationLabel && trip.etaAt && (
        <p className="trip__dest">
          <strong>{t('trip.to', { place: trip.destinationLabel })}</strong>
          <span className="tabular">{t('trip.arriveBy', { time: hhmm(new Date(trip.etaAt)) })}</span>
        </p>
      )}
      <div className="trip__dial">
        <svg width="152" height="152" viewBox="0 0 152 152" aria-hidden="true">
          <circle cx="76" cy="76" r={R} className="trip__track" />
          <motion.circle
            cx="76"
            cy="76"
            r={R}
            className="trip__progress"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - frac) }}
            transition={{ duration: 1, ease: 'linear' }}
            transform="rotate(-90 76 76)"
          />
        </svg>
        <div className="trip__time" aria-live="off">
          <span>
            {mins} {t('map.min')}
          </span>
          <small>{t(trip.etaAt ? 'trip.toArrive' : 'trip.onWay')}</small>
        </div>
      </div>
      <p className={`trip__auto ${auto === 'off' || auto === 'offRoute' ? 'is-warn' : ''}`} role="status">
        {auto === 'on' ? (
          <Footprints size={16} aria-hidden="true" />
        ) : auto === 'watch' || auto === 'uneasy' ? (
          <Eye size={16} aria-hidden="true" />
        ) : auto === 'offRoute' ? (
          <TriangleAlert size={16} aria-hidden="true" />
        ) : (
          <MapPinOff size={16} aria-hidden="true" />
        )}
        {t(`trip.auto.${auto}`)}
      </p>
      {cue && (
        <p className="trip__cue" role="status">
          {cue === 'left' ? <CornerUpLeft size={28} aria-hidden="true" /> : <CornerUpRight size={28} aria-hidden="true" />}
          {t(cue === 'left' ? 'pocket.left' : 'pocket.right')}
        </p>
      )}
      <button className="btn btn--quiet btn--lg btn--block" type="button" onClick={() => endTrip()}>
        {t('trip.end')}
      </button>
      <Tile
        on={Boolean(trip.uneasy)}
        icon={<ScanEye size={20} aria-hidden="true" />}
        title={t('feels.title')}
        sub={t(trip.uneasy ? 'feels.on' : 'feels.sub')}
        onClick={() => tripFeelsOff(!trip.uneasy)}
      />
      {pocketSupported() && (
        <Tile
          on={pocket}
          icon={<Headphones size={20} aria-hidden="true" />}
          title={t('earsos.title')}
          sub={t(pocket ? 'earsos.on' : 'earsos.sub')}
          onClick={() => {
            if (pocket) disarmPocket();
            else armPocket(t('earsos.on')).then((ok) => toast(t(ok ? 'earsos.armed' : 'earsos.none'), ok ? 'ok' : 'warn'));
          }}
        />
      )}
      {trip.etaAt && (
        <Tile
          on={Boolean(trip.guide)}
          icon={<Vibrate size={20} aria-hidden="true" />}
          title={t('pocket.title')}
          sub={t('pocket.sub')}
          onClick={() => {
            // Speaking inside the tap is what lets later cues be heard on iOS.
            if (!trip.guide) say(t('pocket.on'));
            setState({ trip: { ...trip, guide: !trip.guide } });
          }}
        />
      )}
      {trailEnabled && (
        <Tile
          on={Boolean(trip.trail)}
          icon={<Lock size={20} aria-hidden="true" />}
          title={t('trail.title')}
          sub={trip.trail ? t('trail.opens', { time: hhmm(new Date(trip.trail.opensAt)) }) : t('trail.sub')}
          onClick={() => {
            if (!trip.trail) void seal();
          }}
        />
      )}
      <Tell
        text={tripStartText}
        label={t('trip.tell')}
        onTold={() => {
          const now = getState().trip;
          if (now) setState({ trip: { ...now, told: true } });
        }}
      />
    </div>
  );
}

/** One switch on the active trip: tap once, then it looks after itself. */
function Tile({ on, icon, title, sub, onClick }: { on: boolean; icon: ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button className={`tool trip__pocket ${on ? 'is-on' : ''}`} type="button" aria-pressed={on} onClick={onClick}>
      <span className="tool__icon">{icon}</span>
      <span className="tool__text">
        <strong>{title}</strong>
        <span>{sub}</span>
      </span>
    </button>
  );
}

/** One tap to message trusted contacts: SMS to all of them, or the share sheet when none are saved. */
function Tell({ text, label, onTold }: { text: () => string; label: string; onTold: () => void }) {
  const contacts = useStore((s) => s.contacts);
  if (contacts.length)
    return (
      <a className="btn btn--quiet btn--lg btn--block" href={smsLink(contacts, text())} onClick={onTold}>
        <MessageSquareText size={18} aria-hidden="true" /> {label}
      </a>
    );
  return (
    <button
      className="btn btn--quiet btn--lg btn--block"
      type="button"
      onClick={() => {
        const body = text();
        if ('share' in navigator) navigator.share({ text: body }).catch(() => undefined);
        else window.open(whatsappLink(body), '_blank', 'noreferrer');
        onTold();
      }}
    >
      <Share2 size={18} aria-hidden="true" /> {label}
    </button>
  );
}

function ContactForm() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tg, setTg] = useState('');
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});

  const save = () => {
    const e = { name: !name.trim(), phone: !isValidIndianMobile(phone) };
    setErrors(e);
    if (e.name || e.phone) return;
    setState((s) => ({
      contacts: [...s.contacts, { id: uid(), name: name.trim(), phone: normalisePhone(phone), telegramChatId: tg.trim() || undefined }],
    }));
    setName('');
    setPhone('');
    setTg('');
    setOpen(false);
  };

  if (!open)
    return (
      <button className="btn btn--quiet btn--block" type="button" onClick={() => setOpen(true)}>
        <Plus size={18} aria-hidden="true" /> {t('trip.addContact')}
      </button>
    );

  return (
    <motion.form
      className="contact-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      noValidate
    >
      <label className="field">
        <span>{t('trip.name')}</span>
        <input
          className="input"
          value={name}
          autoFocus
          autoComplete="name"
          aria-invalid={errors.name || undefined}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((x) => ({ ...x, name: false }));
          }}
        />
        {errors.name && <span className="field-error">{t('trip.invalidName')}</span>}
      </label>
      <label className="field">
        <span>{t('trip.phone')}</span>
        <input
          className="input"
          value={phone}
          inputMode="tel"
          autoComplete="tel"
          placeholder="98XXXXXXXX"
          aria-invalid={errors.phone || undefined}
          onChange={(e) => {
            setPhone(e.target.value);
            setErrors((x) => ({ ...x, phone: false }));
          }}
        />
        {errors.phone && <span className="field-error">{t('trip.invalidPhone')}</span>}
      </label>
      {cloudEnabled && (
        <label className="field">
          <span>Telegram chat ID (optional)</span>
          <input className="input" value={tg} inputMode="numeric" onChange={(e) => setTg(e.target.value)} />
        </label>
      )}
      <div className="row row--gap">
        <button className="btn btn--primary grow" type="submit">
          {t('trip.save')}
        </button>
        <button className="btn btn--quiet" type="button" onClick={() => setOpen(false)}>
          {t('common.close')}
        </button>
      </div>
    </motion.form>
  );
}
