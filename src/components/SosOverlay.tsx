import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, MessageCircle, MessageSquareText, Phone, Share2, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { config } from '../lib/config';
import { useT } from '../lib/i18n';
import { cloudSos, getFix, smsLink, sosMessage, vibrate, whatsappLink, type Fix } from '../lib/sos';
import { primeSound } from '../lib/sound';
import { getState, setState, toast, useStore } from '../lib/store';
import { trailAlarm } from '../lib/trail';

export function SosOverlay() {
  const sos = useStore((s) => s.sos);
  return <AnimatePresence>{sos !== 'idle' && <SosSheet key="sos" />}</AnimatePresence>;
}

function SosSheet() {
  const t = useT();
  const sos = useStore((s) => s.sos);
  const lang = useStore((s) => s.lang);
  const contacts = useStore((s) => s.contacts);
  const alarm = useStore((s) => s.alarm);
  const [n, setN] = useState<number>(config.sosCountdownS);
  const [fix, setFix] = useState<Fix | null | undefined>(undefined);
  const firstAction = useRef<HTMLAnchorElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Countdown, cancellable. Starts locating immediately so the fix is ready.
  useEffect(() => {
    if (sos !== 'countdown') return;
    cancelRef.current?.focus();
    getFix().then((f) => setFix(f ?? getState().userLoc));
    setN(config.sosCountdownS);
    const id = window.setInterval(() => {
      setN((v) => {
        if (v <= 1) {
          window.clearInterval(id);
          setState({ sos: 'active' });
          return 0;
        }
        vibrate(30);
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [sos]);

  useEffect(() => {
    if (sos !== 'active') return;
    vibrate([200, 100, 200]);
    firstAction.current?.focus();
    // A sealed trail opens to her contacts the moment SOS is live.
    trailAlarm();
    if (fix === undefined) getFix().then((f) => setFix(f ?? getState().userLoc));
  }, [sos]);

  // Telegram (only when cloud + chat ids exist) fires once the alert is live and located.
  const sent = useRef(false);
  useEffect(() => {
    if (sos !== 'active' || fix === undefined || sent.current) return;
    sent.current = true;
    const s = getState();
    cloudSos(fix, s.contacts, sosMessage(s.lang, fix)).then((ok) => ok && toast(t('sos.telegramSent')));
  }, [sos, fix]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && getState().sos === 'countdown') setState({ sos: 'idle' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const msg = sosMessage(lang, fix ?? null);
  const end = (text: string) => {
    setState({ sos: 'idle' });
    toast(text, 'info');
  };

  return (
    <motion.div
      className={`sos-sheet sos-sheet--${sos}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="sos-sheet__panel"
        initial={{ y: 40, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {sos === 'countdown' ? (
            <motion.div key="cd" className="sos-cd" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>
              <h2 id="sos-title" className="sos-cd__title">{t('sos.countdown')}</h2>
              <div className="sos-cd__num" aria-live="assertive">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={n}
                    initial={{ y: 40, opacity: 0, fontVariationSettings: "'wdth' 75, 'wght' 500" }}
                    animate={{ y: 0, opacity: 1, fontVariationSettings: "'wdth' 100, 'wght' 700" }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  >
                    {n}
                  </motion.span>
                </AnimatePresence>
              </div>
              <button ref={cancelRef} className="btn btn--xl btn--ghost-on-sos" onClick={() => end(t('sos.ended'))}>
                <X size={22} aria-hidden="true" /> {t('sos.cancel')}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              className="sos-active"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="sos-active__head">
                <span className="sos-active__beacon" aria-hidden="true">
                  <span />
                  <span />
                </span>
                <div>
                  <h2 id="sos-title" className="sos-active__title">{t('sos.active')}</h2>
                  <p className="sos-active__sub">{t('sos.activeSub')}</p>
                </div>
              </div>

              <p className="sos-active__loc" aria-live="polite">
                {fix === undefined ? t('sos.locating') : fix ? `${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)} (±${Math.round(fix.accuracy ?? 0)} m)` : t('sos.noLoc')}
              </p>

              <div className="sos-actions">
                <motion.a ref={firstAction} className="sos-action sos-action--primary" href="tel:112" whileTap={{ scale: 0.97 }}>
                  <Phone size={22} aria-hidden="true" />
                  <span>{t('sos.call112')}</span>
                </motion.a>
                {contacts.length > 0 ? (
                  <motion.a className="sos-action" href={smsLink(contacts, msg)} whileTap={{ scale: 0.97 }}>
                    <MessageSquareText size={22} aria-hidden="true" />
                    <span>{t('sos.sms')}</span>
                  </motion.a>
                ) : (
                  <p className="sos-actions__note">{t('sos.noContacts')}</p>
                )}
                <motion.a className="sos-action" href={whatsappLink(msg, contacts[0])} target="_blank" rel="noreferrer" whileTap={{ scale: 0.97 }}>
                  <MessageCircle size={22} aria-hidden="true" />
                  <span>{t('sos.whatsapp')}</span>
                </motion.a>
                {'share' in navigator ? (
                  <motion.button
                    className="sos-action"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigator.share({ text: msg }).catch(() => undefined)}
                  >
                    <Share2 size={22} aria-hidden="true" />
                    <span>{t('sos.share')}</span>
                  </motion.button>
                ) : (
                  <motion.button
                    className="sos-action"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigator.clipboard?.writeText(msg).then(() => toast(t('sos.copied')))}
                  >
                    <Copy size={22} aria-hidden="true" />
                    <span>{t('sos.copy')}</span>
                  </motion.button>
                )}
                <motion.button
                  className="sos-action sos-action--row"
                  aria-pressed={alarm}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    primeSound();
                    setState({ alarm: !alarm });
                  }}
                >
                  {alarm ? <VolumeX size={22} aria-hidden="true" /> : <Volume2 size={22} aria-hidden="true" />}
                  <span>{t(alarm ? 'alarm.stop' : 'alarm.start')}</span>
                </motion.button>
              </div>

              <button
                className="btn btn--lg btn--safe btn--block"
                onClick={() => {
                  setState({ alarm: false });
                  end(t('sos.ended'));
                }}
              >
                <Check size={20} aria-hidden="true" /> {t('sos.safe')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
