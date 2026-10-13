import { Phone, RotateCw } from 'lucide-react';
import { Component, type ReactNode } from 'react';
import { helplines } from '../lib/config';
import { translate, type TKey } from '../lib/i18n';
import { getState } from '../lib/store';

type Props = { children: ReactNode; compact?: boolean };

/**
 * A render error must never take the way to help off the screen. The full
 * guard keeps Call 112 and the helplines; the compact one keeps a broken
 * panel from taking the map and SOS button with it.
 */
export class CrashGuard extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const t = (k: TKey) => translate(getState().lang, k);

    if (this.props.compact)
      return (
        <div className="panel-body">
          <p className="note note--caution">{t('crash.section')}</p>
          <button className="btn btn--quiet btn--lg btn--block" type="button" onClick={() => this.setState({ failed: false })}>
            <RotateCw size={18} aria-hidden="true" /> {t('crash.retry')}
          </button>
        </div>
      );

    return (
      <main className="crash" role="alert">
        <h1>{t('crash.title')}</h1>
        <p>{t('crash.body')}</p>
        <a className="btn btn--sos btn--xl btn--block" href="tel:112">
          <Phone size={22} aria-hidden="true" /> {t('sos.call112')}
        </a>
        <ul className="crash__lines">
          {helplines.slice(1).map((h) => (
            <li key={h.id}>
              <a className="btn btn--quiet btn--lg btn--block" href={`tel:${h.number}`}>
                <strong className="tabular">{h.number}</strong> {t(h.key as TKey)}
              </a>
            </li>
          ))}
        </ul>
        <button className="btn btn--primary btn--lg btn--block" type="button" onClick={() => window.location.reload()}>
          <RotateCw size={18} aria-hidden="true" /> {t('crash.reload')}
        </button>
      </main>
    );
  }
}
