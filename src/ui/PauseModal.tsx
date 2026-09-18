import React, { useState } from 'react';
import { useGame } from '../game/GameStateContext';
import { SoundSynth } from '../audio/SoundSynth';
import { SettingsModal } from './SettingsModal';
import { Play, RotateCcw, Sliders, Home } from 'lucide-react';

export const PauseModal: React.FC = () => {
  const { gameState, resumeRace, restartRace, goToMenu } = useGame();
  const [showSettings, setShowSettings] = useState(false);

  if (gameState !== 'PAUSED') return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
        <div className="w-full max-w-sm arcade-glass rounded-3xl p-6 md:p-8 border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col items-center">
          <h2 className="font-arcade text-3xl font-black text-white tracking-widest mb-1">
            PAUSED
          </h2>
          <span className="text-[10px] font-arcade text-cyan-400 tracking-widest mb-6">
            RACE SUSPENDED
          </span>

          <div className="flex flex-col gap-3 w-full">
            {/* Resume */}
            <button
              onClick={() => {
                SoundSynth.playClick();
                resumeRace();
              }}
              className="arcade-btn bg-cyan-500 hover:bg-cyan-400 text-black font-arcade font-black text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              <Play size={18} fill="black" />
              <span>RESUME RACE</span>
            </button>

            {/* Restart */}
            <button
              onClick={() => {
                SoundSynth.playClick();
                restartRace();
              }}
              className="arcade-btn arcade-glass text-white hover:text-cyan-400 font-arcade font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              <span>RESTART CIRCUIT</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                SoundSynth.playClick();
                setShowSettings(true);
              }}
              className="arcade-btn arcade-glass text-white hover:text-cyan-400 font-arcade font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Sliders size={16} />
              <span>SETTINGS</span>
            </button>

            {/* Quit */}
            <button
              onClick={() => {
                SoundSynth.playClick();
                goToMenu();
              }}
              className="arcade-btn arcade-glass text-red-400 hover:text-red-300 font-arcade font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border-red-500/30"
            >
              <Home size={16} />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

