import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const Sculpture = ({ hrv }) => {
  const meshRef = useRef();

  // Cambiar el tamaño de la esfera basado en HRV
  useFrame(() => {
    const scale = hrv ? 0.02 * hrv : 1;  // Escala base modificada por HRV
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={'orange'} />
    </mesh>
  );
};

const HRVSculpture = ({ hrv }) => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Sculpture hrv={hrv} />
    </Canvas>
  );
};

export default HRVSculpture;
