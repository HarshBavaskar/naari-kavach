import { motion } from 'framer-motion';
import { Ambulance, Armchair, Store, ExternalLink, Headphones, HeartHandshake, Hospital, LoaderCircle, MonitorSmartphone, Navigation, Phone, PhoneCall, PhoneIncoming, Route, ScanEye, Shield, Siren, Volume2, VolumeX, Wrench } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { WhatNow } from '../components/WhatNow';
import { PanelTitle, Section } from '../components/ui';
import { config, helplines } from '../lib/config';
import { directionsLink, formatDistance, haversine } from '../lib/geo';
import { useT, type TKey } from '../lib/i18n';
import { waitSpot } from '../lib/journey';
import type { buildContext } from '../lib/risk';
import { armPocket, disarmPocket, pocketSupported } from '../lib/pocket';
import { primeSound } from '../lib/sound';
import { setState, toast, useStore } from '../lib/store';
import { tripFeelsOff } from '../lib/trip';
import type { Poi } from '../lib/types';

const HL_ICON: Record<string, ReactNode> = {
  erss: <Siren size={22} aria-hidden="true" />,
  women: <Shield size={18} aria-hidden="true" />,
  whl: <HeartHandshake size={18} aria-hidden="true" />,
  ambulance: <Ambulance size={18} aria-hidden="true" />,
  cyber: <MonitorSmartphone size={18} aria-hidden="true" />,
};

export function HelpPanel({ ctx }: { ctx: ReturnType<typeof buildContext> }) {
  const t = useT();
  const pois = useStore((s) => s.pois);
  const status = useStore((s) => s.poiStatus);
  const userLoc = useStore((s) => s.userLoc);
  const center = useStore((s) => s.mapCenter);
  const origin = userLoc ?? center;
  const fakeCall = useStore((s) => s.fakeCall);
  const alarm = useStore((s) => s.alarm);
  const uneasy = useStore((s) => Boolean(s.trip?.uneasy));
  const pocket = useStore((s) => s.pocket);

  const { police, hospitals } = useMemo(() => {
    const withD = pois
      .filter((p) => p.kind !== 'activity')
      .map((p) => ({ ...p, d: haversine(origin, p) }))
      .sort((a, b) => a.d - b.d);
    return {
      police: withD.filter((p) => p.kind === 'police').slice(0, 5),
      hospitals: withD.filter((p) => p.kind === 'hospital').slice(0, 5),
    };
  }, [pois, origin]);
  // Somewhere good to stand while a ride or a friend is on the way.
  const wait = useMemo(() => waitSpot(origin, pois, ctx), [origin, pois, ctx]);
  const waitWhy = (p: Poi) =>
    t(p.kind === 'police' ? 'wait.police' : p.kind === 'hospital' ? 'wait.hospital' : p.late ? 'wait.late' : 'wait.open');

  return (
    <div className="panel-body">
      <PanelTitle>{t('help.title')}</PanelTitle>

      <Section title={t('help.helplines')} icon={<PhoneCall />}>
        <div className="helplines">
          {helplines.map((h, i) => (
            <motion.a
              key={h.id}
              href={`tel:${h.number}`}
              className={`helpline ${h.number === '112' ? 'is-primary' : ''}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 420, damping: 32 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="helpline__icon">{HL_ICON[h.id]}</span>
              <span className="helpline__num">{h.number}</span>
              <span className="helpline__label">{t(h.key as TKey)}</span>
              {h.number === '112' && (
                <span className="helpline__call" aria-hidden="true">
                  <Phone size={18} />
                </span>
              )}
            </motion.a>
          ))}
        </div>
      </Section>

      <Section title={t('help.tools')} icon={<Wrench />}>
        <div className="tools">
          <button
            type="button"
            className={`tool ${fakeCall === 'waiting' ? 'is-on' : ''}`}
            aria-pressed={fakeCall === 'waiting'}
            onClick={() => {
              // Sound may only start from a tap, so unlock it now for the ring that comes later.
              primeSound();
              setState({ fakeCall: fakeCall === 'waiting' ? 'idle' : 'waiting' });
            }}
          >
            <span className="tool__icon"><PhoneIncoming size={20} aria-hidden="true" /></span>
            <span className="tool__text">
              <strong>{t('fake.title')}</strong>
              <span>{fakeCall === 'waiting' ? t('fake.cancel') : t('fake.sub', { n: config.fakeCallDelayS })}</span>
            </span>
          </button>
          <button
            type="button"
            className={`tool ${alarm ? 'is-on' : ''}`}
            aria-pressed={alarm}
            onClick={() => {
              primeSound();
              setState({ alarm: !alarm });
            }}
          >
            <span className="tool__icon">{alarm ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}</span>
            <span className="tool__text">
              <strong>{alarm ? t('alarm.stop') : t('alarm.title')}</strong>
              <span>{t('alarm.sub')}</span>
            </span>
          </button>
          {/* One tap, then nothing more to do: the shield watches closely wherever she is. */}
          <button type="button" className={`tool ${uneasy ? 'is-on' : ''}`} aria-pressed={uneasy} onClick={() => tripFeelsOff(!uneasy)}>
            <span className="tool__icon"><ScanEye size={20} aria-hidden="true" /></span>
            <span className="tool__text">
              <strong>{t('feels.title')}</strong>
              <span>{t(uneasy ? 'feels.on' : 'feels.sub')}</span>
            </span>
          </button>
          {pocketSupported() && (
            <button
              type="button"
              className={`tool ${pocket ? 'is-on' : ''}`}
              aria-pressed={pocket}
              onClick={() => {
                if (pocket) disarmPocket();
                else armPocket(t('earsos.on')).then((ok) => toast(t(ok ? 'earsos.armed' : 'earsos.none'), ok ? 'ok' : 'warn'));
              }}
            >
              <span className="tool__icon"><Headphones size={20} aria-hidden="true" /></span>
              <span className="tool__text">
                <strong>{t('earsos.title')}</strong>
                <span>{t(pocket ? 'earsos.on' : 'earsos.sub')}</span>
              </span>
            </button>
          )}
        </div>
      </Section>

      <WhatNow />

      {status === 'loading' && (
        <div className="state">
          <LoaderCircle className="spin" size={20} aria-hidden="true" /> {t('help.loading')}
        </div>
      )}
      {status === 'error' && <p className="note note--caution">{t('help.error')}</p>}

      {status === 'ready' && (
        <>
          <Section title={t('wait.title')} icon={<Armchair />}>
            {wait ? (
              <PlaceList items={[wait]} icon={<Store size={18} aria-hidden="true" />} note={waitWhy} />
            ) : (
              <p className="empty-row">
                <Store size={16} aria-hidden="true" /> {t('wait.none')}
              </p>
            )}
          </Section>
          <Section title={t('help.police')} icon={<Shield />}>
            <PlaceList items={police} icon={<Shield size={18} aria-hidden="true" />} />
          </Section>
          <Section title={t('help.hospitals')} icon={<Hospital />}>
            <PlaceList items={hospitals} icon={<Hospital size={18} aria-hidden="true" />} />
          </Section>
        </>
      )}

      <a className="link-row" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
        <MonitorSmartphone size={18} aria-hidden="true" />
        <span className="grow">{t('help.cyber')}</span>
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    </div>
  );
}

function PlaceList({ items, icon, note }: { items: Array<Poi & { d: number }>; icon: ReactNode; note?: (p: Poi) => string }) {
  const t = useT();
  if (!items.length)
    return (
      <p className="empty-row">
        <Siren size={16} aria-hidden="true" /> {t('help.empty')}
      </p>
    );
  return (
    <ul className="places">
      {items.map((p) => {
        const name = p.name ?? (p.kind === 'police' ? 'Police station' : 'Hospital');
        return (
          <li key={p.id} className="place">
            <button
              type="button"
              className="place__main"
              onClick={() => {
                setState({ focus: { lat: p.lat, lng: p.lng } });
                if (window.innerWidth < 900) setState({ sheetExpanded: false });
              }}
            >
              <span className={`place__icon is-${p.kind}`}>{icon}</span>
              <span className="place__text">
                <strong>{name}</strong>
                <small>
                  {formatDistance(p.d)} {t('help.away')}
                  {note && `, ${note(p)}`}
                </small>
              </span>
            </button>
            <div className="place__actions">
              {p.phone && (
                <a className="icon-btn" href={`tel:${p.phone.split(/[;,]/)[0].replace(/\s/g, '')}`} aria-label={`${t('help.call')} ${p.name ?? ''}`}>
                  <Phone size={18} aria-hidden="true" />
                </a>
              )}
              {/* Route in the app, ranked by risk. The arrow next to it opens turn-by-turn in Maps. */}
              <button
                className="icon-btn"
                type="button"
                aria-label={`${t('help.route')} ${name}`}
                onClick={() =>
                  setState({
                    dest: { kind: 'place', place: { id: p.id, label: name, sub: '', lat: p.lat, lng: p.lng } },
                    pendingRoute: true,
                    tab: 'map',
                    sheetExpanded: true,
                  })
                }
              >
                <Route size={18} aria-hidden="true" />
              </button>
              <a className="icon-btn" href={directionsLink(p)} target="_blank" rel="noreferrer" aria-label={`${t('help.directions')} ${p.name ?? ''}`}>
                <Navigation size={18} aria-hidden="true" />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

