import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../game/GameStateContext';
import { CarConfig } from '../data/CarConfigs';
import { TrackData } from '../tracks/TrackGenerator';
import { CarModel } from './CarModel';
import { CarPhysics } from './CarPhysics';
import { InputManager } from '../game/InputManager';
import { SoundSynth } from '../audio/SoundSynth';
import { MathUtils } from '../utils/MathUtils';
import { TelemetryStore } from '../game/TelemetryStore';

interface PlayerCarProps {
  config: CarConfig;
  color: string;
  trackData: TrackData;
  spawnPosition: THREE.Vector3;
  spawnRotation: THREE.Euler;
  physicsRef?: React.MutableRefObject<CarPhysics | null>;
  onPhysicsReady?: (physics: CarPhysics) => void;
}

export const PlayerCar: React.FC<PlayerCarProps> = ({
  config,
  color,
  trackData,
  spawnPosition,
  spawnRotation,
  physicsRef: externalPhysicsRef,
  onPhysicsReady,
}) => {
  const { gameState, finishRace, settings, updateSettings } = useGame();
  const groupRef = useRef<THREE.Group>(null);
  const internalPhysicsRef = useRef<CarPhysics | null>(null);
  const activePhysicsRef = externalPhysicsRef || internalPhysicsRef;

  // Checkpoints progression tracking
  const nextCheckpointIdx = useRef(0);
  const currentLap = useRef(1);
  const lapStartTime = useRef(0);
  const raceStartTime = useRef(0);
  const bestLap = useRef(Infinity);

  const onPhysicsReadyRef = useRef(onPhysicsReady);
  onPhysicsReadyRef.current = onPhysicsReady;

  // Initialize physics only once when car or track changes if externalPhysicsRef was not provided
  useEffect(() => {
    if (!externalPhysicsRef) {
      const physics = new CarPhysics(config, trackData, spawnPosition, spawnRotation);
      internalPhysicsRef.current = physics;
      onPhysicsReadyRef.current?.(physics);
    } else if (externalPhysicsRef.current) {
      onPhysicsReadyRef.current?.(externalPhysicsRef.current);
    }
  }, [config.id, trackData, externalPhysicsRef]);

  // Main physics & control update frame
  useFrame((_, delta) => {
    const physics = activePhysicsRef.current;
    if (!physics) return;

    const dt = Math.min(delta, 0.05);

    // Get input
    const input = InputManager.getState(settings.steeringSensitivity);

    // Handle camera toggle (C or V key)
    if (input.viewToggleRequested) {
      const nextCam = settings.cameraView === 'chase' ? 'far' : settings.cameraView === 'far' ? 'hood' : 'chase';
      updateSettings({ cameraView: nextCam });
    }

    // Handle car reset request
    if (input.resetRequested) {
      physics.resetToTrack();
    }

    // Only allow driving during RACING state
    if (gameState === 'RACING') {
      physics.update(dt, input.throttle, input.steer, input.handbrake, input.nitro);

      // Checkpoint and lap progression
      updateProgression(physics, dt);
    } else if (gameState === 'COUNTDOWN') {
      // Allow gentle engine revving while parked at starting line
      if (input.throttle > 0) {
        SoundSynth.updateEngine(0.4, 1.0);
      } else {
        SoundSynth.updateEngine(0.05, 0);
      }
    }

    // Update 3D visual position and orientation
    if (groupRef.current) {
      groupRef.current.position.copy(physics.state.position);
      groupRef.current.rotation.y = physics.state.heading;
      groupRef.current.rotation.x = physics.state.pitch;
    }

    // Update sound synthesizer
    if (gameState === 'RACING') {
      const speedRatio = Math.min(1.0, Math.abs(physics.state.speed) / config.physics.topSpeed);
      SoundSynth.updateEngine(speedRatio, input.throttle);
      SoundSynth.setTireScreech(physics.state.driftIntensity);
      SoundSynth.setNitro(physics.state.isBoosting);
    }

    // Update HUD telemetry
    const speedKmH = MathUtils.toKmH(physics.state.speed);
    const rpmRatio = Math.min(1.0, (speedKmH % 40) / 40 + 0.1);
    const gear =
      physics.state.isReversing ? 'R' :
      speedKmH < 5 ? '1' :
      Math.min(6, Math.floor(speedKmH / 38) + 1);

    TelemetryStore.updateTelemetry({
      speedKmH,
      rpmRatio,
      gear,
      nitro: Math.round(physics.state.nitroAmount),
      lap: currentLap.current,
      raceTime: (performance.now() - raceStartTime.current) / 1000,
      bestLapTime: bestLap.current === Infinity ? 0 : bestLap.current,
    });
  });

  // Reset lap timers when starting race
  useEffect(() => {
    if (gameState === 'RACING') {
      raceStartTime.current = performance.now();
      lapStartTime.current = performance.now();
      nextCheckpointIdx.current = 1;
      currentLap.current = 1;
      bestLap.current = Infinity;
    }
  }, [gameState]);

  // Checkpoint passing & Wrong-way detection
  const updateProgression = (physics: CarPhysics, dt: number) => {
    const checkpoints = trackData.checkpoints;
    const targetCheckpoint = checkpoints[nextCheckpointIdx.current];

    if (targetCheckpoint) {
      const distToCheckpoint = physics.state.position.distanceTo(targetCheckpoint);

      // Reached checkpoint gate (within 18 units)
      if (distToCheckpoint < 18) {
        nextCheckpointIdx.current = (nextCheckpointIdx.current + 1) % checkpoints.length;

        // Crossed start/finish line to complete a lap
        if (nextCheckpointIdx.current === 1) {
          const now = performance.now();
          const lapDuration = (now - lapStartTime.current) / 1000;
          lapStartTime.current = now;

          if (lapDuration < bestLap.current && lapDuration > 10) {
            bestLap.current = parseFloat(lapDuration.toFixed(2));
          }

          SoundSynth.playLapChime();

          if (currentLap.current >= TelemetryStore.current.totalLaps) {
            // Race finished!
            finishRace();
          } else {
            currentLap.current += 1;
          }
        }
      }
    }

    // Wrong-way detection: compare car heading against spline tangent
    const closest = MathUtils.getClosestTOnCurve(trackData.spline, physics.state.position, 30);
    const tangent = trackData.spline.getTangentAt(closest.t).normalize();
    const carFwd = new THREE.Vector3(Math.sin(physics.state.heading), 0, Math.cos(physics.state.heading));
    const dot = carFwd.dot(tangent);

    // If driving backwards along the track
    const isWrongWay = dot < -0.3 && Math.abs(physics.state.speed) > 5;
    TelemetryStore.updateTelemetry({ wrongWay: isWrongWay });
  };

  return (
    <group ref={groupRef} position={spawnPosition}>
      <CarModel
        config={config}
        color={color}
        physicsRef={activePhysicsRef}
      />
    </group>
  );
};

