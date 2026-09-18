export interface TrackConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  theme: 'beach' | 'forest' | 'canyon' | 'adventure';
  difficulty: 'Beginner' | 'Intermediate' | 'Expert';
  laps: number;
  lengthMeters: number;
  roadWidth: number;
  sunPosition: [number, number, number];
  sunColor: string;
  ambientColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  skyBackground: string;
  roadColor: string;
  kerbPrimaryColor: string;
  kerbSecondaryColor: string;
  groundColor: string;
  barrierColor: string;
  controlPoints: [number, number, number][];
}

export const TRACKS_DATA: Record<string, TrackConfig> = {
  'tropical-beach': {
    id: 'tropical-beach',
    name: 'PARADISE ADVENTURE SAFARI',
    subtitle: 'Mega Jumps, River Rapids, Mud & Crystal Cavern',
    description: 'The ultimate extreme expedition: launch off massive ramps over deep canyons, race past wild elephants and giraffes, splash through rushing river rapids, blast through mud bogs, and rocket through the glowing crystal mountain cave!',
    theme: 'adventure',
    difficulty: 'Beginner',
    laps: 3,
    lengthMeters: 4200,
    roadWidth: 14.5,
    sunPosition: [80, 120, 70],
    sunColor: '#fff5e0',
    ambientColor: '#d6c29b',
    ambientIntensity: 1.8,
    fogColor: '#dfbe92',
    fogNear: 160,
    fogFar: 650,
    skyBackground: '#5bb8f5',
    roadColor: '#3a332a',
    kerbPrimaryColor: '#ff9900',
    kerbSecondaryColor: '#ffffff',
    groundColor: '#bfa075',
    barrierColor: '#e0c080',
    controlPoints: [
      // ── START ZONE ──
      [0, 0, 0],              // Safari starting gantry
      [0, 1, -90],             // Opening straight
      [10, 3, -170],           // Gentle uphill bend

      // ── MEGA RAMP 1 ── (~t 0.10-0.16)
      [40, 10, -250],          // Steep ramp climb
      [80, 20, -310],          // MEGA JUMP 1: Canyon launch!
      [140, 8, -350],          // Landing zone — big air drop

      // ── SAVANNAH ANIMALS ZONE 1 ──
      [210, 5, -330],          // Savannah entrance (elephants)
      [280, 3, -280],          // Giraffe waterhole bend
      [330, 2, -210],          // Animal run straight

      // ── RIVER CROSSING (PANI) ── (~t 0.28-0.40)
      [350, 0, -130],          // River approach descent
      [340, -1.5, -50],        // RIVER ENTRY: Water splash!
      [300, -1.2, 20],         // Deep rapids — rocks & spray
      [250, -0.8, 70],         // River exit shallow bend
      [200, 0, 110],           // Riverbank exit uphill

      // ── MUD BOG (KICHAD) ── (~t 0.48-0.58)
      [140, 1, 150],           // Mud trail approach
      [70, 0.5, 180],          // MUD BOG: Thick mud zone!
      [10, 1, 210],            // Mud chicane exit

      // ── MOUNTAIN CLIMB ──
      [-60, 5, 230],           // Mountain foothills
      [-130, 12, 220],         // Steep mountain climb
      [-190, 18, 190],         // High altitude ridge

      // ── CRYSTAL CAVE (CAVE) ── (~t 0.68-0.82)
      [-240, 24, 140],         // CAVE ENTRY: Crystal mountain arch
      [-280, 28, 80],          // Deep crystal tunnel — glowing neon
      [-300, 32, 10],          // MOUNTAIN SUMMIT (+32m peak!)
      [-280, 26, -60],         // Cave exit — daylight

      // ── MEGA RAMP 2 / ROLLERCOASTER DROP ── (~t 0.82-0.88)
      [-240, 18, -120],        // ROLLERCOASTER DROP: Steep descent!
      [-180, 8, -160],         // MEGA JUMP 2: Mountain drop launch!
      [-120, 2, -140],         // High-speed landing zone

      // ── RETURN STRAIGHT ──
      [-70, 1, -100],          // S-curve through savannah
      [-30, 0, -40],           // Final straight into finish gantry
    ],
  },
  'emerald-forest': {
    id: 'emerald-forest',
    name: 'EMERALD PINE FOREST',
    subtitle: 'Highland Mountain Run',
    description: 'Speed through dense evergreen pine groves, lush mountain valleys, rolling green hills, and rustic wooden fences.',
    theme: 'forest',
    difficulty: 'Intermediate',
    laps: 3,
    lengthMeters: 2350,
    roadWidth: 14,
    sunPosition: [60, 110, -50],
    sunColor: '#fffae8',
    ambientColor: '#bde4a7',
    ambientIntensity: 1.7,
    fogColor: '#a8d5ba',
    fogNear: 150,
    fogFar: 550,
    skyBackground: '#5cacee',
    roadColor: '#2b2d30',
    kerbPrimaryColor: '#ffcc00',
    kerbSecondaryColor: '#ffffff',
    groundColor: '#3a662e', // lush dark green grass
    barrierColor: '#8a5d3b', // rustic wooden timber guardrails
    controlPoints: [
      [0, 0, 0],
      [0, 1, -100],
      [35, 4, -180],
      [90, 8, -240],      // Mountain climb
      [170, 12, -230],    // Highland ridge
      [220, 10, -160],    // Alpine forest drop
      [200, 6, -80],      // Valley pass
      [150, 3, 0],        // Pine grove straight
      [120, 2, 70],       // S-curve through trees
      [80, 4, 130],       // Hilltop clearing
      [10, 5, 170],       // Forest apex
      [-50, 3, 140],      // Meadow downhill
      [-90, 1, 70],       // Final forest straight
      [-50, 0, 20],
    ],
  },
  'canyon-oasis': {
    id: 'canyon-oasis',
    name: 'RED ROCK CANYON',
    subtitle: 'Desert Oasis Expressway',
    description: 'Dramatic open-sky raceway carved between red sandstone monuments with a winding canyon river and desert oasis.',
    theme: 'canyon',
    difficulty: 'Expert',
    laps: 3,
    lengthMeters: 2400,
    roadWidth: 13.5,
    sunPosition: [-90, 80, -40],
    sunColor: '#ffd9aa',
    ambientColor: '#6e4526',
    ambientIntensity: 1.5,
    fogColor: '#d68f58',
    fogNear: 140,
    fogFar: 500,
    skyBackground: '#f28c38',
    roadColor: '#262220',
    kerbPrimaryColor: '#ff6600',
    kerbSecondaryColor: '#222222',
    groundColor: '#a0522d',
    barrierColor: '#d2b48c',
    controlPoints: [
      [0, 0, 0],
      [0, 0, -110],
      [40, 2, -190],
      [100, 6, -240],
      [170, 5, -210],
      [140, 2, -140],
      [70, 0, -90],
      [100, 3, -30],
      [170, 7, 30],
      [190, 8, 110],
      [130, 6, 170],
      [40, 3, 180],
      [-50, 1, 130],
      [-80, 0, 60],
      [-40, 0, 10],
    ],
  },
  'extreme-adventure': {
    id: 'extreme-adventure',
    name: 'ULTIMATE ADVENTURE SAFARI',
    subtitle: 'Mega Jumps, River Rapids, Mud & Crystal Cavern',
    description: 'The ultimate extreme expedition: launch off massive ramps over deep canyons, race past wild elephants and giraffes, splash through rushing river rapids, blast through mud bogs, and rocket through the glowing crystal mountain cave!',
    theme: 'adventure',
    difficulty: 'Expert',
    laps: 3,
    lengthMeters: 4200,
    roadWidth: 14.5,
    sunPosition: [80, 120, 70],
    sunColor: '#fff5e0',
    ambientColor: '#d6c29b',
    ambientIntensity: 1.8,
    fogColor: '#dfbe92',
    fogNear: 160,
    fogFar: 650,
    skyBackground: '#5bb8f5',
    roadColor: '#3a332a',
    kerbPrimaryColor: '#ff9900',
    kerbSecondaryColor: '#ffffff',
    groundColor: '#bfa075',
    barrierColor: '#e0c080',
    controlPoints: [
      // ── START ZONE ──
      [0, 0, 0],              // Safari starting gantry
      [0, 1, -90],             // Opening straight
      [10, 3, -170],           // Gentle uphill bend

      // ── MEGA RAMP 1 ── (~t 0.10-0.16)
      [40, 10, -250],          // Steep ramp climb
      [80, 20, -310],          // MEGA JUMP 1: Canyon launch!
      [140, 8, -350],          // Landing zone — big air drop

      // ── SAVANNAH ANIMALS ZONE 1 ──
      [210, 5, -330],          // Savannah entrance (elephants)
      [280, 3, -280],          // Giraffe waterhole bend
      [330, 2, -210],          // Animal run straight

      // ── RIVER CROSSING (PANI) ── (~t 0.28-0.40)
      [350, 0, -130],          // River approach descent
      [340, -1.5, -50],        // RIVER ENTRY: Water splash!
      [300, -1.2, 20],         // Deep rapids — rocks & spray
      [250, -0.8, 70],         // River exit shallow bend
      [200, 0, 110],           // Riverbank exit uphill

      // ── MUD BOG (KICHAD) ── (~t 0.48-0.58)
      [140, 1, 150],           // Mud trail approach
      [70, 0.5, 180],          // MUD BOG: Thick mud zone!
      [10, 1, 210],            // Mud chicane exit

      // ── MOUNTAIN CLIMB ──
      [-60, 5, 230],           // Mountain foothills
      [-130, 12, 220],         // Steep mountain climb
      [-190, 18, 190],         // High altitude ridge

      // ── CRYSTAL CAVE (CAVE) ── (~t 0.68-0.82)
      [-240, 24, 140],         // CAVE ENTRY: Crystal mountain arch
      [-280, 28, 80],          // Deep crystal tunnel — glowing neon
      [-300, 32, 10],          // MOUNTAIN SUMMIT (+32m peak!)
      [-280, 26, -60],         // Cave exit — daylight

      // ── MEGA RAMP 2 / ROLLERCOASTER DROP ── (~t 0.82-0.88)
      [-240, 18, -120],        // ROLLERCOASTER DROP: Steep descent!
      [-180, 8, -160],         // MEGA JUMP 2: Mountain drop launch!
      [-120, 2, -140],         // High-speed landing zone

      // ── RETURN STRAIGHT ──
      [-70, 1, -100],          // S-curve through savannah
      [-30, 0, -40],           // Final straight into finish gantry
    ],
  },
};

export const DEFAULT_TRACK_ID = 'tropical-beach';
