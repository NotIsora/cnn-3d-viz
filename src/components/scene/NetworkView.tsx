// src/components/scene/LayerMesh.tsx
'use client';

import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
// Import tiện ích vừa tạo
import { getOptimalGridSize, getActivationColor } from '@/utils/math-utils';

interface LayerMeshProps {
  position: [number, number, number];
  count: number;
  color: string;
  gridSize?: number;
  layerName: string;
  activations?: Float32Array; // Dữ liệu thật từ TensorFlow (Optional)
}

const LayerMesh: React.FC<LayerMeshProps> = ({ 
  position, 
  count, 
  color: baseColor, 
  gridSize,
  layerName,
  activations 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []); // Tránh tạo mới object trong loop

  // Sử dụng math-util để tính số cột
  const { cols } = useMemo(() => {
    if (gridSize) return { cols: gridSize, rows: Math.ceil(count / gridSize) };
    return getOptimalGridSize(count);
  }, [count, gridSize]);
  
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const spacing = 0.5;
    const offsetX = (cols * spacing) / 2;
    const offsetY = (Math.ceil(count / cols) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      // 1. Tính vị trí
      const x = (i % cols) * spacing - offsetX;
      const y = Math.floor(i / cols) * spacing - offsetY;
      
      dummy.position.set(x, -y, 0); // -y để lật đúng chiều ảnh
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // 2. Tính màu sắc (QUAN TRỌNG)
      if (activations && activations[i] !== undefined) {
        // Nếu có dữ liệu AI: Dùng hàm getActivationColor
        const activeColor = getActivationColor(activations[i]);
        meshRef.current.setColorAt(i, activeColor);
      } else {
        // Nếu không: Dùng màu cơ bản của layer
        tempColor.set(baseColor);
        // Làm tối nhẹ các neuron ngẫu nhiên để tạo hiệu ứng "matrix" đẹp mắt
        if (Math.random() > 0.8) tempColor.multiplyScalar(0.7); 
        meshRef.current.setColorAt(i, tempColor);
      }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

  }, [count, cols, baseColor, activations]); // Chạy lại khi activations thay đổi

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      position={position}
      // ... giữ nguyên phần event handler
    >
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshStandardMaterial 
        roughness={0.4}
        metalness={0.1}
      />
    </instancedMesh>
  );
};

export default LayerMesh;
