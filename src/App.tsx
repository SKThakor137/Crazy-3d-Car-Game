import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
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
              }}
            >
              <GameLoop />
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

