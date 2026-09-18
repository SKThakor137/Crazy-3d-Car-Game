import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGame } from '../game/GameStateContext';
import { SoundSynth } from '../audio/SoundSynth';

// ─────────────────────────────────────────────────────────────
//  Stylized Procedural Character (Standing Pose)
// ─────────────────────────────────────────────────────────────
interface StandingFigureProps {
  gender: 'male' | 'female';
  armPose: number; // 0 = arms down, 1 = handshake extended
}

const StandingFigure: React.FC<StandingFigureProps> = ({ gender, armPose }) => {
  const isMale = gender === 'male';
  const skinColor = isMale ? '#c68642' : '#d4a76a';
  const jacketColor = isMale ? '#1a2a4a' : '#8b1a1a';
  const pantsColor = isMale ? '#1a1a2e' : '#1a1a2e';
  const hairColor = isMale ? '#1a1008' : '#2a1505';

  // Arm angle lerped by armPose (0 = idle, 1 = extended forward for handshake)
  const rightArmAngle = -Math.PI * 0.02 + armPose * (-Math.PI * 0.35);
  const rightForearmAngle = armPose * (-Math.PI * 0.2);

  return (
    <group>
      {/* HEAD */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* HAIR */}
      {isMale ? (
        <mesh position={[0, 1.65, -0.02]}>
          <boxGeometry args={[0.2, 0.08, 0.2]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 1.65, -0.02]}>
            <boxGeometry args={[0.22, 0.08, 0.22]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
          {/* Ponytail */}
          <mesh position={[0, 1.5, -0.16]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.08, 0.25, 0.06]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* TORSO */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.35, 0.38, 0.2]} />
        <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* BELT / WAIST */}
      <mesh position={[0, 1.04, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.18]} />
        <meshStandardMaterial color="#111" roughness={0.4} />
      </mesh>

      {/* LEFT ARM (always idle at side) */}
      <group position={[-0.22, 1.35, 0]}>
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.1, 0.24, 0.1]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
      </group>

      {/* RIGHT ARM (animated for handshake) */}
      <group position={[0.22, 1.35, 0]} rotation={[rightArmAngle, 0, 0]}>
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.1, 0.24, 0.1]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} />
        </mesh>
        <group position={[0, -0.24, 0]} rotation={[rightForearmAngle, 0, 0]}>
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[0.08, 0.16, 0.08]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* LEGS */}
      <group position={[-0.08, 0.72, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12, 0.36, 0.12]} />
          <meshStandardMaterial color={pantsColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.11, 0.32, 0.11]} />
          <meshStandardMaterial color={pantsColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.38, 0.02]}>
          <boxGeometry args={[0.12, 0.06, 0.18]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
      </group>
      <group position={[0.08, 0.72, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12, 0.36, 0.12]} />
          <meshStandardMaterial color={pantsColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.11, 0.32, 0.11]} />
          <meshStandardMaterial color={pantsColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.38, 0.02]}>
          <boxGeometry args={[0.12, 0.06, 0.18]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
//  3D Cutscene: Characters meet, handshake, enter the car
// ─────────────────────────────────────────────────────────────
interface PreRaceCutscene3DProps {
  carPosition: THREE.Vector3;
  carHeading: number;
}

export const PreRaceCutscene3D: React.FC<PreRaceCutscene3DProps> = ({
  carPosition,
  carHeading,
}) => {
  const { camera } = useThree();
  const { skipIntro } = useGame();
  const elapsed = useRef(0);
  const handshakePlayed = useRef(false);

  // Character positions (relative to car, animated over time)
  const riderGroupRef = useRef<THREE.Group>(null);
  const partnerGroupRef = useRef<THREE.Group>(null);
  const [armPoseRider, setArmPoseRider] = useState(0);
  const [armPosePartner, setArmPosePartner] = useState(0);
  const [visible, setVisible] = useState(true);

  // Calculate world positions relative to car
  const carFwd = new THREE.Vector3(Math.sin(carHeading), 0, Math.cos(carHeading));
  const carRight = new THREE.Vector3(carFwd.z, 0, -carFwd.x);

  // Rider starts from driver side (left), partner from passenger side (right)
  const riderStartPos = carPosition.clone()
    .add(carRight.clone().multiplyScalar(-3.5))
    .add(carFwd.clone().multiplyScalar(1.5));
  riderStartPos.y = carPosition.y;

  const partnerStartPos = carPosition.clone()
    .add(carRight.clone().multiplyScalar(3.5))
    .add(carFwd.clone().multiplyScalar(1.5));
  partnerStartPos.y = carPosition.y;

  // Meet point: in front of car hood
  const meetPoint = carPosition.clone()
    .add(carFwd.clone().multiplyScalar(3.8));
  meetPoint.y = carPosition.y;

  const TOTAL_DURATION = 7.0; // total cutscene seconds

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt;
    const t = elapsed.current;

    // Phase timings
    const WALK_END = 2.2;        // Characters walk to meet point
    const HANDSHAKE_START = 2.2;
    const HANDSHAKE_PEAK = 3.0;   // Handshake contact
    const HANDSHAKE_END = 4.2;    // Arms lower
    const ENTER_START = 4.2;
    const ENTER_END = 5.8;       // Characters "enter" car (fade/shrink)
    const TRANSITION_END = TOTAL_DURATION;

    // 1. WALK PHASE: Characters approach meet point
    if (t < WALK_END) {
      const walkProgress = Math.min(1, t / WALK_END);
      const eased = 1 - Math.pow(1 - walkProgress, 2); // ease-out

      if (riderGroupRef.current) {
        riderGroupRef.current.position.lerpVectors(riderStartPos, meetPoint.clone().add(carRight.clone().multiplyScalar(-0.3)), eased);
        riderGroupRef.current.rotation.y = carHeading + Math.PI * 0.15;
      }
      if (partnerGroupRef.current) {
        partnerGroupRef.current.position.lerpVectors(partnerStartPos, meetPoint.clone().add(carRight.clone().multiplyScalar(0.3)), eased);
        partnerGroupRef.current.rotation.y = carHeading - Math.PI * 0.15;
      }
    }

    // 2. HANDSHAKE PHASE: Arms extend and touch
    if (t >= HANDSHAKE_START && t < HANDSHAKE_END) {
      const handshakeT = (t - HANDSHAKE_START) / (HANDSHAKE_PEAK - HANDSHAKE_START);
      if (t < HANDSHAKE_PEAK) {
        const pose = Math.min(1, handshakeT);
        setArmPoseRider(pose);
        setArmPosePartner(pose);
      } else {
        // Hold then lower
        const lowerT = (t - HANDSHAKE_PEAK) / (HANDSHAKE_END - HANDSHAKE_PEAK);
        const pose = Math.max(0, 1 - lowerT);
        setArmPoseRider(pose);
        setArmPosePartner(pose);
      }

      // Play handshake sound at peak
      if (t >= HANDSHAKE_PEAK - 0.05 && !handshakePlayed.current) {
        SoundSynth.playHandshake();
        handshakePlayed.current = true;
      }
    }

    // 3. ENTER CAR PHASE: Characters walk to car sides and shrink/disappear
    if (t >= ENTER_START && t < ENTER_END) {
      const enterProgress = (t - ENTER_START) / (ENTER_END - ENTER_START);
      const eased = Math.min(1, enterProgress);

      // Rider walks to driver side
      const riderTarget = carPosition.clone().add(carRight.clone().multiplyScalar(-1.2));
      riderTarget.y = carPosition.y;
      if (riderGroupRef.current) {
        riderGroupRef.current.position.lerpVectors(
          meetPoint.clone().add(carRight.clone().multiplyScalar(-0.3)),
          riderTarget,
          eased
        );
        riderGroupRef.current.rotation.y = carHeading;
        const scale = Math.max(0.01, 1 - eased * 0.95);
        riderGroupRef.current.scale.setScalar(scale);
      }

      // Partner walks to passenger side
      const partnerTarget = carPosition.clone().add(carRight.clone().multiplyScalar(1.2));
      partnerTarget.y = carPosition.y;
      if (partnerGroupRef.current) {
        partnerGroupRef.current.position.lerpVectors(
          meetPoint.clone().add(carRight.clone().multiplyScalar(0.3)),
          partnerTarget,
          eased
        );
        partnerGroupRef.current.rotation.y = carHeading;
        const scale = Math.max(0.01, 1 - eased * 0.95);
        partnerGroupRef.current.scale.setScalar(scale);
      }
    }

    // 4. TRANSITION: Hide characters, transition to countdown
    if (t >= ENTER_END) {
      setVisible(false);
    }

    if (t >= TRANSITION_END) {
      skipIntro();
      return;
    }

    // ─── CINEMATIC CAMERA ───
    if (t < WALK_END) {
      // Orbit around the meet point showing both characters approaching
      const camAngle = carHeading + Math.PI * 0.7 - t * 0.15;
      const camDist = 5.5;
      const camHeight = 2.2;
      camera.position.set(
        meetPoint.x + Math.sin(camAngle) * camDist,
        meetPoint.y + camHeight,
        meetPoint.z + Math.cos(camAngle) * camDist
      );
      camera.lookAt(meetPoint.x, meetPoint.y + 1.2, meetPoint.z);
    } else if (t < HANDSHAKE_END) {
      // Close-up of handshake from the front
      const camAngle = carHeading + Math.PI * 0.9;
      const closeUpDist = 2.8;
      camera.position.set(
        meetPoint.x + Math.sin(camAngle) * closeUpDist,
        meetPoint.y + 1.5,
        meetPoint.z + Math.cos(camAngle) * closeUpDist
      );
      camera.lookAt(meetPoint.x, meetPoint.y + 1.2, meetPoint.z);
    } else if (t < ENTER_END) {
      // Pull back to show both characters walking to car
      const pullBackT = (t - HANDSHAKE_END) / (ENTER_END - HANDSHAKE_END);
      const camAngle = carHeading + Math.PI * 0.85 + pullBackT * 0.3;
      const camDist = 4.0 + pullBackT * 3.0;
      const camHeight = 2.0 + pullBackT * 1.0;
      camera.position.set(
        carPosition.x + Math.sin(camAngle) * camDist,
        carPosition.y + camHeight,
        carPosition.z + Math.cos(camAngle) * camDist
      );
      camera.lookAt(carPosition.x, carPosition.y + 1.0, carPosition.z);
    } else {
      // Final zoom into windshield before transition
      const finalT = (t - ENTER_END) / (TRANSITION_END - ENTER_END);
      const camDist = 6.5 - finalT * 2.5;
      camera.position.set(
        carPosition.x - Math.sin(carHeading) * camDist,
        carPosition.y + 2.5 - finalT * 0.3,
        carPosition.z - Math.cos(carHeading) * camDist
      );
      const lookTarget = carPosition.clone().add(carFwd.clone().multiplyScalar(5));
      lookTarget.y += 1.0;
      camera.lookAt(lookTarget);
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Rider (Male Driver) */}
      <group ref={riderGroupRef} position={riderStartPos.toArray()}>
        <StandingFigure gender="male" armPose={armPoseRider} />
      </group>

      {/* Partner (Female Co-pilot) */}
      <group ref={partnerGroupRef} position={partnerStartPos.toArray()}>
        <StandingFigure gender="female" armPose={armPosePartner} />
      </group>
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
//  2D Overlay: Skip Button + Dialogue Subtitles
// ─────────────────────────────────────────────────────────────
export const PreRaceCutsceneOverlay: React.FC = () => {
  const { gameState, skipIntro } = useGame();
  const [subtitle, setSubtitle] = useState('');
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (gameState !== 'INTRO_STORY') return;
    startTime.current = Date.now();

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Subtitle 1: Partner dialogue at 1.5s
    timers.push(setTimeout(() => {
      setSubtitle('"Ready to take 1st place together?"');
      setSubtitleVisible(true);
    }, 1500));

    // Hide at 2.8s
    timers.push(setTimeout(() => {
      setSubtitleVisible(false);
    }, 2800));

    // Subtitle 2: Rider response at 3.5s
    timers.push(setTimeout(() => {
      setSubtitle('"You know it. Let\'s roll!"');
      setSubtitleVisible(true);
    }, 3500));

    // Hide at 5.0s
    timers.push(setTimeout(() => {
      setSubtitleVisible(false);
    }, 5000));

    // Subtitle 3: Get in at 5.5s
    timers.push(setTimeout(() => {
      setSubtitle('🏁 Buckle up!');
      setSubtitleVisible(true);
    }, 5500));

    // Hide at 6.5s
    timers.push(setTimeout(() => {
      setSubtitleVisible(false);
    }, 6500));

    return () => timers.forEach(t => clearTimeout(t));
  }, [gameState]);

  // Handle keyboard skip
  useEffect(() => {
    if (gameState !== 'INTRO_STORY') return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        skipIntro();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, skipIntro]);

  if (gameState !== 'INTRO_STORY') return null;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between items-center p-4 md:p-8">
      {/* Skip Button (top-right) */}
      <div className="self-end pointer-events-auto">
        <button
          onClick={() => skipIntro()}
          className="arcade-glass px-5 py-2.5 rounded-full border border-cyan-400/40 text-cyan-300 font-arcade text-xs md:text-sm font-bold tracking-wider hover:bg-cyan-500/20 hover:border-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
        >
          SKIP INTRO ▸▸ (SPACE)
        </button>
      </div>

      {/* Center Subtitle */}
      <div className="flex-1 flex items-end justify-center pb-12 md:pb-16">
        {subtitleVisible && (
          <div className="arcade-glass px-6 py-3 rounded-2xl border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.6)] max-w-lg text-center animate-fade-in">
            <span className="font-arcade text-base md:text-lg text-white/95 tracking-wide leading-relaxed">
              {subtitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

