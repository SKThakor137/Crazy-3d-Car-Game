/**
 * In-Game Arcade Music Synthesizer & Radio Player
 * Features 4 high-energy procedural electronic soundtracks + custom audio file playback support.
 */

export interface TrackInfo {
  id: string;
  name: string;
  genre: string;
  bpm: number;
}

export class MusicSynth {
  private static ctx: AudioContext | null = null;
  private static musicGain: GainNode | null = null;
  private static isPlaying = false;
  private static timerId: number | null = null;
  private static step = 0;
  public static isMuted = false;
  private static currentTrackIdx = 0;

  // Custom audio upload support
  private static customAudio: HTMLAudioElement | null = null;
  private static isCustomAudioPlaying = false;
  private static customTrackName = '';

  public static readonly TRACKS: TrackInfo[] = [
    { id: 'neon-overdrive', name: 'NEON OVERDRIVE', genre: 'Synthwave', bpm: 132 },
    { id: 'desert-thunder', name: 'DESERT THUNDER', genre: 'Heavy Electro Rock', bpm: 142 },
    { id: 'safari-rush', name: 'SAFARI EXPEDITION', genre: 'Adventure Groove', bpm: 126 },
    { id: 'turbo-chiptune', name: 'TURBO CHIPTUNE', genre: 'Arcade 8-Bit', bpm: 150 },
  ];

  // Song 1: Synthwave (Am - F - C - G)
  private static song1Bass = [
    110, 110, 220, 110, 110, 110, 220, 110,
    87.31, 87.31, 174.61, 87.31, 87.31, 87.31, 174.61, 87.31,
    130.81, 130.81, 261.63, 130.81, 130.81, 130.81, 261.63, 130.81,
    98.0, 98.0, 196.0, 98.0, 98.0, 98.0, 196.0, 98.0,
  ];
  private static song1Lead = [
    440, 523.25, 659.25, 880, 659.25, 523.25, 659.25, 880,
    349.23, 440, 523.25, 698.46, 523.25, 440, 523.25, 698.46,
    523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 783.99, 1046.5,
    392.0, 493.88, 587.33, 783.99, 587.33, 493.88, 587.33, 783.99,
  ];

  // Song 2: Heavy Electro Rock (Em - C - D - Bm)
  private static song2Bass = [
    82.41, 82.41, 164.81, 82.41, 82.41, 164.81, 82.41, 164.81,
    65.41, 65.41, 130.81, 65.41, 65.41, 130.81, 65.41, 130.81,
    73.42, 73.42, 146.83, 73.42, 73.42, 146.83, 73.42, 146.83,
    61.74, 61.74, 123.47, 61.74, 61.74, 123.47, 61.74, 123.47,
  ];
  private static song2Lead = [
    329.63, 392.0, 493.88, 659.25, 493.88, 392.0, 493.88, 659.25,
    261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 392.0, 523.25,
    293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 440.0, 587.33,
    246.94, 311.13, 369.99, 493.88, 369.99, 311.13, 369.99, 493.88,
  ];

  // Song 3: Safari Adventure Groove (Dm - Bb - F - C)
  private static song3Bass = [
    73.42, 146.83, 73.42, 146.83, 73.42, 146.83, 73.42, 146.83,
    58.27, 116.54, 58.27, 116.54, 58.27, 116.54, 58.27, 116.54,
    87.31, 174.61, 87.31, 174.61, 87.31, 174.61, 87.31, 174.61,
    65.41, 130.81, 65.41, 130.81, 65.41, 130.81, 65.41, 130.81,
  ];
  private static song3Lead = [
    587.33, 659.25, 698.46, 880.0, 698.46, 659.25, 587.33, 880.0,
    466.16, 523.25, 587.33, 698.46, 587.33, 523.25, 466.16, 698.46,
    698.46, 783.99, 880.0, 1046.5, 880.0, 783.99, 698.46, 1046.5,
    523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 783.99,
  ];

  // Song 4: Turbo Chiptune (C - G - Am - F)
  private static song4Bass = [
    130.81, 261.63, 130.81, 261.63, 130.81, 261.63, 130.81, 261.63,
    98.0, 196.0, 98.0, 196.0, 98.0, 196.0, 98.0, 196.0,
    110.0, 220.0, 110.0, 220.0, 110.0, 220.0, 110.0, 220.0,
    87.31, 174.61, 87.31, 174.61, 87.31, 174.61, 87.31, 174.61,
  ];
  private static song4Lead = [
    523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 1046.5,
    392.0, 493.88, 587.33, 783.99, 587.33, 493.88, 392.0, 783.99,
    440.0, 523.25, 659.25, 880.0, 659.25, 523.25, 440.0, 880.0,
    349.23, 440.0, 523.25, 698.46, 523.25, 440.0, 349.23, 698.46,
  ];

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
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('MusicSynth init error:', e);
    }
  }

  public static setMusicVolume(vol: number): void {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol * 0.45)), this.ctx.currentTime, 0.05);
    }
    if (this.customAudio) {
      this.customAudio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  public static getCurrentTrack(): TrackInfo {
    if (this.isCustomAudioPlaying) {
      return {
        id: 'custom',
        name: this.customTrackName || 'CUSTOM TRACK',
        genre: 'User Audio',
        bpm: 128,
      };
    }
    return this.TRACKS[this.currentTrackIdx] || this.TRACKS[0];
  }

  public static nextTrack(): TrackInfo {
    this.stopCustomAudio();
    this.currentTrackIdx = (this.currentTrackIdx + 1) % this.TRACKS.length;
    this.restartCurrent();
    return this.getCurrentTrack();
  }

  public static prevTrack(): TrackInfo {
    this.stopCustomAudio();
    this.currentTrackIdx = (this.currentTrackIdx - 1 + this.TRACKS.length) % this.TRACKS.length;
    this.restartCurrent();
    return this.getCurrentTrack();
  }

  public static setTrack(idx: number): TrackInfo {
    this.stopCustomAudio();
    this.currentTrackIdx = Math.max(0, Math.min(this.TRACKS.length - 1, idx));
    this.restartCurrent();
    return this.getCurrentTrack();
  }

  private static restartCurrent(): void {
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  public static playCustomAudioFile(file: File): void {
    this.stop();
    this.stopCustomAudio();
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.8;
      audio.play();
      this.customAudio = audio;
      this.isCustomAudioPlaying = true;
      this.customTrackName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
    } catch (e) {
      console.warn('Failed to play custom audio file:', e);
    }
  }

  public static stopCustomAudio(): void {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
      this.isCustomAudioPlaying = false;
      this.customTrackName = '';
    }
  }

  public static start(): void {
    if (this.isCustomAudioPlaying && this.customAudio) {
      this.customAudio.play();
      return;
    }

    this.init();
    if (this.isPlaying || !this.ctx || this.isMuted) return;
    this.isPlaying = true;
    this.step = 0;

    const track = this.TRACKS[this.currentTrackIdx] || this.TRACKS[0];
    const stepDurationMs = (60 / track.bpm / 2) * 1000; // 16th notes
    this.timerId = window.setInterval(() => {
      this.playStep();
    }, stepDurationMs);
  }

  public static stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  private static playStep(): void {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const currentStep = this.step % 32;

    const trackIdx = this.currentTrackIdx;
    const bassPatterns = [this.song1Bass, this.song2Bass, this.song3Bass, this.song4Bass];
    const leadPatterns = [this.song1Lead, this.song2Lead, this.song3Lead, this.song4Lead];

    const currentBass = bassPatterns[trackIdx] || this.song1Bass;
    const currentLead = leadPatterns[trackIdx] || this.song1Lead;

    // 1. Kick Drum (every 4 16th steps = on the beat)
    if (this.step % 4 === 0) {
      try {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(145, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

        kickGain.gain.setValueAtTime(0.65, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.16);
      } catch (e) {
        // audio node error
      }
    }

    // 2. Snare / Clap on beats 2 and 4 (step 4, 12, 20, 28)
    if (this.step % 8 === 4) {
      try {
        const snareBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        const snareData = snareBuffer.getChannelData(0);
        for (let i = 0; i < snareData.length; i++) {
          snareData[i] = (Math.random() * 2 - 1) * (1 - i / snareData.length);
        }
        const snareSource = this.ctx.createBufferSource();
        snareSource.buffer = snareBuffer;

        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = 'bandpass';
        snareFilter.frequency.setValueAtTime(2500, now);

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.35, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        snareSource.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.musicGain);

        snareSource.start(now);
      } catch (e) {
        // ignore
      }
    }

    // 3. Hi-Hat (on every 16th)
    try {
      const isOffBeat = this.step % 2 === 1;
      const hatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.035, this.ctx.sampleRate);
      const hatData = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatData.length; i++) {
        hatData[i] = Math.random() * 2 - 1;
      }
      const hatSource = this.ctx.createBufferSource();
      hatSource.buffer = hatBuffer;

      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(7500, now);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(isOffBeat ? 0.16 : 0.08, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      hatSource.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);

      hatSource.start(now);
    } catch (e) {
      // ignore
    }

    // 4. Bass synth
    try {
      const bassFreq = currentBass[currentStep];
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassGain = this.ctx.createGain();

      bassOsc.type = trackIdx === 3 ? 'square' : 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, now);
      bassFilter.frequency.exponentialRampToValueAtTime(140, now + 0.18);

      bassGain.gain.setValueAtTime(0.32, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.22);
    } catch (e) {
      // ignore
    }

    // 5. Arpeggiated Melody Lead
    if (this.step % 2 === 0) {
      try {
        const leadFreq = currentLead[currentStep];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();

        leadOsc.type = trackIdx === 3 ? 'square' : 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadGain.gain.setValueAtTime(trackIdx === 3 ? 0.1 : 0.2, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);

        leadOsc.start(now);
        leadOsc.stop(now + 0.24);
      } catch (e) {
        // ignore
      }
    }

    this.step++;
  }
}
