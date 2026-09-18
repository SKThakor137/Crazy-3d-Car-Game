import React from 'react';
import { useGame } from '../game/GameStateContext';
import { SoundSynth } from '../audio/SoundSynth';
import { Volume2, Sliders, Monitor, Smartphone, Camera, X } from 'lucide-react';

import { MusicSynth } from '../audio/MusicSynth';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings } = useGame();

  const handleClose = () => {
    SoundSynth.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg arcade-glass rounded-3xl p-6 md:p-8 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sliders size={22} className="text-cyan-400" />
            <h2 className="font-arcade text-2xl font-black text-white">SETTINGS</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl arcade-glass flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Audio Section */}
          <div className="arcade-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-arcade font-bold">
              <Volume2 size={16} />
              <span>AUDIO CONTROLS</span>
            </div>

            {/* Master Volume */}
            <div>
              <div className="flex justify-between text-xs font-arcade text-gray-300 mb-1">
                <span>MASTER VOLUME</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={e => updateSettings({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex justify-between text-xs font-arcade text-gray-300 mb-1">
                <span>SOUND EFFECTS (ENGINE & CRASHES)</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={e => updateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Music Volume */}
            <div>
              <div className="flex justify-between text-xs font-arcade text-gray-300 mb-1">
                <span>SYNTHWAVE MUSIC</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={e => updateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Soundtrack Station Selector */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-arcade text-gray-400 mb-2">ACTIVE RADIO STATION (4 SOUNDTRACKS)</div>
              <div className="grid grid-cols-2 gap-2">
                {MusicSynth.TRACKS.map((trk, tIdx) => {
                  const isActive = MusicSynth.getCurrentTrack().id === trk.id;
                  return (
                    <button
                      key={trk.id}
                      onClick={() => {
                        SoundSynth.playClick();
                        MusicSynth.setTrack(tIdx);
                      }}
                      className={`px-2.5 py-2 rounded-xl font-arcade text-[10px] text-left transition-all truncate ${
                        isActive
                          ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                          : 'arcade-glass text-gray-300 hover:text-white'
                      }`}
                    >
                      {trk.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="arcade-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-arcade font-bold">
              <Monitor size={16} />
              <span>GRAPHICS PERFORMANCE</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map(qual => (
                <button
                  key={qual}
                  onClick={() => {
                    SoundSynth.playClick();
                    updateSettings({ graphicsQuality: qual });
                  }}
                  className={`py-2 rounded-xl font-arcade text-xs font-bold uppercase transition-all ${
                    settings.graphicsQuality === qual
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                      : 'arcade-glass text-gray-400 hover:text-white'
                  }`}
                >
                  {qual}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Perspective */}
          <div className="arcade-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-arcade font-bold">
              <Camera size={16} />
              <span>DRIVING CAMERA VIEW</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'chase' as const, label: 'CHASE' },
                { id: 'far' as const, label: 'AERIAL' },
                { id: 'hood' as const, label: 'HOOD' },
              ].map(cam => (
                <button
                  key={cam.id}
                  onClick={() => {
                    SoundSynth.playClick();
                    updateSettings({ cameraView: cam.id });
                  }}
                  className={`py-2 rounded-xl font-arcade text-xs font-bold uppercase transition-all ${
                    settings.cameraView === cam.id
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                      : 'arcade-glass text-gray-400 hover:text-white'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls & Sensitivity */}
          <div className="arcade-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-arcade font-bold">
              <Smartphone size={16} />
              <span>CONTROLS CONFIGURATION</span>
            </div>

            {/* Steering Sensitivity */}
            <div>
              <div className="flex justify-between text-xs font-arcade text-gray-300 mb-1">
                <span>STEERING SENSITIVITY</span>
                <span>{settings.steeringSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.steeringSensitivity}
                onChange={e => updateSettings({ steeringSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Touch Controls mode */}
            <div>
              <span className="text-xs font-arcade text-gray-300 block mb-1">
                ON-SCREEN TOUCH CONTROLS
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'always', 'never'] as const).map(tc => (
                  <button
                    key={tc}
                    onClick={() => {
                      SoundSynth.playClick();
                      updateSettings({ touchControls: tc });
                    }}
                    className={`py-1.5 rounded-xl font-arcade text-xs font-bold uppercase transition-all ${
                      settings.touchControls === tc
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                        : 'arcade-glass text-gray-400 hover:text-white'
                    }`}
                  >
                    {tc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={handleClose}
          className="arcade-btn w-full bg-cyan-500 hover:bg-cyan-400 text-black font-arcade font-black text-sm py-3 rounded-xl mt-6 shadow-xl shadow-cyan-500/30"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};

