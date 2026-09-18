import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TrackConfig } from '../data/TrackConfigs';
import { TrackData } from './TrackGenerator';
import { MathUtils } from '../utils/MathUtils';

interface TrackWorldProps {
  config: TrackConfig;
  trackData: TrackData;
}

export const TrackWorld: React.FC<TrackWorldProps> = ({ config, trackData }) => {
  // Generate asphalt texture procedurally with road markings
  const roadTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Asphalt base
    ctx.fillStyle = config.roadColor;
    ctx.fillRect(0, 0, 512, 512);

    // Asphalt speckle texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.04})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Outer white lane borders
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 0, 8, 512);
    ctx.fillRect(512 - 24, 0, 8, 512);

    // Center dividing line (dashed yellow)
    ctx.fillStyle = '#ffcc00';
    const dashLength = 64;
    const gapLength = 64;
    for (let y = 16; y < 512; y += dashLength + gapLength) {
      ctx.fillRect(252, y, 8, dashLength);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }, [config.roadColor]);

  // Checkered start/finish line texture
  const finishTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const tileSize = 16;
    for (let x = 0; x < 256; x += tileSize) {
      for (let y = 0; y < 64; y += tileSize) {
        ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#ffffff' : '#151515';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Generate theme scenery props along the track spline
  const sceneryData = useMemo(() => {
    const spline = trackData.spline;
    const samples = 70;

    const palmTrees: Array<{ pos: [number, number, number]; rotY: number; scale: number }> = [];
    const pineTrees: Array<{ pos: [number, number, number]; scale: number }> = [];
    const rocks: Array<{ pos: [number, number, number]; scale: [number, number, number]; color: string }> = [];
    const sailboats: Array<{ pos: [number, number, number]; rotY: number; scale: number; sailColor: string }> = [];
    const umbrellas: Array<{ pos: [number, number, number]; color: string }> = [];

    const minSideDist = config.roadWidth / 2 + 12;

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const pt = spline.getPointAt(t);
      const tangent = spline.getTangentAt(t).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      // Place props on left and right sides with safe setback
      const sideOffsets = [
        -minSideDist - Math.random() * 22,
        minSideDist + Math.random() * 22,
      ];

      for (const offset of sideOffsets) {
        const pos = pt.clone().add(normal.clone().multiplyScalar(offset));

        // Guarantee scenery NEVER spawns on any section of the racetrack
        const nearestOnTrack = MathUtils.getClosestTOnCurve(spline, pos, 80);
        const clearanceRequired = config.roadWidth / 2 + 7.5;
        if (nearestOnTrack.distanceSq < clearanceRequired * clearanceRequired) {
          continue; // skip, keep road completely clear!
        }

        // Ground height: props away from track rest firmly on ground level
        const groundY = Math.max(0, pt.y * 0.15);

        if (config.theme === 'beach') {
          // Tropical Palm Trees
          if (Math.random() > 0.35) {
            palmTrees.push({
              pos: [pos.x, groundY, pos.z],
              rotY: Math.random() * Math.PI * 2,
              scale: 0.85 + Math.random() * 0.4,
            });
          }

          // Beach umbrellas on sandy side
          if (Math.abs(offset) > 20 && Math.random() > 0.7) {
            const umbrellaColors = ['#ff3b30', '#ff9500', '#007aff', '#ff2d55', '#ffcc00'];
            umbrellas.push({
              pos: [pos.x, groundY, pos.z],
              color: umbrellaColors[Math.floor(Math.random() * umbrellaColors.length)],
            });
          }

          // Coastal rocks along shore
          if (Math.random() > 0.75) {
            rocks.push({
              pos: [pos.x, groundY + 0.4, pos.z],
              scale: [3 + Math.random() * 2.5, 2 + Math.random() * 2, 3 + Math.random() * 2.5],
              color: '#8b8378',
            });
          }
        } else if (config.theme === 'forest') {
          // Lush Alpine Pine Trees
          pineTrees.push({
            pos: [pos.x, groundY, pos.z],
            scale: 0.9 + Math.random() * 0.6,
          });

          // Mountain boulders
          if (Math.random() > 0.6) {
            rocks.push({
              pos: [pos.x, groundY + 0.5, pos.z],
              scale: [3.5 + Math.random() * 3, 2.5 + Math.random() * 2.5, 3.5 + Math.random() * 3],
              color: '#696969',
            });
          }
        } else if (config.theme === 'adventure') {
          // Safari Acacia/Palm Trees along savanna
          if (t < 0.25 || t > 0.85) {
            palmTrees.push({
              pos: [pos.x, groundY, pos.z],
              rotY: Math.random() * Math.PI * 2,
              scale: 0.85 + Math.random() * 0.4,
            });
          }
          // Savannah Boulders (cleanly off-road)
          if (Math.random() > 0.55) {
            rocks.push({
              pos: [pos.x, groundY + 0.5, pos.z],
              scale: [3.5 + Math.random() * 3, 2.5 + Math.random() * 2.5, 3.5 + Math.random() * 3],
              color: '#8c6b45',
            });
          }
        } else {
          // Canyon Red Rock Mesas
          rocks.push({
            pos: [pos.x, groundY + 4, pos.z],
            scale: [8 + Math.random() * 12, 12 + Math.random() * 18, 8 + Math.random() * 12],
            color: Math.random() > 0.5 ? '#99441f' : '#b35924',
          });
        }
      }
    }

    // Adventure Safari wildlife and features
    const elephants: Array<{ pos: [number, number, number]; rotY: number; scale: number }> = [];
    const giraffes: Array<{ pos: [number, number, number]; rotY: number; scale: number }> = [];
    const megaRamps: Array<{ pos: [number, number, number]; rotY: number; width: number }> = [];
    const caveArches: Array<{ pos: THREE.Vector3; tangent: THREE.Vector3; width: number }> = [];
    let waterRapidsPos: THREE.Vector3 | null = null;
    let mudBogPos: THREE.Vector3 | null = null;

    if (config.theme === 'adventure') {
      // 1. Safari Elephants near river / waterhole (grounded at y = 0)
      [0.22, 0.25, 0.27].forEach((tVal, idx) => {
        const pt = spline.getPointAt(tVal);
        const tangent = spline.getTangentAt(tVal).normalize();
        const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
        const side = idx % 2 === 0 ? 1 : -1;
        const ePos = pt.clone().add(normal.multiplyScalar(side * (24 + idx * 4)));
        elephants.push({
          pos: [ePos.x, 0, ePos.z],
          rotY: Math.atan2(tangent.x, tangent.z) + (side > 0 ? -1.2 : 1.2),
          scale: 1.1 + idx * 0.1,
        });
      });

      // 2. Safari Giraffes under trees (grounded at y = 0)
      [0.20, 0.23, 0.28, 0.31].forEach((tVal, idx) => {
        const pt = spline.getPointAt(tVal);
        const tangent = spline.getTangentAt(tVal).normalize();
        const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
        const side = idx % 2 === 0 ? -1 : 1;
        const gPos = pt.clone().add(normal.multiplyScalar(side * (25 + idx * 3)));
        giraffes.push({
          pos: [gPos.x, 0, gPos.z],
          rotY: Math.atan2(tangent.x, tangent.z) + (side > 0 ? -0.8 : 0.8),
          scale: 1.0 + (idx % 2) * 0.2,
        });
      });

      // 3. Mega Launch Ramps: Ramp 1 (t=0.13) and Ramp 2 (t=0.85)
      [0.13, 0.85].forEach((tVal) => {
        const pt = spline.getPointAt(tVal);
        const tangent = spline.getTangentAt(tVal).normalize();
        megaRamps.push({
          pos: [pt.x, pt.y + 0.05, pt.z],
          rotY: Math.atan2(tangent.x, tangent.z),
          width: config.roadWidth,
        });
      });

      // 4. Crystal Mountain Cave Arches (t from 0.70 to 0.82)
      const caveCount = 9;
      for (let c = 0; c < caveCount; c++) {
        const tVal = 0.70 + (c / (caveCount - 1)) * 0.12;
        const pt = spline.getPointAt(tVal);
        const tangent = spline.getTangentAt(tVal).normalize();
        caveArches.push({
          pos: pt.clone(),
          tangent: tangent.clone(),
          width: config.roadWidth,
        });
      }

      // 5. River Rapids & Mud Bog center anchors
      waterRapidsPos = spline.getPointAt(0.34);
      mudBogPos = spline.getPointAt(0.53);
    }

    // Floating sailboats in ocean for beach theme
    if (config.theme === 'beach') {
      const sailColors = ['#ffffff', '#ff3b30', '#00f0ff', '#ffcc00'];
      for (let s = 0; s < 10; s++) {
        const angle = (s / 10) * Math.PI * 2;
        const dist = 280 + Math.random() * 120;
        sailboats.push({
          pos: [Math.cos(angle) * dist - 80, -0.2, Math.sin(angle) * dist - 80],
          rotY: Math.random() * Math.PI * 2,
          scale: 1.5 + Math.random() * 0.8,
          sailColor: sailColors[s % sailColors.length],
        });
      }
    }

    return { palmTrees, pineTrees, rocks, sailboats, umbrellas, elephants, giraffes, megaRamps, caveArches, waterRapidsPos, mudBogPos };
  }, [config.theme, config.roadWidth, trackData.spline]);

  return (
    <group>
      {/* Natural Outdoor Lighting & Sky Atmosphere */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />
      <directionalLight
        position={config.sunPosition}
        color={config.sunColor}
        intensity={2.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={10}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0005}
      />
      <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />

      {/* Sky Sphere Dome */}
      <mesh>
        <sphereGeometry args={[700, 32, 16]} />
        <meshBasicMaterial color={config.skyBackground} side={THREE.BackSide} />
      </mesh>

      {/* Ground Terrain (Lush Forest Grass or Golden Beach Sand) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
        <planeGeometry args={[1600, 1600, 32, 32]} />
        <meshStandardMaterial
          color={config.groundColor}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* --- OCEAN WATER FOR BEACH THEME --- */}
      {config.theme === 'beach' && (
        <group>
          {/* Deep Ocean Water Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-160, -0.6, -160]}>
            <planeGeometry args={[1400, 1400]} />
            <meshStandardMaterial
              color="#0099cc"
              roughness={0.08}
              metalness={0.85}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* Turquoise Shoreline Wave Fringe */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-80, -0.52, -80]}>
            <planeGeometry args={[600, 600]} />
            <meshStandardMaterial
              color="#00e5ff"
              roughness={0.15}
              metalness={0.6}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      )}

      {/* Road Ribbon Mesh */}
      <mesh geometry={trackData.roadGeometry} receiveShadow>
        <meshStandardMaterial
          map={roadTexture}
          roughness={0.65}
          metalness={0.12}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Kerbs (Vertex Colored) */}
      <mesh geometry={trackData.kerbLeftGeometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </mesh>
      <mesh geometry={trackData.kerbRightGeometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </mesh>

      {/* Low-Profile Sleek Guardrails (Open views over the scenery) */}
      <mesh geometry={trackData.barrierLeftGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={config.barrierColor}
          metalness={config.theme === 'forest' ? 0.2 : 0.8}
          roughness={config.theme === 'forest' ? 0.85 : 0.3}
        />
      </mesh>
      <mesh geometry={trackData.barrierRightGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={config.barrierColor}
          metalness={config.theme === 'forest' ? 0.2 : 0.8}
          roughness={config.theme === 'forest' ? 0.85 : 0.3}
        />
      </mesh>

      {/* Start / Finish Line Decal Box */}
      <mesh
        position={[
          trackData.startFinishGantryPosition.x,
          trackData.startFinishGantryPosition.y + 0.06,
          trackData.startFinishGantryPosition.z,
        ]}
        rotation={trackData.startFinishGantryRotation}
      >
        <planeGeometry args={[config.roadWidth, 4]} />
        <meshStandardMaterial map={finishTexture} roughness={0.4} />
      </mesh>

      {/* Overhead Start / Finish Gantry Arch */}
      <group
        position={trackData.startFinishGantryPosition}
        rotation={trackData.startFinishGantryRotation}
      >
        <mesh position={[-config.roadWidth / 2 - 1.2, 4.5, 0]} castShadow>
          <boxGeometry args={[1.0, 9, 1.0]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
        </mesh>
        <mesh position={[config.roadWidth / 2 + 1.2, 4.5, 0]} castShadow>
          <boxGeometry args={[1.0, 9, 1.0]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 8.8, 0]} castShadow>
          <boxGeometry args={[config.roadWidth + 3.8, 1.4, 1.2]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} />
        </mesh>
        {/* Banner */}
        <mesh position={[0, 8.8, 0.62]}>
          <planeGeometry args={[config.roadWidth - 2, 1.0]} />
          <meshStandardMaterial
            color="#ffcc00"
            emissive="#ff9900"
            emissiveIntensity={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* --- PROCEDURAL SCENERY: PALM TREES (BEACH) --- */}
      {sceneryData.palmTrees.map((palm, idx) => (
        <group key={`palm-${idx}`} position={palm.pos} rotation={[0, palm.rotY, 0]} scale={palm.scale}>
          {/* Curved Palm Trunk */}
          <mesh position={[0, 3, 0]} rotation={[0.08, 0, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.45, 6, 8]} />
            <meshStandardMaterial color="#7a5436" roughness={0.9} />
          </mesh>
          <mesh position={[0.25, 6.5, 0]} rotation={[0.15, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.28, 4, 8]} />
            <meshStandardMaterial color="#8b6239" roughness={0.9} />
          </mesh>

          {/* Coconut Cluster */}
          <mesh position={[0.4, 8.2, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#4a3018" roughness={0.8} />
          </mesh>

          {/* Tropical Palm Fronds (Star Canopy) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angleDeg, fIdx) => {
            const rad = (angleDeg * Math.PI) / 180;
            return (
              <mesh
                key={fIdx}
                position={[0.4 + Math.cos(rad) * 1.6, 8.2 - Math.sin(0.3) * 0.4, Math.sin(rad) * 1.6]}
                rotation={[0.35, rad, -0.4]}
                castShadow
              >
                <planeGeometry args={[3.2, 1.0]} />
                <meshStandardMaterial
                  color="#2e7d32"
                  roughness={0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* --- PROCEDURAL SCENERY: PINE TREES (FOREST) --- */}
      {sceneryData.pineTrees.map((pine, idx) => (
        <group key={`pine-${idx}`} position={pine.pos} scale={pine.scale}>
          {/* Tree Trunk */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.5, 5, 8]} />
            <meshStandardMaterial color="#4e3629" roughness={0.9} />
          </mesh>
          {/* Tier 1 Lower Cone */}
          <mesh position={[0, 4.5, 0]} castShadow>
            <coneGeometry args={[3.0, 4.0, 8]} />
            <meshStandardMaterial color="#1a472a" roughness={0.8} />
          </mesh>
          {/* Tier 2 Middle Cone */}
          <mesh position={[0, 6.8, 0]} castShadow>
            <coneGeometry args={[2.3, 3.5, 8]} />
            <meshStandardMaterial color="#235c34" roughness={0.8} />
          </mesh>
          {/* Tier 3 Top Cone */}
          <mesh position={[0, 8.8, 0]} castShadow>
            <coneGeometry args={[1.5, 3.0, 8]} />
            <meshStandardMaterial color="#2d6e3f" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* --- PROCEDURAL SCENERY: BEACH UMBRELLAS --- */}
      {sceneryData.umbrellas.map((umb, idx) => (
        <group key={`umb-${idx}`} position={umb.pos}>
          {/* Pole */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
            <meshStandardMaterial color="#dddddd" metalness={0.7} />
          </mesh>
          {/* Parasol Canopy */}
          <mesh position={[0, 2.3, 0]} castShadow>
            <coneGeometry args={[1.8, 0.7, 12]} />
            <meshStandardMaterial color={umb.color} roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* --- PROCEDURAL SCENERY: OCEAN SAILBOATS --- */}
      {sceneryData.sailboats.map((boat, idx) => (
        <group key={`boat-${idx}`} position={boat.pos} rotation={[0, boat.rotY, 0]} scale={boat.scale}>
          {/* Hull */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[2.2, 0.8, 5.0]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          {/* Mast */}
          <mesh position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 6.0, 8]} />
            <meshStandardMaterial color="#4a3018" roughness={0.7} />
          </mesh>
          {/* Sail */}
          <mesh position={[0, 3.8, 0.8]} rotation={[0, Math.PI / 2, 0]}>
            <coneGeometry args={[1.8, 4.5, 3]} />
            <meshStandardMaterial color={boat.sailColor} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* --- PROCEDURAL SCENERY: ROCKS & BOULDERS --- */}
      {sceneryData.rocks.map((rock, idx) => (
        <mesh key={`rock-${idx}`} position={rock.pos} scale={rock.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={rock.color} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* --- ADVENTURE SAFARI WILDLIFE: ELEPHANTS --- */}
      {config.theme === 'adventure' &&
        sceneryData.elephants.map((ele, idx) => (
          <ElephantMesh key={`elephant-${idx}`} pos={ele.pos} rotY={ele.rotY} scale={ele.scale} />
        ))}

      {/* --- ADVENTURE SAFARI WILDLIFE: GIRAFFES --- */}
      {config.theme === 'adventure' &&
        sceneryData.giraffes.map((gir, idx) => (
          <GiraffeMesh key={`giraffe-${idx}`} pos={gir.pos} rotY={gir.rotY} scale={gir.scale} />
        ))}

      {/* --- ADVENTURE MEGA LAUNCH RAMPS --- */}
      {config.theme === 'adventure' &&
        sceneryData.megaRamps.map((ramp, idx) => (
          <MegaRampMesh key={`mega-ramp-${idx}`} pos={ramp.pos} rotY={ramp.rotY} width={ramp.width} />
        ))}

      {/* --- ADVENTURE CRYSTAL CAVE TUNNEL --- */}
      {config.theme === 'adventure' && sceneryData.caveArches.length > 0 && (
        <CrystalCaveMesh arches={sceneryData.caveArches} />
      )}

      {/* --- ADVENTURE RIVER WATER RAPIDS ZONE --- */}
      {config.theme === 'adventure' && sceneryData.waterRapidsPos && (
        <WaterRapidsMesh centerPos={sceneryData.waterRapidsPos} roadWidth={config.roadWidth} />
      )}

      {/* --- ADVENTURE MUD BOG OFF-ROAD HAZARD ZONE --- */}
      {config.theme === 'adventure' && sceneryData.mudBogPos && (
        <MudBogMesh centerPos={sceneryData.mudBogPos} roadWidth={config.roadWidth} />
      )}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
// Procedural Safari Elephant Component
// ─────────────────────────────────────────────────────────────
const ElephantMesh: React.FC<{ pos: [number, number, number]; rotY: number; scale?: number }> = ({
  pos,
  rotY,
  scale = 1,
}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={scale}>
    {/* Sturdy Body */}
    <mesh position={[0, 2.2, 0]} castShadow>
      <boxGeometry args={[2.8, 2.2, 3.8]} />
      <meshStandardMaterial color="#6a6a72" roughness={0.9} />
    </mesh>
    {/* Head */}
    <mesh position={[0, 2.6, 2.4]} castShadow>
      <boxGeometry args={[1.7, 1.7, 1.7]} />
      <meshStandardMaterial color="#6a6a72" roughness={0.9} />
    </mesh>
    {/* Ears */}
    <mesh position={[-1.3, 2.7, 2.2]} rotation={[0, -0.3, 0]}>
      <boxGeometry args={[0.15, 1.8, 1.4]} />
      <meshStandardMaterial color="#5e5e66" roughness={0.9} />
    </mesh>
    <mesh position={[1.3, 2.7, 2.2]} rotation={[0, 0.3, 0]}>
      <boxGeometry args={[0.15, 1.8, 1.4]} />
      <meshStandardMaterial color="#5e5e66" roughness={0.9} />
    </mesh>
    {/* Trunk */}
    <mesh position={[0, 1.3, 3.1]} rotation={[0.4, 0, 0]}>
      <cylinderGeometry args={[0.22, 0.38, 2.0, 8]} />
      <meshStandardMaterial color="#6a6a72" roughness={0.9} />
    </mesh>
    {/* Curved Ivory Tusks */}
    <mesh position={[-0.5, 1.8, 2.9]} rotation={[0.7, 0, 0]}>
      <coneGeometry args={[0.11, 1.3, 8]} />
      <meshStandardMaterial color="#f7f5ed" roughness={0.3} />
    </mesh>
    <mesh position={[0.5, 1.8, 2.9]} rotation={[0.7, 0, 0]}>
      <coneGeometry args={[0.11, 1.3, 8]} />
      <meshStandardMaterial color="#f7f5ed" roughness={0.3} />
    </mesh>
    {/* 4 Pillars Legs */}
    {[-1.0, 1.0].map((x, xi) =>
      [-1.3, 1.3].map((z, zi) => (
        <mesh key={`e-leg-${xi}-${zi}`} position={[x, 1.0, z]} castShadow>
          <cylinderGeometry args={[0.38, 0.44, 2.0, 8]} />
          <meshStandardMaterial color="#5c5c64" roughness={0.9} />
        </mesh>
      ))
    )}
  </group>
);

// ─────────────────────────────────────────────────────────────
// Procedural Safari Giraffe Component
// ─────────────────────────────────────────────────────────────
const GiraffeMesh: React.FC<{ pos: [number, number, number]; rotY: number; scale?: number }> = ({
  pos,
  rotY,
  scale = 1,
}) => (
  <group position={pos} rotation={[0, rotY, 0]} scale={scale}>
    {/* Body */}
    <mesh position={[0, 3.4, 0]} rotation={[-0.2, 0, 0]} castShadow>
      <boxGeometry args={[1.2, 1.4, 2.4]} />
      <meshStandardMaterial color="#d49b4b" roughness={0.8} />
    </mesh>
    {/* Towering Neck */}
    <mesh position={[0, 5.5, 1.2]} rotation={[0.28, 0, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.34, 4.4, 8]} />
      <meshStandardMaterial color="#d49b4b" roughness={0.8} />
    </mesh>
    {/* Head */}
    <mesh position={[0, 7.5, 1.9]} castShadow>
      <boxGeometry args={[0.45, 0.5, 0.9]} />
      <meshStandardMaterial color="#b37b30" roughness={0.8} />
    </mesh>
    {/* Horns */}
    <mesh position={[-0.12, 7.9, 1.8]}>
      <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
      <meshStandardMaterial color="#543312" />
    </mesh>
    <mesh position={[0.12, 7.9, 1.8]}>
      <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
      <meshStandardMaterial color="#543312" />
    </mesh>
    {/* Slender Legs */}
    {[-0.45, 0.45].map((x, xi) =>
      [-0.9, 0.9].map((z, zi) => (
        <mesh key={`g-leg-${xi}-${zi}`} position={[x, 1.6, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 3.2, 6]} />
          <meshStandardMaterial color="#ba8135" roughness={0.8} />
        </mesh>
      ))
    )}
  </group>
);

// ─────────────────────────────────────────────────────────────
// Procedural Mega Jump Launch Ramp
// ─────────────────────────────────────────────────────────────
const MegaRampMesh: React.FC<{ pos: [number, number, number]; rotY: number; width: number }> = ({
  pos,
  rotY,
  width,
}) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    {/* Launch Wedge */}
    <mesh position={[0, 1.1, 0]} rotation={[-0.22, 0, 0]}>
      <boxGeometry args={[width + 1.2, 0.35, 9.0]} />
      <meshStandardMaterial color="#ffaa00" metalness={0.7} roughness={0.25} />
    </mesh>
    {/* Chevron Hazard Lip */}
    <mesh position={[0, 2.05, 4.4]}>
      <boxGeometry args={[width + 1.4, 0.4, 0.4]} />
      <meshStandardMaterial color="#ffcc00" emissive="#ff9900" emissiveIntensity={0.6} />
    </mesh>
    {/* Side Safety Warning Pillars */}
    <mesh position={[-width / 2 - 1.0, 2.6, 4.4]}>
      <boxGeometry args={[0.4, 2.4, 0.4]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    <mesh position={[width / 2 + 1.0, 2.6, 4.4]}>
      <boxGeometry args={[0.4, 2.4, 0.4]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    {/* Glowing Banner Sign */}
    <mesh position={[0, 3.8, 4.4]}>
      <boxGeometry args={[width + 1.6, 0.7, 0.2]} />
      <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={0.9} />
    </mesh>
  </group>
);

// ─────────────────────────────────────────────────────────────
// Procedural Crystal Mountain Cave Component
// ─────────────────────────────────────────────────────────────
const CrystalCaveMesh: React.FC<{ arches: Array<{ pos: THREE.Vector3; tangent: THREE.Vector3; width: number }> }> = ({
  arches,
}) => (
  <group>
    {arches.map((arch, idx) => {
      const rotY = Math.atan2(arch.tangent.x, arch.tangent.z);
      return (
        <group key={`cave-arch-${idx}`} position={arch.pos.toArray()} rotation={[0, rotY, 0]}>
          {/* Left Rock Pillar */}
          <mesh position={[-arch.width / 2 - 2.5, 4.8, 0]} castShadow>
            <cylinderGeometry args={[2.5, 3.2, 10, 7]} />
            <meshStandardMaterial color="#362a22" roughness={0.95} />
          </mesh>
          {/* Right Rock Pillar */}
          <mesh position={[arch.width / 2 + 2.5, 4.8, 0]} castShadow>
            <cylinderGeometry args={[2.5, 3.2, 10, 7]} />
            <meshStandardMaterial color="#362a22" roughness={0.95} />
          </mesh>
          {/* Massive Rock Tunnel Ceiling Arch */}
          <mesh position={[0, 9.6, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[3.2, 3.2, arch.width + 5.5, 8, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#261d17" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
          {/* Glowing Cyan Stalactite */}
          <mesh position={[-arch.width / 4, 8.0, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.55, 2.4, 6]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1.0} />
          </mesh>
          {/* Glowing Purple Stalactite */}
          <mesh position={[arch.width / 4, 8.0, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.55, 2.4, 6]} />
            <meshStandardMaterial color="#b026ff" emissive="#b026ff" emissiveIntensity={1.0} />
          </mesh>
          {/* Ground Crystals */}
          <mesh position={[-arch.width / 2 - 0.7, 0.7, 0]} rotation={[0.2, 0.3, -0.4]}>
            <coneGeometry args={[0.4, 1.7, 6]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[arch.width / 2 + 0.7, 0.7, 0]} rotation={[-0.2, -0.3, 0.4]}>
            <coneGeometry args={[0.4, 1.7, 6]} />
            <meshStandardMaterial color="#ff00cc" emissive="#ff00cc" emissiveIntensity={1.2} />
          </mesh>
        </group>
      );
    })}
  </group>
);

// ─────────────────────────────────────────────────────────────
// Procedural Water Rapids Zone Component
// ─────────────────────────────────────────────────────────────
const WaterRapidsMesh: React.FC<{ centerPos: THREE.Vector3; roadWidth: number }> = ({ centerPos, roadWidth }) => (
  <group position={[centerPos.x, centerPos.y - 0.15, centerPos.z]}>
    {/* Blue River Water Surface Plane */}
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[roadWidth * 2.6, 90]} />
      <meshStandardMaterial color="#1a9fd6" roughness={0.05} metalness={0.88} transparent opacity={0.78} />
    </mesh>
    {/* Rapids White Foam */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <planeGeometry args={[roadWidth * 2.2, 85]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} transparent opacity={0.3} />
    </mesh>
  </group>
);

// ─────────────────────────────────────────────────────────────
// Procedural Mud Bog Off-Road Hazard Zone Component
// ─────────────────────────────────────────────────────────────
const MudBogMesh: React.FC<{ centerPos: THREE.Vector3; roadWidth: number }> = ({ centerPos, roadWidth }) => (
  <group position={[centerPos.x, centerPos.y + 0.06, centerPos.z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[roadWidth + 2.0, 85]} />
      <meshStandardMaterial color="#382412" roughness={0.95} metalness={0.05} />
    </mesh>
    {/* Rutted Mud Tracks */}
    {[-3, 0, 3].map((offX, rIdx) => (
      <mesh key={`rut-${rIdx}`} position={[offX, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 80]} />
        <meshStandardMaterial color="#221509" roughness={0.9} />
      </mesh>
    ))}
  </group>
);
