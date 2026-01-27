// src/components/scene/LayerMesh.tsx
'use client';

import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';

interface LayerMeshProps {
  position: [number, number, number]; // Vị trí của cả layer trong không gian 3D
  count: number;                      // Số lượng neuron trong layer này
  color: string;                      // Màu sắc của neuron
  gridSize?: number;                  // Kích thước lưới (ví dụ: 10x10)
  layerName: string;                  // Tên layer (để log hoặc debug)
}

const LayerMesh: React.FC<LayerMeshProps> = ({ 
  position, 
  count, 
  color, 
  gridSize,
  layerName 
}) => {
  // Ref tới InstancedMesh
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Tạo một Object3D tạm thời để tính toán ma trận (giúp tiết kiệm bộ nhớ)
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Tính toán kích thước lưới (cols x rows) dựa trên số lượng neuron
  const cols = gridSize || Math.ceil(Math.sqrt(count));
  
  useLayoutEffect(() => {
    if (!meshRef.current) return;

    // Khoảng cách giữa các neuron
    const spacing = 0.5; 
    
    // Căn giữa layer tại vị trí position
    const offsetX = (cols * spacing) / 2;
    const offsetY = (Math.ceil(count / cols) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      // Tính toán vị trí x, y trong lưới
      const x = (i % cols) * spacing - offsetX;
      const y = Math.floor(i / cols) * spacing - offsetY;
      
      // Đặt vị trí cho dummy object
      dummy.position.set(x, y, 0);
      dummy.updateMatrix();
      
      // Gán ma trận của dummy vào InstancedMesh tại index i
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    // Bắt buộc: Báo cho Three.js biết cần cập nhật instance matrix
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, cols, dummy]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]} // [Geometry, Material, Count]
      position={position}
      // Xử lý sự kiện hover/click (Future Proofing)
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Geometry: Sử dụng Box (nhẹ hơn Sphere) */}
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      
      {/* Material: MeshStandard để phản chiếu ánh sáng */}
      <meshStandardMaterial 
        color={color} 
        roughness={0.4}
        metalness={0.1}
      />
    </instancedMesh>
  );
};

export default LayerMesh;
