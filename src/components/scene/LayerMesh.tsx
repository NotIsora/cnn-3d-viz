'use client';

import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { getOptimalGridSize } from '@/utils/math-utils';

interface LayerMeshProps {
  position: [number, number, number];
  count: number;
  color: string;
  layerName: string;
}

const LayerMesh: React.FC<LayerMeshProps> = ({ position, count, color, layerName }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Tính toán lưới grid
  const { cols } = useMemo(() => getOptimalGridSize(count), [count]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const spacing = 0.6; // Khoảng cách giữa các neuron
    const offsetX = (cols * spacing) / 2;
    const offsetY = (Math.ceil(count / cols) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const x = (i % cols) * spacing - offsetX;
      const y = Math.floor(i / cols) * spacing - offsetY;
      
      dummy.position.set(x, -y, 0);
      dummy.scale.setScalar(1); // Reset scale
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
      // Set màu mặc định
      meshRef.current.setColorAt(i, new THREE.Color(color));
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [count, cols, color, dummy]);

  return (
    <group position={position}>
      {/* Label tên Layer */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial roughness={0.3} metalness={0.2} />
      </instancedMesh>
    </group>
  );
};

export default LayerMesh;
