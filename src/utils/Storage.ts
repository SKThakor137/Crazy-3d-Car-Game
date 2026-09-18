export interface UserSettings {
  masterVolume: number;    // 0 - 1
  sfxVolume: number;       // 0 - 1
  musicVolume: number;     // 0 - 1
  graphicsQuality: 'low' | 'medium' | 'high';
  steeringSensitivity: number; // 0.5 - 1.5
  touchControls: 'auto' | 'always' | 'never';
  cameraView: 'chase' | 'far' | 'hood';
}

export interface TrackRecord {
  bestLapTime: number;     // seconds
  bestRaceTime: number;    // seconds
  wins: number;
}

export interface GameProgress {
  selectedCarId: string;
  carColors: Record<string, string>;
  selectedTrackId: string;
  unlockedCars: string[];
  trackRecords: Record<string, TrackRecord>;
  settings: UserSettings;
}

const STORAGE_KEY = 'super_apex_racing_save_v1';

const DEFAULT_SETTINGS: UserSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.85,
  musicVolume: 0.6,
  graphicsQuality: 'high',
  steeringSensitivity: 1.0,
  touchControls: 'auto',
  cameraView: 'chase',
};

const DEFAULT_PROGRESS: GameProgress = {
  selectedCarId: 'apex-gt',
  carColors: {
    'apex-gt': '#00f0ff',
    'viper-x': '#ff8400',
    'phantom-rs': '#ff0077',
  },
  selectedTrackId: 'extreme-adventure',
  unlockedCars: ['apex-gt', 'viper-x', 'phantom-rs'],
  trackRecords: {
    'tropical-beach': { bestLapTime: 45.2, bestRaceTime: 140.0, wins: 0 },
    'emerald-forest': { bestLapTime: 49.5, bestRaceTime: 152.0, wins: 0 },
    'canyon-oasis': { bestLapTime: 54.0, bestRaceTime: 168.0, wins: 0 },
    'extreme-adventure': { bestLapTime: 65.0, bestRaceTime: 200.0, wins: 0 },
  },
  settings: DEFAULT_SETTINGS,
};

export class StorageManager {
  static load(): GameProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          carColors: { ...DEFAULT_PROGRESS.carColors, ...(parsed.carColors || {}) },
          trackRecords: { ...DEFAULT_PROGRESS.trackRecords, ...(parsed.trackRecords || {}) },
        };
      }
    } catch (e) {
      console.warn('Could not load saved progress from localStorage:', e);
    }
    return DEFAULT_PROGRESS;
  }

  static save(data: GameProgress): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
  }

  static updateSettings(settings: Partial<UserSettings>): GameProgress {
    const current = this.load();
    current.settings = { ...current.settings, ...settings };
    this.save(current);
    return current;
  }

  static recordRaceFinish(trackId: string, raceTime: number, bestLap: number, isWin: boolean): GameProgress {
    const current = this.load();
    const existing = current.trackRecords[trackId] || { bestLapTime: 999, bestRaceTime: 999, wins: 0 };
    
    if (bestLap > 0 && bestLap < existing.bestLapTime) {
      existing.bestLapTime = parseFloat(bestLap.toFixed(2));
    }
    if (raceTime > 0 && raceTime < existing.bestRaceTime) {
      existing.bestRaceTime = parseFloat(raceTime.toFixed(2));
    }
    if (isWin) {
      existing.wins += 1;
    }

    current.trackRecords[trackId] = existing;
    this.save(current);
    return current;
  }
}

