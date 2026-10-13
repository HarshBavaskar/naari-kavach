import { AnimatePresence, motion } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { config } from '../lib/config';
import { useT } from '../lib/i18n';
import { vibrate } from '../lib/sos';
import { startRing } from '../lib/sound';
import { setState, useStore } from '../lib/store';

/**
 * Fake incoming call: a believable reason to walk away. Rings a few seconds
 * after the tap, then looks like a normal call. SOS always wins the screen.
 */
export function FakeCall() {
  const phase = useStore((s) => s.fakeCall);
  const sos = useStore((s) => s.sos);

  useEffect(() => {
    if (sos !== 'idle' && phase !== 'idle') setState({ fakeCall: 'idle' });
  }, [sos, phase]);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const id = window.setTimeout(() => setState({ fakeCall: 'ringing' }), config.fakeCallDelayS * 1000);
    return () => window.clearTimeout(id);
  }, [phase]);

  return <AnimatePresence>{(phase === 'ringing' || phase === 'talking') && <CallScreen key="call" talking={phase === 'talking'} />}</AnimatePresence>;
}

function CallScreen({ talking }: { talking: boolean }) {
  const t = useT();
  const contact = useStore((s) => s.contacts[0]?.name);
  const caller = contact || t('fake.caller');
  const [secs, setSecs] = useState(0);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
    if (talking) {
      const id = window.setInterval(() => setSecs((v) => v + 1), 1000);
      return () => window.clearInterval(id);
    }
    const stop = startRing();
    vibrate([400, 200, 400]);
    const id = window.setInterval(() => vibrate([400, 200, 400]), 3000);
    return () => {
      stop();
      window.clearInterval(id);
      vibrate(0);
    };
  }, [talking]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setState({ fakeCall: 'idle' });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <motion.div
      className="call"
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-name"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <div className="call__who">
        <p className="call__status tabular" aria-live="polite">{talking ? mmss : t('fake.incoming')}</p>
        <span className="call__avatar" aria-hidden="true">{caller.trim().charAt(0).toUpperCase()}</span>
        <h2 id="call-name" className="call__name">{caller}</h2>
        <p className="call__line">{t('fake.mobile')}</p>
      </div>
      <div className="call__actions">
        {talking ? (
          <CallButton innerRef={first} label={t('fake.end')} onClick={() => setState({ fakeCall: 'idle' })}>
            <PhoneOff size={28} aria-hidden="true" />
          </CallButton>
        ) : (
          <>
            <CallButton label={t('fake.decline')} onClick={() => setState({ fakeCall: 'idle' })}>
              <PhoneOff size={28} aria-hidden="true" />
            </CallButton>
            <CallButton innerRef={first} answer label={t('fake.answer')} onClick={() => setState({ fakeCall: 'talking' })}>
              <Phone size={28} aria-hidden="true" />
            </CallButton>
          </>
        )}
      </div>
    </motion.div>
  );
}

function CallButton({
  innerRef,
  label,
  answer,
  onClick,
  children,
}: {
  innerRef?: RefObject<HTMLButtonElement>;
  label: string;
  answer?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button ref={innerRef} type="button" className={`call__btn ${answer ? 'is-answer' : ''}`} onClick={onClick}>
      <span className="call__btn-icon">{children}</span>
      <span>{label}</span>
    </button>
  );
}
