/**
 * Audio alerts for administrator database-change notifications.
 *
 * `playSecurityAlertSound` mirrors the DABAWGOV emergency siren: a three-cycle
 * sawtooth wail for direct database tampering. `playAlertChime` is the softer
 * two-tone used for ordinary change alerts.
 *
 * Browsers block audio until the page has received a user gesture, so the
 * caller must invoke `unlockAlertAudio` from a click/keydown listener once.
 * Failures are silent; the visual alert remains the primary signal.
 */
let context: AudioContext | null = null;
let lastPlayedAt = 0;

const MIN_INTERVAL_MS = 1200;

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ?? (window as AudioWindow).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  context ??= new AudioContextCtor();

  return context;
}

function throttled(): AudioContext | null {
  const audio = getContext();

  if (!audio || audio.state !== "running") {
    return null;
  }

  const now = Date.now();

  if (now - lastPlayedAt < MIN_INTERVAL_MS) {
    return null;
  }

  lastPlayedAt = now;

  return audio;
}

export async function unlockAlertAudio(): Promise<void> {
  const audio = getContext();

  if (!audio || audio.state === "running") {
    return;
  }

  try {
    await audio.resume();
  } catch {
    // Autoplay policy still applies; the visual alert remains visible.
  }
}

export function playAlertChime(): void {
  const audio = throttled();

  if (!audio) {
    return;
  }

  const start = audio.currentTime;
  const tones = [
    { frequency: 880, at: 0, duration: 0.18 },
    { frequency: 1174.66, at: 0.16, duration: 0.22 },
  ];

  for (const tone of tones) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const toneStart = start + tone.at;
    const toneEnd = toneStart + tone.duration;

    oscillator.type = "sine";
    oscillator.frequency.value = tone.frequency;
    gain.gain.setValueAtTime(0.0001, toneStart);
    gain.gain.exponentialRampToValueAtTime(0.08, toneStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(toneStart);
    oscillator.stop(toneEnd + 0.02);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}

export function playSecurityAlertSound(): void {
  const audio = throttled();

  if (!audio) {
    return;
  }

  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();

  oscillator.type = "sawtooth";
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1500, now);

  // Three-cycle wail: 580 -> 980 -> 580, repeated and finished high.
  oscillator.frequency.setValueAtTime(580, now);
  oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.18);
  oscillator.frequency.exponentialRampToValueAtTime(580, now + 0.35);
  oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.52);
  oscillator.frequency.exponentialRampToValueAtTime(580, now + 0.7);
  oscillator.frequency.exponentialRampToValueAtTime(1050, now + 0.88);
  oscillator.frequency.exponentialRampToValueAtTime(520, now + 1.1);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.32, now + 0.04);
  gain.gain.setValueAtTime(0.32, now + 0.9);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 1.1);

  oscillator.onended = () => {
    oscillator.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}
