import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from '../utils/MathUtils';
import { CarPhysics } from '../cars/CarPhysics';

export type CameraViewMode = 'chase' | 'far' | 'hood';

interface ChaseCameraProps {
  physicsRef?: React.MutableRefObject<CarPhysics | null>;
  viewMode?: CameraViewMode;
  // Legacy fallback props
  carPosition?: THREE.Vector3;
  carHeading?: number;
  carSpeed?: number;
  isBoosting?: boolean;
  collisionSeverity?: number;
}

export const ChaseCamera: React.FC<ChaseCameraProps> = ({
  physicsRef,
  viewMode = 'chase',
  carPosition: propPosition,
  carHeading: propHeading = 0,
  carSpeed: propSpeed = 0,
  isBoosting: propBoosting = false,
  collisionSeverity: propCollision = 0,
}) => {
  const { camera } = useThree();

  // Smoothed camera properties
  const camYaw = useRef(0);
  const camPosY = useRef(0);
  const camTarget = useRef(new THREE.Vector3());
  const shakeOffset = useRef(new THREE.Vector3());
  const isInitialized = useRef(false);
  const lastCarPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // Determine real-time state: prefer live physicsRef if supplied
    const physics = physicsRef?.current;
    const carPos = physics ? physics.state.position : (propPosition || lastCarPos.current);
    const carHeading = physics ? physics.state.heading : propHeading;
    const carSpeed = physics ? physics.state.speed : propSpeed;
    const isBoosting = physics ? physics.state.isBoosting : propBoosting;
    const isDrifting = physics ? physics.state.isDrifting : false;
    const driftIntensity = physics ? physics.state.driftIntensity : 0;
    const collisionSeverity = physics ? physics.state.collisionSeverity : propCollision;

    if (!carPos) return;

    const dt = Math.min(delta, 0.05);

    const isAirborne = physics ? physics.state.isAirborne : false;
    const justLanded = physics ? physics.state.justLanded : false;

    // Speed ratio (0 to 1) for dynamic camera pull-back and FOV
    const speedRatio = Math.min(1.0, Math.abs(carSpeed) / 52);

    // Detect track reset / large position teleport (> 15 units jump) or first frame
    const distFromLast = carPos.distanceTo(lastCarPos.current);
    const needsSnap = !isInitialized.current || distFromLast > 15;

    if (needsSnap) {
      camYaw.current = carHeading;
      lastCarPos.current.copy(carPos);

      if (viewMode === 'hood') {
        const fwd = new THREE.Vector3(Math.sin(carHeading), 0, Math.cos(carHeading));
        camera.position.copy(carPos).add(fwd.clone().multiplyScalar(1.5));
        camera.position.y += 0.88;
        const target = carPos.clone().add(fwd.clone().multiplyScalar(35));
        target.y += 0.88;
        camera.lookAt(target);
      } else if (viewMode === 'far') {
        const initDist = 9.2;
        const initHeight = 4.2;
        camPosY.current = carPos.y + initHeight;
        camera.position.set(
          carPos.x - Math.sin(carHeading) * initDist,
          camPosY.current,
          carPos.z - Math.cos(carHeading) * initDist
        );
        camTarget.current.set(
          carPos.x + Math.sin(carHeading) * 8.5,
          carPos.y + 0.6,
          carPos.z + Math.cos(carHeading) * 8.5
        );
        camera.lookAt(camTarget.current);
      } else {
        // Standard Arcade Chase Cam
        const initDist = 6.4;
        const initHeight = 2.55;
        camPosY.current = carPos.y + initHeight;
        camera.position.set(
          carPos.x - Math.sin(carHeading) * initDist,
          camPosY.current,
          carPos.z - Math.cos(carHeading) * initDist
        );
        camTarget.current.set(
          carPos.x + Math.sin(carHeading) * 7.5,
          carPos.y + 0.95,
          carPos.z + Math.cos(carHeading) * 7.5
        );
        camera.lookAt(camTarget.current);
      }

      isInitialized.current = true;
      return;
    }

    lastCarPos.current.copy(carPos);

    // Dynamic FOV for exciting sense of speed and airtime
    const baseFov = viewMode === 'hood' ? 74 : viewMode === 'far' ? 58 : 64;
    const targetFov = baseFov + speedRatio * 12 + (isBoosting ? 6 : 0) + (isAirborne ? 5 : 0);
    if ('fov' in camera) {
      const perspCam = camera as THREE.PerspectiveCamera;
      perspCam.fov = MathUtils.damp(perspCam.fov, targetFov, 6, dt);
      perspCam.updateProjectionMatrix();
    }

    // Impact, landing thud & collision camera shake
    if (justLanded || collisionSeverity > 0.05) {
      const intensity = justLanded ? 0.38 : Math.min(0.35, collisionSeverity * 0.28);
      shakeOffset.current.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.7,
        (Math.random() - 0.5) * intensity
      );
    } else {
      shakeOffset.current.set(0, 0, 0);
    }

    // --- VIEW MODE HANDLING ---
    if (viewMode === 'hood') {
      // 1. HOOD / BUMPER FIRST-PERSON VIEW
      const fwd = new THREE.Vector3(Math.sin(carHeading), 0, Math.cos(carHeading));
      const hoodPos = carPos.clone().add(fwd.clone().multiplyScalar(1.5));
      hoodPos.y += 0.88;

      const lookAhead = carPos.clone().add(fwd.clone().multiplyScalar(35));
      lookAhead.y += 0.88;

      camera.position.copy(hoodPos).add(shakeOffset.current);
      camera.lookAt(lookAhead);

    } else if (viewMode === 'far') {
      // 2. AERIAL FAR CHASE VIEW (High bird's-eye perspective)
      const dist = 9.2 + speedRatio * 1.8;
      const height = 4.2 + speedRatio * 0.4;
      const targetAhead = 8.5;
      const targetHeight = 0.6;

      const angleDiff = MathUtils.angleDiff(camYaw.current, carHeading);
      camYaw.current += angleDiff * (1 - Math.exp(-8.0 * dt));

      const desiredX = carPos.x - Math.sin(camYaw.current) * dist;
      const desiredZ = carPos.z - Math.cos(camYaw.current) * dist;
      const desiredY = carPos.y + height;

      camPosY.current = MathUtils.damp(camPosY.current, desiredY, 12, dt);
      camera.position.set(desiredX, camPosY.current, desiredZ).add(shakeOffset.current);

      const targetX = carPos.x + Math.sin(carHeading) * targetAhead;
      const targetZ = carPos.z + Math.cos(carHeading) * targetAhead;
      const targetY = carPos.y + targetHeight;

      camTarget.current.x = MathUtils.damp(camTarget.current.x, targetX, 16, dt);
      camTarget.current.y = MathUtils.damp(camTarget.current.y, targetY, 12, dt);
      camTarget.current.z = MathUtils.damp(camTarget.current.z, targetZ, 16, dt);

      camera.lookAt(camTarget.current);

    } else {
      // 3. STANDARD ARCADE 3RD-PERSON CHASE VIEW (Default)
      // Camera distance & elevation
      const airtimeDist = isAirborne ? 1.6 : 0;
      const airtimeHeight = isAirborne ? 0.9 : 0;
      const dist = 6.4 + speedRatio * 1.4 + (isBoosting ? 0.8 : 0) + airtimeDist;
      const height = 2.55 + speedRatio * 0.35 + airtimeHeight;
      const targetAhead = 7.5 + speedRatio * 3.0;
      const targetHeight = 0.95;

      // Angular yaw tracking: interpolate YAW angle instead of Cartesian coordinates.
      // This guarantees the camera stays at exactly `dist` radius behind the car,
      // never clips through the car during sharp corners, and rotates smoothly!
      const angleDiff = MathUtils.angleDiff(camYaw.current, carHeading);
      const yawSpeed = 9.0; // Responsive tracking with slight organic trail
      camYaw.current += angleDiff * (1 - Math.exp(-yawSpeed * dt));

      // Subtle dynamic drift sway: gives a thrilling view of the car sliding
      let effectiveYaw = camYaw.current;
      if (isDrifting && driftIntensity > 0.1) {
        effectiveYaw += Math.sign(angleDiff) * Math.min(0.12, driftIntensity * 0.1);
      }

      const desiredX = carPos.x - Math.sin(effectiveYaw) * dist;
      const desiredZ = carPos.z - Math.cos(effectiveYaw) * dist;
      const desiredY = carPos.y + height;

      // Smooth vertical dampening to gracefully follow track hills and dips
      camPosY.current = MathUtils.damp(camPosY.current, desiredY, 14, dt);
      camera.position.set(desiredX, camPosY.current, desiredZ).add(shakeOffset.current);

      // Target look-ahead: angles downward looking onto the track ahead
      const targetX = carPos.x + Math.sin(carHeading) * targetAhead;
      const targetZ = carPos.z + Math.cos(carHeading) * targetAhead;
      const targetY = carPos.y + targetHeight;

      camTarget.current.x = MathUtils.damp(camTarget.current.x, targetX, 16, dt);
      camTarget.current.y = MathUtils.damp(camTarget.current.y, targetY, 14, dt);
      camTarget.current.z = MathUtils.damp(camTarget.current.z, targetZ, 16, dt);

      camera.lookAt(camTarget.current);
    }
  });

  return null;
};
