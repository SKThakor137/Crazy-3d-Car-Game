import React from 'react';
import { useGame } from '../game/GameStateContext';
import { TRACKS_DATA, TrackConfig } from '../data/TrackConfigs';
import { SoundSynth } from '../audio/SoundSynth';
import { MathUtils } from '../utils/MathUtils';
import { ArrowLeft, Play, Flag, Trophy, Clock, Zap } from 'lucide-react';

export const TrackSelectView: React.FC = () => {
  const {
    selectedTrackId,
    setSelectedTrackId,
    difficulty,
    setDifficulty,
    startIntro,
    goToMenu,
    goToGarage,
    progress,
  } = useGame();

  const tracks = Object.values(TRACKS_DATA);

  const handleSelectTrack = (trackId: string) => {
    SoundSynth.playClick();
    setSelectedTrackId(trackId);
  };

  const handleStartRace = () => {
    SoundSynth.playClick();
    startIntro();
  };

  return (
    <div className="relative w-full h-full select-none overflow-y-auto bg-gradient-to-b from-[#060814] via-[#0b0f1f] to-black p-4 md:p-8 flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto mb-6">
        <button
          onClick={() => {
            SoundSynth.playClick();
            goToMenu();
          }}
          className="arcade-btn arcade-glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-white hover:text-cyan-400"
        >
          <ArrowLeft size={18} />
          <span className="font-arcade text-xs">MAIN MENU</span>
        </button>

        <div className="text-center">
          <h1 className="font-arcade font-black text-2xl md:text-4xl text-white tracking-wider">
            CIRCUIT SELECTION
          </h1>
          <span className="text-[10px] md:text-xs font-arcade text-cyan-400 tracking-widest">
            CHOOSE YOUR RACING DESTINATION
          </span>
        </div>

        <button
          onClick={() => {
            SoundSynth.playClick();
            goToGarage();
          }}
          className="arcade-btn arcade-glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-cyan-400 hover:text-white"
        >
          <span className="font-arcade text-xs">GARAGE</span>
        </button>
      </div>

      {/* Difficulty Selector */}
      <div className="flex justify-center items-center gap-3 mb-6">
        <span className="text-xs font-arcade text-gray-400">AI DIFFICULTY:</span>
        {(['Easy', 'Normal', 'Hard'] as const).map(diff => (
          <button
            key={diff}
            onClick={() => {
              SoundSynth.playClick();
              setDifficulty(diff);
            }}
            className={`arcade-btn px-4 py-1.5 rounded-xl font-arcade text-xs font-bold transition-all ${
              difficulty === diff
                ? diff === 'Easy'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : diff === 'Normal'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'arcade-glass text-gray-400 hover:text-white'
            }`}
          >
            {diff.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tracks Grid (4 Scenic Circuits) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-7xl mx-auto w-full mb-8">
        {tracks.map(track => {
          const isSelected = selectedTrackId === track.id;
          const record = progress.trackRecords[track.id];

          return (
            <div
              key={track.id}
              onClick={() => handleSelectTrack(track.id)}
              className={`arcade-glass rounded-3xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.25)] scale-[1.02]'
                  : track.id === 'extreme-adventure'
                  ? 'border border-amber-500/50 hover:scale-[1.01] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'hover:border-cyan-500/50 hover:scale-[1.01] opacity-90'
              }`}
            >
              {/* Header Badge */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`text-[10px] font-arcade font-bold px-2.5 py-1 rounded-md ${
                      track.id === 'extreme-adventure'
                        ? 'bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-red-500/30 text-amber-300 border border-amber-500/60 shadow-sm shadow-amber-500/20 animate-pulse'
                        : track.difficulty === 'Beginner'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : track.difficulty === 'Intermediate'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    }`}
                  >
                    {track.id === 'extreme-adventure' ? '🔥 ALL ADVENTURES IN 1' : track.difficulty.toUpperCase()}
                  </span>

                  <span className="text-xs font-arcade text-gray-400 flex items-center gap-1">
                    <Flag size={14} className="text-cyan-400" />
                    {track.laps} LAPS
                  </span>
                </div>

                <h3 className="font-arcade text-2xl font-black text-white">{track.name}</h3>
                <span className="text-xs font-arcade text-cyan-400 block mb-2">{track.subtitle}</span>
                <p className="text-gray-400 text-xs leading-relaxed mb-3">{track.description}</p>

                {/* Adventure Feature Chips */}
                {track.id === 'extreme-adventure' && (
                  <div className="mb-4 flex flex-wrap gap-1 text-[9px] font-arcade font-bold">
                    <span className="bg-amber-500/25 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">🚀 2x MEGA JUMPS</span>
                    <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md">🐘 WILD ANIMALS</span>
                    <span className="bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md">🌊 PANI (RAPIDS)</span>
                    <span className="bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded-md">💩 KICHAD (MUD)</span>
                    <span className="bg-purple-500/25 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md">💎 CAVE TUNNEL</span>
                  </div>
                )}
              </div>

              {/* Track Stats & Records */}
              <div className="bg-black/50 rounded-2xl p-4 flex flex-col gap-2 border border-white/5">
                <div className="flex justify-between items-center text-xs font-arcade">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Zap size={14} className="text-yellow-400" />
                    LENGTH
                  </span>
                  <span className="text-white font-bold">{track.lengthMeters} M</span>
                </div>

                <div className="flex justify-between items-center text-xs font-arcade">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Clock size={14} className="text-cyan-400" />
                    BEST LAP
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {record && record.bestLapTime < 900
                      ? MathUtils.formatTime(record.bestLapTime)
                      : '--:--.--'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-arcade">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-400" />
                    RECORD
                  </span>
                  <span className="text-amber-400 font-bold">
                    {record && record.bestRaceTime < 900
                      ? MathUtils.formatTime(record.bestRaceTime)
                      : '--:--.--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Launch Race Button */}
      <div className="flex justify-center w-full max-w-md mx-auto mb-4">
        <button
          onClick={handleStartRace}
          className="arcade-btn w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-400 text-black font-arcade font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/40"
        >
          <Play size={24} fill="black" />
          <span>START GRAND PRIX</span>
        </button>
      </div>
    </div>
  );
};

