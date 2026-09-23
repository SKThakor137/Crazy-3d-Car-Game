import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGame } from '../game/GameStateContext';
import { CARS_DATA, CarConfig } from '../data/CarConfigs';
import { CarModel } from '../cars/CarModel';
import { SoundSynth } from '../audio/SoundSynth';
import { ChevronLeft, ChevronRight, Play, ArrowLeft, Zap, Gauge, Flame } from 'lucide-react';

// Turntable rotating floor in garage
const GarageScene: React.FC<{ config: CarConfig; color: string }> = ({ config, color }) => {
  const turntableRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (turntableRef.current) {
      turntableRef.current.rotation.y += 0.4 * delta;
    }
  });

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 20, 15]} intensity={2.5} castShadow />
      <directionalLight position={[-10, 15, -15]} intensity={1.5} color="#00f0ff" />
      <pointLight position={[0, -0.5, 0]} intensity={4} color={color} distance={8} />

      {/* Studio Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#080a12" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Circular Turntable Platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0, 4.2, 48]} />
        <meshStandardMaterial color="#121624" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Platform Neon Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[4.1, 4.25, 48]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={2} />
      </mesh>

      {/* Rotating Car Group */}
      <group ref={turntableRef} position={[0, 0, 0]}>
        <CarModel config={config} color={color} />
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minPolarAngle={0.2}
      />
    </>
  );
};

export const GarageView: React.FC = () => {
  const {
    selectedCarId,
    setSelectedCarId,
    selectedCarColor,
    setSelectedCarColor,
    goToMenu,
    goToTrackSelect,
    startIntro,
  } = useGame();

  const carIds = Object.keys(CARS_DATA);
  const currentCar = CARS_DATA[selectedCarId] || CARS_DATA['apex-gt'];

  const handleNextCar = () => {
    SoundSynth.playClick();
    const idx = carIds.indexOf(selectedCarId);
    const nextId = carIds[(idx + 1) % carIds.length];
    setSelectedCarId(nextId);
  };

  const handlePrevCar = () => {
    SoundSynth.playClick();
    const idx = carIds.indexOf(selectedCarId);
    const prevId = carIds[(idx - 1 + carIds.length) % carIds.length];
    setSelectedCarId(prevId);
  };

  const handleColorPick = (col: string) => {
    SoundSynth.playClick();
    setSelectedCarColor(col);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-gradient-to-b from-[#060814] to-black">
      {/* Top Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-auto">
        <button
          onClick={() => {
            SoundSynth.playClick();
            goToMenu();
          }}
          className="arcade-btn arcade-glass rounded-xl px-4 py-2.5 flex items-center gap-2 text-white hover:text-cyan-400"
        >
          <ArrowLeft size={18} />
          <span className="font-arcade text-xs">BACK</span>
        </button>

        <div className="text-center">
          <h1 className="font-arcade font-black text-2xl md:text-3xl text-white tracking-wider">
            GARAGE
          </h1>
          <span className="text-[10px] md:text-xs font-arcade text-cyan-400 tracking-widest">
            VEHICLE CUSTOMIZATION & TUNING
          </span>
        </div>

        <button
          onClick={() => {
            SoundSynth.playClick();
            goToTrackSelect();
          }}
          className="arcade-btn bg-cyan-500 hover:bg-cyan-400 text-black font-arcade font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/30"
        >
          <span>SELECT TRACK</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 3D Turntable Canvas */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [0, 3, 8], fov: 45 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <GarageScene config={currentCar} color={selectedCarColor} />
        </Canvas>
      </div>

      {/* Left/Right Switch Car Arrows */}
      <button
        onClick={handlePrevCar}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-16 md:w-14 md:h-20 arcade-glass rounded-2xl flex items-center justify-center text-cyan-400 hover:text-white hover:scale-105 active:scale-95 transition-all pointer-events-auto"
      >
        <ChevronLeft size={36} />
      </button>

      <button
        onClick={handleNextCar}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-16 md:w-14 md:h-20 arcade-glass rounded-2xl flex items-center justify-center text-cyan-400 hover:text-white hover:scale-105 active:scale-95 transition-all pointer-events-auto"
      >
        <ChevronRight size={36} />
      </button>

      {/* Bottom Panel: Car Info, Stats, Color Palette, and Launch */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col md:flex-row gap-4 pointer-events-auto justify-between items-end">
        {/* Left: Car Title & Description */}
        <div className="arcade-glass rounded-2xl p-4 md:p-6 w-full md:max-w-md border-l-4 border-l-cyan-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-arcade text-[10px] font-bold">
              {currentCar.category}
            </span>
          </div>
          <h2 className="font-arcade text-3xl md:text-4xl font-black text-white mt-1">
            {currentCar.name}
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 leading-relaxed">
            {currentCar.description}
          </p>

          {/* Color Palette Selector */}
          <div className="mt-4">
            <span className="text-[10px] font-arcade text-gray-400 tracking-wider block mb-2">
              LIVERY PAINT COLOR
            </span>
            <div className="flex gap-2.5">
              {currentCar.availableColors.map(col => (
                <button
                  key={col}
                  onClick={() => handleColorPick(col)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    selectedCarColor === col
                      ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Car Performance Stats & Quick Race */}
        <div className="arcade-glass rounded-2xl p-4 md:p-6 w-full md:max-w-md flex flex-col gap-3">
          <span className="text-[10px] font-arcade text-gray-400 tracking-wider">
            PERFORMANCE METRICS
          </span>

          {/* Speed Stat */}
          <StatBar
            label="TOP SPEED"
            value={currentCar.stats.speed}
            icon={<Gauge size={14} className="text-cyan-400" />}
            color="bg-cyan-400"
          />

          {/* Acceleration Stat */}
          <StatBar
            label="ACCELERATION"
            value={currentCar.stats.acceleration}
            icon={<Zap size={14} className="text-yellow-400" />}
            color="bg-yellow-400"
          />

          {/* Handling Stat */}
          <StatBar
            label="HANDLING & GRIP"
            value={currentCar.stats.handling}
            icon={<ChevronRight size={14} className="text-emerald-400" />}
            color="bg-emerald-400"
          />

          {/* Nitro Stat */}
          <StatBar
            label="NITRO THRUST"
            value={currentCar.stats.nitro}
            icon={<Flame size={14} className="text-orange-400" />}
            color="bg-orange-500"
          />

          {/* Quick Race button */}
          <button
            onClick={() => {
              SoundSynth.playClick();
              startIntro();
            }}
            className="arcade-btn bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-arcade font-black text-sm py-3 rounded-xl mt-2 flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30"
          >
            <Play size={18} fill="black" />
            <span>RACE THIS CAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable animated Stat Bar component
const StatBar: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({
  label,
  value,
  icon,
  color,
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center text-xs font-arcade">
      <div className="flex items-center gap-1.5 text-gray-300">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-white font-bold">{value}/100</span>
    </div>
    <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);
