import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useT } from '../lib/i18n';
import { LogoAnimated } from './Logo';

/**
 * The one orchestrated moment: shield draws, pin drops, the wordmark opens
 * from condensed to normal width letter by letter, then the panel lifts away.
 * Runs once per session. Tap or any key skips it.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const t = useT();
  const word = 'Naari Kavach';
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const id = window.setTimeout(onDone, reduce ? 500 : 1900);
    const skip = () => onDone();
    window.addEventListener('keydown', skip);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', skip);
    };
  }, [onDone, reduce]);

  return (
    <motion.div
      className="intro"
      onClick={onDone}
      initial={{ y: 0 }}
      exit={{ y: '-100%', transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
      role="presentation"
    >
      <div className="intro__inner">
        <LogoAnimated size={128} />
        <h1 className="intro__word" aria-label={word}>
          {word.split('').map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={{ opacity: 0, y: 18, fontVariationSettings: "'wdth' 75, 'wght' 300" }}
              animate={{ opacity: 1, y: 0, fontVariationSettings: "'wdth' 100, 'wght' 650" }}
              transition={{ delay: 0.55 + i * 0.035, type: 'spring', stiffness: 260, damping: 22 }}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="intro__deva"
          lang="mr"
          initial={{ opacity: 0, letterSpacing: '0.3em' }}
          animate={{ opacity: 1, letterSpacing: '0.02em' }}
          transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          नारी कवच
        </motion.p>
        <motion.p className="intro__tag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.45, duration: 0.4 }}>
          {t('app.tagline')}
        </motion.p>
      </div>
      <button className="intro__skip" type="button" onClick={onDone}>
        {t('intro.skip')}
      </button>
    </motion.div>
  );
}
