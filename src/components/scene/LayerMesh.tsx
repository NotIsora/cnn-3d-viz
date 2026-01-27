import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useCNNStore, LayerData } from '@/store/useCNNStore';

interface LayerMeshProps {
  layer: LayerData;
  layerIndex: number;
  position: [number, number, number];
}

const VOXEL_SIZE = 0.8;
const GAP = 0.1;

export const LayerMesh: React.FC<LayerMeshProps> = ({ layer, layerIndex, position }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const { setHoveredInfo } = useCNNStore();

  const [_, height, width, channels] = layer.shape;
  const count = width * height * channels;

  // Reusable temporary objects (Memory Optimization)
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    let idx = 0;
    // Loop qua từng channel -> row -> col
    for (let c = 0; c < channels; c++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const id = idx++;
          
          // Tính vị trí: Center grid tại (0,0)
          const posX = (x - width / 2) * (VOXEL_SIZE + GAP);
          const posY = (height / 2 - y) * (VOXEL_SIZE + GAP); // Flip Y cho đúng ảnh
          const posZ = c * 2; // Tách các channel ra xa một chút

          tempObject.position.set(posX, posY, posZ);
          tempObject.scale.setScalar(1);
          tempObject.updateMatrix();
          meshRef.current.setMatrixAt(id, tempObject.matrix);

          // Color Mapping: Normalize value to Color
          const val = layer.data[id] || 0;
          // Viridis-like approximation (Tím -> Xanh -> Vàng)
          tempColor.setHSL(0.6 - (val * 0.5), 1.0, val * 0.5 + 0.1); 
          meshRef.current.setColorAt(id, tempColor);
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [layer, width, height, channels]);

  return (
    <group position={position}>
      {/* Label Layer */}
      <mesh position={[0, height/2 + 2, 0]}>
        <textGeometry args={[layer.name]} /> 
        {/* Note: Cần FontLoader để render text 3D, tạm thời dùng HTML overlay hoặc bỏ qua */}
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onPointerMove={(e) => {
          e.stopPropagation();
          const instanceId = e.instanceId;
          if (instanceId === undefined) return;
          
          // Tính toán ngược lại index i,j từ instanceId
          // Đây là simplified logic, thực tế cần mapping chính xác
          setHoveredInfo({
            layerIndex,
            voxelIndex: instanceId,
            x: 0, // Todo: calculate real X
            y: 0, // Todo: calculate real Y
            z: 0,
            value: layer.data[instanceId]
          });
        }}
        onPointerOut={() => setHoveredInfo(null)}
      >
        <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
        <meshStandardMaterial roughness={0.2} metalness={0.8} />
      </instancedMesh>
    </group>
  );
};
