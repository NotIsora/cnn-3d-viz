'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LayerData } from '@/core/CNNEngine'; // Import shared type

interface LayerMeshProps {
  data: LayerData;
  position: [number, number, number];
  color?: string;
}

export const LayerMesh: React.FC<LayerMeshProps> = ({ 
  data, 
  position, 
  color = 'orange' 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // 1. Optimization: Use useMemo for geometry to avoid recreating it on every render
  const geometry = useMemo(() => {
    // Logic to determine geometry based on shape (e.g., Box for Conv2D, Plane for Dense)
    // Simplified for demo:
    const [d, h, w] = data.shape.slice(1); // Assuming [batch, height, width, depth]
    return new THREE.BoxGeometry(w || 1, h || 1, (d || 1) * 0.1);
  }, [data.shape]);

  // 2. Safety: Explicit Resource Disposal
  useEffect(() => {
    return () => {
      geometry.dispose();
      // If we created a custom material instance, we would dispose it here too.
    };
  }, [geometry]);

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial 
            color={color} 
            transparent 
            opacity={0.8} 
            side={THREE.DoubleSide} 
        />
      </mesh>
      {/* 3. UX: Add floating label for better context */}
      {/* <Text ... >{data.name}</Text> */} 
    </group>
  );
};
