import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCNNStore } from '@/store/useCNNStore';
import { Line } from '@react-three/drei';

export const Connections = () => {
  const { hoveredInfo, layers } = useCNNStore();

  const lines = useMemo(() => {
    if (!hoveredInfo || hoveredInfo.layerIndex === 0) return null;

    // Logic: Nếu đang hover ở Layer N, vẽ đường về Layer N-1
    // Giả sử Convolution 3x3, ta vẽ hình nón về 9 điểm ảnh cũ
    
    // Vị trí hiện tại (Output)
    // Cần đồng bộ logic vị trí với LayerMesh.tsx
    // Ở đây tôi hardcode demo để bạn thấy hiệu ứng
    const currentLayerX = hoveredInfo.layerIndex * 30;
    const prevLayerX = (hoveredInfo.layerIndex - 1) * 30;

    const start = new THREE.Vector3(currentLayerX, 0, 0); 
    const end = new THREE.Vector3(prevLayerX, 0, 0);

    return (
      <group>
        <Line 
          points={[start, end]} 
          color="cyan" 
          lineWidth={2} 
          transparent 
          opacity={0.6} 
        />
        {/* Hiệu ứng kernel frame ở layer trước */}
        <mesh position={end}>
          <ringGeometry args={[1, 1.1, 4]} />
          <meshBasicMaterial color="yellow" side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }, [hoveredInfo]);

  return lines;
};
