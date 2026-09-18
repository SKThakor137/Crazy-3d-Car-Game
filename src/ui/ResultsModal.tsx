import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGame } from '../game/GameStateContext';
import { TRACKS_DATA } from '../data/TrackConfigs';
import { MathUtils } from '../utils/MathUtils';
import { SoundSynth } from '../audio/SoundSynth';
import { Trophy, RotateCcw, ArrowRight, Home, Zap, Clock, Award } from 'lucide-react';

import { TelemetryStore } from '../game/TelemetryStore';

export const ResultsModal: React.FC = () => {
  const {
    gameState,
    restartRace,
    goToMenu,
    goToGarage,
    goToTrackSelect,
    selectedTrackId,
    setSelectedTrackId,
  } = useGame();

  const raceTelemetry = TelemetryStore.current;
  const racers = TelemetryStore.racers;
  const isWin = raceTelemetry.position === 1;
  const isPodium = raceTelemetry.position <= 3;

  useEffect(() => {
    if (gameState === 'FINISHED' && isPodium) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff0077', '#ffea00', '#00ff88'],
        });
      } catch (e) {
        // ignore
      }
    }
  }, [gameState, isPodium]);

  if (gameState !== 'FINISHED') return null;

  const handleNextTrack = () => {
    SoundSynth.playClick();
    const trackKeys = Object.keys(TRACKS_DATA);
    const currIdx = trackKeys.indexOf(selectedTrackId);
    const nextKey = trackKeys[(currIdx + 1) % trackKeys.length];
    setSelectedTrackId(nextKey);
    restartRace();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl arcade-glass rounded-3xl p-6 md:p-8 border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col items-center">
        {/* Podium Trophy / Badge */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-3 shadow-2xl ${
            isWin
              ? 'bg-gradient-to-tr from-yellow-600 to-amber-400 text-black border-2 border-yellow-200 animate-pulse-glow'
              : isPodium
              ? 'bg-gradient-to-tr from-cyan-600 to-blue-400 text-white border border-cyan-300'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          {isWin ? <Trophy size={42} /> : isPodium ? <Award size={42} /> : <Zap size={38} />}
        </div>

        {/* Title */}
        <h2 className="font-arcade text-3xl md:text-5xl font-black text-white tracking-wider text-center">
          {isWin ? '1ST PLACE VICTORY!' : isPodium ? 'PODIUM FINISH!' : 'RACE FINISHED'}
        </h2>
        <span className="text-xs font-arcade text-cyan-400 tracking-widest mt-1 mb-6">
          GRAND PRIX COMPLETED
        </span>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {/* Position */}
          <div className="arcade-glass rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-[10px] font-arcade text-gray-400">POSITION</span>
            <span className="font-arcade text-2xl md:text-3xl font-black text-neon-cyan">
              #{raceTelemetry.position}
            </span>
          </div>

          {/* Total Race Time */}
          <div className="arcade-glass rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-[10px] font-arcade text-gray-400">TOTAL TIME</span>
            <span className="font-arcade text-lg md:text-xl font-bold text-yellow-400 mt-1">
              {MathUtils.formatTime(raceTelemetry.raceTime)}
            </span>
          </div>

          {/* Fastest Lap */}
          <div className="arcade-glass rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="text-[10px] font-arcade text-gray-400">BEST LAP</span>
            <span className="font-arcade text-lg md:text-xl font-bold text-white mt-1">
              {MathUtils.formatTime(raceTelemetry.bestLapTime)}
            </span>
          </div>
        </div>

        {/* Final Standings Leaderboard with Full Race Details */}
        <div className="w-full bg-black/60 rounded-2xl p-3 md:p-4 border border-white/10 mb-6 max-h-56 overflow-y-auto">
          <div className="flex justify-between items-center text-[10px] font-arcade text-gray-400 tracking-wider pb-2 border-b border-white/10 px-2">
            <span className="w-10">POS</span>
            <span className="flex-1 text-left">RACER</span>
            <span className="w-20 text-center">BEST LAP</span>
            <span className="w-24 text-right">TOTAL TIME</span>
            <span className="w-20 text-right">GAP</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            {racers.map((racer, idx) => {
              const leaderTime = racers[0]?.finishTime > 0 ? racers[0].finishTime : raceTelemetry.raceTime;
              const isFirst = idx === 0;

              let finalTime = racer.finishTime;
              let gapStr = '--';

              if (isFirst) {
                finalTime = leaderTime;
                gapStr = 'WINNER';
              } else if (racer.finished && racer.finishTime > 0) {
                finalTime = racer.finishTime;
                const gap = Math.max(0.1, racer.finishTime - leaderTime);
                gapStr = `+${gap.toFixed(2)}s`;
              } else {
                // Realistic calculated gap based on track progression
                const progressDiff = Math.max(0.05, racers[0].totalDistance - racer.totalDistance);
                const simulatedGap = progressDiff * 4.2 + idx * 1.2;
                finalTime = leaderTime + simulatedGap;
                gapStr = `+${simulatedGap.toFixed(2)}s`;
              }

              const bestLapStr =
                racer.bestLapTime > 0
                  ? MathUtils.formatTime(racer.bestLapTime)
                  : '--:--';

              return (
                <div
                  key={racer.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-arcade transition-all ${
                    racer.isPlayer
                      ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/20 border border-cyan-400/50 text-cyan-200 font-bold shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : idx === 0
                      ? 'bg-amber-500/15 border border-amber-400/30 text-amber-200'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {/* Position */}
                  <div className="w-10 flex items-center gap-1">
                    <span
                      className={`font-black ${
                        idx === 0
                          ? 'text-yellow-400 text-sm'
                          : idx === 1
                          ? 'text-gray-200'
                          : idx === 2
                          ? 'text-amber-600'
                          : 'text-gray-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Racer Name & Badge */}
                  <div className="flex-1 flex items-center gap-2 truncate pr-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: racer.color }}
                    />
                    <span className="truncate">{racer.name}</span>
                    {racer.isPlayer && (
                      <span className="bg-cyan-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* Best Lap */}
                  <div className="w-20 text-center text-[11px] text-gray-300">
                    {bestLapStr}
                  </div>

                  {/* Total Time */}
                  <div className="w-24 text-right font-mono font-bold text-yellow-300 text-[11px]">
                    {MathUtils.formatTime(finalTime)}
                  </div>

                  {/* Gap to Winner */}
                  <div
                    className={`w-20 text-right text-[10px] font-bold ${
                      isFirst ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                  >
                    {gapStr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
          <button
            onClick={() => {
              SoundSynth.playClick();
              restartRace();
            }}
            className="arcade-btn arcade-glass rounded-xl p-3 flex flex-col items-center justify-center text-white hover:text-cyan-400 text-xs font-arcade"
          >
            <RotateCcw size={18} className="mb-1" />
            <span>RESTART</span>
          </button>

          <button
            onClick={handleNextTrack}
            className="arcade-btn bg-cyan-500 hover:bg-cyan-400 rounded-xl p-3 flex flex-col items-center justify-center text-black text-xs font-arcade font-bold shadow-lg shadow-cyan-500/30"
          >
            <ArrowRight size={18} className="mb-1" />
            <span>NEXT TRACK</span>
          </button>

          <button
            onClick={() => {
              SoundSynth.playClick();
              goToGarage();
            }}
            className="arcade-btn arcade-glass rounded-xl p-3 flex flex-col items-center justify-center text-white hover:text-cyan-400 text-xs font-arcade"
          >
            <Award size={18} className="mb-1" />
            <span>GARAGE</span>
          </button>

          <button
            onClick={() => {
              SoundSynth.playClick();
              goToMenu();
            }}
            className="arcade-btn arcade-glass rounded-xl p-3 flex flex-col items-center justify-center text-gray-400 hover:text-white text-xs font-arcade"
          >
            <Home size={18} className="mb-1" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

