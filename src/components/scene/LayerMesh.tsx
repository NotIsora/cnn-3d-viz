'use client';

import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { LayerData } from '@/core/CNNEngine';
import { Text } from '@react-three/drei';

interface LayerMeshProps {
  data: LayerData;
  position: [number, number, number];
  colorBase: string;
}

export const LayerMesh: React.FC<LayerMeshProps> = ({ data, position, colorBase }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Tính toán vị trí các neurons/pixels dựa trên shape
  const { count, positions, colors } = useMemo(() => {
    // Shape chuẩn hóa: 
    // [H, W, Filters] cho Conv2D
    // [Units] cho Dense/Flatten
    const is3D = data.shape.length === 3;
    const height = is3D ? data.shape[0] : 1;
    const width = is3D ? data.shape[1] : Math.sqrt(data.shape[0]); // Giả lập grid cho Dense
    const depth = is3D ? data.shape[2] : 1;
    
    const count = data.activations.length;
    const tempPositions = new Float32Array(count * 3);
    const tempColors = new Float32Array(count * 3);
    const colorObj = new THREE.Color(colorBase);

    let idx = 0;
    // Sắp xếp các units thành Grid 3D
    // Layout: Các filter map xếp chồng lên nhau theo trục Z (depth)
    const SPACING = 1.2; // Khoảng cách giữa các unit
    
    for (let d = 0; d < depth; d++) {
        for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
                // Tính index trong mảng 1 chiều activations
                // TFJS layout thường là: height -> width -> depth
                const activationVal = data.activations[idx];

                // Logic hiển thị: Nếu activation <= 0 (ReLU chết), làm mờ đi
                const intensity = Math.max(0.1, activationVal); 
                
                // Set color
                tempColors[idx * 3] = colorObj.r * intensity;
                tempColors[idx * 3 + 1] = colorObj.g * intensity;
                tempColors[idx * 3 + 2] = colorObj.b * intensity;

                // Set position (Center grid tại local origin)
                tempPositions[idx * 3] = (w - width / 2) * SPACING * 0.2;
                tempPositions[idx * 3 + 1] = -(h - height / 2) * SPACING * 0.2; // Y ngược
                tempPositions[idx * 3 + 2] = d * SPACING * 0.5; // Depth separation

                idx++;
                if (idx >= count) break;
            }
        }
    }
    
    return { count, positions: tempPositions, colors: tempColors };
  }, [data, colorBase]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const tempObject = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
        tempObject.position.set(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
        );
        tempObject.scale.setScalar(0.15); // Kích thước neuron
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
        meshRef.current.setColorAt(i, new THREE.Color(colors[i * 3], colors[i * 3+1], colors[i * 3+2]));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [data, count, positions, colors]);

  return (
    <group position={position}>
        <Text 
            position={[0, (data.shape[0] || 10) * 0.15 + 1, 0]} 
            fontSize={0.5} 
            color="white"
            anchorX="center"
            anchorY="bottom"
        >
            {data.name}
            {'\n'}
            {JSON.stringify(data.shape)}
        </Text>
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial toneMapped={false} />
        </instancedMesh>
    </group>
  );
};
