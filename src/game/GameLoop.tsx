import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from './GameStateContext';
import { CARS_DATA } from '../data/CarConfigs';
import { TRACKS_DATA } from '../data/TrackConfigs';
import { TrackGenerator, TrackData } from '../tracks/TrackGenerator';
import { TrackWorld } from '../tracks/TrackWorld';
import { PlayerCar } from '../cars/PlayerCar';
import { AICar } from '../ai/AICar';
import { AIAgent, AIProfile } from '../ai/AIAgent';
import { ChaseCamera } from '../camera/ChaseCamera';
import { PreRaceCutscene3D } from '../cinematics/PreRaceCutscene';
import { VisualEffects } from '../effects/VisualEffects';
import { CarPhysics } from '../cars/CarPhysics';
import { SoundSynth } from '../audio/SoundSynth';
import { MathUtils } from '../utils/MathUtils';
import { TelemetryStore } from './TelemetryStore';

export const GameLoop: React.FC = () => {
  const {
    gameState,
    setGameState,
    selectedCarId,
    selectedCarColor,
    selectedTrackId,
    difficulty,
    settings,
  } = useGame();

  const trackConfig = TRACKS_DATA[selectedTrackId] || TRACKS_DATA['neon-city'];
  const playerCarConfig = CARS_DATA[selectedCarId] || CARS_DATA['apex-gt'];

  // Generate procedural track data
  const [trackData, setTrackData] = useState<TrackData>(() => TrackGenerator.generate(trackConfig));
  useEffect(() => {
    setTrackData(TrackGenerator.generate(trackConfig));
  }, [trackConfig]);

  // AI Opponents state
  const aiAgentsRef = useRef<AIAgent[]>([]);

  // Initialize player physics eagerly so camera and components have instant access on frame 0
  const playerSpawn = trackData.spawnPoints[5] || trackData.spawnPoints[0];
  const playerPhysicsRef = useRef<CarPhysics | null>(null);
  if (!playerPhysicsRef.current) {
    playerPhysicsRef.current = new CarPhysics(
      playerCarConfig,
      trackData,
      playerSpawn.position,
      playerSpawn.rotation
    );
  }

  // Re-initialize physics when car or track configuration changes
  useEffect(() => {
    const spawn = trackData.spawnPoints[5] || trackData.spawnPoints[0];
    playerPhysicsRef.current = new CarPhysics(
      playerCarConfig,
      trackData,
      spawn.position,
      spawn.rotation
    );
  }, [playerCarConfig, trackData]);

  // Countdown timer logic
  const countdownTimer = useRef(3);
  const lastCountdownSec = useRef(3);

  // Setup AI Drivers when track changes or race restarts
  useEffect(() => {
    const aiProfiles: AIProfile[] = [
      {
        id: 'ai-1',
        name: 'VORTEX',
        carConfig: CARS_DATA['phantom-rs'],
        color: '#ff0055',
        laneOffset: -2.8,
        aggression: 1.1,
        skill: 0.98,
      },
      {
        id: 'ai-2',
        name: 'BLAZE',
        carConfig: CARS_DATA['viper-x'],
        color: '#ff8400',
        laneOffset: 2.8,
        aggression: 1.05,
        skill: 0.94,
      },
      {
        id: 'ai-3',
        name: 'SHADOW',
        carConfig: CARS_DATA['apex-gt'],
        color: '#1a1a24',
        laneOffset: -1.0,
        aggression: 0.95,
        skill: 0.91,
      },
      {
        id: 'ai-4',
        name: 'CYBER',
        carConfig: CARS_DATA['phantom-rs'],
        color: '#7928ca',
        laneOffset: 1.8,
        aggression: 0.9,
        skill: 0.88,
      },
      {
        id: 'ai-5',
        name: 'VIPER',
        carConfig: CARS_DATA['viper-x'],
        color: '#00ff88',
        laneOffset: -2.0,
        aggression: 0.85,
        skill: 0.85,
      },
    ];

    // Spawn 5 AI cars on grid positions 1 through 5 (Player spawns on 6th)
    const newAgents: AIAgent[] = aiProfiles.map((prof, idx) => {
      const spawn = trackData.spawnPoints[idx] || trackData.spawnPoints[0];
      return new AIAgent(prof, trackData, spawn.position, spawn.rotation, difficulty);
    });

    aiAgentsRef.current = newAgents;
  }, [trackData, difficulty]);

  // Countdown sequence (3 -> 2 -> 1 -> GO -> RACING)
  useEffect(() => {
    if (gameState === 'COUNTDOWN') {
      let count = 3;
      TelemetryStore.updateTelemetry({ countdown: 3 });
      SoundSynth.playCountdownBeep(false);

      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          SoundSynth.playCountdownBeep(false);
          TelemetryStore.updateTelemetry({ countdown: count });
        } else if (count === 0) {
          SoundSynth.playCountdownBeep(true); // High pitch GO!
          TelemetryStore.updateTelemetry({ countdown: 0 });
          setGameState('RACING');
        } else {
          clearInterval(timer);
        }
      }, 750);

      return () => clearInterval(timer);
    }
  }, [gameState, setGameState]);

  // Main game loop (AI update & race leaderboard ranking)
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    const playerPhysics = playerPhysicsRef.current;
    const aiAgents = aiAgentsRef.current;
    if (!playerPhysics) return;

    // Collect all car positions for collision avoidance
    const allPositions = [
      playerPhysics.state.position,
      ...aiAgents.map(a => a.position),
    ];

    const telem = TelemetryStore.current;

    // Update AI Opponents when racing
    if (gameState === 'RACING') {
      for (const ai of aiAgents) {
        ai.update(dt, trackConfig.laps, allPositions, telem.raceTime);
      }
    }

    // Compute player spline progression
    const playerClosest = MathUtils.getClosestTOnCurve(
      trackData.spline,
      playerPhysics.state.position,
      40
    );

    // Monotonic progression: negative progress if starting behind start line on lap 1
    let pT = playerClosest.t;
    if (telem.lap === 1 && pT > 0.85) {
      pT = pT - 1.0;
    }
    const playerProgress = (telem.lap - 1) + pT;

    // Compile leaderboard ranking (Player + 5 AI cars)
    const racersList = [
      {
        id: 'player',
        name: 'YOU',
        isPlayer: true,
        carId: selectedCarId,
        color: selectedCarColor,
        lap: telem.lap,
        splineT: playerClosest.t,
        totalDistance: playerProgress,
        currentLapTime: telem.raceTime,
        bestLapTime: telem.bestLapTime,
        finished: gameState === 'FINISHED',
        finishTime: telem.raceTime,
      },
      ...aiAgents.map(ai => ({
        id: ai.profile.id,
        name: ai.profile.name,
        isPlayer: false,
        carId: ai.profile.carConfig.id,
        color: ai.profile.color,
        lap: ai.lap,
        splineT: ai.splineT,
        totalDistance: ai.totalDistance,
        currentLapTime: 0,
        bestLapTime: ai.bestLapTime,
        finished: ai.finished,
        finishTime: ai.finishTime,
      })),
    ];

    // Sort by total distance traveled (highest distance = 1st place)
    racersList.sort((a, b) => b.totalDistance - a.totalDistance);

    // Find player position
    const playerRank = racersList.findIndex(r => r.isPlayer) + 1;

    TelemetryStore.setRacers(racersList);
    TelemetryStore.updateTelemetry({ position: playerRank > 0 ? playerRank : 1 });
    TelemetryStore.tickNotification();
  });

  return (
    <group>
      {/* 3D Track & Environment Scenery with Dynamic Player-Tracking Shadows */}
      <TrackWorld config={trackConfig} trackData={trackData} physicsRef={playerPhysicsRef} />

      {/* Player Vehicle */}
      <PlayerCar
        config={playerCarConfig}
        color={selectedCarColor}
        trackData={trackData}
        spawnPosition={playerSpawn.position}
        spawnRotation={playerSpawn.rotation}
        physicsRef={playerPhysicsRef}
      />

      {/* AI Opponents */}
      {aiAgentsRef.current.map(agent => (
        <AICar key={agent.profile.id} agent={agent} />
      ))}

      {/* Pre-Race Story Cutscene (Meet, Handshake & Enter Car) */}
      {gameState === 'INTRO_STORY' && (
        <PreRaceCutscene3D
          carPosition={playerSpawn.position}
          carHeading={playerSpawn.rotation.y}
        />
      )}

      {/* Dynamic 3rd-Person Chase Camera (Active during Countdown, Racing, etc.) */}
      {gameState !== 'INTRO_STORY' && (
        <ChaseCamera
          physicsRef={playerPhysicsRef}
          viewMode={settings.cameraView}
        />
      )}

      {/* Dynamic Tire Skids and Particle Effects */}
      <VisualEffects
        physicsRef={playerPhysicsRef}
      />
    </group>
  );
};

