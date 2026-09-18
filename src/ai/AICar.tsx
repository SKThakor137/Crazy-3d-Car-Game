import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AIAgent } from './AIAgent';
import { CarModel } from '../cars/CarModel';

interface AICarProps {
  agent: AIAgent;
}

export const AICar: React.FC<AICarProps> = ({ agent }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(agent.position);
      groupRef.current.rotation.y = agent.heading;
    }
  });

  return (
    <group ref={groupRef} position={agent.position}>
      <CarModel
        config={agent.profile.carConfig}
        color={agent.profile.color}
        isBraking={agent.isBraking}
        isBoosting={agent.isBoosting}
        steeringAngle={agent.steeringAngle}
        wheelRotationSpeed={agent.speed * 2.8}
      />
    </group>
  );
};

