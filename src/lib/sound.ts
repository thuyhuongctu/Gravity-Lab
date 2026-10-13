/**
 * Sound: a synthesised space ambience, the orbit room's sonification and the
 * planets' orbital frequencies raised by octaves into hearing. Web Audio only;
 * nothing plays until the listener turns it on (browsers require a gesture).
 */

export type SoundState = { ambient: boolean; orbit: boolean; volume: number; chord: boolean };

const KEY = "gravity-lab:sound";

function load(): SoundState {
  const base: SoundState = { ambient: false, orbit: false, volume: 0.6, chord: false };
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(KEY) ?? "null",
    ) as Partial<SoundState> | null;
    // Saved choices are kept, but sound always starts off: a page must not play on load.
    if (saved && typeof saved.volume === "number")
      base.volume = Math.min(1, Math.max(0, saved.volume));
  } catch {
    // No storage: defaults.
  }
  return base;
}

let state: SoundState =
  typeof window === "undefined"
    ? { ambient: false, orbit: false, volume: 0.6, chord: false }
    : load();
const listeners = new Set<() => void>();

function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ volume: state.volume }));
  } catch {
    // Not remembered.
  }
  listeners.forEach((fn) => fn());
}

export function subscribeSound(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSound(): SoundState {
  return state;
}

/* ---------- audio graph ---------- */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let wet: GainNode | null = null;

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = state.volume * state.volume;
  master.connect(ctx.destination);

  // A long, soft reverb from decaying noise: the "room" of space.
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 4.5);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  verb.buffer = ir;
  wet = ctx.createGain();
  wet.gain.value = 0.55;
  wet.connect(verb);
  verb.connect(master);

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (state.ambient || state.orbit || state.chord) void ctx.resume();
  });
  return ctx;
}

/** Send a node to the dry mix and the reverb. */
function out(node: AudioNode, reverb = 1) {
  node.connect(master!);
  if (reverb > 0) {
    const g = ctx!.createGain();
    g.gain.value = reverb;
    node.connect(g);
    g.connect(wet!);
  }
}

function wake() {
  const c = audio();
  if (c && c.state !== "running" && !document.hidden) void c.resume();
  return c;
}

export function setVolume(v: number) {
  state = { ...state, volume: Math.min(1, Math.max(0, v)) };
  if (ctx && master)
    master.gain.setTargetAtTime(state.volume * state.volume, ctx.currentTime, 0.05);
  emit();
}

/* ---------- ambience: cosmic tones ---------- */

let ambientBus: GainNode | null = null;
let ambientStop: (() => void) | null = null;
let ducked = false;
const AMBIENT_LEVEL = 0.32;
const DUCK = 0.22;

/**
 * Planetary frequencies (Cousto's octave method), Hz · gain · pan: Earth year (OM),
 * Earth day, the Moon (synodic), Venus, Mercury. A 68.05 Hz sub is the year one octave down.
 */
const TONES: Array<[number, number, number]> = [
  [136.1, 0.22, 0],
  [194.18, 0.12, -0.5],
  [210.42, 0.08, 0.5],
  [221.23, 0.07, -0.3],
  [141.27, 0.09, 0.35],
];

function reverb(c: AudioContext): ConvolverNode {
  const len = c.sampleRate * 5;
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  const v = c.createConvolver();
  v.buffer = ir;
  return v;
}

function startAmbient(c: AudioContext) {
  ambientBus = c.createGain();
  ambientBus.gain.value = 0;
  // Six seconds in, so the drone rises rather than starts.
  ambientBus.gain.linearRampToValueAtTime((ducked ? DUCK : 1) * AMBIENT_LEVEL, c.currentTime + 6);
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.ratio.value = 3;
  ambientBus.connect(comp);
  out(comp, 0.9);
  const nodes: AudioScheduledSourceNode[] = [];

  // Dry and wet (5 s convolver) paths into the bus.
  const bus = c.createGain();
  const dry = c.createGain();
  dry.gain.value = 0.5;
  const wet = c.createGain();
  wet.gain.value = 0.55;
  const verb = reverb(c);
  bus.connect(dry);
  bus.connect(verb);
  verb.connect(wet);
  dry.connect(ambientBus);
  wet.connect(ambientBus);

  // A low-pass swept very slowly, so the texture breathes over half a minute.
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  lp.Q.value = 0.4;
  lp.connect(bus);
  const sweep = c.createOscillator();
  sweep.frequency.value = 0.03;
  const sweepDepth = c.createGain();
  sweepDepth.gain.value = 420;
  sweep.connect(sweepDepth);
  sweepDepth.connect(lp.frequency);
  sweep.start();
  nodes.push(sweep);

  TONES.forEach(([f, g, p], i) => {
    // Each tone twice, detuned left and right, so the pair beats slowly, felt as breathing.
    for (const side of [0, 1]) {
      const o = c.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f + (side ? 0.35 + i * 0.12 : -0.35 - i * 0.12);
      const v = c.createGain();
      v.gain.value = g * 0.5;
      const pan = c.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, p + (side ? 0.35 : -0.35)));
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.04 + i * 0.017;
      const depth = c.createGain();
      depth.gain.value = g * 0.35;
      lfo.connect(depth);
      depth.connect(v.gain);
      lfo.start(c.currentTime + i * 1.3);
      o.connect(v);
      v.connect(pan);
      pan.connect(lp);
      o.start();
      nodes.push(o, lfo);
    }
  });
  const sub = c.createOscillator();
  sub.frequency.value = 68.05;
  const sv = c.createGain();
  sv.gain.value = 0.1;
  sub.connect(sv);
  sv.connect(bus);
  sub.start();
  nodes.push(sub);

  const main = ambientBus;
  ambientStop = () => {
    const t = c.currentTime;
    main.gain.cancelScheduledValues(t);
    main.gain.setTargetAtTime(0, t, 0.5);
    for (const node of nodes) node.stop(t + 3);
    window.setTimeout(() => main.disconnect(), 3200);
  };
}

/** While the song plays, the tones fall to 22% over 2.5 s and rise again after. */
export function duckAmbient(on: boolean) {
  ducked = on;
  if (!ctx || !ambientBus || !state.ambient) return;
  const t = ctx.currentTime;
  ambientBus.gain.cancelScheduledValues(t);
  ambientBus.gain.setValueAtTime(ambientBus.gain.value, t);
  ambientBus.gain.linearRampToValueAtTime((on ? DUCK : 1) * AMBIENT_LEVEL, t + 2.5);
}

export function setAmbient(on: boolean) {
  if (on === state.ambient) return;
  state = { ...state, ambient: on };
  const c = on ? wake() : ctx;
  if (c) {
    if (on) startAmbient(c);
    else {
      ambientStop?.();
      ambientStop = null;
      ambientBus = null;
    }
  }
  emit();
}

/* ---------- short sounds ---------- */

function bell(freq: number, level: number, decay: number, dest?: AudioNode, pan = 0) {
  const c = ctx;
  if (!c || !master) return;
  const t = c.currentTime;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  const p = c.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  // A sine with a quiet inharmonic partial reads as a small bell.
  for (const [mult, amp] of [
    [1, 1],
    [2.76, 0.18],
  ] as const) {
    const o = c.createOscillator();
    o.frequency.value = freq * mult;
    const og = c.createGain();
    og.gain.value = amp;
    o.connect(og);
    og.connect(g);
    o.start(t);
    o.stop(t + decay + 0.1);
  }
  g.connect(p);
  if (dest) p.connect(dest);
  else out(p, 0.8);
}

function thump(level: number, pan = 0) {
  const c = ctx;
  if (!c || !master) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  const p = c.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  o.connect(g);
  g.connect(p);
  out(p, 0.6);
  o.start(t);
  o.stop(t + 1);
}

/* ---------- orbit sonification ---------- */

/** Major pentatonic steps; orbit pitches are rounded to it so many orbits stay consonant. */
const PENTA = [0, 2, 4, 7, 9];

/** Round a frequency to the nearest A-major pentatonic note. */
export function snapPentatonic(freq: number): number {
  const semis = 12 * Math.log2(freq / 220);
  const oct = Math.floor(semis / 12);
  const within = semis - oct * 12;
  let best = 0;
  let bestD = Infinity;
  for (const s of [...PENTA, 12]) {
    const d = Math.abs(within - s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return 220 * Math.pow(2, oct + best / 12);
}

/** Pitch for an orbit: proportional to angular speed, so by Kepler's third law inner orbits sing higher. */
export function orbitPitch(omega: number, omegaRef: number): number {
  const f = 220 * (omega / omegaRef);
  return snapPentatonic(Math.min(1320, Math.max(110, f)));
}

type Voice = { osc: OscillatorNode; gain: GainNode; pan: StereoPannerNode; id: number | null };
let voices: Voice[] = [];
let orbitBus: GainNode | null = null;
let lastCount = -1;
let lastTick = 0;

export type OrbitBody = { id: number; x: number; y: number; vx: number; vy: number; mass: number };

export function setOrbitSound(on: boolean) {
  if (on === state.orbit) return;
  state = { ...state, orbit: on };
  const c = on ? wake() : ctx;
  if (c) {
    if (on) {
      orbitBus = c.createGain();
      orbitBus.gain.value = 0.5;
      out(orbitBus, 0.7);
      voices = Array.from({ length: 8 }, () => {
        const osc = c.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 220;
        const gain = c.createGain();
        gain.gain.value = 0;
        const pan = c.createStereoPanner();
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(orbitBus!);
        osc.start();
        return { osc, gain, pan, id: null };
      });
      lastCount = -1;
    } else {
      const t = c.currentTime;
      for (const v of voices) {
        v.gain.gain.setTargetAtTime(0, t, 0.2);
        v.osc.stop(t + 1.5);
      }
      const bus = orbitBus;
      window.setTimeout(() => bus?.disconnect(), 1600);
      voices = [];
      orbitBus = null;
    }
  }
  emit();
}

/**
 * Called by the orbit room each frame. Each orbiting body (up to eight) gets a
 * sine voice tuned to its angular speed around the heaviest body; a new body
 * rings a bell and a merger thumps.
 */
export function orbitFrame(bodies: readonly OrbitBody[], active: boolean, now: number) {
  if (!state.orbit || !ctx || !orbitBus) return;
  const t = ctx.currentTime;
  if (!active) {
    for (const v of voices) v.gain.gain.setTargetAtTime(0, t, 0.15);
    lastCount = -1;
    return;
  }
  if (now - lastTick < 60) return;
  lastTick = now;

  if (lastCount >= 0 && bodies.length > lastCount) bell(880, 0.12, 1.6);
  if (lastCount >= 0 && bodies.length < lastCount && bodies.length > 0) thump(0.35);
  lastCount = bodies.length;

  let center: OrbitBody | null = null;
  for (const b of bodies) if (!center || b.mass > center.mass) center = b;
  const others = center
    ? bodies
        .filter((b) => b !== center)
        .sort((a, b) => b.mass - a.mass)
        .slice(0, voices.length)
    : [];
  // Reference: a circular orbit 200 units from the central mass (G = 980 in the engine).
  const omegaRef = center ? Math.sqrt((980 * center.mass) / 200 ** 3) : 1;

  voices.forEach((v, i) => {
    const b = others[i];
    if (!b || !center) {
      v.gain.gain.setTargetAtTime(0, t, 0.25);
      v.id = null;
      return;
    }
    const rx = b.x - center.x;
    const ry = b.y - center.y;
    const r2 = Math.max(1, rx * rx + ry * ry);
    const omega = Math.abs(rx * (b.vy - center.vy) - ry * (b.vx - center.vx)) / r2;
    const f = orbitPitch(omega, omegaRef);
    if (v.id !== b.id) v.osc.frequency.setValueAtTime(f, t);
    else v.osc.frequency.setTargetAtTime(f, t, 0.08);
    v.id = b.id;
    v.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, rx / 400)), t, 0.1);
    // Quieter for far, slow bodies; the sum of eight voices stays below clipping.
    v.gain.gain.setTargetAtTime(0.05 + 0.05 * Math.min(1, omega / omegaRef), t, 0.12);
  });
}

/* ---------- planetary frequencies ---------- */

/** Sidereal orbital periods in days (NASA planetary fact sheet). */
export const PLANETS = [
  { id: "mercury", vi: "Sao Thủy", en: "Mercury", days: 87.969 },
  { id: "venus", vi: "Sao Kim", en: "Venus", days: 224.701 },
  { id: "earth", vi: "Trái Đất", en: "Earth", days: 365.256 },
  { id: "mars", vi: "Sao Hỏa", en: "Mars", days: 686.98 },
  { id: "jupiter", vi: "Sao Mộc", en: "Jupiter", days: 4332.589 },
  { id: "saturn", vi: "Sao Thổ", en: "Saturn", days: 10759.22 },
  { id: "uranus", vi: "Sao Thiên Vương", en: "Uranus", days: 30685.4 },
  { id: "neptune", vi: "Sao Hải Vương", en: "Neptune", days: 60189 },
] as const;

/**
 * An orbit's frequency (once per period) raised by whole octaves until it lands
 * between 110 and 220 Hz. Doubling keeps the pitch class, so the ratios between
 * planets survive up to octaves.
 */
export function planetTone(days: number): { hz: number; octaves: number; orbitHz: number } {
  const orbitHz = 1 / (days * 86400);
  let hz = orbitHz;
  let octaves = 0;
  while (hz < 110) {
    hz *= 2;
    octaves += 1;
  }
  return { hz, octaves, orbitHz };
}

/** One planet's tone, as a key on the sound panel. */
export function playPlanet(index: number) {
  const p = PLANETS[index];
  if (!p || !wake()) return;
  bell(planetTone(p.days).hz * 2, 0.16, 3.2, undefined, (index / (PLANETS.length - 1)) * 1.4 - 0.7);
}

let chordTimer = 0;

/** Play the planets one by one, inner to outer, then hold them together. */
export function playPlanets(onNote?: (index: number | null) => void) {
  const c = wake();
  if (!c) return;
  window.clearTimeout(chordTimer);
  state = { ...state, chord: true };
  emit();
  const step = 650;
  PLANETS.forEach((p, i) => {
    window.setTimeout(() => {
      onNote?.(i);
      const { hz } = planetTone(p.days);
      bell(hz * 2, 0.16, 3.2, undefined, (i / (PLANETS.length - 1)) * 1.4 - 0.7);
    }, i * step);
  });
  const holdAt = PLANETS.length * step + 300;
  window.setTimeout(() => {
    onNote?.(-1);
    const t = c.currentTime;
    const bus = c.createGain();
    bus.gain.setValueAtTime(0, t);
    bus.gain.linearRampToValueAtTime(0.22, t + 1.2);
    bus.gain.setTargetAtTime(0, t + 5, 1.2);
    out(bus, 1);
    PLANETS.forEach((p) => {
      const o = c.createOscillator();
      o.type = "triangle";
      o.frequency.value = planetTone(p.days).hz;
      const g = c.createGain();
      g.gain.value = 0.09;
      o.connect(g);
      g.connect(bus);
      o.start(t);
      o.stop(t + 10);
    });
  }, holdAt);
  chordTimer = window.setTimeout(() => {
    onNote?.(null);
    state = { ...state, chord: false };
    emit();
  }, holdAt + 9000);
}
