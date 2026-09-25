import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { GameStateProvider, useGame } from './game/GameStateContext';
import { InputManager } from './game/InputManager';
import { MainMenu } from './ui/MainMenu';
import { GarageView } from './ui/GarageView';
import { TrackSelectView } from './ui/TrackSelectView';
import { HUD } from './ui/HUD';
import { MobileControls } from './ui/MobileControls';
import { PauseModal } from './ui/PauseModal';
import { ResultsModal } from './ui/ResultsModal';
import { GameLoop } from './game/GameLoop';
import { PreRaceCutsceneOverlay } from './cinematics/PreRaceCutscene';

// Sleek Non-Blocking Asset Loading Overlay
const AssetLoadingOverlay: React.FC = () => {
  const { active, progress } = useProgress();
  if (!active || progress >= 100) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-arcade text-lg tracking-widest text-cyan-400 font-bold">
          LOADING RACE WORLD... {Math.round(progress)}%
        </span>
      </div>
      <div className="w-72 h-3.5 bg-gray-900 rounded-full overflow-hidden border border-cyan-500/40 p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-orange-400 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="font-arcade text-[10px] text-gray-400 mt-2.5 tracking-wider">
        OPTIMIZING 3D CARS & SHADERS
      </span>
    </div>
  );
};

const GameContainer: React.FC = () => {
  const { gameState, pauseRace, resumeRace, settings } = useGame();

  // Initialize InputManager once
  useEffect(() => {
    InputManager.init();
    return () => InputManager.destroy();
  }, []);

  // Global pause keyboard shortcuts (Escape / P)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'RACING') {
          pauseRace();
        } else if (gameState === 'PAUSED') {
          resumeRace();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, pauseRace, resumeRace]);

  // Determine shadow resolution & dpr based on graphics quality setting
  const dpr =
    settings.graphicsQuality === 'high' ? [1, 2] as [number, number] :
    settings.graphicsQuality === 'medium' ? [1, 1.5] as [number, number] : [0.8, 1] as [number, number];

  const shadowsEnabled = settings.graphicsQuality !== 'low';

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* 1. Main Title Menu */}
      {gameState === 'MENU' && <MainMenu />}

      {/* 2. Interactive 3D Garage */}
      {gameState === 'GARAGE' && <GarageView />}

      {/* 3. Circuit Selection */}
      {gameState === 'TRACK_SELECT' && <TrackSelectView />}

      {/* 4. Active 3D Racing World & HUD */}
      {(gameState === 'INTRO_STORY' ||
        gameState === 'COUNTDOWN' ||
        gameState === 'RACING' ||
        gameState === 'PAUSED' ||
        gameState === 'FINISHED') && (
        <>
          {/* Main 3D Racing Canvas */}
          <div className="w-full h-full">
            <Canvas
              shadows={shadowsEnabled}
              dpr={dpr}
              camera={{ position: [0, 5, 10], fov: 60 }}
              gl={{
                antialias: settings.graphicsQuality !== 'low',
                powerPreference: 'high-performance',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
              }}
              onCreated={({ gl }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.05;
                if (shadowsEnabled) {
                  gl.shadowMap.enabled = true;
                  gl.shadowMap.type = THREE.PCFSoftShadowMap;
                }
              }}
            >
              <React.Suspense fallback={null}>
                <GameLoop />
              </React.Suspense>
            </Canvas>
          </div>

          {/* Pre-Race Story Cinematic Overlay */}
          {gameState === 'INTRO_STORY' && <PreRaceCutsceneOverlay />}

          {/* Race HUD */}
          {gameState !== 'INTRO_STORY' && <HUD />}

          {/* Virtual Mobile Touch Controls */}
          {gameState !== 'INTRO_STORY' && <MobileControls />}

          {/* Pause Menu Modal */}
          <PauseModal />

          {/* Race Results & Podium Modal */}
          <ResultsModal />
        </>
      )}

      {/* Real-time Non-blocking Asset Loading Bar */}
      <AssetLoadingOverlay />
    </div>
  );
};

export default function App() {
  return (
    <GameStateProvider>
      <GameContainer />
    </GameStateProvider>
  );
}

