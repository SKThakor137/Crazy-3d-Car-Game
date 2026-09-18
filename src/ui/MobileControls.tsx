import React, { useState, useEffect } from 'react';
import { InputManager } from '../game/InputManager';
import { useGame } from '../game/GameStateContext';
import { ArrowLeft, ArrowRight, Zap, RotateCcw, Pause } from 'lucide-react';

export const MobileControls: React.FC = () => {
  const { gameState, pauseRace, settings } = useGame();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  // Determine if mobile controls should show
  const shouldShow =
    settings.touchControls === 'always' ||
    (settings.touchControls === 'auto' && isTouchDevice);

  if (!shouldShow || (gameState !== 'RACING' && gameState !== 'COUNTDOWN')) {
    return null;
  }

  const bindTouch = (action: Parameters<typeof InputManager.setTouchInput>[0]) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      InputManager.setTouchInput(action, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      InputManager.setTouchInput(action, false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      InputManager.setTouchInput(action, false);
    },
    onMouseDown: () => InputManager.setTouchInput(action, true),
    onMouseUp: () => InputManager.setTouchInput(action, false),
    onMouseLeave: () => InputManager.setTouchInput(action, false),
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden flex flex-col justify-between p-3">
      {/* Top row: Pause & Reset for quick mobile access */}
      <div className="flex justify-between items-center w-full px-2">
        <button
          onClick={pauseRace}
          className="pointer-events-auto w-12 h-12 rounded-2xl arcade-glass flex items-center justify-center text-white active:scale-90"
        >
          <Pause size={20} />
        </button>

        <button
          onClick={() => InputManager.requestReset()}
          className="pointer-events-auto w-12 h-12 rounded-2xl arcade-glass flex items-center justify-center text-orange-400 active:scale-90"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Bottom row: Steering (Left side) & Pedals/Nitro (Right side) */}
      <div className="flex justify-between items-end w-full pb-2 px-1">
        {/* Left: Steering D-Pad */}
        <div className="flex gap-3 pointer-events-auto items-center">
          {/* Steer Left */}
          <button
            {...bindTouch('steerLeft')}
            className="w-18 h-18 md:w-22 md:h-22 rounded-3xl arcade-glass flex items-center justify-center text-cyan-400 active:bg-cyan-500/30 active:scale-95 shadow-xl border border-cyan-500/40 p-4"
          >
            <ArrowLeft size={34} />
          </button>

          {/* Steer Right */}
          <button
            {...bindTouch('steerRight')}
            className="w-18 h-18 md:w-22 md:h-22 rounded-3xl arcade-glass flex items-center justify-center text-cyan-400 active:bg-cyan-500/30 active:scale-95 shadow-xl border border-cyan-500/40 p-4"
          >
            <ArrowRight size={34} />
          </button>
        </div>

        {/* Right: Pedals & Nitro */}
        <div className="flex flex-col gap-3 pointer-events-auto items-end">
          {/* Top row right: Nitro & Handbrake */}
          <div className="flex gap-2.5">
            {/* Nitro Button */}
            <button
              {...bindTouch('nitro')}
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg active:scale-90 border border-cyan-300"
            >
              <Zap size={24} />
            </button>

            {/* Handbrake / Drift Button */}
            <button
              {...bindTouch('handbrake')}
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl arcade-glass-orange flex items-center justify-center text-orange-400 font-arcade font-bold text-xs shadow-lg active:scale-90 border border-orange-500"
            >
              DRIFT
            </button>
          </div>

          {/* Bottom row right: Brake & Gas */}
          <div className="flex gap-3 items-center">
            {/* Brake / Reverse Pedal */}
            <button
              {...bindTouch('brake')}
              className="w-18 h-20 md:w-22 md:h-24 rounded-3xl arcade-glass-red flex flex-col items-center justify-center text-red-400 font-arcade font-bold text-sm shadow-xl active:bg-red-500/40 active:scale-95 border border-red-500/50"
            >
              <span className="text-lg">▼</span>
              <span>BRAKE</span>
            </button>

            {/* Gas / Accelerate Pedal */}
            <button
              {...bindTouch('accelerate')}
              className="w-20 h-24 md:w-24 md:h-28 rounded-3xl bg-gradient-to-t from-emerald-700 to-green-500 flex flex-col items-center justify-center text-white font-arcade font-black text-base shadow-2xl active:scale-95 border-2 border-green-300"
            >
              <span className="text-xl">▲</span>
              <span>GAS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

