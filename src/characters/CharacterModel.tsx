import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface StandingCharacterProps {
  gender: 'male' | 'female';
  position?: [number, number, number];
  rotation?: [number, number, number];
  armPose?: 'idle' | 'handshake' | 'wave' | 'thumbsup';
  animationProgress?: number; // 0 to 1 for arm animation interpolation
}

interface ArmJointRotations {
  shoulder: [number, number, number];
  elbow: [number, number, number];
  hand: [number, number, number];
}

// Preset rotations for each pose
const ARM_POSES: Record<'idle' | 'handshake' | 'wave' | 'thumbsup', ArmJointRotations> = {
  idle: {
    shoulder: [0, 0, -0.08],
    elbow: [0.12, 0, 0],
    hand: [0, 0, 0],
  },
  handshake: {
    // Right arm extended forward at ~45 degrees, hand at waist height
    shoulder: [-Math.PI / 4, -0.22, -0.05],
    elbow: [0.35, 0, 0],
    hand: [0.1, 0.35, 0],
  },
  wave: {
    // Right arm raised overhead
    shoulder: [-0.25, 0, -2.6],
    elbow: [-0.3, 0, 0.6],
    hand: [0, 0, 0],
  },
  thumbsup: {
    // Right arm forward with fist
    shoulder: [-1.3, -0.2, 0.08],
    elbow: [-0.75, 0, 0],
    hand: [0.2, 0.4, 0],
  },
};

export const StandingCharacter: React.FC<StandingCharacterProps> = ({
  gender,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  armPose = 'idle',
  animationProgress,
}) => {
  const isMale = gender === 'male';

  // Refs for hierarchical arm rigging & dynamic animations
  const rightShoulderRef = useRef<THREE.Group>(null);
  const rightElbowRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const rightThumbRef = useRef<THREE.Mesh>(null);
  const leftShoulderRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  // Colors based on gender specifications
  // Male: darker skin tone, dark blue jacket (#1a2a4a), short dark hair
  // Female: slightly lighter skin tone, crimson red jacket (#8b1a1a), ponytail hair
  const skinColor = isMale ? '#96603d' : '#e5ad89';
  const jacketColor = isMale ? '#1a2a4a' : '#8b1a1a';
  const pantsColor = isMale ? '#1b1e2b' : '#22242f';
  const shoesColor = '#18181c';
  const hairColor = isMale ? '#18181b' : '#281710';
  const accentColor = isMale ? '#00f0ff' : '#ffffff';

  // Shoulder separation width
  const shoulderX = isMale ? 0.23 : 0.2;

  // Frame animation for pose interpolation and lively idle movement
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Determine target progress (0 to 1)
    const effectiveProgress = Math.max(
      0,
      Math.min(
        1,
        animationProgress !== undefined
          ? animationProgress
          : armPose === 'idle'
          ? 0
          : 1
      )
    );

    const idlePose = ARM_POSES.idle;
    const targetPose = ARM_POSES[armPose];

    // Lerp base joint angles between idle and target pose
    const targetShoulderX = THREE.MathUtils.lerp(
      idlePose.shoulder[0],
      targetPose.shoulder[0],
      effectiveProgress
    );
    const targetShoulderY = THREE.MathUtils.lerp(
      idlePose.shoulder[1],
      targetPose.shoulder[1],
      effectiveProgress
    );
    const targetShoulderZ = THREE.MathUtils.lerp(
      idlePose.shoulder[2],
      targetPose.shoulder[2],
      effectiveProgress
    );

    let targetElbowX = THREE.MathUtils.lerp(
      idlePose.elbow[0],
      targetPose.elbow[0],
      effectiveProgress
    );
    const targetElbowY = THREE.MathUtils.lerp(
      idlePose.elbow[1],
      targetPose.elbow[1],
      effectiveProgress
    );
    let targetElbowZ = THREE.MathUtils.lerp(
      idlePose.elbow[2],
      targetPose.elbow[2],
      effectiveProgress
    );

    const targetHandX = THREE.MathUtils.lerp(
      idlePose.hand[0],
      targetPose.hand[0],
      effectiveProgress
    );
    const targetHandY = THREE.MathUtils.lerp(
      idlePose.hand[1],
      targetPose.hand[1],
      effectiveProgress
    );
    const targetHandZ = THREE.MathUtils.lerp(
      idlePose.hand[2],
      targetPose.hand[2],
      effectiveProgress
    );

    // Dynamic wave oscillation when waving
    if (armPose === 'wave' && effectiveProgress > 0.1) {
      const waveOscillation = Math.sin(time * 8) * 0.32 * effectiveProgress;
      targetElbowZ += waveOscillation;
    }

    // Apply smooth frame dampening to right arm joints
    if (rightShoulderRef.current) {
      rightShoulderRef.current.rotation.x = THREE.MathUtils.damp(
        rightShoulderRef.current.rotation.x,
        targetShoulderX,
        14,
        delta
      );
      rightShoulderRef.current.rotation.y = THREE.MathUtils.damp(
        rightShoulderRef.current.rotation.y,
        targetShoulderY,
        14,
        delta
      );
      rightShoulderRef.current.rotation.z = THREE.MathUtils.damp(
        rightShoulderRef.current.rotation.z,
        targetShoulderZ,
        14,
        delta
      );
    }

    if (rightElbowRef.current) {
      rightElbowRef.current.rotation.x = THREE.MathUtils.damp(
        rightElbowRef.current.rotation.x,
        targetElbowX,
        14,
        delta
      );
      rightElbowRef.current.rotation.y = THREE.MathUtils.damp(
        rightElbowRef.current.rotation.y,
        targetElbowY,
        14,
        delta
      );
      rightElbowRef.current.rotation.z = THREE.MathUtils.damp(
        rightElbowRef.current.rotation.z,
        targetElbowZ,
        14,
        delta
      );
    }

    if (rightHandRef.current) {
      rightHandRef.current.rotation.x = THREE.MathUtils.damp(
        rightHandRef.current.rotation.x,
        targetHandX,
        14,
        delta
      );
      rightHandRef.current.rotation.y = THREE.MathUtils.damp(
        rightHandRef.current.rotation.y,
        targetHandY,
        14,
        delta
      );
      rightHandRef.current.rotation.z = THREE.MathUtils.damp(
        rightHandRef.current.rotation.z,
        targetHandZ,
        14,
        delta
      );
    }

    // Dynamic thumb appearance for thumbs up
    if (rightThumbRef.current) {
      const thumbTargetScale = armPose === 'thumbsup' ? effectiveProgress : 0;
      rightThumbRef.current.scale.setScalar(
        THREE.MathUtils.damp(rightThumbRef.current.scale.x, thumbTargetScale, 12, delta)
      );
    }

    // Subtle breathing animation for arcade life-like feel
    const breath = Math.sin(time * 2.2) * 0.012;
    if (torsoRef.current) {
      torsoRef.current.position.y = 1.19 + breath * 0.25;
    }
    if (leftShoulderRef.current) {
      leftShoulderRef.current.rotation.z = 0.08 + breath * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* ===================================================
          FEET & SHOES (~0.00 to 0.08)
          =================================================== */}
      {/* Left Shoe */}
      <group position={[-0.12, 0.04, 0.03]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.11, 0.08, 0.22]} />
          <meshStandardMaterial color={shoesColor} roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Shoe Sole Accent */}
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[0.114, 0.02, 0.224]} />
          <meshStandardMaterial color="#2d3139" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Shoe */}
      <group position={[0.12, 0.04, 0.03]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.11, 0.08, 0.22]} />
          <meshStandardMaterial color={shoesColor} roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Shoe Sole Accent */}
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[0.114, 0.02, 0.224]} />
          <meshStandardMaterial color="#2d3139" roughness={0.9} />
        </mesh>
      </group>

      {/* ===================================================
          LEGS (SHINS + THIGHS) (~0.08 to 0.88)
          =================================================== */}
      {/* Left Shin */}
      <mesh castShadow position={[-0.12, 0.28, 0]}>
        <cylinderGeometry args={[0.048, 0.042, 0.4, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Right Shin */}
      <mesh castShadow position={[0.12, 0.28, 0]}>
        <cylinderGeometry args={[0.048, 0.042, 0.4, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Left Knee Joint */}
      <mesh castShadow position={[-0.12, 0.48, 0]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Right Knee Joint */}
      <mesh castShadow position={[0.12, 0.48, 0]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Left Thigh */}
      <mesh castShadow position={[-0.12, 0.68, 0]}>
        <cylinderGeometry args={[0.062, 0.052, 0.4, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Right Thigh */}
      <mesh castShadow position={[0.12, 0.68, 0]}>
        <cylinderGeometry args={[0.062, 0.052, 0.4, 8]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* ===================================================
          PELVIS & BELT (~0.88 to 1.00)
          =================================================== */}
      <mesh castShadow position={[0, 0.94, 0]}>
        <boxGeometry args={[0.34, 0.12, 0.22]} />
        <meshStandardMaterial color={pantsColor} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.99, 0]}>
        <boxGeometry args={[0.35, 0.035, 0.23]} />
        <meshStandardMaterial color="#111115" roughness={0.5} />
      </mesh>

      {/* Belt Buckle */}
      <mesh position={[0, 0.99, 0.117]}>
        <boxGeometry args={[0.06, 0.045, 0.02]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ===================================================
          TORSO / RACING JACKET & UPPER BODY (~1.00 to 1.72)
          =================================================== */}
      <group ref={torsoRef} position={[0, 1.19, 0]}>
        {/* Main Torso Box */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[isMale ? 0.38 : 0.34, 0.38, isMale ? 0.24 : 0.22]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.2} />
        </mesh>

        {/* Jacket Zipper Line */}
        <mesh position={[0, 0, (isMale ? 0.24 : 0.22) / 2 + 0.005]}>
          <boxGeometry args={[0.02, 0.38, 0.015]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Racing Jacket Stripe Accent */}
        <mesh position={[0.08, 0.06, (isMale ? 0.24 : 0.22) / 2 + 0.006]}>
          <boxGeometry args={[0.03, 0.26, 0.015]} />
          <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Jacket Collar */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.18]} />
          <meshStandardMaterial color={jacketColor} roughness={0.6} />
        </mesh>

        {/* Neck */}
        <mesh castShadow position={[0, 0.23, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 0.07, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.8} />
        </mesh>

        {/* Head Sphere (radius ~0.14) */}
        <group position={[0, 0.37, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* Ears */}
          <mesh position={[-0.14, 0, 0]}>
            <sphereGeometry args={[0.028, 6, 6]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>
          <mesh position={[0.14, 0, 0]}>
            <sphereGeometry args={[0.028, 6, 6]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* Stylized Arcade Racing Sunglasses / Visor */}
          <mesh position={[0, 0.02, 0.12]}>
            <boxGeometry args={[0.22, 0.05, 0.05]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* ---------------- HAIR STYLES ---------------- */}
          {isMale ? (
            /* Male: Short dark box on top */
            <group>
              <mesh position={[0, 0.12, -0.01]}>
                <boxGeometry args={[0.26, 0.07, 0.26]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.04, -0.07]}>
                <boxGeometry args={[0.27, 0.13, 0.15]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
            </group>
          ) : (
            /* Female: Longer ponytail using elongated box/cylinder behind head */
            <group>
              {/* Hair Top */}
              <mesh position={[0, 0.12, -0.02]}>
                <boxGeometry args={[0.26, 0.08, 0.26]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
              {/* Hair Back Volume */}
              <mesh position={[0, 0.04, -0.08]}>
                <boxGeometry args={[0.27, 0.14, 0.16]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
              {/* Hair Tie / Scrunchie */}
              <mesh position={[0, 0.04, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.04, 8]} />
                <meshStandardMaterial color="#ef4444" roughness={0.6} />
              </mesh>
              {/* Ponytail: Elongated cylinder behind head */}
              <mesh position={[0, -0.15, -0.22]} rotation={[0.32, 0, 0]}>
                <cylinderGeometry args={[0.042, 0.02, 0.36, 8]} />
                <meshStandardMaterial color={hairColor} roughness={0.9} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* ===================================================
          LEFT ARM (Upper + Forearm + Hand)
          =================================================== */}
      <group ref={leftShoulderRef} position={[-shoulderX, 1.34, 0]}>
        {/* Left Shoulder Cap */}
        <mesh>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Left Upper Arm */}
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.048, 0.044, 0.24, 8]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Left Elbow Joint */}
        <mesh position={[0, -0.24, 0]}>
          <sphereGeometry args={[0.046, 8, 8]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Left Forearm */}
        <mesh castShadow position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.044, 0.038, 0.22, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.8} />
        </mesh>
        {/* Left Hand */}
        <mesh position={[0, -0.47, 0]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.8} />
        </mesh>
      </group>

      {/* ===================================================
          RIGHT ARM (Hierarchical Joints for armPose lerping)
          =================================================== */}
      <group ref={rightShoulderRef} position={[shoulderX, 1.34, 0]}>
        {/* Right Shoulder Cap */}
        <mesh>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Right Upper Arm */}
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.048, 0.044, 0.24, 8]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.2} />
        </mesh>

        {/* Right Elbow Pivot */}
        <group ref={rightElbowRef} position={[0, -0.24, 0]}>
          {/* Elbow Joint Sphere */}
          <mesh>
            <sphereGeometry args={[0.046, 8, 8]} />
            <meshStandardMaterial color={jacketColor} roughness={0.5} metalness={0.2} />
          </mesh>
          {/* Right Forearm */}
          <mesh castShadow position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.044, 0.038, 0.22, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} />
          </mesh>

          {/* Right Wrist / Hand Pivot */}
          <group ref={rightHandRef} position={[0, -0.22, 0]}>
            {/* Hand Sphere */}
            <mesh castShadow>
              <sphereGeometry args={[0.042, 8, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>

            {/* Thumbs-Up Thumb Geometry */}
            <mesh
              ref={rightThumbRef}
              position={[0, 0.038, 0.02]}
              rotation={[-0.2, 0, 0]}
              scale={[0, 0, 0]}
            >
              <cylinderGeometry args={[0.015, 0.012, 0.045, 6]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

export default StandingCharacter;
