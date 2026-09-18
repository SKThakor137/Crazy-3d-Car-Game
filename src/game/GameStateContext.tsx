import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageManager, GameProgress, UserSettings } from '../utils/Storage';
import { CARS_DATA, DEFAULT_CAR_ID } from '../data/CarConfigs';
import { TRACKS_DATA, DEFAULT_TRACK_ID } from '../data/TrackConfigs';
import { SoundSynth } from '../audio/SoundSynth';
import { MusicSynth } from '../audio/MusicSynth';
import { TelemetryStore } from './TelemetryStore';

export type GameState = 
  | 'MENU'
  | 'GARAGE'
  | 'TRACK_SELECT'
  | 'INTRO_STORY'
  | 'COUNTDOWN'
  | 'RACING'
  | 'PAUSED'
  | 'FINISHED';

export type AIDifficulty = 'Easy' | 'Normal' | 'Hard';

interface GameContextType {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  selectedCarId: string;
  setSelectedCarId: (id: string) => void;
  selectedCarColor: string;
  setSelectedCarColor: (color: string) => void;
  selectedTrackId: string;
  setSelectedTrackId: (id: string) => void;
  difficulty: AIDifficulty;
  setDifficulty: (diff: AIDifficulty) => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  progress: GameProgress;
  startIntro: () => void;
  startCountdown: () => void;
  skipIntro: () => void;
  restartRace: () => void;
  pauseRace: () => void;
  resumeRace: () => void;
  finishRace: () => void;
  goToMenu: () => void;
  goToGarage: () => void;
  goToTrackSelect: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<GameProgress>(() => StorageManager.load());
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedCarId, setSelectedCarId] = useState<string>(progress.selectedCarId || DEFAULT_CAR_ID);
  const [selectedCarColor, setSelectedCarColor] = useState<string>(
    progress.carColors[selectedCarId] || CARS_DATA[selectedCarId]?.defaultColor || '#00f0ff'
  );
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    TRACKS_DATA[progress.selectedTrackId] ? progress.selectedTrackId : DEFAULT_TRACK_ID
  );
  const [difficulty, setDifficulty] = useState<AIDifficulty>('Normal');

  // Keep colors updated when switching cars
  useEffect(() => {
    const savedColor = progress.carColors[selectedCarId] || CARS_DATA[selectedCarId]?.defaultColor || '#00f0ff';
    setSelectedCarColor(savedColor);
  }, [selectedCarId]);

  // Audio setup on user interaction
  useEffect(() => {
    SoundSynth.setMasterVolume(progress.settings.masterVolume);
    SoundSynth.setSfxVolume(progress.settings.sfxVolume);
    MusicSynth.setMusicVolume(progress.settings.musicVolume);
    SoundSynth.isMuted = progress.settings.masterVolume <= 0;
    MusicSynth.isMuted = progress.settings.musicVolume <= 0 || progress.settings.masterVolume <= 0;
  }, [progress.settings]);

  // Manage music transitions
  useEffect(() => {
    if (gameState === 'RACING' || gameState === 'COUNTDOWN') {
      MusicSynth.start();
    } else if (gameState === 'MENU' || gameState === 'GARAGE' || gameState === 'TRACK_SELECT') {
      MusicSynth.start();
    }
  }, [gameState]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = StorageManager.updateSettings(newSettings);
    setProgress(updated);
  };

  const handleSetCarColor = (color: string) => {
    setSelectedCarColor(color);
    const updated = { ...progress, carColors: { ...progress.carColors, [selectedCarId]: color } };
    setProgress(updated);
    StorageManager.save(updated);
  };

  const startIntro = () => {
    SoundSynth.init();
    MusicSynth.init();
    const totalLaps = TRACKS_DATA[selectedTrackId]?.laps || 3;
    TelemetryStore.reset(totalLaps);
    setGameState('INTRO_STORY');
  };

  const startCountdown = () => {
    SoundSynth.init();
    MusicSynth.init();
    const totalLaps = TRACKS_DATA[selectedTrackId]?.laps || 3;
    TelemetryStore.reset(totalLaps);
    setGameState('COUNTDOWN');
  };

  const skipIntro = () => {
    setGameState('COUNTDOWN');
  };

  const restartRace = () => {
    SoundSynth.stopAll();
    startCountdown();
  };

  const pauseRace = () => {
    SoundSynth.stopAll();
    setGameState('PAUSED');
  };

  const resumeRace = () => {
    setGameState('RACING');
  };

  const finishRace = () => {
    SoundSynth.stopAll();
    setGameState('FINISHED');
    const telem = TelemetryStore.current;
    const isWin = telem.position === 1;
    const updated = StorageManager.recordRaceFinish(
      selectedTrackId,
      telem.raceTime,
      telem.bestLapTime,
      isWin
    );
    setProgress(updated);
  };

  const goToMenu = () => {
    SoundSynth.stopAll();
    setGameState('MENU');
  };

  const goToGarage = () => {
    SoundSynth.stopAll();
    setGameState('GARAGE');
  };

  const goToTrackSelect = () => {
    SoundSynth.stopAll();
    setGameState('TRACK_SELECT');
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        selectedCarId,
        setSelectedCarId,
        selectedCarColor,
        setSelectedCarColor: handleSetCarColor,
        selectedTrackId,
        setSelectedTrackId,
        difficulty,
        setDifficulty,
        settings: progress.settings,
        updateSettings,
        progress,
        startIntro,
        startCountdown,
        skipIntro,
        restartRace,
        pauseRace,
        resumeRace,
        finishRace,
        goToMenu,
        goToGarage,
        goToTrackSelect,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameStateProvider');
  }
  return context;
};
