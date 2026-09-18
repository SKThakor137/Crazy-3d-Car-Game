/**
 * Web Audio API Procedural Sound Synthesizer
 * Fully self-contained, offline, realistic dynamic audio with zero external asset files.
 */
export class SoundSynth {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static sfxGain: GainNode | null = null;

  // Continuous engine sound nodes
  private static engineOsc1: OscillatorNode | null = null;
  private static engineOsc2: OscillatorNode | null = null;
  private static engineFilter: BiquadFilterNode | null = null;
  private static engineGain: GainNode | null = null;
  private static isEngineRunning = false;

  // Continuous tire squeal nodes
  private static tireNoiseGain: GainNode | null = null;
  private static tireFilter: BiquadFilterNode | null = null;
  private static isTireSquealing = false;

  // Continuous nitro roar nodes
  private static nitroGain: GainNode | null = null;
  private static isNitroPlaying = false;

  public static isMuted = false;

  public static init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.setupContinuousNodes();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public static setMasterVolume(vol: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public static setSfxVolume(vol: number): void {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  private static setupContinuousNodes(): void {
    if (!this.ctx || !this.sfxGain) return;

    // 1. Setup Engine Synthesizer
    try {
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Engine sound init error:', e);
    }

    // 2. Setup Tire Screech Synthesizer (Filtered Noise)
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      this.tireFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.tireFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.tireNoiseGain = this.ctx.createGain();
      this.tireNoiseGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      whiteNoise.connect(this.tireFilter);
      this.tireFilter.connect(this.tireNoiseGain);
      this.tireNoiseGain.connect(this.sfxGain);
      whiteNoise.start();
    } catch (e) {
      console.warn('Tire screech sound init error:', e);
    }

    // 3. Setup Nitro Jet Roar Synthesizer
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.7;
      }

      const jetNoise = this.ctx.createBufferSource();
      jetNoise.buffer = noiseBuffer;
      jetNoise.loop = true;

      const nitroFilter = this.ctx.createBiquadFilter();
      nitroFilter.type = 'lowpass';
      nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      jetNoise.connect(nitroFilter);
      nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.sfxGain);
      jetNoise.start();
    } catch (e) {
      console.warn('Nitro sound init error:', e);
    }
  }

  // Update dynamic engine RPM pitch and volume based on speed and throttle
  public static updateEngine(speedRatio: number, throttle: number): void {
    if (!this.ctx || !this.engineGain || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;
    if (this.ctx.state === 'suspended') return;

    const baseFreq = 40;
    const maxFreq = 240;
    const targetFreq = baseFreq + Math.pow(speedRatio, 0.85) * (maxFreq - baseFreq) + (throttle > 0 ? 15 : 0);
    const filterFreq = 300 + speedRatio * 1800 + (throttle > 0 ? 300 : 0);
    const targetVol = (0.2 + speedRatio * 0.45 + (throttle > 0 ? 0.15 : 0.05)) * (this.isMuted ? 0 : 1);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  // Set tire screech volume (drift or skid)
  public static setTireScreech(intensity: number): void {
    if (!this.ctx || !this.tireNoiseGain) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const now = this.ctx.currentTime;
    this.tireNoiseGain.gain.setTargetAtTime(clamped * 0.35 * (this.isMuted ? 0 : 1), now, 0.06);
  }

  // Set nitro boost sound
  public static setNitro(active: boolean): void {
    if (!this.ctx || !this.nitroGain) return;
    const now = this.ctx.currentTime;
    const target = active ? 0.5 : 0.0001;
    this.nitroGain.gain.setTargetAtTime(target * (this.isMuted ? 0 : 1), now, 0.08);
  }

  // Play hard collision sound
  public static playCollision(severity = 0.5): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      const impactVol = Math.min(0.8, severity * 0.8);
      gain.gain.setValueAtTime(impactVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  // Play countdown beep (low tone for 3, 2, 1, high tone for GO!)
  public static playCountdownBeep(isGo = false): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'sine' : 'square';
      const freq = isGo ? 880 : 440;
      const dur = isGo ? 0.45 : 0.2;

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {
      console.warn(e);
    }
  }

  // Play lap completion chime
  public static playLapChime(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        if (!this.ctx || !this.sfxGain) return;
        const now = this.ctx.currentTime + index * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.28);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Play UI button click
  public static playClick(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn(e);
    }
  }

  // Handshake / Fist Bump impact sound
  public static playHandshake(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;

      // Sharp percussive slap
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // White noise snap (hand clap texture)
      const bufferLen = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferLen, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLen; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferLen);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2000, now);
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  // Airborne jump launch whoosh
  public static playJumpLaunch(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }

  // Heavy suspension landing thud
  public static playLandingThud(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      console.warn(e);
    }
  }

  // Water river splash sound
  public static playWaterSplash(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const bufferLen = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferLen, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferLen) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  // Mud squelch sound
  public static playMudSplat(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn(e);
    }
  }

  public static stopAll(): void {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    }
    if (this.tireNoiseGain && this.ctx) {
      this.tireNoiseGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    }
    if (this.nitroGain && this.ctx) {
      this.nitroGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    }
  }
}

