import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';

interface ProceduralSkyEnvProps {
  sunPosition?: [number, number, number];
  theme?: 'beach' | 'forest' | 'canyon' | 'adventure';
}

export const ProceduralSkyEnv: React.FC<ProceduralSkyEnvProps> = ({
  sunPosition = [80, 120, 70],
  theme = 'adventure',
}) => {
  const { gl, scene } = useThree();
  const cloudsRef = useRef<THREE.Group>(null);

  // Generate procedural HDRI environment map for realistic PBR car paint & clearcoat reflections
  useEffect(() => {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(gl);
      pmremGenerator.compileEquirectangularShader();

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      // 1. Sky-to-Ground Spherical Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 256);
      if (theme === 'canyon') {
        skyGrad.addColorStop(0.0, '#1a3356'); // Warm twilight zenith
        skyGrad.addColorStop(0.38, '#46729e');
        skyGrad.addColorStop(0.50, '#fca34d'); // Sunset orange horizon
        skyGrad.addColorStop(0.52, '#994420'); // Red rock ground
        skyGrad.addColorStop(1.0, '#381608');
      } else {
        skyGrad.addColorStop(0.0, '#0f3875'); // Deep crystal zenith blue
        skyGrad.addColorStop(0.40, '#4a94dd'); // Atmospheric azure
        skyGrad.addColorStop(0.49, '#dcf0ff'); // Bright horizon glow
        skyGrad.addColorStop(0.51, '#8c7b64'); // Earthy horizon line
        skyGrad.addColorStop(1.0, '#2e251b'); // Dark earth nadir
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 512, 256);

      // 2. High-Dynamic Radiant Sun Flare (sharp hotspot + corona glow)
      const sunGrad = ctx.createRadialGradient(340, 65, 0, 340, 65, 90);
      sunGrad.addColorStop(0.0, 'rgba(255, 255, 245, 1.0)');
      sunGrad.addColorStop(0.15, 'rgba(255, 245, 200, 0.9)');
      sunGrad.addColorStop(0.45, 'rgba(255, 210, 130, 0.35)');
      sunGrad.addColorStop(1.0, 'rgba(255, 180, 100, 0.0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(340, 65, 90, 0, Math.PI * 2);
      ctx.fill();

      // 3. Subtle horizontal cloud banding in reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let y = 80; y < 125; y += 14) {
        ctx.fillRect(0, y, 512, 6);
      }

      const envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;

      const renderTarget = pmremGenerator.fromEquirectangular(envTexture);
      scene.environment = renderTarget.texture;

      return () => {
        scene.environment = null;
        renderTarget.dispose();
        pmremGenerator.dispose();
        envTexture.dispose();
      };
    } catch (e) {
      console.warn('ProceduralSkyEnv setup error:', e);
    }
  }, [gl, scene, theme]);

  // Procedural 3D drifting cloud puffs
  const cloudData = useMemo(() => {
    const clouds: Array<{ x: number; y: number; z: number; scale: [number, number, number]; opacity: number }> = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 250 + Math.random() * 450;
      clouds.push({
        x: Math.cos(angle) * radius,
        y: 190 + Math.random() * 70,
        z: Math.sin(angle) * radius,
        scale: [60 + Math.random() * 50, 14 + Math.random() * 10, 35 + Math.random() * 30],
        opacity: 0.65 + Math.random() * 0.25,
      });
    }
    return clouds;
  }, []);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.003 * delta;
    }
  });

  return (
    <group>
      {/* Preetham Physical Atmospheric Sky with Rayleigh/Mie solar scattering */}
      <Sky
        distance={4500}
        sunPosition={sunPosition}
        turbidity={theme === 'canyon' ? 9 : 5}
        rayleigh={theme === 'canyon' ? 1.2 : 0.6}
        mieCoefficient={0.005}
        mieDirectionalG={0.82}
      />

      {/* Floating Volumetric Cloud Clusters */}
      <group ref={cloudsRef}>
        {cloudData.map((c, idx) => (
          <group key={idx} position={[c.x, c.y, c.z]}>
            {/* Center cloud puff */}
            <mesh scale={c.scale}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={c.opacity * 0.7}
                depthWrite={false}
              />
            </mesh>
            {/* Flanking secondary puff */}
            <mesh position={[c.scale[0] * 0.4, -2, 0]} scale={[c.scale[0] * 0.7, c.scale[1] * 0.85, c.scale[2] * 0.8]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial
                color="#f1f5f9"
                transparent
                opacity={c.opacity * 0.6}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
