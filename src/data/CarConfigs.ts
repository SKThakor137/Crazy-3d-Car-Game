export interface CarConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'Balanced' | 'Muscle' | 'Hypercar';
  stats: {
    speed: number;        // 1 - 100
    acceleration: number; // 1 - 100
    handling: number;     // 1 - 100
    nitro: number;        // 1 - 100
  };
  physics: {
    topSpeed: number;        // units/sec (e.g. 52 = ~190 km/h)
    reverseSpeed: number;
    accelerationRate: number;
    brakingRate: number;
    steerAngleMax: number;
    turnSpeed: number;
    driftSlipFactor: number;
    gripRecovery: number;
    nitroMultiplier: number;
    mass: number;
  };
  availableColors: string[];
  defaultColor: string;
  unlockedByDefault: boolean;
}

export const CARS_DATA: Record<string, CarConfig> = {
  'apex-gt': {
    id: 'apex-gt',
    name: 'APEX GT',
    subtitle: 'Aero Sports Coupe',
    description: 'Perfect aerodynamic balance with razor-sharp responsive cornering and high top speed.',
    category: 'Balanced',
    stats: {
      speed: 82,
      acceleration: 85,
      handling: 88,
      nitro: 80,
    },
    physics: {
      topSpeed: 52,
      reverseSpeed: 18,
      accelerationRate: 32,
      brakingRate: 48,
      steerAngleMax: 0.58,
      turnSpeed: 3.2,
      driftSlipFactor: 0.88,
      gripRecovery: 4.2,
      nitroMultiplier: 1.45,
      mass: 1250,
    },
    availableColors: ['#00f0ff', '#ff0055', '#ffaa00', '#ffffff', '#1a1a24', '#00ff88'],
    defaultColor: '#00f0ff',
    unlockedByDefault: true,
  },
  'viper-x': {
    id: 'viper-x',
    name: 'VIPER X',
    subtitle: 'V8 Widebody Muscle',
    description: 'Raw brute force. Dominates straightaways with monstrous acceleration and explosive nitro.',
    category: 'Muscle',
    stats: {
      speed: 94,
      acceleration: 92,
      handling: 70,
      nitro: 95,
    },
    physics: {
      topSpeed: 60,
      reverseSpeed: 20,
      accelerationRate: 38,
      brakingRate: 40,
      steerAngleMax: 0.50,
      turnSpeed: 2.6,
      driftSlipFactor: 0.94,
      gripRecovery: 3.4,
      nitroMultiplier: 1.6,
      mass: 1550,
    },
    availableColors: ['#ff8400', '#ff0033', '#111116', '#ffdd00', '#4a00e0', '#2ecc71'],
    defaultColor: '#ff8400',
    unlockedByDefault: true,
  },
  'phantom-rs': {
    id: 'phantom-rs',
    name: 'PHANTOM RS',
    subtitle: 'Carbon Hypercar',
    description: 'Extreme lightweight downforce technology. Clings to apexes and accelerates like lightning.',
    category: 'Hypercar',
    stats: {
      speed: 90,
      acceleration: 96,
      handling: 98,
      nitro: 85,
    },
    physics: {
      topSpeed: 56,
      reverseSpeed: 22,
      accelerationRate: 42,
      brakingRate: 55,
      steerAngleMax: 0.65,
      turnSpeed: 3.8,
      driftSlipFactor: 0.80,
      gripRecovery: 5.2,
      nitroMultiplier: 1.5,
      mass: 1100,
    },
    availableColors: ['#ff0077', '#00e5ff', '#7928ca', '#f5f5f7', '#101010', '#00ff66'],
    defaultColor: '#ff0077',
    unlockedByDefault: true,
  },
};

export const DEFAULT_CAR_ID = 'apex-gt';

