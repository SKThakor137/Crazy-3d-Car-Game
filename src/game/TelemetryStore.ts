export interface RaceTelemetryData {
  speedKmH: number;
  rpmRatio: number;
  gear: number | string;
  nitro: number;          // 0 to 100
  lap: number;
  totalLaps: number;
  position: number;       // 1 to 6
  totalRacers: number;
  raceTime: number;
  bestLapTime: number;
  lastLapTime: number;
  wrongWay: boolean;
  countdown: number;      // 3, 2, 1, 0 (GO)
}

export interface RacerProgressData {
  id: string;
  name: string;
  isPlayer: boolean;
  carId: string;
  color: string;
  lap: number;
  splineT: number;        // 0 to 1 along circuit
  totalDistance: number;  // lap + splineT
  currentLapTime: number;
  bestLapTime: number;
  finished: boolean;
  finishTime: number;
}

const DEFAULT_TELEMETRY: RaceTelemetryData = {
  speedKmH: 0,
  rpmRatio: 0,
  gear: 'N',
  nitro: 100,
  lap: 1,
  totalLaps: 3,
  position: 6,
  totalRacers: 6,
  raceTime: 0,
  bestLapTime: 0,
  lastLapTime: 0,
  wrongWay: false,
  countdown: 3,
};

type TelemetryListener = (telemetry: RaceTelemetryData) => void;
type RacersListener = (racers: RacerProgressData[]) => void;

export class TelemetryStore {
  public static current: RaceTelemetryData = { ...DEFAULT_TELEMETRY };
  public static racers: RacerProgressData[] = [];

  private static telemetryListeners = new Set<TelemetryListener>();
  private static racersListeners = new Set<RacersListener>();
  private static lastNotifyTime = 0;

  public static reset(totalLaps = 3): void {
    this.current = {
      ...DEFAULT_TELEMETRY,
      totalLaps,
      gear: 1,
    };
    this.racers = [];
    this.notifyTelemetry();
    this.notifyRacers();
  }

  public static updateTelemetry(patch: Partial<RaceTelemetryData>): void {
    Object.assign(this.current, patch);
  }

  public static setRacers(racers: RacerProgressData[]): void {
    this.racers = racers;
  }

  // Throttled notification (at max 15 times/sec) to avoid React thrashing
  public static tickNotification(): void {
    const now = performance.now();
    if (now - this.lastNotifyTime >= 66) { // ~15 FPS UI update is silky smooth for numbers
      this.lastNotifyTime = now;
      this.notifyTelemetry();
      this.notifyRacers();
    }
  }

  public static subscribeTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    listener(this.current);
    return () => this.telemetryListeners.delete(listener);
  }

  public static subscribeRacers(listener: RacersListener): () => void {
    this.racersListeners.add(listener);
    listener(this.racers);
    return () => this.racersListeners.delete(listener);
  }

  private static notifyTelemetry(): void {
    const data = { ...this.current };
    this.telemetryListeners.forEach(listener => listener(data));
  }

  private static notifyRacers(): void {
    const data = [...this.racers];
    this.racersListeners.forEach(listener => listener(data));
  }
}

