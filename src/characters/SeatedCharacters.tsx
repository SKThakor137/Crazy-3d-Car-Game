import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CarPhysics } from '../cars/CarPhysics';

export interface SeatedOccupantsProps {
  steeringAngle?: number;
  isBoosting?: boolean;
  isDrifting?: boolean;
  driftIntensity?: number;
  physicsRef?: React.MutableRefObject<CarPhysics | null>;
}

/**
 * Two seated characters visible inside the car cockpit:
 * - Driver (left seat): arms on steering wheel, turn with steering
 * - Passenger / Girlfriend (right seat): reactive animations
 */
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

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    const p = physicsRef?.current?.state;
    const steer = p ? p.steeringAngle : steeringAngle;
    const boosting = p ? p.isBoosting : isBoosting;
    const drifting = p ? p.isDrifting : isDrifting;
    const driftInt = p ? p.driftIntensity : driftIntensity;

    // Smoothly interpolate steering for driver arms
    smoothSteer.current += (steer - smoothSteer.current) * Math.min(1, 14 * dt);

    // Driver arms follow steering wheel rotation
    if (driverArmsRef.current) {
      driverArmsRef.current.rotation.z = smoothSteer.current * 0.5;
    }

    // Passenger lean during drifting
    const targetLean = drifting ? Math.sign(steer) * Math.min(0.15, driftInt * 0.12) : 0;
    smoothLean.current += (targetLean - smoothLean.current) * Math.min(1, 8 * dt);

    if (passengerTorsoRef.current) {
      passengerTorsoRef.current.rotation.z = smoothLean.current;
    }

    // Passenger fist pump when boosting
    const targetFist = boosting ? 1 : 0;
    smoothFist.current += (targetFist - smoothFist.current) * Math.min(1, 10 * dt);

    if (passengerArmRef.current) {
      passengerArmRef.current.rotation.x = -Math.PI * 0.2 - smoothFist.current * Math.PI * 0.45;
    }
  });

  const skinDriver = '#c68642';
  const skinPassenger = '#d4a76a';

  return (
    <group>
      {/* ═══════ DRIVER (Left Seat) ═══════ */}
      <group position={[-0.35, 0.55, -0.15]}>
        {/* Head with Racing Helmet */}
        <mesh position={[0, 0.32, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#222230" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Helmet visor */}
        <mesh position={[0, 0.30, 0.08]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.16, 0.06, 0.04]} />
          <meshStandardMaterial color="#0a0a1a" roughness={0.05} metalness={0.9} transparent opacity={0.85} />
        </mesh>

        {/* Torso */}
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.26, 0.3, 0.16]} />
          <meshStandardMaterial color="#1a2a4a" roughness={0.5} />
        </mesh>

        {/* Arms reaching forward to steering wheel */}
        <group ref={driverArmsRef} position={[0, 0.18, 0.12]}>
          {/* Left Arm */}
          <group position={[-0.14, 0, 0]}>
            <mesh position={[0, -0.04, 0.08]} rotation={[-0.8, 0, 0]}>
              <boxGeometry args={[0.07, 0.18, 0.07]} />
              <meshStandardMaterial color="#1a2a4a" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.06, 0.2]}>
              <sphereGeometry args={[0.035, 6, 6]} />
              <meshStandardMaterial color={skinDriver} roughness={0.5} />
            </mesh>
          </group>
          {/* Right Arm */}
          <group position={[0.14, 0, 0]}>
            <mesh position={[0, -0.04, 0.08]} rotation={[-0.8, 0, 0]}>
              <boxGeometry args={[0.07, 0.18, 0.07]} />
              <meshStandardMaterial color="#1a2a4a" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.06, 0.2]}>
              <sphereGeometry args={[0.035, 6, 6]} />
              <meshStandardMaterial color={skinDriver} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ═══════ PASSENGER / GIRLFRIEND (Right Seat) ═══════ */}
      <group position={[0.35, 0.55, -0.15]}>
        {/* Head */}
        <mesh position={[0, 0.32, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color={skinPassenger} roughness={0.6} />
        </mesh>
        {/* Hair on top */}
        <mesh position={[0, 0.4, -0.02]}>
          <boxGeometry args={[0.18, 0.06, 0.18]} />
          <meshStandardMaterial color="#2a1505" roughness={0.8} />
        </mesh>
        {/* Ponytail */}
        <mesh position={[0, 0.28, -0.12]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.06, 0.2, 0.05]} />
          <meshStandardMaterial color="#2a1505" roughness={0.8} />
        </mesh>

        {/* Torso (with lean ref) */}
        <group ref={passengerTorsoRef}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.24, 0.28, 0.15]} />
            <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
          </mesh>
        </group>

        {/* Left arm (resting on lap) */}
        <group position={[-0.14, 0.1, 0.04]}>
          <mesh rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.07, 0.16, 0.07]} />
            <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.1, 0.03]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color={skinPassenger} roughness={0.5} />
          </mesh>
        </group>

        {/* Right arm (animated fist pump when boosting) */}
        <group ref={passengerArmRef} position={[0.14, 0.18, 0.04]} rotation={[-0.2, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.07, 0.16, 0.07]} />
            <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color={skinPassenger} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
