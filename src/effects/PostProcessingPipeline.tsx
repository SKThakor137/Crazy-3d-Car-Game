import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface PostProcessingPipelineProps {
  enabled?: boolean;
}

export const PostProcessingPipeline: React.FC<PostProcessingPipelineProps> = ({ enabled = true }) => {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    if (!enabled) return null;

    try {
      const comp = new EffectComposer(gl);
      comp.setSize(size.width, size.height);

      // Base Render pass
      const renderPass = new RenderPass(scene, camera);
      comp.addPass(renderPass);

      // Cinematic Optical Bloom (soft glow on taillights, headlights, neon crystals, sun glints)
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        0.32, // gentle bloom strength (not blinding)
        0.35, // radius
        0.82  // threshold: only bright highlights glow
      );
      comp.addPass(bloomPass);

      // Final Output pass (sRGB color conversion and ACES tone mapping integration)
      const outputPass = new OutputPass();
      comp.addPass(outputPass);

      return comp;
    } catch (e) {
      console.warn('PostProcessingPipeline initialization error:', e);
      return null;
    }
  }, [gl, scene, camera, enabled]);

  // Keep composer resolution in sync with canvas size
  useEffect(() => {
    if (composer) {
      composer.setSize(size.width, size.height);
    }
  }, [composer, size]);

  // Render composer every frame when enabled
  useFrame(() => {
    if (composer && enabled) {
      composer.render();
    }
  }, 1);

  return null;
};
