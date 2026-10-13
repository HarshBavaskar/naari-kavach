/**
 * Sounds made in the browser (Web Audio), so they work offline with no files:
 * a phone ring for the fake call and a siren for the alarm.
 */

let ctx: AudioContext | null = null;

/** Call inside a tap. Browsers only let sound start from a user gesture. */
export function primeSound(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

const silent = () => undefined;

/** Speaks a short cue. The first call must come from a tap, or iOS stays silent. Never throws. */
export function say(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    // Cue strings are English until the translations are checked.
    u.lang = 'en-IN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* no speech on this device */
  }
}

/** Phone ring: two short bursts, then a pause, repeating. Returns a stop function. */
export function startRing(): () => void {
  const ac = primeSound();
  if (!ac) return silent;
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.connect(ac.destination);
  const oscs = [400, 450].map((hz) => {
    const o = ac.createOscillator();
    o.frequency.value = hz;
    o.connect(gain);
    o.start();
    return o;
  });
  const burst = () => {
    const t = ac.currentTime;
    for (const at of [0, 0.6]) {
      gain.gain.setValueAtTime(0.45, t + at);
      gain.gain.setValueAtTime(0, t + at + 0.4);
    }
  };
  burst();
  const id = window.setInterval(burst, 3000);
  return () => {
    window.clearInterval(id);
    for (const o of oscs) o.stop();
    gain.disconnect();
  };
}

/** Siren: a square wave sweeping up and down at full volume. Returns a stop function. */
export function startSiren(): () => void {
  const ac = primeSound();
  if (!ac) return silent;
  const osc = ac.createOscillator();
  osc.type = 'square';
  const gain = ac.createGain();
  gain.gain.value = 0.9;
  osc.connect(gain);
  gain.connect(ac.destination);
  const sweep = () => {
    const t = ac.currentTime;
    osc.frequency.cancelScheduledValues(t);
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.linearRampToValueAtTime(1500, t + 0.35);
    osc.frequency.linearRampToValueAtTime(700, t + 0.7);
  };
  sweep();
  osc.start();
  const id = window.setInterval(sweep, 700);
  return () => {
    window.clearInterval(id);
    osc.stop();
    gain.disconnect();
  };
}
