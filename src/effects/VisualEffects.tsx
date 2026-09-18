import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

import { CarPhysics } from '../cars/CarPhysics';

interface VisualEffectsProps {
  physicsRef?: React.MutableRefObject<CarPhysics | null>;
  carPosition?: THREE.Vector3;
  carHeading?: number;
  carSpeed?: number;
  isDrifting?: boolean;
  driftIntensity?: number;
  isBoosting?: boolean;
  hasCollided?: boolean;
}

const MAX_SKID_POINTS = 160;
const MAX_SMOKE_PARTICLES = 50;
const MAX_HAZARD_PARTICLES = 40;

export const VisualEffects: React.FC<VisualEffectsProps> = ({
  physicsRef,
  carPosition: propPos,
  carHeading: propHeading = 0,
  carSpeed: propSpeed = 0,
  isDrifting: propDrifting = false,
  driftIntensity: propDriftInt = 0,
  isBoosting: propBoosting = false,
  hasCollided: propCollided = false,
}) => {
  // --- Dynamic Skid Marks Line Segments ---
  const skidPositions = useMemo(() => new Float32Array(MAX_SKID_POINTS * 3), []);
  const skidGeoRef = useRef<THREE.BufferGeometry>(null);
  const skidCount = useRef(0);
  const lastSkidPos = useRef(new THREE.Vector3());

  // --- Tire Smoke Particles ---
  const smokeParticles = useRef<
    Array<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number; scale: number }>
  >([]);
  const smokePointsRef = useRef<THREE.Points>(null);
  const smokePositions = useMemo(() => new Float32Array(MAX_SMOKE_PARTICLES * 3), []);
  const smokeSizes = useMemo(() => new Float32Array(MAX_SMOKE_PARTICLES), []);

  // --- Water Splash Particles ---
  const splashParticles = useRef<
    Array<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }>
  >([]);
  const splashPointsRef = useRef<THREE.Points>(null);
  const splashPositions = useMemo(() => new Float32Array(MAX_HAZARD_PARTICLES * 3), []);

  // --- Mud Splatter Particles ---
  const mudParticles = useRef<
    Array<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number }>
  >([]);
  const mudPointsRef = useRef<THREE.Points>(null);
  const mudPositions = useMemo(() => new Float32Array(MAX_HAZARD_PARTICLES * 3), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    const p = physicsRef?.current?.state;
    const carPosition = p ? p.position : propPos;
    const carHeading = p ? p.heading : propHeading;
    const carSpeed = p ? p.speed : propSpeed;
    const isDrifting = p ? p.isDrifting : propDrifting;
    const driftIntensity = p ? p.driftIntensity : propDriftInt;
    const isBoosting = p ? p.isBoosting : propBoosting;
    const isWater = p ? p.isWaterHazard : false;
    const isMud = p ? p.isMudHazard : false;

    if (!carPosition) return;

    // 1. Skid marks calculation
    if (isDrifting && Math.abs(carSpeed) > 12) {
      const distFromLast = carPosition.distanceTo(lastSkidPos.current);
      if (distFromLast > 1.2) {
        lastSkidPos.current.copy(carPosition);

        // Place skid mark behind car
        const behindX = carPosition.x - Math.sin(carHeading) * 1.3;
        const behindZ = carPosition.z - Math.cos(carHeading) * 1.3;
        const y = carPosition.y + 0.06;

        const idx = (skidCount.current % (MAX_SKID_POINTS / 2)) * 6;
        // Left wheel mark
        const normalX = Math.cos(carHeading);
        const normalZ = -Math.sin(carHeading);

        skidPositions[idx] = behindX - normalX * 0.8;
        skidPositions[idx + 1] = y;
        skidPositions[idx + 2] = behindZ - normalZ * 0.8;

        // Right wheel mark
        skidPositions[idx + 3] = behindX + normalX * 0.8;
        skidPositions[idx + 4] = y;
        skidPositions[idx + 5] = behindZ + normalZ * 0.8;

        skidCount.current++;
        if (skidGeoRef.current) {
          skidGeoRef.current.attributes.position.needsUpdate = true;
        }
      }
    }

    // 2. Emit Smoke Particles
    if ((isDrifting && driftIntensity > 0.2) || (isBoosting && Math.abs(carSpeed) > 10)) {
      if (smokeParticles.current.length < MAX_SMOKE_PARTICLES) {
        const behindX = carPosition.x - Math.sin(carHeading) * 1.6 + (Math.random() - 0.5) * 1.2;
        const behindZ = carPosition.z - Math.cos(carHeading) * 1.6 + (Math.random() - 0.5) * 1.2;

        smokeParticles.current.push({
          pos: new THREE.Vector3(behindX, carPosition.y + 0.3, behindZ),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 1.5,
            1.2 + Math.random() * 2.0,
            (Math.random() - 0.5) * 1.5
          ),
          life: 0,
          maxLife: 0.6 + Math.random() * 0.4,
          scale: 0.8 + Math.random() * 0.8,
        });
      }
    }

    // 3. Emit Water Splash Particles
    if (isWater && Math.abs(carSpeed) > 8) {
      if (splashParticles.current.length < MAX_HAZARD_PARTICLES) {
        splashParticles.current.push({
          pos: new THREE.Vector3(
            carPosition.x + (Math.random() - 0.5) * 2.2,
            carPosition.y + 0.1,
            carPosition.z + (Math.random() - 0.5) * 2.2
          ),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 3.5,
            2.5 + Math.random() * 3.5,
            (Math.random() - 0.5) * 3.5
          ),
          life: 0,
          maxLife: 0.4 + Math.random() * 0.25,
        });
      }
    }

    // 4. Emit Mud Splatter Particles
    if (isMud && Math.abs(carSpeed) > 6) {
      if (mudParticles.current.length < MAX_HAZARD_PARTICLES) {
        mudParticles.current.push({
          pos: new THREE.Vector3(
            carPosition.x - Math.sin(carHeading) * 1.4 + (Math.random() - 0.5) * 1.6,
            carPosition.y + 0.1,
            carPosition.z - Math.cos(carHeading) * 1.4 + (Math.random() - 0.5) * 1.6
          ),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 2.5,
            1.8 + Math.random() * 2.5,
            (Math.random() - 0.5) * 2.5
          ),
          life: 0,
          maxLife: 0.45 + Math.random() * 0.25,
        });
      }
    }

    // Update Smoke Particles
    for (let i = smokeParticles.current.length - 1; i >= 0; i--) {
      const sp = smokeParticles.current[i];
      sp.life += dt;
      if (sp.life >= sp.maxLife) {
        smokeParticles.current.splice(i, 1);
      } else {
        sp.pos.addScaledVector(sp.vel, dt);
      }
    }

    // Update Water Splash Particles
    for (let i = splashParticles.current.length - 1; i >= 0; i--) {
      const wp = splashParticles.current[i];
      wp.life += dt;
      if (wp.life >= wp.maxLife) {
        splashParticles.current.splice(i, 1);
      } else {
        wp.pos.addScaledVector(wp.vel, dt);
        wp.vel.y -= 9.8 * dt; // gravity
      }
    }

    // Update Mud Splatter Particles
    for (let i = mudParticles.current.length - 1; i >= 0; i--) {
      const mp = mudParticles.current[i];
      mp.life += dt;
      if (mp.life >= mp.maxLife) {
        mudParticles.current.splice(i, 1);
      } else {
        mp.pos.addScaledVector(mp.vel, dt);
        mp.vel.y -= 9.8 * dt;
      }
    }

    // Write buffer arrays
    for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
      if (i < smokeParticles.current.length) {
        const sp = smokeParticles.current[i];
        smokePositions[i * 3] = sp.pos.x;
        smokePositions[i * 3 + 1] = sp.pos.y;
        smokePositions[i * 3 + 2] = sp.pos.z;
        smokeSizes[i] = sp.scale * (1 - sp.life / sp.maxLife) * 14;
      } else {
        smokePositions[i * 3 + 1] = -9999;
        smokeSizes[i] = 0;
      }
    }

    for (let i = 0; i < MAX_HAZARD_PARTICLES; i++) {
      if (i < splashParticles.current.length) {
        const wp = splashParticles.current[i];
        splashPositions[i * 3] = wp.pos.x;
        splashPositions[i * 3 + 1] = wp.pos.y;
        splashPositions[i * 3 + 2] = wp.pos.z;
      } else {
        splashPositions[i * 3 + 1] = -9999;
      }

      if (i < mudParticles.current.length) {
        const mp = mudParticles.current[i];
        mudPositions[i * 3] = mp.pos.x;
        mudPositions[i * 3 + 1] = mp.pos.y;
        mudPositions[i * 3 + 2] = mp.pos.z;
      } else {
        mudPositions[i * 3 + 1] = -9999;
      }
    }

    if (smokePointsRef.current) {
      smokePointsRef.current.geometry.attributes.position.needsUpdate = true;
      smokePointsRef.current.geometry.attributes.size.needsUpdate = true;
    }
    if (splashPointsRef.current) {
      splashPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (mudPointsRef.current) {
      mudPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Skid Marks Line Points */}
      <points>
        <bufferGeometry ref={skidGeoRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[skidPositions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          color="#111116"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* Smoke Particles */}
      <points ref={smokePointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[smokePositions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[smokeSizes, 1]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#e0e0e0"
          transparent
          opacity={0.35}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Water Splash Particles */}
      <points ref={splashPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[splashPositions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.8}
          color="#70d6ff"
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </points>

      {/* Mud Splatter Particles */}
      <points ref={mudPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[mudPositions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          size={2.2}
          color="#422a14"
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
