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
    let el = this.audioElements.get(id);
    if (!el) {
      el = new Audio(entry.src);
      this.audioElements.set(id, el);
    }
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  async play(id: string) {
    if (!this.globalEnabled) return;
    const entry = this.registry[id];
    if (!entry || !this.categoryEnabled[entry.category]) return;
    const ctx = this.ensureContext();
    if (!ctx) { this.playFallback(id); return; }
    const buf = await this.loadBuffer(id);
    if (!buf) return;
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
    const ctx = this.ensureContext();
    if (!ctx) { this.playFallback(id); return; }
    const buf = await this.loadBuffer(id);
    if (!buf) return;
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
      const ctx = this.ensureContext();
      if (!ctx) return;
      const buf = await this.loadBuffer(id);
      if (!buf) return;
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
    const ctx = this.ensureContext();
    if (!ctx) return;
    const buf = await this.loadBuffer(id);
    if (!buf) return;
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
   * Synthesise a short celebratory "ding-ding" chime for correct answers.
   * Two ascending triangle-wave notes, very soft (gain 0.18).
   */
  playCorrect() {
    if (!this.globalEnabled || !this.categoryEnabled.effect) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    gain.connect(this.gains.effect);
    const now = ctx.currentTime;
    // Note 1: C5 → E5 rising feel
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.setValueAtTime(523, now);       // C5
    o1.frequency.linearRampToValueAtTime(659, now + 0.06); // E5
    o1.connect(gain);
    o1.start(now);
    o1.stop(now + 0.12);
    // Note 2: G5 — a beat later
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(784, now + 0.13); // G5
    o2.connect(gain);
    gain.gain.setValueAtTime(0.18, now + 0.13);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);
    o2.start(now + 0.13);
    o2.stop(now + 0.36);
  }

  /**
   * Synthesise a soft low "boop" for incorrect answers — not harsh or discouraging.
   * A short sine-wave dip, gain 0.12.
   */
  playIncorrect() {
    if (!this.globalEnabled || !this.categoryEnabled.effect) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
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

    // Preferred voice names — these are the highest quality on each platform.
    const preferredHK = [
      'Sinji',         // macOS Premium Cantonese (newer naming)
      'Sin-ji',        // macOS Cantonese (classic)
      'Sin Ji',
      'Tracy',         // Microsoft Cantonese (Windows / Edge)
      'TracyM',
      'TracyRUS',
      'WanLung',       // Microsoft Cantonese male
      'Google 粵語（香港）',
      'Google Cantonese (Hong Kong)',
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

  /** Speak text via SpeechSynthesis, respecting global mute and ducking music. */
  speakTTS(text: string, lang = 'zh-HK', rate = 0.72) {
    if (!this.globalEnabled || !this.categoryEnabled.voice) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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
