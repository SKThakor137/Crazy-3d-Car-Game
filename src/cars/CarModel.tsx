import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CarConfig } from '../data/CarConfigs';

import { CarPhysics } from './CarPhysics';
import { SeatedOccupants } from '../characters/SeatedCharacters';

interface CarModelProps {
  config: CarConfig;
  color: string;
  isBraking?: boolean;
  isReversing?: boolean;
  isBoosting?: boolean;
  steeringAngle?: number;  // radians for front wheels
  wheelRotationSpeed?: number;
  physicsRef?: React.MutableRefObject<CarPhysics | null>;
  isDrifting?: boolean;
  driftIntensity?: number;
}

export const CarModel: React.FC<CarModelProps> = ({
  config,
  color,
  isBraking = false,
  isReversing = false,
  isBoosting = false,
  steeringAngle = 0,
  wheelRotationSpeed = 0,
  physicsRef,
  isDrifting = false,
  driftIntensity = 0,
}) => {
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);
  const tailLightMatLRef = useRef<THREE.MeshStandardMaterial>(null);
  const tailLightMatRRef = useRef<THREE.MeshStandardMaterial>(null);
  const nitroFlamesGroupRef = useRef<THREE.Group>(null);
  const reverseLightsGroupRef = useRef<THREE.Group>(null);

  const wheelSpinRef = useRef(0);

  // Soft ambient occlusion contact shadow beneath the car chassis
  const contactShadowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 128, 15, 64, 128, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Animate wheel rotation and reactive visual states
  useFrame((_, delta) => {
    const p = physicsRef?.current?.state;
    const steer = p ? p.steeringAngle : steeringAngle;
    const spinSpeed = p ? p.speed * 2.8 : wheelRotationSpeed;
    const braking = p ? p.isBraking : isBraking;
    const boosting = p ? p.isBoosting : isBoosting;
    const reversing = p ? p.isReversing : isReversing;

    wheelSpinRef.current += spinSpeed * delta;

    if (frontLeftWheelRef.current && frontRightWheelRef.current) {
      frontLeftWheelRef.current.rotation.y = steer;
      frontRightWheelRef.current.rotation.y = steer;

      const flMesh = frontLeftWheelRef.current.children[0];
      const frMesh = frontRightWheelRef.current.children[0];
      if (flMesh) flMesh.rotation.x = wheelSpinRef.current;
      if (frMesh) frMesh.rotation.x = wheelSpinRef.current;
    }

    if (rearLeftWheelRef.current && rearRightWheelRef.current) {
      const rlMesh = rearLeftWheelRef.current.children[0];
      const rrMesh = rearRightWheelRef.current.children[0];
      if (rlMesh) rlMesh.rotation.x = wheelSpinRef.current;
      if (rrMesh) rrMesh.rotation.x = wheelSpinRef.current;
    }

    if (tailLightMatLRef.current && tailLightMatRRef.current) {
      const intensity = braking ? 4.0 : 1.2;
      tailLightMatLRef.current.emissiveIntensity = intensity;
      tailLightMatRRef.current.emissiveIntensity = intensity;
    }

    if (nitroFlamesGroupRef.current) {
      nitroFlamesGroupRef.current.visible = boosting;
      if (boosting) {
        nitroFlamesGroupRef.current.scale.set(
          0.9 + Math.random() * 0.25,
          0.9 + Math.random() * 0.25,
          0.85 + Math.random() * 0.35
        );
      }
    }

    if (reverseLightsGroupRef.current) {
      reverseLightsGroupRef.current.visible = reversing;
    }
  });

  const isMuscle = config.id === 'viper-x';
  const isHyper = config.id === 'phantom-rs';

  return (
    <group>
      {/* --- SOFT AMBIENT OCCLUSION UNDERBODY CONTACT SHADOW --- */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.3, 4.6]} />
        <meshBasicMaterial
          map={contactShadowTexture}
          transparent
          opacity={0.82}
          depthWrite={false}
        />
      </mesh>

      {/* --- CHASSIS / MAIN BODY --- */}
      <group position={[0, 0.45, 0]}>
        {/* Central Cabin Core Chassis */}
        <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[isMuscle ? 1.78 : 1.7, 0.35, isHyper ? 4.3 : 4.1]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>

        {/* ─── SCULPTED FLARED WHEEL ARCHES / WIDEBODY FENDERS ─── */}
        {/* Front Left Fender Flare (Over Front-Left Tire) */}
        <group position={[-0.88, 0.18, 1.3]}>
          <mesh castShadow receiveShadow position={[-0.1, 0.12, 0]}>
            <boxGeometry args={[0.22, 0.16, 0.88]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} clearcoatRoughness={0.06} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.1, 0.0, 0.4]}>
            <boxGeometry args={[0.2, 0.28, 0.2]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.1, 0.0, -0.4]}>
            <boxGeometry args={[0.2, 0.28, 0.2]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
        </group>

        {/* Front Right Fender Flare (Over Front-Right Tire) */}
        <group position={[0.88, 0.18, 1.3]}>
          <mesh castShadow receiveShadow position={[0.1, 0.12, 0]}>
            <boxGeometry args={[0.22, 0.16, 0.88]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} clearcoatRoughness={0.06} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.1, 0.0, 0.4]}>
            <boxGeometry args={[0.2, 0.28, 0.2]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.1, 0.0, -0.4]}>
            <boxGeometry args={[0.2, 0.28, 0.2]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
        </group>

        {/* Rear Left Widebody Quarter Panel (Over Rear-Left Tire) */}
        <group position={[-0.9, 0.2, -1.3]}>
          <mesh castShadow receiveShadow position={[-0.11, 0.14, 0]}>
            <boxGeometry args={[0.24, 0.18, 0.96]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} clearcoatRoughness={0.06} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.11, 0.0, 0.44]}>
            <boxGeometry args={[0.22, 0.3, 0.22]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.11, 0.0, -0.44]}>
            <boxGeometry args={[0.22, 0.3, 0.22]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
        </group>

        {/* Rear Right Widebody Quarter Panel (Over Rear-Right Tire) */}
        <group position={[0.9, 0.2, -1.3]}>
          <mesh castShadow receiveShadow position={[0.11, 0.14, 0]}>
            <boxGeometry args={[0.24, 0.18, 0.96]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} clearcoatRoughness={0.06} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.11, 0.0, 0.44]}>
            <boxGeometry args={[0.22, 0.3, 0.22]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.11, 0.0, -0.44]}>
            <boxGeometry args={[0.22, 0.3, 0.22]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
        </group>

        {/* Carbon Aerodynamic Side Skirts (Rocker Panels) */}
        <mesh position={[-0.92, -0.06, 0]}>
          <boxGeometry args={[0.12, 0.06, 1.7]} />
          <meshStandardMaterial color="#0f0f13" roughness={0.35} metalness={0.8} />
        </mesh>
        <mesh position={[0.92, -0.06, 0]}>
          <boxGeometry args={[0.12, 0.06, 1.7]} />
          <meshStandardMaterial color="#0f0f13" roughness={0.35} metalness={0.8} />
        </mesh>

        {/* Side Air Intake Scoops (Behind doors, feeding rear brakes) */}
        <mesh position={[-0.88, 0.2, -0.65]}>
          <boxGeometry args={[0.08, 0.16, 0.32]} />
          <meshStandardMaterial color="#0a0a0d" roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh position={[0.88, 0.2, -0.65]}>
          <boxGeometry args={[0.08, 0.16, 0.32]} />
          <meshStandardMaterial color="#0a0a0d" roughness={0.6} metalness={0.5} />
        </mesh>

        {/* Aerodynamic Door Handles */}
        <mesh position={[-0.86, 0.32, 0.02]}>
          <boxGeometry args={[0.03, 0.04, 0.16]} />
          <meshStandardMaterial color="#1a1a1f" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.86, 0.32, 0.02]}>
          <boxGeometry args={[0.03, 0.04, 0.16]} />
          <meshStandardMaterial color="#1a1a1f" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Nose / Front Bumper Structure */}
        <mesh castShadow receiveShadow position={[0, 0.06, 1.96]}>
          <boxGeometry args={[isMuscle ? 1.95 : 1.82, 0.26, 0.46]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>

        {/* Center Honeycomb Radiator Grille */}
        <mesh position={[0, 0.09, 2.2]}>
          <boxGeometry args={[1.05, 0.18, 0.04]} />
          <meshStandardMaterial color="#08080a" roughness={0.85} metalness={0.3} />
        </mesh>
        {/* Grille Chrome Emblem / Badge */}
        <mesh position={[0, 0.12, 2.23]}>
          <boxGeometry args={[0.1, 0.05, 0.02]} />
          <meshPhysicalMaterial color="#ffffff" metalness={0.98} roughness={0.08} clearcoat={1.0} />
        </mesh>

        {/* Lower Center Air Intake */}
        <mesh position={[0, -0.04, 2.2]}>
          <boxGeometry args={[1.2, 0.08, 0.04]} />
          <meshStandardMaterial color="#08080a" roughness={0.85} metalness={0.3} />
        </mesh>

        {/* Left & Right Brake Cooling Air Intakes */}
        <mesh position={[-0.68, 0.04, 2.2]}>
          <boxGeometry args={[0.26, 0.14, 0.04]} />
          <meshStandardMaterial color="#08080a" roughness={0.85} metalness={0.3} />
        </mesh>
        <mesh position={[0.68, 0.04, 2.2]}>
          <boxGeometry args={[0.26, 0.14, 0.04]} />
          <meshStandardMaterial color="#08080a" roughness={0.85} metalness={0.3} />
        </mesh>

        {/* Front Splitter with Corner Aerodynamic Winglets */}
        <mesh position={[0, -0.06, 2.14]}>
          <boxGeometry args={[isMuscle ? 2.1 : 1.96, 0.05, 0.44]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-1.02, -0.01, 2.18]}>
          <boxGeometry args={[0.04, 0.08, 0.2]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[1.02, -0.01, 2.18]}>
          <boxGeometry args={[0.04, 0.08, 0.2]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Dual Front Carbon Dive Plane Canards */}
        <mesh position={[-0.98, 0.07, 2.05]} rotation={[0, 0.2, 0.12]}>
          <boxGeometry args={[0.18, 0.02, 0.14]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.98, 0.07, 2.05]} rotation={[0, -0.2, -0.12]}>
          <boxGeometry args={[0.18, 0.02, 0.14]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Sculpted Hood with Power Taper */}
        <mesh castShadow receiveShadow position={[0, 0.26, 1.1]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[isMuscle ? 1.84 : 1.72, 0.18, 1.58]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>

        {/* Hood Dual Power Crease Lines */}
        <mesh position={[-0.42, 0.36, 1.05]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[0.035, 0.025, 1.3]} />
          <meshPhysicalMaterial color={color} metalness={0.92} roughness={0.12} clearcoat={1.0} envMapIntensity={1.3} />
        </mesh>
        <mesh position={[0.42, 0.36, 1.05]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[0.035, 0.025, 1.3]} />
          <meshPhysicalMaterial color={color} metalness={0.92} roughness={0.12} clearcoat={1.0} envMapIntensity={1.3} />
        </mesh>

        {/* Hood Carbon Heat Extraction Vents */}
        <mesh position={[-0.24, 0.36, 1.15]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[0.16, 0.02, 0.38]} />
          <meshStandardMaterial color="#0e0e12" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0.24, 0.36, 1.15]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[0.16, 0.02, 0.38]} />
          <meshStandardMaterial color="#0e0e12" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Muscle Hood Scoop (Viper X only) */}
        {isMuscle && (
          <mesh castShadow position={[0, 0.4, 0.9]}>
            <boxGeometry args={[0.7, 0.16, 0.8]} />
            <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.7} />
          </mesh>
        )}

        {/* ─── COCKPIT INTERIOR & SEATING ─── */}
        {/* Interior Tub / Floor */}
        <mesh position={[0, 0.08, -0.1]}>
          <boxGeometry args={[isMuscle ? 1.55 : 1.4, 0.08, 1.7]} />
          <meshStandardMaterial color="#121216" roughness={0.8} />
        </mesh>

        {/* Dashboard */}
        <mesh position={[0, 0.42, 0.45]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[isMuscle ? 1.5 : 1.35, 0.22, 0.35]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.5} />
        </mesh>
        {/* Dashboard Digital HUD Instrument Cluster */}
        <mesh position={[-0.35, 0.48, 0.42]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.22, 0.08, 0.02]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        {/* Steering Wheel Rim */}
        <mesh position={[-0.35, 0.45, 0.32]} rotation={[0.45, 0, 0]}>
          <torusGeometry args={[0.11, 0.02, 8, 16]} />
          <meshStandardMaterial color="#222" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Driver Racing Bucket Seat (Left) */}
        <group position={[-0.35, 0, 0]}>
          <mesh position={[0, 0.18, -0.15]}>
            <boxGeometry args={[0.38, 0.12, 0.4]} />
            <meshStandardMaterial color="#181822" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.46, -0.32]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.36, 0.52, 0.1]} />
            <meshStandardMaterial color="#181822" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.74, -0.38]}>
            <boxGeometry args={[0.22, 0.14, 0.08]} />
            <meshStandardMaterial color="#ff0033" roughness={0.4} />
          </mesh>
        </group>

        {/* Passenger Racing Bucket Seat (Right) */}
        <group position={[0.35, 0, 0]}>
          <mesh position={[0, 0.18, -0.15]}>
            <boxGeometry args={[0.38, 0.12, 0.4]} />
            <meshStandardMaterial color="#181822" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.46, -0.32]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.36, 0.52, 0.1]} />
            <meshStandardMaterial color="#181822" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.74, -0.38]}>
            <boxGeometry args={[0.22, 0.14, 0.08]} />
            <meshStandardMaterial color="#ff0033" roughness={0.4} />
          </mesh>
        </group>

        {/* ─── SEATED OCCUPANTS (RIDER & GIRLFRIEND) ─── */}
        <SeatedOccupants
          physicsRef={physicsRef}
          steeringAngle={steeringAngle}
          isBoosting={isBoosting}
          isDrifting={isDrifting}
          driftIntensity={driftIntensity}
        />

        {/* ─── CABIN ROOF & PILLARS ─── */}
        {/* Roof Top Panel */}
        <mesh
          castShadow
          position={[0, isHyper ? 0.72 : 0.82, isHyper ? -0.22 : -0.12]}
        >
          <boxGeometry args={[isMuscle ? 1.5 : 1.38, 0.06, isHyper ? 1.25 : 1.15]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>

        {/* Left & Right A-Pillars (Front Frame) */}
        <mesh position={[-0.68, 0.58, 0.35]} rotation={[-0.45, 0, 0.1]}>
          <boxGeometry args={[0.07, 0.65, 0.07]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>
        <mesh position={[0.68, 0.58, 0.35]} rotation={[-0.45, 0, -0.1]}>
          <boxGeometry args={[0.07, 0.65, 0.07]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>

        {/* Left & Right C-Pillars (Rear Frame) */}
        <mesh position={[-0.68, 0.58, -0.65]} rotation={[0.45, 0, -0.1]}>
          <boxGeometry args={[0.07, 0.65, 0.07]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>
        <mesh position={[0.68, 0.58, -0.65]} rotation={[0.45, 0, 0.1]}>
          <boxGeometry args={[0.07, 0.65, 0.07]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>

        {/* Roof Shark Fin Antenna */}
        <mesh position={[0, isHyper ? 0.77 : 0.87, isHyper ? -0.7 : -0.6]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.16]} />
          <meshStandardMaterial color="#0e0e12" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* ─── AERODYNAMIC DOOR SIDE MIRRORS ─── */}
        {/* Left Side Mirror (Driver) */}
        <group position={[-0.82, 0.54, 0.38]}>
          {/* Stalk */}
          <mesh position={[-0.06, 0.01, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.12, 0.03, 0.04]} />
            <meshStandardMaterial color="#141418" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Housing */}
          <mesh position={[-0.14, 0.04, -0.02]} rotation={[0, 0.15, 0]}>
            <boxGeometry args={[0.18, 0.1, 0.14]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
          {/* Chrome Reflective Mirror Glass (Facing Rearward) */}
          <mesh position={[-0.14, 0.04, -0.095]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.15, 0.08]} />
            <meshStandardMaterial color="#f0f8ff" metalness={0.98} roughness={0.04} envMapIntensity={1.8} />
          </mesh>
        </group>

        {/* Right Side Mirror (Passenger) */}
        <group position={[0.82, 0.54, 0.38]}>
          {/* Stalk */}
          <mesh position={[0.06, 0.01, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.12, 0.03, 0.04]} />
            <meshStandardMaterial color="#141418" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Housing */}
          <mesh position={[0.14, 0.04, -0.02]} rotation={[0, -0.15, 0]}>
            <boxGeometry args={[0.18, 0.1, 0.14]} />
            <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.15} clearcoat={1.0} envMapIntensity={1.3} />
          </mesh>
          {/* Chrome Reflective Mirror Glass (Facing Rearward) */}
          <mesh position={[0.14, 0.04, -0.095]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.15, 0.08]} />
            <meshStandardMaterial color="#f0f8ff" metalness={0.98} roughness={0.04} envMapIntensity={1.8} />
          </mesh>
        </group>

        {/* ─── CRYSTAL-CLEAR TINTED WINDOWS ─── */}
        {/* Windshield (Front Glass - Clear View of Driver & Passenger) */}
        <mesh
          position={[0, isHyper ? 0.54 : 0.64, isHyper ? 0.65 : 0.62]}
          rotation={[-0.55, 0, 0]}
        >
          <planeGeometry args={[isMuscle ? 1.42 : 1.32, 0.8]} />
          <meshStandardMaterial
            color="#c0e4f8"
            roughness={0.05}
            metalness={0.88}
            transparent
            opacity={0.3}
            depthWrite={false}
            side={THREE.DoubleSide}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Rear Window */}
        <mesh
          position={[0, isHyper ? 0.54 : 0.64, isHyper ? -0.95 : -0.85]}
          rotation={[0.55, Math.PI, 0]}
        >
          <planeGeometry args={[isMuscle ? 1.38 : 1.28, 0.7]} />
          <meshStandardMaterial
            color="#c0e4f8"
            roughness={0.05}
            metalness={0.88}
            transparent
            opacity={0.3}
            depthWrite={false}
            side={THREE.DoubleSide}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Side Windows (Left & Right) */}
        <mesh position={[-0.72, 0.62, -0.12]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.25, 0.42]} />
          <meshStandardMaterial
            color="#c0e4f8"
            roughness={0.05}
            metalness={0.88}
            transparent
            opacity={0.26}
            depthWrite={false}
            side={THREE.DoubleSide}
            envMapIntensity={1.5}
          />
        </mesh>
        <mesh position={[0.72, 0.62, -0.12]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.25, 0.42]} />
          <meshStandardMaterial
            color="#c0e4f8"
            roughness={0.05}
            metalness={0.88}
            transparent
            opacity={0.26}
            depthWrite={false}
            side={THREE.DoubleSide}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Rear Trunk / Deck */}
        <mesh castShadow receiveShadow position={[0, 0.3, -1.6]}>
          <boxGeometry args={[isMuscle ? 1.95 : 1.8, 0.32, 1.2]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.88}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            envMapIntensity={1.3}
          />
        </mesh>

        {/* Rear Diffuser Base */}
        <mesh position={[0, -0.06, -2.15]}>
          <boxGeometry args={[1.94, 0.18, 0.32]} />
          <meshStandardMaterial color="#0c0c10" roughness={0.35} metalness={0.8} />
        </mesh>

        {/* 4 Vertical Aerodynamic Diffuser Fins */}
        {[-0.45, -0.15, 0.15, 0.45].map((xVal, fIdx) => (
          <mesh key={`diff-fin-${fIdx}`} position={[xVal, -0.08, -2.17]}>
            <boxGeometry args={[0.03, 0.16, 0.28]} />
            <meshStandardMaterial color="#0a0a0e" roughness={0.3} metalness={0.9} />
          </mesh>
        ))}

        {/* Rear License Plate Recessed Housing */}
        <mesh position={[0, 0.14, -2.2]}>
          <boxGeometry args={[0.48, 0.18, 0.04]} />
          <meshStandardMaterial color="#0d0d10" roughness={0.7} />
        </mesh>
        {/* License Plate */}
        <mesh position={[0, 0.14, -2.225]}>
          <planeGeometry args={[0.42, 0.14]} />
          <meshStandardMaterial color="#fafaf9" roughness={0.4} />
        </mesh>

        {/* Rear Spoiler / Wing */}
        <group position={[0, 0.65, -1.9]}>
          {/* Spoiler upright mounts */}
          <mesh position={[-0.6, -0.15, 0]}>
            <boxGeometry args={[0.06, 0.35, 0.2]} />
            <meshStandardMaterial color="#151515" metalness={0.9} />
          </mesh>
          <mesh position={[0.6, -0.15, 0]}>
            <boxGeometry args={[0.06, 0.35, 0.2]} />
            <meshStandardMaterial color="#151515" metalness={0.9} />
          </mesh>
          {/* Spoiler blade */}
          <mesh castShadow position={[0, 0.05, 0]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[isHyper ? 2.2 : isMuscle ? 2.0 : 1.85, 0.06, 0.45]} />
            <meshPhysicalMaterial
              color="#111115"
              metalness={0.85}
              roughness={0.2}
              clearcoat={0.9}
              clearcoatRoughness={0.1}
            />
          </mesh>
        </group>

        {/* --- LIGHTS --- */}
        {/* Front Xenon / LED Projector Headlights with Glowing DRL Brow */}
        <group position={[-0.72, 0.16, 2.12]}>
          <mesh>
            <boxGeometry args={[0.35, 0.12, 0.08]} />
            <meshStandardMaterial
              color="#e6ffff"
              emissive="#e6ffff"
              emissiveIntensity={3.2}
            />
          </mesh>
          {/* LED DRL Eyebrow Strip */}
          <mesh position={[0, 0.07, 0.04]}>
            <boxGeometry args={[0.36, 0.025, 0.02]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
          {/* Projector Glass Lens */}
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.7} transparent opacity={0.35} />
          </mesh>
        </group>
        <group position={[0.72, 0.16, 2.12]}>
          <mesh>
            <boxGeometry args={[0.35, 0.12, 0.08]} />
            <meshStandardMaterial
              color="#e6ffff"
              emissive="#e6ffff"
              emissiveIntensity={3.2}
            />
          </mesh>
          {/* LED DRL Eyebrow Strip */}
          <mesh position={[0, 0.07, 0.04]}>
            <boxGeometry args={[0.36, 0.025, 0.02]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
          {/* Projector Glass Lens */}
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.7} transparent opacity={0.35} />
          </mesh>
        </group>

        {/* Rear Taillights */}
        <mesh position={[-0.7, 0.25, -2.18]}>
          <boxGeometry args={[0.4, 0.12, 0.08]} />
          <meshStandardMaterial
            ref={tailLightMatLRef}
            color="#ff0033"
            emissive="#ff0033"
            emissiveIntensity={isBraking ? 4.0 : 1.2}
          />
        </mesh>
        <mesh position={[0.7, 0.25, -2.18]}>
          <boxGeometry args={[0.4, 0.12, 0.08]} />
          <meshStandardMaterial
            ref={tailLightMatRRef}
            color="#ff0033"
            emissive="#ff0033"
            emissiveIntensity={isBraking ? 4.0 : 1.2}
          />
        </mesh>

        {/* Reverse Lights */}
        <group ref={reverseLightsGroupRef} visible={isReversing}>
          <mesh position={[-0.35, 0.25, -2.18]}>
            <boxGeometry args={[0.15, 0.08, 0.06]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.35, 0.25, -2.18]}>
            <boxGeometry args={[0.15, 0.08, 0.06]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
          </mesh>
        </group>

        {/* Quad Chrome Exhaust System */}
        <group position={[0, -0.04, -2.2]}>
          {/* Left Dual Tips */}
          <mesh position={[-0.6, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.07, 0.16, 16]} />
            <meshPhysicalMaterial color="#ffffff" metalness={0.98} roughness={0.08} clearcoat={1.0} />
          </mesh>
          <mesh position={[-0.46, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.07, 0.16, 16]} />
            <meshPhysicalMaterial color="#ffffff" metalness={0.98} roughness={0.08} clearcoat={1.0} />
          </mesh>

          {/* Right Dual Tips */}
          <mesh position={[0.46, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.07, 0.16, 16]} />
            <meshPhysicalMaterial color="#ffffff" metalness={0.98} roughness={0.08} clearcoat={1.0} />
          </mesh>
          <mesh position={[0.6, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.07, 0.16, 16]} />
            <meshPhysicalMaterial color="#ffffff" metalness={0.98} roughness={0.08} clearcoat={1.0} />
          </mesh>

          {/* Nitro Flames (Active when boosting) */}
          <group ref={nitroFlamesGroupRef} visible={isBoosting}>
            <mesh position={[-0.53, 0, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.16, 0.8, 8]} />
              <meshBasicMaterial color="#00f0ff" />
            </mesh>
            <mesh position={[0.53, 0, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.16, 0.8, 8]} />
              <meshBasicMaterial color="#00f0ff" />
            </mesh>
          </group>
        </group>
      </group>

      {/* --- WHEELS (4 CORNERS) --- */}
      {/* Front Left */}
      <group ref={frontLeftWheelRef} position={[-0.98, 0.35, 1.3]}>
        <WheelMesh isLeft={true} />
      </group>

      {/* Front Right */}
      <group ref={frontRightWheelRef} position={[0.98, 0.35, 1.3]}>
        <WheelMesh isLeft={false} />
      </group>

      {/* Rear Left */}
      <group ref={rearLeftWheelRef} position={[-0.98, 0.35, -1.3]}>
        <WheelMesh isLeft={true} />
      </group>

      {/* Rear Right */}
      <group ref={rearRightWheelRef} position={[0.98, 0.35, -1.3]}>
        <WheelMesh isLeft={false} />
      </group>
    </group>
  );
};

// Reusable Wheel Component with Rubber Tire, Deep-Dish 5-Spoke Alloy Rim, Lug Nuts, and Drilled Brake Rotor
const WheelMesh: React.FC<{ isLeft: boolean }> = ({ isLeft }) => {
  return (
    <group>
      {/* Inner Wheel Well Dark Liner (creates realistic occluded depth behind the wheel) */}
      <mesh position={[isLeft ? 0.15 : -0.15, 0.05, 0]}>
        <boxGeometry args={[0.08, 0.74, 0.76]} />
        <meshBasicMaterial color="#08080a" />
      </mesh>

      {/* Wheel spin group */}
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Rubber Tire with Tread Profile */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.32, 24]} />
          <meshStandardMaterial color="#111113" roughness={0.88} />
        </mesh>

        {/* Deep-Dish Stepped Outer Wheel Rim Lip */}
        <mesh position={[0, isLeft ? -0.08 : 0.08, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.18, 24]} />
          <meshPhysicalMaterial color="#e4e4e7" metalness={0.94} roughness={0.1} clearcoat={0.95} />
        </mesh>

        {/* 5-Spoke Sport Alloy Pattern */}
        {[0, 72, 144, 216, 288].map((deg, sIdx) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh
              key={sIdx}
              position={[Math.cos(rad) * 0.11, isLeft ? -0.15 : 0.15, Math.sin(rad) * 0.11]}
              rotation={[0, 0, rad]}
            >
              <boxGeometry args={[0.045, 0.03, 0.16]} />
              <meshPhysicalMaterial color="#e4e4e7" metalness={0.92} roughness={0.15} clearcoat={0.8} />
            </mesh>
          );
        })}

        {/* Center Chrome Hub Cap */}
        <mesh position={[0, isLeft ? -0.16 : 0.16, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.02, 16]} />
          <meshPhysicalMaterial color="#f4f4f5" metalness={0.98} roughness={0.08} clearcoat={1.0} />
        </mesh>

        {/* 5 Chrome Lug Nuts */}
        {[0, 72, 144, 216, 288].map((deg, lIdx) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh
              key={`lug-${lIdx}`}
              position={[Math.cos(rad) * 0.035, isLeft ? -0.162 : 0.162, Math.sin(rad) * 0.035]}
            >
              <cylinderGeometry args={[0.008, 0.008, 0.015, 6]} />
              <meshStandardMaterial color="#ffffff" metalness={0.98} roughness={0.1} />
            </mesh>
          );
        })}

        {/* Cross-Drilled Steel Brake Rotor */}
        <mesh position={[0, isLeft ? 0.04 : -0.04, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.03, 20]} />
          <meshStandardMaterial color="#a1a1aa" metalness={0.96} roughness={0.18} />
        </mesh>

        {/* High-Performance Brake Caliper (Brembo Racing Red) */}
        <mesh position={[0.13, isLeft ? 0.045 : -0.045, 0]}>
          <boxGeometry args={[0.11, 0.07, 0.13]} />
          <meshStandardMaterial color="#e11d48" roughness={0.25} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
};
