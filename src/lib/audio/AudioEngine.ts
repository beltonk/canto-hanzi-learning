export type SoundCategory = 'ui' | 'voice' | 'music' | 'effect';

interface SoundEntry {
  src: string;
  category: SoundCategory;
}

type SoundRegistry = Record<string, SoundEntry>;

const DUCK_RATIO = 0.3;
const DUCK_TIME = 0.05; // seconds
const FADE_TIME = 0.25;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private gains: Record<SoundCategory, GainNode> = {} as Record<SoundCategory, GainNode>;
  private buffers = new Map<string, AudioBuffer>();
  private registry: SoundRegistry = {};
  private categoryEnabled: Record<SoundCategory, boolean> = { ui: true, voice: true, music: true, effect: true };
  private globalEnabled = true;
  private currentMusic: { source: AudioBufferSourceNode | HTMLAudioElement; id: string } | null = null;
  private brushSource: AudioBufferSourceNode | null = null;
  private audioElements = new Map<string, HTMLAudioElement>(); // fallback
  private unlocked = false;
  private mediaElementUnlocked = false;

  setRegistry(registry: SoundRegistry) {
    this.registry = registry;
  }

  setGlobalEnabled(on: boolean) {
    this.globalEnabled = on;
    if (this.ctx) {
      if (!on) this.stopMusic();
    }
  }

  setCategoryEnabled(cat: SoundCategory, on: boolean) {
    this.categoryEnabled[cat] = on;
    if (!on && cat === 'music') this.stopMusic();
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const cats: SoundCategory[] = ['ui', 'voice', 'music', 'effect'];
      for (const cat of cats) {
        const gain = this.ctx.createGain();
        gain.connect(this.ctx.destination);
        this.gains[cat] = gain;
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private async resumeContextIfNeeded(): Promise<AudioContext | null> {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Ignore and let caller gracefully no-op on locked platforms.
      }
    }
    return ctx;
  }

  private async getRunningContext(): Promise<AudioContext | null> {
    const ctx = await this.resumeContextIfNeeded();
    if (!ctx) return null;
    return ctx.state === 'running' ? ctx : null;
  }

  /**
   * Attempt to unlock audio playback on platforms that require user gesture
   * (notably iOS Safari/Chrome where AudioContext starts suspended).
   */
  async unlock(): Promise<boolean> {
    const ctx = await this.resumeContextIfNeeded();
    if (!ctx) return false;
    if (this.unlocked && ctx.state === 'running') return true;
    if (ctx.state !== 'running') return false;
    try {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
      this.unlocked = true;
    } catch {
      // Best effort; context may still be usable without priming.
    }
    await this.unlockMediaElementIfNeeded();
    return ctx.state === 'running';
  }

  private async unlockMediaElementIfNeeded(): Promise<void> {
    if (this.mediaElementUnlocked || typeof window === 'undefined') return;
    const primer = new Audio(this.registry['ui.tap']?.src ?? '/sounds/_initial/ui-tap.mp3');
    primer.preload = 'auto';
    primer.muted = true;
    primer.setAttribute('playsinline', 'true');
    primer.setAttribute('webkit-playsinline', 'true');
    try {
      await primer.play();
      primer.pause();
      primer.currentTime = 0;
      this.mediaElementUnlocked = true;
    } catch {
      // Keep false and retry on next trusted gesture.
    }
  }

  private async loadBuffer(id: string): Promise<AudioBuffer | null> {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    if (this.buffers.has(id)) return this.buffers.get(id)!;
    const entry = this.registry[id];
    if (!entry) return null;
    try {
      const res = await fetch(entry.src);
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      this.buffers.set(id, buf);
      return buf;
    } catch {
      return null;
    }
  }

  private playFallback(id: string) {
    const entry = this.registry[id];
    if (!entry) return;
    void this.unlockMediaElementIfNeeded();
    let el = this.audioElements.get(id);
    if (!el) {
      el = new Audio(entry.src);
      el.preload = 'auto';
      // iOS/WebKit inline playback hints; use attributes for broad DOM typings compatibility.
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      this.audioElements.set(id, el);
    }
    el.muted = false;
    el.volume = 1;
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  async play(id: string) {
    if (!this.globalEnabled) return;
    const entry = this.registry[id];
    if (!entry || !this.categoryEnabled[entry.category]) return;
    const ctx = await this.getRunningContext();
    if (!ctx) { this.playFallback(id); return; }
    const buf = await this.loadBuffer(id);
    if (!buf) { this.playFallback(id); return; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.gains[entry.category]);
    src.start();
  }

  async voice(id: string) {
    if (!this.globalEnabled || !this.categoryEnabled.voice) return;
    // Duck music
    if (this.gains.music) {
      this.gains.music.gain.linearRampToValueAtTime(DUCK_RATIO, (this.ctx?.currentTime ?? 0) + DUCK_TIME);
    }
    const entry = this.registry[id];
    if (!entry) return;
    const ctx = await this.getRunningContext();
    if (!ctx) { this.playFallback(id); return; }
    const buf = await this.loadBuffer(id);
    if (!buf) { this.playFallback(id); return; }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.gains.voice);
    src.onended = () => {
      if (this.gains.music && ctx) {
        this.gains.music.gain.linearRampToValueAtTime(1, ctx.currentTime + DUCK_TIME);
      }
    };
    src.start();
  }

  music = {
    start: async (id: string) => {
      if (!this.globalEnabled || !this.categoryEnabled.music) return;
      this.stopMusic();
      const ctx = await this.getRunningContext();
      if (!ctx) return;
      const buf = await this.loadBuffer(id);
      if (!buf) { this.playFallback(id); return; }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.gains.music);
      src.start();
      this.currentMusic = { source: src, id };
    },
    stop: () => this.stopMusic(),
  };

  private stopMusic() {
    if (this.currentMusic) {
      try {
        if (this.currentMusic.source instanceof AudioBufferSourceNode) {
          this.currentMusic.source.stop();
        }
      } catch { /* ignore */ }
      this.currentMusic = null;
    }
  }

  async startBrush(id = 'brush.loop') {
    if (!this.globalEnabled || !this.categoryEnabled.effect) return;
    const ctx = await this.getRunningContext();
    if (!ctx) return;
    const buf = await this.loadBuffer(id);
    if (!buf) { this.playFallback(id); return; }
    if (this.brushSource) { try { this.brushSource.stop(); } catch { /* ignore */ } }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.gains.effect);
    src.start();
    this.brushSource = src;
  }

  stopBrush() {
    if (this.brushSource) {
      try {
        this.brushSource.stop();
      } catch { /* ignore */ }
      this.brushSource = null;
    }
  }

  fadeOutMusic() {
    if (!this.ctx || !this.currentMusic) return;
    this.gains.music.gain.linearRampToValueAtTime(0, this.ctx.currentTime + FADE_TIME);
    setTimeout(() => this.stopMusic(), FADE_TIME * 1000 + 50);
  }

  /**
   * Synthesise a short, encouraging "win" chime for correct answers.
   *
   * Two ascending bells (C5 → G5, a perfect fifth — the classic ascending
   * "fanfare" interval used in level-up / victory sounds). Each note is a
   * sine fundamental layered with a softer 2nd-harmonic overtone for a
   * gentle bell timbre, with a quick attack and exponential decay.
   * The second note is slightly louder and longer so the chime resolves
   * upward and feels rewarding without being shrill.
   *
   * Total length ~0.4s — short enough to stay enjoyable on rapid retries.
   * A 5 kHz low-pass keeps it warm on small speakers (iPad).
   */
  async playCorrect() {
    if (!this.globalEnabled || !this.categoryEnabled.effect) return;
    const ctx = await this.getRunningContext();
    if (!ctx) { this.playFallback('success.chime'); return; }

    const now = ctx.currentTime;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5000;
    lp.Q.value = 0.7;
    lp.connect(this.gains.effect);

    const bell = (freq: number, startOffset: number, duration: number, peak: number) => {
      const start = now + startOffset;
      const end = start + duration;

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, start);
      noteGain.gain.linearRampToValueAtTime(peak, start + 0.008);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, end);
      noteGain.connect(lp);

      const fundamental = ctx.createOscillator();
      fundamental.type = 'sine';
      fundamental.frequency.value = freq;
      fundamental.connect(noteGain);
      fundamental.start(start);
      fundamental.stop(end + 0.02);

      const overtone = ctx.createOscillator();
      overtone.type = 'sine';
      overtone.frequency.value = freq * 2;
      const overtoneGain = ctx.createGain();
      overtoneGain.gain.value = 0.18;
      overtone.connect(overtoneGain).connect(noteGain);
      overtone.start(start);
      overtone.stop(end + 0.02);
    };

    bell(523.25, 0.000, 0.16, 0.15); // C5 — the "set up" note
    bell(783.99, 0.095, 0.30, 0.20); // G5 — the bright, triumphant resolution
  }

  /**
   * Synthesise a celebratory "victory" fanfare for game-complete moments.
   *
   * A short 7-note ascending melody in C major, in the spirit of classic
   * "level-up / course-clear" arcade jingles. Each note layers a triangle
   * wave (bright, chiptune-like body) with a softer sine fundamental for
   * warmth, plus a sustained low octave pad that grounds the whole phrase.
   *
   * Use `level` to scale intensity:
   *   3 → full bouncy fanfare (~1.5s, all 7 notes, brightest)
   *   2 → same melody at slightly lower volume (default, encouraging)
   *   1 → short 3-note "you tried" cadence (~0.7s, gentle)
   *
   * Always passes through a 6 kHz low-pass so it stays warm on iPad
   * speakers and doesn't get harsh at higher pitches.
   */
  async playVictoryFanfare(level: 1 | 2 | 3 = 3) {
    if (!this.globalEnabled || !this.categoryEnabled.effect) return;
    const ctx = await this.getRunningContext();
    if (!ctx) { this.playFallback('confetti.burst'); return; }

    const now = ctx.currentTime;

    // Lower cutoff (was 6 kHz) softens the high overtones so the fanfare
    // feels more like a music-box / lullaby than a chiptune blast.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4200;
    lp.Q.value = 0.7;
    lp.connect(this.gains.effect);

    // Schedule one melody note as triangle (body) + sine (warm sweetener).
    // A slightly slower attack (25 ms vs 12 ms) takes the punchy edge off.
    const note = (freq: number, startOffset: number, duration: number, peak: number) => {
      const start = now + startOffset;
      const end = start + duration;

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, start);
      noteGain.gain.linearRampToValueAtTime(peak, start + 0.025);
      noteGain.gain.setValueAtTime(peak, end - 0.06);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, end);
      noteGain.connect(lp);

      const tri = ctx.createOscillator();
      tri.type = 'triangle';
      tri.frequency.value = freq;
      tri.connect(noteGain);
      tri.start(start);
      tri.stop(end + 0.02);

      const sin = ctx.createOscillator();
      sin.type = 'sine';
      sin.frequency.value = freq;
      const sinGain = ctx.createGain();
      sinGain.gain.value = 0.55;
      sin.connect(sinGain).connect(noteGain);
      sin.start(start);
      sin.stop(end + 0.02);
    };

    if (level === 1) {
      // Gentle "you tried" cadence — 3 notes, ascending major triad.
      const peak = 0.055;
      note(523.25, 0.00, 0.18, peak); // C5
      note(659.25, 0.18, 0.18, peak); // E5
      note(783.99, 0.36, 0.40, peak * 1.1); // G5 — held resolution
      return;
    }

    // 2-star and 3-star: the full bouncy fanfare, at a softer level so it
    // sits comfortably underneath UI sounds and never feels overpowering.
    // Tempo: ~120 BPM eighth-notes => 125ms per beat.
    const t = 0.125;
    const peak = level === 3 ? 0.075 : 0.055;

    // A held low pad (G3 + C4) gives the phrase a "fanfare" warmth.
    // Kept very quiet (35 % of melody peak) so it just glues the notes.
    const padStart = now;
    const padEnd = now + t * 11;
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0, padStart);
    padGain.gain.linearRampToValueAtTime(peak * 0.35, padStart + 0.06);
    padGain.gain.setValueAtTime(peak * 0.35, padEnd - 0.25);
    padGain.gain.exponentialRampToValueAtTime(0.0001, padEnd);
    padGain.connect(lp);
    for (const padFreq of [196.0, 261.63]) { // G3, C4
      const padOsc = ctx.createOscillator();
      padOsc.type = 'sine';
      padOsc.frequency.value = padFreq;
      padOsc.connect(padGain);
      padOsc.start(padStart);
      padOsc.stop(padEnd + 0.02);
    }

    // Melody — ascending arpeggio + flourish ending on a held high C6.
    note(523.25, 0 * t, t * 0.9, peak);          // C5
    note(659.25, 1 * t, t * 0.9, peak);          // E5
    note(783.99, 2 * t, t * 0.9, peak);          // G5
    note(1046.50, 3 * t, t * 1.6, peak * 1.05);  // C6 (held)
    note(1318.51, 5 * t, t * 0.9, peak * 1.05);  // E6
    note(1174.66, 6 * t, t * 0.9, peak);         // D6
    note(1046.50, 7 * t, t * 4.0, peak * 1.15);  // C6 — long, triumphant resolution
  }

  /**
   * Synthesise a soft low "boop" for incorrect answers — not harsh or discouraging.
   * A short sine-wave dip, gain 0.12.
   */
  async playIncorrect() {
    if (!this.globalEnabled || !this.categoryEnabled.effect) return;
    const ctx = await this.getRunningContext();
    if (!ctx) { this.playFallback('failure.soft'); return; }
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(this.gains.effect);
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, now);       // A3
    o.frequency.linearRampToValueAtTime(180, now + 0.18); // slide down
    o.connect(gain);
    gain.gain.linearRampToValueAtTime(0, now + 0.22);
    o.start(now);
    o.stop(now + 0.23);
  }

  /**
   * Pick the best available SpeechSynthesis voice for a given language.
   * Prefers known high-quality / native-sounding Cantonese & Mandarin voices
   * (Sin-ji on Apple, Tracy on Microsoft, Google zh-* on Chrome, etc.).
   */
  private pickVoice(lang: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const wantHK = lang.toLowerCase().startsWith('zh-hk') || lang.toLowerCase().startsWith('yue');

    // Preferred voice names — every entry below is a Cantonese FEMALE voice.
    // Order matters: best-quality / most-common platform voice first.
    // The male WanLung voice is intentionally excluded from this list so
    // it never wins over a female voice; if a system somehow has only
    // WanLung available it can still be reached via the language fallback
    // below — but this is extremely rare in practice.
    const preferredHK = [
      // macOS premium Cantonese (female, very natural)
      'Sinji',
      'Sin-ji',
      'Sin Ji',
      // Microsoft Edge / Azure neural Cantonese (female, modern, very natural)
      'HiuMaan',
      'Hiu Maan',
      'HiuMaanNeural',
      'HiuGaai',
      'Hiu Gaai',
      'HiuGaaiNeural',
      // Microsoft classic / SAPI Cantonese (female)
      'Tracy',
      'TracyM',
      'TracyRUS',
      // Google Chrome Cantonese (female on all platforms)
      'Google 粵語（香港）',
      'Google Cantonese (Hong Kong)',
      'Google 廣東話',
    ];
    const preferredCN = [
      'Tingting',      // macOS Premium Mandarin
      'Tian-Tian',
      'Mei-Jia',       // macOS Taiwan Mandarin
      'Xiaoxiao',      // Microsoft Mandarin neural
      'Yunxi',
      'Huihui',
      'Google 普通话（中国大陆）',
      'Google Mandarin',
      'Google 國語（臺灣）',
    ];
    const preferred = wantHK ? preferredHK : preferredCN;

    const matchByName = (name: string) =>
      voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));

    for (const name of preferred) {
      const v = matchByName(name);
      if (v) return v;
    }

    // Fallback: any voice whose lang matches what we want
    const langLower = lang.toLowerCase();
    const exactLang = voices.find(v => v.lang.toLowerCase() === langLower);
    if (exactLang) return exactLang;

    if (wantHK) {
      // Try yue-HK or any Cantonese
      const yue = voices.find(v => v.lang.toLowerCase().startsWith('yue'))
        || voices.find(v => v.lang.toLowerCase() === 'zh-hk');
      if (yue) return yue;
    }
    // Final fallback: any zh-* voice
    return voices.find(v => v.lang.toLowerCase().startsWith('zh')) ?? null;
  }

  /**
   * Speak text via SpeechSynthesis, respecting global mute and ducking music.
   *
   * The default rate (0.5) is intentionally half of the SpeechSynthesis
   * neutral of 1.0 — this app targets primary school students who need a
   * slow, clearly enunciated voice. Individual callers can override `rate`
   * when needed, but every callsite in this codebase uses 0.5 by policy.
   */
  speakTTS(text: string, lang = 'zh-HK', rate = 0.5) {
    if (!this.globalEnabled || !this.categoryEnabled.voice) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    void this.unlock();
    window.speechSynthesis.cancel();

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1.0;
      const voice = this.pickVoice(lang);
      if (voice) {
        utterance.voice = voice;
        // Some platforms ignore .lang when a voice is set; the voice's own lang takes over.
      }
      if (this.gains.music && this.ctx) {
        this.gains.music.gain.linearRampToValueAtTime(DUCK_RATIO, this.ctx.currentTime + DUCK_TIME);
        utterance.onend = () => {
          if (this.gains.music && this.ctx) {
            this.gains.music.gain.linearRampToValueAtTime(1, this.ctx.currentTime + DUCK_TIME);
          }
        };
      }
      window.speechSynthesis.speak(utterance);
    };

    // Voices may load asynchronously; if they aren't ready yet, wait once.
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        speakNow();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
      // Trigger voice loading on some browsers
      window.speechSynthesis.getVoices();
      // Fallback timeout in case the event doesn't fire
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        speakNow();
      }, 250);
    } else {
      speakNow();
    }
  }
}

// Singleton
let _engine: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  if (!_engine) _engine = new AudioEngine();
  return _engine;
}
