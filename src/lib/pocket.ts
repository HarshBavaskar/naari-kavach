/**
 * Earphone SOS: start the SOS countdown from the earphone button, with the
 * phone still in her bag or pocket.
 *
 * Browsers hand media buttons only to a page that is playing sound, so a
 * silent loop plays while the trigger is armed. That can pause other audio,
 * which is why she turns it on herself. Three presses in a row start the
 * countdown, and the countdown keeps its cancel window.
 */
import { vibrate } from './sos';
import { getState, setState } from './store';

/** Presses this close together count as one gesture. */
const WINDOW_MS = 3000;
const PRESSES = 3;
/** Some phones ignore clips shorter than a few seconds, so the silent loop is this long. */
const LOOP_S = 10;
const RATE = 8000;
const ACTIONS = ['play', 'pause', 'nexttrack', 'previoustrack'] as const;

let audio: HTMLAudioElement | null = null;
let presses: number[] = [];

/** Silence as an 8-bit mono WAV file, made in the browser so there is no file to ship. */
function silence() {
  const n = RATE * LOOP_S;
  const v = new DataView(new ArrayBuffer(44 + n));
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  text(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  text(36, 'data');
  v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([v.buffer], { type: 'audio/wav' }));
}

/**
 * Counts presses. True when they complete the gesture; the SOS countdown has
 * then started, unless SOS was already running.
 */
export function pocketPress(count = 1, now = Date.now()) {
  presses = [...presses.filter((t) => now - t < WINDOW_MS), ...Array<number>(count).fill(now)];
  if (presses.length < PRESSES) return false;
  presses = [];
  if (getState().sos === 'idle') {
    setState({ sos: 'countdown' });
    vibrate([200, 100, 200]);
  }
  return true;
}

export const pocketSupported = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof Audio !== 'undefined';

/** Call inside a tap: sound may only start from a user gesture. `label` shows on the lock screen. */
export async function armPocket(label: string) {
  if (!pocketSupported()) return false;
  try {
    audio ??= Object.assign(new Audio(silence()), { loop: true });
    await audio.play();
  } catch {
    return false;
  }
  // A press also pauses the loop, so every handler starts it again to keep hearing the button.
  const on = (n: number) => () => {
    pocketPress(n);
    audio?.play().catch(() => undefined);
  };
  const ms = navigator.mediaSession;
  ms.metadata = new MediaMetadata({ title: 'Naari Kavach', artist: label });
  // One press arrives as play or pause. Phones turn a double press into "next" and a triple into "previous".
  ms.setActionHandler('play', on(1));
  ms.setActionHandler('pause', on(1));
  ms.setActionHandler('nexttrack', on(2));
  ms.setActionHandler('previoustrack', on(3));
  setState({ pocket: true });
  return true;
}

export function disarmPocket() {
  audio?.pause();
  if (pocketSupported()) for (const a of ACTIONS) navigator.mediaSession.setActionHandler(a, null);
  presses = [];
  setState({ pocket: false });
}
