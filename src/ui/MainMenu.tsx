import React, { useState } from 'react';
import { useGame } from '../game/GameStateContext';
import { TRACKS_DATA } from '../data/TrackConfigs';
import { SoundSynth } from '../audio/SoundSynth';
import { SettingsModal } from './SettingsModal';
import { Play, Award, Flag, Sliders, HelpCircle, Zap, ShieldAlert, X } from 'lucide-react';

export const MainMenu: React.FC = () => {
  const { startIntro, goToGarage, goToTrackSelect, selectedTrackId } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handlePlay = () => {
    SoundSynth.playClick();
    startIntro();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden flex flex-col justify-between items-center p-6 md:p-12 bg-radial from-[#121630] via-[#070914] to-black">
      {/* Background Cyber Glow & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff0d_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="scanline" />

      {/* Top Bar / Version */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-arcade text-xs tracking-widest text-cyan-400 font-bold">
            NEXT-GEN WEB 3D RACING
          </span>
        </div>
        <span className="font-arcade text-xs tracking-widest text-gray-400">
          v1.0.0 ARCADE EDITION
        </span>
      </div>

      {/* Center Hero Branding */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full arcade-glass border-cyan-500/40 mb-4">
          <Zap size={14} className="text-yellow-400 animate-pulse" />
          <span className="font-arcade text-[10px] md:text-xs text-gray-300 tracking-widest">
            REALTIME ARCADE PHYSICS & 3D CIRCUITS
          </span>
        </div>

        <h1 className="font-arcade font-black text-5xl md:text-8xl tracking-tight text-white drop-shadow-[0_0_40px_rgba(0,240,255,0.4)]">
          SUPER <span className="text-neon-cyan">APEX</span>
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="h-[2px] w-12 bg-cyan-400" />
          <span className="font-arcade text-lg md:text-2xl font-bold tracking-[0.35em] text-neon-orange">
            CIRCUIT 3D
          </span>
          <span className="h-[2px] w-12 bg-orange-400" />
        </div>
      </div>

      {/* Main Menu Buttons */}
      <div className="w-full max-w-md flex flex-col gap-3 z-10">
        {/* Play / Quick Race */}
        <button
          onClick={handlePlay}
          className="arcade-btn w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-400 text-black font-arcade font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/40 active:scale-95"
        >
          <Play size={22} fill="black" />
          <span>START RACE</span>
        </button>

        {/* Selected Circuit Bar */}
        <button
          onClick={() => {
            SoundSynth.playClick();
            goToTrackSelect();
          }}
          className="w-full arcade-glass rounded-xl px-4 py-2.5 flex items-center justify-between text-xs hover:border-cyan-400/60 transition-all cursor-pointer group"
        >
          <span className="font-arcade text-gray-400 flex items-center gap-1.5 text-[11px]">
            <Flag size={14} className="text-cyan-400" />
            TRACK:
          </span>
          <span className="font-arcade text-white font-bold group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-[11px]">
            {TRACKS_DATA[selectedTrackId]?.name || 'PARADISE ADVENTURE SAFARI'}
            {(selectedTrackId === 'tropical-beach' || selectedTrackId === 'extreme-adventure') && (
              <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-full animate-pulse">
                🔥 ADVENTURE SAFARI
              </span>
            )}
          </span>
          <span className="text-[10px] text-cyan-400 font-arcade">CHANGE ›</span>
        </button>

        {/* Garage & Track Select in Row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              SoundSynth.playClick();
              goToGarage();
            }}
            className="arcade-btn arcade-glass text-white hover:text-cyan-400 font-arcade font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <Award size={18} className="text-yellow-400" />
            <span>GARAGE</span>
          </button>

          <button
            onClick={() => {
              SoundSynth.playClick();
              goToTrackSelect();
            }}
            className="arcade-btn arcade-glass text-white hover:text-cyan-400 font-arcade font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <Flag size={18} className="text-cyan-400" />
            <span>CIRCUITS</span>
          </button>
        </div>

        {/* Settings & How to Play */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              SoundSynth.playClick();
              setShowSettings(true);
            }}
            className="arcade-btn arcade-glass text-gray-300 hover:text-white font-arcade font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <Sliders size={16} />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={() => {
              SoundSynth.playClick();
              setShowHelp(true);
            }}
            className="arcade-btn arcade-glass text-gray-300 hover:text-white font-arcade font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <HelpCircle size={16} />
            <span>HOW TO PLAY</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* How to Play Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-lg arcade-glass rounded-3xl p-6 md:p-8 border border-cyan-500/40 shadow-[0_0_40px_rgba(0,240,255,0.25)]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-arcade text-2xl font-black text-white flex items-center gap-2">
                <HelpCircle size={22} className="text-cyan-400" />
                HOW TO PLAY
              </h2>
              <button
                onClick={() => {
                  SoundSynth.playClick();
                  setShowHelp(false);
                }}
                className="w-8 h-8 rounded-xl arcade-glass flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs font-arcade text-gray-300">
              {/* Keyboard Controls */}
              <div className="arcade-glass rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-cyan-400 font-bold block mb-1">DESKTOP KEYBOARD CONTROLS</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">W</span> or <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">↑</span> Accelerate</div>
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">S</span> or <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">↓</span> Brake / Reverse</div>
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">A</span> or <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">←</span> Steer Left</div>
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">D</span> or <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">→</span> Steer Right</div>
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">SPACE</span> Handbrake / Drift</div>
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">SHIFT</span> Nitro Boost</div>
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">R</span> Reset Car to Track</div>
                  <div><span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">C</span> Toggle Camera View</div>
                </div>
              </div>

              {/* Touch Controls */}
              <div className="arcade-glass rounded-2xl p-4">
                <span className="text-cyan-400 font-bold block mb-1">MOBILE & TOUCH CONTROLS</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  On phones and tablets, virtual on-screen buttons appear automatically: Left thumb controls Left/Right steering; right thumb controls Gas, Brake, Handbrake drift, and Nitro boost.
                </p>
              </div>

              {/* Racing Strategy */}
              <div className="arcade-glass rounded-2xl p-4">
                <span className="text-cyan-400 font-bold block mb-1">RACING STRATEGY</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Drifting around sharp apex corners refills your Nitro meter faster! Fire your Nitro on long straights to overtake the AI opponents.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                SoundSynth.playClick();
                setShowHelp(false);
              }}
              className="arcade-btn w-full bg-cyan-500 hover:bg-cyan-400 text-black font-arcade font-black text-sm py-3 rounded-xl mt-5 shadow-lg shadow-cyan-500/30"
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

