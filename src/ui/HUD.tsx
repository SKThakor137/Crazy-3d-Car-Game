import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../game/GameStateContext';
import { Minimap } from './Minimap';
import { MathUtils } from '../utils/MathUtils';
import {
  Pause,
  RotateCcw,
  Camera,
  Zap,
  AlertTriangle,
  Music,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
} from 'lucide-react';
import { InputManager } from '../game/InputManager';
import { TelemetryStore, RaceTelemetryData } from '../game/TelemetryStore';
import { MusicSynth } from '../audio/MusicSynth';

export const HUD: React.FC = () => {
  const { gameState, pauseRace, updateSettings, settings } = useGame();

  const [raceTelemetry, setRaceTelemetry] = useState<RaceTelemetryData>(() => TelemetryStore.current);
  const [camToast, setCamToast] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState(() => MusicSynth.getCurrentTrack());
  const [songToast, setSongToast] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(MusicSynth.isMuted);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return TelemetryStore.subscribeTelemetry(data => {
      setRaceTelemetry(data);
    });
  }, []);

  const handleToggleCam = () => {
    const nextCam =
      settings.cameraView === 'chase' ? 'far' : settings.cameraView === 'far' ? 'hood' : 'chase';
    updateSettings({ cameraView: nextCam });
    const label =
      nextCam === 'chase' ? 'ARCADE CHASE' : nextCam === 'far' ? 'AERIAL OVERVIEW' : 'HOOD / BUMPER COCKPIT';
    setCamToast(label);
  };

  useEffect(() => {
    if (!camToast) return;
    const t = setTimeout(() => setCamToast(null), 1500);
    return () => clearTimeout(t);
  }, [camToast]);

  const handleNextSong = () => {
    const next = MusicSynth.nextTrack();
    setCurrentSong(next);
    setSongToast(`RADIO: ${next.name} [${next.genre}]`);
  };

  const handleToggleMute = () => {
    MusicSynth.isMuted = !MusicSynth.isMuted;
    setIsMuted(MusicSynth.isMuted);
    if (!MusicSynth.isMuted) {
      MusicSynth.start();
    } else {
      MusicSynth.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      MusicSynth.playCustomAudioFile(file);
      const custom = MusicSynth.getCurrentTrack();
      setCurrentSong(custom);
      setSongToast(`CUSTOM: ${custom.name}`);
    }
  };

  useEffect(() => {
    if (!songToast) return;
    const t = setTimeout(() => setSongToast(null), 2500);
    return () => clearTimeout(t);
  }, [songToast]);

  // Keyboard hotkeys for Music (N = Next Song, M = Mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyN') {
        handleNextSong();
      } else if (e.code === 'KeyM') {
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetCar = () => {
    InputManager.requestReset();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-6 select-none overflow-hidden">
      {/* --- TOP BAR: Lap, Timer, Positions, Radio, Controls --- */}
      <div className="flex justify-between items-start w-full">
        {/* Left: Position & Lap */}
        <div className="flex gap-2.5 md:gap-3 items-center">
          {/* Position Badge */}
          <div className="arcade-glass rounded-2xl px-3.5 py-2 flex flex-col items-center justify-center border-l-4 border-l-cyan-400">
            <span className="text-[10px] md:text-xs font-arcade text-gray-400 tracking-wider">POS</span>
            <div className="flex items-baseline gap-1">
              <span className="font-arcade text-2xl md:text-4xl font-black text-neon-cyan">
                {raceTelemetry.position}
              </span>
              <span className="text-[10px] md:text-sm font-arcade text-gray-400">
                / {raceTelemetry.totalRacers}
              </span>
            </div>
          </div>

          {/* Lap Counter */}
          <div className="arcade-glass rounded-2xl px-3.5 py-2 flex flex-col justify-center">
            <span className="text-[10px] md:text-xs font-arcade text-gray-400 tracking-wider">LAP</span>
            <div className="flex items-baseline gap-1">
              <span className="font-arcade text-xl md:text-3xl font-bold text-white">
                {raceTelemetry.lap}
              </span>
              <span className="text-[10px] md:text-sm font-arcade text-gray-400">
                / {raceTelemetry.totalLaps}
              </span>
            </div>
          </div>

          {/* Race Time & Best Lap */}
          <div className="hidden sm:flex arcade-glass rounded-2xl px-3.5 py-2 flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-arcade text-gray-400">TIME:</span>
              <span className="font-arcade text-sm md:text-base font-bold text-yellow-400">
                {MathUtils.formatTime(raceTelemetry.raceTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-arcade text-gray-400">BEST:</span>
              <span className="font-arcade text-xs text-gray-300">
                {raceTelemetry.bestLapTime > 0 ? MathUtils.formatTime(raceTelemetry.bestLapTime) : '--:--.--'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: In-Game Radio Station Player Widget */}
        <div className="hidden md:flex arcade-glass rounded-2xl px-3 py-1.5 items-center gap-2.5 pointer-events-auto border border-cyan-500/30">
          <button
            onClick={handleToggleMute}
            className="text-cyan-400 hover:text-white transition-colors"
            title="Mute / Unmute Music (M)"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="flex flex-col">
            <span className="text-[9px] font-arcade text-gray-400 tracking-wider">RADIO (N)</span>
            <span className="text-xs font-arcade text-white font-bold truncate max-w-[130px]">
              {currentSong.name}
            </span>
          </div>
          <button
            onClick={handleNextSong}
            className="p-1 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-cyan-300 transition-all active:scale-95"
            title="Next Track (N)"
          >
            <SkipForward size={14} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-gray-300 hover:text-white transition-all"
            title="Upload Custom Song MP3"
          >
            <Upload size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Right: Quick Action Buttons & Minimap */}
        <div className="flex items-start gap-2.5 md:gap-3">
          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={pauseRace}
              title="Pause (Esc)"
              className="w-9 h-9 md:w-11 md:h-11 rounded-xl arcade-glass flex items-center justify-center text-white hover:text-cyan-400 hover:border-cyan-400 transition-all active:scale-95"
            >
              <Pause size={18} />
            </button>

            <button
              onClick={handleToggleCam}
              title="Cycle Camera (C)"
              className="w-9 h-9 md:w-11 md:h-11 rounded-xl arcade-glass flex items-center justify-center text-white hover:text-cyan-400 hover:border-cyan-400 transition-all active:scale-95"
            >
              <Camera size={18} />
            </button>

            <button
              onClick={handleResetCar}
              title="Reset Car (R)"
              className="w-9 h-9 md:w-11 md:h-11 rounded-xl arcade-glass flex items-center justify-center text-yellow-400 hover:text-yellow-300 hover:border-yellow-400 transition-all active:scale-95"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Minimap Radar */}
          <div className="block pointer-events-auto">
            <Minimap />
          </div>
        </div>
      </div>

      {/* --- CENTER: Camera Toast, Song Toast, Wrong-Way Warning & Countdown Overlay --- */}
      <div className="flex flex-col items-center justify-center my-auto">
        {/* Camera View Switch Toast */}
        {camToast && (
          <div className="arcade-glass px-5 py-2 rounded-full border border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center gap-2 mb-3 animate-fade-in">
            <Camera size={16} className="text-cyan-400" />
            <span className="font-arcade text-xs md:text-sm font-bold tracking-wider text-cyan-300">
              {camToast}
            </span>
          </div>
        )}

        {/* Song Notification Toast */}
        {songToast && (
          <div className="arcade-glass px-5 py-2 rounded-full border border-yellow-400/50 shadow-[0_0_25px_rgba(255,200,0,0.4)] flex items-center gap-2 mb-3 animate-fade-in">
            <Music size={16} className="text-yellow-400 animate-pulse" />
            <span className="font-arcade text-xs md:text-sm font-bold tracking-wider text-yellow-300">
              {songToast}
            </span>
          </div>
        )}

        {/* Wrong Way Warning */}
        {raceTelemetry.wrongWay && (
          <div className="arcade-glass-red px-6 py-3 rounded-2xl flex items-center gap-3 border-2 border-red-500 animate-bounce mb-4">
            <AlertTriangle className="text-red-500 animate-pulse" size={28} />
            <span className="font-arcade font-black text-2xl md:text-3xl text-red-500 tracking-wider">
              WRONG WAY!
            </span>
          </div>
        )}

        {/* 3-2-1-GO Countdown Overlay */}
        {gameState === 'COUNTDOWN' && (
          <div className="flex flex-col items-center">
            {raceTelemetry.countdown > 0 ? (
              <div className="font-arcade text-7xl md:text-9xl font-black text-neon-yellow drop-shadow-2xl animate-pulse">
                {raceTelemetry.countdown}
              </div>
            ) : (
              <div className="font-arcade text-7xl md:text-9xl font-black text-neon-cyan drop-shadow-2xl scale-125 transition-transform duration-300">
                GO!
              </div>
            )}
            <span className="font-arcade text-sm md:text-base text-gray-300 tracking-widest mt-2">
              REV UP AND GET READY!
            </span>
          </div>
        )}
      </div>

      {/* --- BOTTOM BAR: Speedometer, Gear, RPM, Nitro Bar --- */}
      <div className="flex justify-between items-end w-full">
        {/* Bottom Left: Nitro Energy Gauge */}
        <div className="arcade-glass rounded-2xl p-3 md:p-4 w-44 md:w-56 border-b-4 border-b-cyan-500">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap size={16} className={raceTelemetry.nitro > 20 ? 'text-cyan-400' : 'text-gray-500'} />
              <span className="text-xs font-arcade font-bold tracking-wider text-cyan-300">NITRO</span>
            </div>
            <span className="text-xs font-arcade font-bold text-white">{raceTelemetry.nitro}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-black/60 rounded-full h-3.5 p-0.5 overflow-hidden border border-cyan-500/30">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                raceTelemetry.nitro > 50
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_12px_#00f0ff]'
                  : raceTelemetry.nitro > 20
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${raceTelemetry.nitro}%` }}
            />
          </div>
          <div className="text-[9px] font-arcade text-gray-400 mt-1 flex justify-between">
            <span>SHIFT / BOOST</span>
            <span>AUTO RECHARGE</span>
          </div>
        </div>

        {/* Bottom Right: Digital Speedometer & Tachometer */}
        <div className="arcade-glass rounded-2xl p-3 md:p-5 flex flex-col items-end border-r-4 border-r-cyan-400">
          {/* RPM Bars */}
          <div className="flex gap-1 mb-2">
            {[...Array(12)].map((_, i) => {
              const active = i / 12 <= raceTelemetry.rpmRatio;
              const isRedline = i >= 9;
              return (
                <div
                  key={i}
                  className={`w-2 md:w-3 h-2.5 rounded-sm transition-colors duration-75 ${
                    active
                      ? isRedline
                        ? 'bg-red-500 shadow-[0_0_8px_#ff0033]'
                        : 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]'
                      : 'bg-gray-800'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-baseline gap-2">
            {/* Gear Indicator */}
            <div className="arcade-glass rounded-lg px-2.5 py-1 text-center mr-1">
              <span className="text-[9px] font-arcade text-gray-400 block leading-none">GEAR</span>
              <span className="font-arcade text-xl md:text-2xl font-black text-yellow-400">
                {raceTelemetry.gear}
              </span>
            </div>

            {/* Speed Value */}
            <span className="font-arcade text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-lg">
              {raceTelemetry.speedKmH}
            </span>
            <span className="font-arcade text-xs md:text-sm text-cyan-400 font-bold">KM/H</span>
          </div>
        </div>
      </div>
    </div>
  );
};
