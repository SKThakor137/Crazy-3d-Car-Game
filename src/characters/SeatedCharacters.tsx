import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CarPhysics } from '../cars/CarPhysics';
import {
  createMaleFaceTexture,
  createFemaleFaceTexture,
  createJacketTexture,
} from '../textures/ProceduralTextures';

export interface SeatedOccupantsProps {
  steeringAngle?: number;
  isBoosting?: boolean;
  isDrifting?: boolean;
  driftIntensity?: number;
  physicsRef?: React.MutableRefObject<CarPhysics | null>;
}

export const SeatedOccupants: React.FC<SeatedOccupantsProps> = ({
  steeringAngle = 0,
  isBoosting = false,
  isDrifting = false,
  driftIntensity = 0,
  physicsRef,
}) => {
  const driverArmsRef = useRef<THREE.Group>(null);
  const passengerTorsoRef = useRef<THREE.Group>(null);
  const passengerArmRef = useRef<THREE.Group>(null);

  const smoothSteer = useRef(0);
  const smoothLean = useRef(0);
  const smoothFist = useRef(0);

  // Generate textures for realistic seated occupants
  const maleFaceTex = useMemo(() => createMaleFaceTexture(), []);
  const femaleFaceTex = useMemo(() => createFemaleFaceTexture(), []);
  const driverJacketTex = useMemo(() => createJacketTexture('#1e293b', true), []);
  const passengerJacketTex = useMemo(() => createJacketTexture('#be123c', false), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.getElapsedTime();

    const p = physicsRef?.current?.state;
    const steer = p ? p.steeringAngle : steeringAngle;
    const boosting = p ? p.isBoosting : isBoosting;
    const drifting = p ? p.isDrifting : isDrifting;
    const driftInt = p ? p.driftIntensity : driftIntensity;

    // Driver arms steer dynamically with steering wheel
    smoothSteer.current += (steer - smoothSteer.current) * Math.min(1, 14 * dt);
    if (driverArmsRef.current) {
      driverArmsRef.current.rotation.z = smoothSteer.current * 0.55;
    }

    // Passenger dynamic lean during cornering & drifting
    const targetLean = drifting ? Math.sign(steer) * Math.min(0.18, driftInt * 0.15) : 0;
    smoothLean.current += (targetLean - smoothLean.current) * Math.min(1, 8 * dt);
    if (passengerTorsoRef.current) {
      passengerTorsoRef.current.rotation.z = smoothLean.current + Math.sin(time * 3) * 0.008;
    }

    // Passenger celebration fist pump when boosting
    const targetFist = boosting ? 1 : 0;
    smoothFist.current += (targetFist - smoothFist.current) * Math.min(1, 10 * dt);
    if (passengerArmRef.current) {
      passengerArmRef.current.rotation.x = -Math.PI * 0.15 - smoothFist.current * Math.PI * 0.55;
      passengerArmRef.current.rotation.z = smoothFist.current * 0.2;
    }
  });

  const skinMale = '#c58c65';
  const skinFemale = '#e8b896';
  const hairFemale = '#29180e';

  return (
    <group>
      {/* ════════════════════════════════════════════════════════════
          DRIVER: RIDER (Left Seat at X = -0.35, Y = 0.52, Z = -0.15)
          ════════════════════════════════════════════════════════════ */}
      <group position={[-0.35, 0.52, -0.15]}>
        {/* Torso in Leather Racing Jacket */}
        <mesh castShadow position={[0, 0.14, 0]} rotation={[0.08, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.14, 0.32, 16]} />
          <meshStandardMaterial map={driverJacketTex} roughness={0.4} metalness={0.15} />
        </mesh>

        {/* Head with Realistic Face & Aviator Sunglasses */}
        <group position={[0, 0.38, 0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial color={skinMale} roughness={0.6} />
          </mesh>
          {/* Face Texture Decal */}
          <mesh position={[0, 0, 0.105]}>
            <planeGeometry args={[0.17, 0.17]} />
            <meshStandardMaterial map={maleFaceTex} transparent roughness={0.35} />
          </mesh>
          {/* Styled Racing Helmet / Hair */}
          <mesh position={[0, 0.05, -0.01]} castShadow>
            <sphereGeometry args={[0.112, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
        </group>

        {/* Racing Driver Arms Gripping the Steering Wheel */}
        <group ref={driverArmsRef} position={[0, 0.22, 0.12]}>
          {/* Left Arm & Biker Glove */}
          <group position={[-0.14, 0, 0]}>
            <mesh position={[0, -0.05, 0.08]} rotation={[-0.75, 0.15, 0]}>
              <cylinderGeometry args={[0.042, 0.038, 0.2, 10]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
            {/* Glove gripping wheel */}
            <mesh position={[0.02, -0.11, 0.18]}>
              <sphereGeometry args={[0.038, 10, 10]} />
              <meshStandardMaterial color="#09090b" roughness={0.5} />
            </mesh>
          </group>

          {/* Right Arm & Biker Glove */}
          <group position={[0.14, 0, 0]}>
            <mesh position={[0, -0.05, 0.08]} rotation={[-0.75, -0.15, 0]}>
              <cylinderGeometry args={[0.042, 0.038, 0.2, 10]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
            {/* Glove gripping wheel */}
            <mesh position={[-0.02, -0.11, 0.18]}>
              <sphereGeometry args={[0.038, 10, 10]} />
              <meshStandardMaterial color="#09090b" roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ════════════════════════════════════════════════════════════
          PASSENGER: GIRLFRIEND (Right Seat at X = 0.35, Y = 0.52, Z = -0.15)
          ════════════════════════════════════════════════════════════ */}
      <group position={[0.35, 0.52, -0.15]}>
        <group ref={passengerTorsoRef}>
          {/* Torso in Cropped Biker Jacket */}
          <mesh castShadow position={[0, 0.13, 0]} rotation={[0.05, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.12, 0.3, 16]} />
            <meshStandardMaterial map={passengerJacketTex} roughness={0.4} metalness={0.15} />
          </mesh>

          {/* Feminine Head with Beautiful Realistic Face & Ponytail */}
          <group position={[0, 0.36, 0.02]}>
            <mesh castShadow>
              <sphereGeometry args={[0.105, 16, 16]} />
              <meshStandardMaterial color={skinFemale} roughness={0.5} />
            </mesh>
            {/* Realistic Face Texture */}
            <mesh position={[0, 0, 0.1]}>
              <planeGeometry args={[0.16, 0.16]} />
              <meshStandardMaterial map={femaleFaceTex} transparent roughness={0.3} />
            </mesh>
            {/* 3D Styled Ponytail Hair */}
            <group position={[0, 0.04, -0.01]}>
              <mesh castShadow>
                <sphereGeometry args={[0.108, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                <meshStandardMaterial color={hairFemale} roughness={0.8} />
              </mesh>
              {/* Ponytail Scrunchie */}
              <mesh position={[0, 0.05, -0.11]}>
                <torusGeometry args={[0.025, 0.012, 8, 14]} />
                <meshStandardMaterial color="#f43f5e" />
              </mesh>
              {/* Flowing Ponytail Tail */}
              <mesh position={[0, -0.06, -0.15]} rotation={[0.4, 0, 0]}>
                <cylinderGeometry args={[0.028, 0.05, 0.22, 10]} />
                <meshStandardMaterial color={hairFemale} roughness={0.8} />
              </mesh>
              {/* Gold Earrings */}
              <mesh position={[-0.105, -0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.016, 0.003, 6, 12]} />
                <meshPhysicalMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
              </mesh>
              <mesh position={[0.105, -0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.016, 0.003, 6, 12]} />
                <meshPhysicalMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
              </mesh>
            </group>
          </group>

          {/* Left Arm (Relaxed) */}
          <group position={[-0.14, 0.18, 0.05]}>
            <mesh position={[0, -0.06, 0.04]} rotation={[-0.4, 0.1, 0]}>
              <cylinderGeometry args={[0.038, 0.032, 0.18, 10]} />
              <meshStandardMaterial color="#be123c" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.13, 0.08]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color={skinFemale} roughness={0.5} />
            </mesh>
          </group>

          {/* Right Arm (Celebration Fist Pump when Boosting!) */}
          <group ref={passengerArmRef} position={[0.14, 0.18, 0.05]}>
            <mesh position={[0, -0.06, 0.04]}>
              <cylinderGeometry args={[0.038, 0.032, 0.18, 10]} />
              <meshStandardMaterial color="#be123c" roughness={0.4} />
            </mesh>
            {/* Clenched celebratory fist */}
            <mesh position={[0, -0.13, 0.08]}>
              <sphereGeometry args={[0.034, 8, 8]} />
              <meshStandardMaterial color={skinFemale} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
