import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

import { CarConfig } from '../data/CarConfigs';
import { CarPhysics } from './CarPhysics';
import { SeatedOccupants } from '../characters/SeatedCharacters';

interface RealisticCarModelProps {
  config: CarConfig;
  color: string;
  isBraking?: boolean;
  isReversing?: boolean;
  isBoosting?: boolean;
  steeringAngle?: number;
  wheelRotationSpeed?: number;
  physicsRef?: React.MutableRefObject<CarPhysics | null>;
  isDrifting?: boolean;
  driftIntensity?: number;
}

export const RealisticCarModel: React.FC<RealisticCarModelProps> = ({
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
  // Load official Three.js Ferrari 458 GLTF model with local draco decoder
  const gltf = useGLTF('/models/ferrari.glb', '/draco/');

  // Official Three.js baked ambient occlusion contact shadow
  const aoShadowTexture = useLoader(THREE.TextureLoader, '/models/ferrari_ao.png');

  // Clone scene so multiple cars (Player + AI + Garage) have independent instances
  const carScene = useMemo(() => {
    return SkeletonUtils.clone(gltf.scene);
  }, [gltf.scene]);

  // References to wheels and animatable components
  const wheelFLRef = useRef<THREE.Object3D | null>(null);
  const wheelFRRef = useRef<THREE.Object3D | null>(null);
  const wheelRLRef = useRef<THREE.Object3D | null>(null);
  const wheelRRRef = useRef<THREE.Object3D | null>(null);
  const steeringWheelRef = useRef<THREE.Object3D | null>(null);
  const tailLightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const nitroFlamesGroupRef = useRef<THREE.Group>(null);

  const wheelSpinRef = useRef(0);

  // Configure materials matching Three.js Car Visualizer (PBR Clearcoat Paint, Glass, Rims)
  useEffect(() => {
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      metalness: 0.9,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.8,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.12,
      envMapIntensity: 1.5,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xc4e6f8,
      metalness: 0.1,
      roughness: 0.02,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      envMapIntensity: 2.0,
    });

    const brakeMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Brembo racing red
      metalness: 0.5,
      roughness: 0.25,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      metalness: 0.8,
      roughness: 0.35,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x141417,
      roughness: 0.85,
    });

    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xff0022,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    tailLightMatRef.current = tailLightMat;

    carScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const name = mesh.name.toLowerCase();

        if (name === 'body') {
          mesh.material = bodyMat;
        } else if (name.startsWith('rim_')) {
          mesh.material = rimMat;
        } else if (name === 'glass') {
          mesh.material = glassMat;
        } else if (name === 'brake' || name === 'brakes') {
          mesh.material = brakeMat;
        } else if (name.includes('carbon')) {
          mesh.material = carbonMat;
        } else if (name === 'tire' || name === 'tires') {
          mesh.material = rubberMat;
        } else if (name === 'lights_red') {
          mesh.material = tailLightMat;
        }
      }
    });

    // Locate wheel nodes and steering wheel
    wheelFLRef.current = carScene.getObjectByName('wheel_fl') || null;
    wheelFRRef.current = carScene.getObjectByName('wheel_fr') || null;
    wheelRLRef.current = carScene.getObjectByName('wheel_rl') || null;
    wheelRRRef.current = carScene.getObjectByName('wheel_rr') || null;
    steeringWheelRef.current = carScene.getObjectByName('steering_wheel') || null;
  }, [carScene, color]);

  // Frame animations (wheel rotation, steering, taillights, nitro)
  useFrame((_, delta) => {
    const p = physicsRef?.current?.state;
    const steer = p ? p.steeringAngle : steeringAngle;
    const spinSpeed = p ? p.speed * 2.8 : wheelRotationSpeed;
    const braking = p ? p.isBraking : isBraking;
    const boosting = p ? p.isBoosting : isBoosting;

    wheelSpinRef.current += spinSpeed * delta;

    // Animate wheels
    // In ferrari.glb, wheels spin along X axis
    if (wheelFLRef.current) {
      wheelFLRef.current.rotation.x = wheelSpinRef.current;
      wheelFLRef.current.rotation.z = steer;
    }
    if (wheelFRRef.current) {
      wheelFRRef.current.rotation.x = wheelSpinRef.current;
      wheelFRRef.current.rotation.z = steer;
    }
    if (wheelRLRef.current) {
      wheelRLRef.current.rotation.x = wheelSpinRef.current;
    }
    if (wheelRRRef.current) {
      wheelRRRef.current.rotation.x = wheelSpinRef.current;
    }

    // Steering wheel in cockpit
    if (steeringWheelRef.current) {
      steeringWheelRef.current.rotation.y = -steer * 2.5;
    }

    // Taillight emissive response on braking
    if (tailLightMatRef.current) {
      tailLightMatRef.current.emissiveIntensity = braking ? 4.5 : 1.2;
    }

    // Nitro boost flames
    if (nitroFlamesGroupRef.current) {
      nitroFlamesGroupRef.current.visible = boosting;
      if (boosting) {
        nitroFlamesGroupRef.current.scale.set(
          0.9 + Math.random() * 0.3,
          0.9 + Math.random() * 0.3,
          0.85 + Math.random() * 0.4
        );
      }
    }
  });

  return (
    <group>
      {/* Official Three.js Baked Ambient Occlusion Underbody Contact Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[0.655 * 4, 1.3 * 4]} />
        <meshBasicMaterial
          map={aoShadowTexture}
          blending={THREE.MultiplyBlending}
          toneMapped={false}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>

      {/* 
        3D Ferrari Supercar Mesh (Three.js Car Visualizer)
        Rotated 180 degrees so front (-Z in gltf) faces forward (+Z in game)
      */}
      <group rotation={[0, Math.PI, 0]} position={[0, 0, 0]}>
        <primitive object={carScene} />

        {/* Dual Nitro Boost Flames at Rear Exhausts */}
        <group ref={nitroFlamesGroupRef} visible={isBoosting} position={[0, 0.32, 2.15]}>
          <mesh position={[-0.42, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.14, 0.8, 8]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
          <mesh position={[0.42, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.14, 0.8, 8]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
        </group>
      </group>

      {/* 
        Seated Occupants (Rider & Girlfriend) inside cockpit
        Visible through clear glass — only rendered on player vehicle (physicsRef defined)
        to prevent 5x duplicated offscreen canvas textures on AI opponents
      */}
      {physicsRef !== undefined && (
        <group position={[0, 0, 0]}>
          <SeatedOccupants
            physicsRef={physicsRef}
            steeringAngle={steeringAngle}
            isBoosting={isBoosting}
            isDrifting={isDrifting}
            driftIntensity={driftIntensity}
          />
        </group>
      )}
    </group>
  );
};

