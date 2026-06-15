// La Fenêtre — the procedural soundscape engine.
//
// Everything here is generative Web Audio: filtered noise beds, tuned drones,
// and sparse partial accents (bells, crackle, chirps). No sample files, no
// external audio API. Each WindowSpec.soundscape is a recipe of layers; we
// instantiate the matching synth for each, breathing slowly so the air never
// loops audibly. Browsers block autoplay — nothing starts until start() is
// called from a user gesture (the « Entrer » button).

import type { Soundscape, SoundLayer, SoundLayerKind } from "./windows";

// --- shared noise buffer (a few seconds of white noise, looped) -------------

function makeNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // pink-ish noise via a simple one-pole filter on white noise
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = 0.98 * last + 0.02 * white;
    data[i] = (white * 0.25 + last * 2.0) * 0.5;
  }
  return buf;
}

interface Voice {
  /** stop and disconnect this voice; returns when faded. */
  stop(): void;
}

// A slow LFO that gently modulates a target AudioParam around a base value.
function breathe(
  ctx: AudioContext,
  param: AudioParam,
  base: number,
  depth: number,
  periodSec: number,
): OscillatorNode {
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 1 / periodSec;
  const amp = ctx.createGain();
  amp.gain.value = depth;
  param.value = base;
  lfo.connect(amp).connect(param);
  lfo.start();
  return lfo;
}

// --- noise-bed voice (murmur / rain / wind / water / etc.) ------------------

interface BedConfig {
  type: BiquadFilterType;
  freq: number;
  q: number;
  /** breathing on the filter cutoff. */
  swingHz?: number;
  swingPeriod?: number;
  /** breathing on the gain, for swelling beds (crowd, sea). */
  gainSwing?: number;
  gainPeriod?: number;
  /** optional second filter stage for a narrower band. */
  hp?: number;
}

function bedConfigFor(kind: SoundLayerKind, freq?: number): BedConfig {
  switch (kind) {
    case "murmur":
      return { type: "bandpass", freq: freq ?? 360, q: 0.9, swingHz: 60, swingPeriod: 11, gainSwing: 0.35, gainPeriod: 9 };
    case "market":
      return { type: "bandpass", freq: freq ?? 520, q: 0.8, swingHz: 120, swingPeriod: 7, gainSwing: 0.4, gainPeriod: 6 };
    case "rain":
      return { type: "highpass", freq: freq ?? 1200, q: 0.6, hp: 600, gainSwing: 0.12, gainPeriod: 13 };
    case "wind":
      return { type: "bandpass", freq: freq ?? 200, q: 1.6, swingHz: 90, swingPeriod: 8, gainSwing: 0.45, gainPeriod: 6.5 };
    case "water":
      return { type: "bandpass", freq: freq ?? 480, q: 1.1, swingHz: 140, swingPeriod: 5, gainSwing: 0.25, gainPeriod: 4 };
    case "waves":
      return { type: "lowpass", freq: freq ?? 220, q: 0.7, gainSwing: 0.6, gainPeriod: 9 };
    case "room":
      return { type: "lowpass", freq: freq ?? 140, q: 0.5, gainSwing: 0.1, gainPeriod: 17 };
    case "night":
      return { type: "bandpass", freq: freq ?? 3200, q: 4, swingHz: 200, swingPeriod: 3, gainSwing: 0.3, gainPeriod: 2.5 };
    default:
      return { type: "bandpass", freq: freq ?? 400, q: 1, gainSwing: 0.2, gainPeriod: 8 };
  }
}

function makeBed(
  ctx: AudioContext,
  noise: AudioBuffer,
  out: GainNode,
  kind: SoundLayerKind,
  level: number,
  freq?: number,
): Voice {
  const cfg = bedConfigFor(kind, freq);
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;

  const filt = ctx.createBiquadFilter();
  filt.type = cfg.type;
  filt.frequency.value = cfg.freq;
  filt.Q.value = cfg.q;

  const gain = ctx.createGain();
  gain.gain.value = 0; // fade in

  let chain: AudioNode = src;
  chain.connect(filt);
  chain = filt;

  if (cfg.hp) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = cfg.hp;
    chain.connect(hp);
    chain = hp;
  }

  chain.connect(gain).connect(out);

  const lfos: OscillatorNode[] = [];
  if (cfg.swingHz && cfg.swingPeriod) {
    lfos.push(breathe(ctx, filt.frequency, cfg.freq, cfg.swingHz, cfg.swingPeriod));
  }
  if (cfg.gainSwing && cfg.gainPeriod) {
    lfos.push(breathe(ctx, gain.gain, level, level * cfg.gainSwing, cfg.gainPeriod));
  }

  src.start();
  // fade in over 2.5s
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(level, ctx.currentTime + 2.5);
  // re-apply breathing center after the ramp by leaving the LFO connected
  // (LFO sums onto the param; the ramp sets the base via setValue above).

  return {
    stop() {
      const now = ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);
      } catch {
        /* noop */
      }
      lfos.forEach((l) => {
        try {
          l.stop(now + 1.4);
        } catch {
          /* noop */
        }
      });
      try {
        src.stop(now + 1.4);
      } catch {
        /* noop */
      }
    },
  };
}

// --- tonal drone (stacked detuned sines) ------------------------------------

function makeDrone(ctx: AudioContext, out: GainNode, rootHz: number, level: number): Voice {
  const partials = [1, 1.5, 2.01, 3.02];
  const detunes = [0, 4, -3, 6];
  const oscs: OscillatorNode[] = [];
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(out);

  partials.forEach((mult, idx) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = rootHz * mult;
    osc.detune.value = detunes[idx];
    const og = ctx.createGain();
    og.gain.value = level / (idx + 1.5);
    osc.connect(og).connect(gain);
    osc.start();
    oscs.push(osc);
  });

  const lfo = breathe(ctx, gain.gain, level, level * 0.35, 14);

  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(level, ctx.currentTime + 3.5);

  return {
    stop() {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 2);
      [...oscs, lfo].forEach((o) => {
        try {
          o.stop(now + 2.2);
        } catch {
          /* noop */
        }
      });
    },
  };
}

// --- sparse accent voices (bells / fire / birds / clock) --------------------
// These schedule themselves on a recurring randomized timer until stopped.

function makeAccent(
  ctx: AudioContext,
  out: GainNode,
  kind: SoundLayerKind,
  level: number,
): Voice {
  let alive = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function ring(freq: number, dur: number, type: OscillatorType, gainScale: number) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g).connect(out);
    const t = ctx.currentTime;
    const peak = level * gainScale;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function crackle() {
    // a short burst of filtered noise — a fire pop
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1200 + Math.random() * 1800;
    f.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.value = level * (0.4 + Math.random() * 0.6);
    src.connect(f).connect(g).connect(out);
    src.start();
  }

  function scheduleNext() {
    if (!alive) return;
    const params = accentTiming(kind);
    const wait = params.min + Math.random() * (params.max - params.min);
    timer = setTimeout(() => {
      if (!alive) return;
      switch (kind) {
        case "bells": {
          const base = 320 + Math.random() * 90;
          ring(base, 4.5, "sine", 0.5);
          ring(base * 2.76, 3.5, "sine", 0.18); // inharmonic partial — bell timbre
          ring(base * 5.4, 2.5, "sine", 0.08);
          break;
        }
        case "birds": {
          const f = 1800 + Math.random() * 1600;
          ring(f, 0.12, "sine", 0.5);
          if (Math.random() > 0.5) setTimeout(() => alive && ring(f * 1.1, 0.1, "sine", 0.4), 130);
          break;
        }
        case "night":
          ring(3400 + Math.random() * 800, 0.05, "triangle", 0.3);
          break;
        case "clock":
          ring(900, 0.04, "square", 0.25);
          break;
        case "fire":
          crackle();
          break;
        default:
          break;
      }
      scheduleNext();
    }, wait);
  }

  scheduleNext();

  return {
    stop() {
      alive = false;
      if (timer) clearTimeout(timer);
    },
  };
}

function accentTiming(kind: SoundLayerKind): { min: number; max: number } {
  switch (kind) {
    case "bells":
      return { min: 9000, max: 22000 };
    case "birds":
      return { min: 1200, max: 5000 };
    case "night":
      return { min: 120, max: 500 };
    case "clock":
      return { min: 1000, max: 1000 };
    case "fire":
      return { min: 180, max: 900 };
    default:
      return { min: 3000, max: 8000 };
  }
}

const ACCENT_KINDS: SoundLayerKind[] = ["bells", "birds", "night", "clock", "fire"];

// --- the engine -------------------------------------------------------------

export class Soundscaper {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices: Voice[] = [];
  private current: Soundscape | null = null;
  private _volume = 0.7;
  private _playing = false;

  get playing(): boolean {
    return this._playing;
  }
  get volume(): number {
    return this._volume;
  }

  /** Must be called from a user gesture. Builds (or rebuilds) the graph. */
  async start(scape: Soundscape): Promise<void> {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._volume;
      this.master.connect(this.ctx.destination);
      this.noise = makeNoiseBuffer(this.ctx);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.swap(scape);
    this._playing = true;
  }

  /** Swap to a new soundscape without tearing down the context. */
  swap(scape: Soundscape): void {
    if (!this.ctx || !this.master || !this.noise) {
      this.current = scape;
      return;
    }
    this.voices.forEach((v) => v.stop());
    this.voices = [];
    this.current = scape;

    for (const layer of scape.layers) {
      this.addLayer(layer);
    }
    if (scape.droneHz) {
      this.voices.push(makeDrone(this.ctx, this.master, scape.droneHz, 0.16));
    }
  }

  private addLayer(layer: SoundLayer): void {
    if (!this.ctx || !this.master || !this.noise) return;
    const level = Math.max(0, Math.min(1, layer.gain)) * 0.5;
    if (layer.kind === "drone") {
      this.voices.push(makeDrone(this.ctx, this.master, layer.freq ?? 110, level));
    } else if (ACCENT_KINDS.includes(layer.kind)) {
      this.voices.push(makeAccent(this.ctx, this.master, layer.kind, level));
    } else {
      this.voices.push(makeBed(this.ctx, this.noise, this.master, layer.kind, level, layer.freq));
    }
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
    }
  }

  /** Stop all sound but keep the context for a quick restart. */
  stop(): void {
    this.voices.forEach((v) => v.stop());
    this.voices = [];
    this._playing = false;
  }

  /** Resume the last soundscape after a stop(). */
  async resume(): Promise<void> {
    if (!this.ctx || !this.current) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.swap(this.current);
    this._playing = true;
  }

  /** Tear everything down. */
  async dispose(): Promise<void> {
    this.stop();
    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch {
        /* noop */
      }
      this.ctx = null;
      this.master = null;
      this.noise = null;
    }
  }
}
