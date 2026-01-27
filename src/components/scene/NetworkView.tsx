// src/components/scene/NetworkView.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Grid } from '@react-three/drei';
import { Suspense } from 'react';
import LayerMesh from './LayerMesh';

// Định nghĩa dữ liệu giả lập cho mạng CNN (Sau này sẽ thay bằng dữ liệu thật từ TensorFlow.js)
const MOCK_LAYERS = [
  { id: 'input', type: 'Input', count: 784, color: '#94a3b8', depth: 0, grid: 28 }, // 28x28 Image
  { id: 'conv1', type: 'Conv2D', count: 1000, color: '#4f46e5', depth: 15 },
  { id: 'pool1', type: 'MaxPooling', count: 400, color: '#ec4899', depth: 30 },
  { id: 'conv2', type: 'Conv2D', count: 800, color: '#4f46e5', depth: 45 },
  { id: 'pool2', type: 'MaxPooling', count: 200, color: '#ec4899', depth: 60 },
  { id: 'dense', type: 'Dense', count: 100, color: '#eab308', depth: 75 },
  { id: 'output', type: 'Output', count: 10, color: '#22c55e', depth: 90, grid: 10 },
];

export default function NetworkView() {
  return (
    <div className="h-full w-full relative bg-neutral-950">
      <Canvas
        // Tối ưu Camera
        camera={{ position: [40, 20, 40], fov: 45, near: 0.1, far: 1000 }}
        // Tối ưu Pixel Ratio cho màn hình Retina (giới hạn max là 2)
        dpr={[1, 2]}
        // Cấu hình render
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        {/* --- Môi trường & Ánh sáng --- */}
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={1.5} />
        <pointLight position={[20, 20, 20]} intensity={2000} distance={100} />
        <pointLight position={[-20, -10, 10]} intensity={1000} color="#4f46e5" />

        {/* --- Nội dung 3D --- */}
        <Suspense fallback={null}>
          <group position={[-10, 0, -40]}> {/* Căn chỉnh vị trí toàn bộ mạng */}
            {MOCK_LAYERS.map((layer) => (
              <LayerMesh
                key={layer.id}
                layerName={layer.type}
                position={[0, 0, layer.depth]} // Xếp chồng theo trục Z
                count={layer.count}
                color={layer.color}
                gridSize={layer.grid}
              />
            ))}
            
            {/* Đường nối trục Z để hình dung luồng dữ liệu */}
            <mesh position={[0, 0, 45]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 100, 8]} />
              <meshBasicMaterial color="#333" opacity={0.5} transparent />
            </mesh>
          </group>
        </Suspense>

        {/* --- Công cụ hỗ trợ --- */}
        <Grid 
          position={[0, -10, 0]} 
          args={[100, 100]} 
          cellColor="#333" 
          sectionColor="#555" 
          fadeStrength={1}
        />
        <OrbitControls 
          makeDefault 
          enableDamping 
          dampingFactor={0.05} 
          maxPolarAngle={Math.PI / 1.5} // Giới hạn góc xoay camera xuống dưới sàn
        />
        
        {/* Chỉ hiện FPS Stats trong môi trường Dev */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>

      {/* --- UI Overlay (HTML) --- */}
      <div className="absolute top-4 left-4 text-white pointer-events-none">
        <h1 className="text-2xl font-bold bg-black/50 p-2 rounded">CNN 3D Visualizer</h1>
        <p className="text-sm text-gray-400 px-2">Dev-Mode: Active</p>
      </div>
    </div>
  );
}
