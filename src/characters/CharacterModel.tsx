import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface StandingCharacterProps {
  gender: 'male' | 'female';
  position?: [number, number, number];
  rotation?: [number, number, number];
  armPose?: 'idle' | 'handshake' | 'wave' | 'thumbsup' | number;
  animationProgress?: number;
  isWalking?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Soft Ground Foot Shadow Texture for Characters
// ─────────────────────────────────────────────────────────────
const useCharacterFootShadowTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 58);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// ─────────────────────────────────────────────────────────────
// Official Three.js Rigged Male Character (Soldier.glb)
// ─────────────────────────────────────────────────────────────
const MaleSoldierCharacter: React.FC<{
  armPose?: 'idle' | 'handshake' | 'wave' | 'thumbsup' | number;
  isWalking?: boolean;
}> = ({ isWalking = false }) => {
  const gltf = useGLTF('/models/Soldier.glb');
  const footShadowTex = useCharacterFootShadowTexture();

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(gltf.scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<{ [name: string]: THREE.AnimationAction }>({});
  const activeActionNameRef = useRef<string>('Idle');

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const actions: { [name: string]: THREE.AnimationAction } = {};
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      actions[clip.name] = action;
    });
    actionsRef.current = actions;

    // Start with Idle action
    if (actions['Idle']) {
      actions['Idle'].play();
      activeActionNameRef.current = 'Idle';
    }

    return () => {
      mixer.stopAllAction();
    };
  }, [clonedScene, gltf.animations]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (mixerRef.current) {
      mixerRef.current.update(dt);
    }

    // Switch between Walk and Idle
    const targetActionName = isWalking ? 'Walk' : 'Idle';
    if (targetActionName !== activeActionNameRef.current) {
      const currentAction = actionsRef.current[activeActionNameRef.current];
      const nextAction = actionsRef.current[targetActionName];
      if (currentAction && nextAction) {
        currentAction.fadeOut(0.3);
        nextAction.reset().fadeIn(0.3).play();
        activeActionNameRef.current = targetActionName;
      }
    }
  });

  return (
    <group>
      {/* Soft Ground Contact Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial
          map={footShadowTex}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>

      {/* Cloned Skinned Character Mesh */}
      <primitive object={clonedScene} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
// Official Three.js Rigged Female Character (Michelle.glb)
// ─────────────────────────────────────────────────────────────
const FemaleMichelleCharacter: React.FC<{
  armPose?: 'idle' | 'handshake' | 'wave' | 'thumbsup' | number;
  isWalking?: boolean;
}> = ({ isWalking = false }) => {
  const gltf = useGLTF('/models/Michelle.glb');
  const footShadowTex = useCharacterFootShadowTexture();

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(gltf.scene);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const danceClip = gltf.animations.find((a) => a.name === 'SambaDance');
    if (danceClip) {
      const action = mixer.clipAction(danceClip);
      // Play at gentle, stylish idle tempo
      action.timeScale = 0.55;
      action.play();
    }

    return () => {
      mixer.stopAllAction();
    };
  }, [clonedScene, gltf.animations]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (mixerRef.current) {
      mixerRef.current.update(dt);
    }
  });

  return (
    <group scale={[1.05, 1.05, 1.05]}>
      {/* Soft Ground Contact Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial
          map={footShadowTex}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>

      {/* Cloned Skinned Character Mesh */}
      <primitive object={clonedScene} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
// Primary Export: StandingCharacter with Suspense Loading
// ─────────────────────────────────────────────────────────────
export const StandingCharacter: React.FC<StandingCharacterProps> = ({
  gender,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  armPose = 'idle',
  animationProgress,
  isWalking = false,
}) => {
  return (
    <group position={position} rotation={rotation}>
      <React.Suspense fallback={null}>
        {gender === 'male' ? (
          <MaleSoldierCharacter armPose={armPose} isWalking={isWalking} />
        ) : (
          <FemaleMichelleCharacter armPose={armPose} isWalking={isWalking} />
        )}
      </React.Suspense>
    </group>
  );
};
