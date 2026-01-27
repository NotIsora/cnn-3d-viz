// src/components/scene/NetworkView.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Grid, Text } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import LayerMesh from './LayerMesh';
import { CNNEngine, LayerData } from '@/core/CNNEngine'; // Import Core Engine

export default function NetworkView() {
  // State để lưu trữ cấu trúc layer thực tế từ TensorFlow
  const [layers, setLayers] = useState<LayerData[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook khởi tạo AI Engine
  useEffect(() => {
    const initAI = async () => {
      try {
        const engine = CNNEngine.getInstance();
        await engine.init();
        
        // Load model mặc định và lấy cấu trúc
        const structure = await engine.loadModel();
        setLayers(structure);
        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to init AI Engine:", err);
        setLoading(false);
      }
    };

    initAI();
  }, []);

  return (
    <div className="h-full w-full relative bg-neutral-950">
      <Canvas
        camera={{ position: [40, 20, 40], fov: 45, near: 0.1, far: 2000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#050505']} />
        
        {/* --- Ánh sáng --- */}
        <ambientLight intensity={1.5} />
        <pointLight position={[20, 20, 20]} intensity={2000} distance={100} />
        <pointLight position={[-20, -10, 10]} intensity={1000} color="#4f46e5" />

        <Suspense fallback={null}>
          <group position={[-10, 0, -40]}>
            
            {/* Hiển thị Loading Text trong không gian 3D nếu đang tải model */}
            {loading && (
              <Text position={[0, 10, 0]} fontSize={2} color="white">
                Loading TensorFlow Model...
              </Text>
            )}

            {/* Render các layer thực tế từ Engine */}
            {!loading && layers.map((layer) => {
              // Tính toán số lượng neuron từ shape (Ví dụ: [28, 28, 1] -> 784)
              // Bỏ qua giá trị null hoặc -1 trong shape
              const neuronCount = layer.shape.reduce((a, b) => (b > 0 ? a * b : a), 1);
              
              // Màu sắc dựa trên loại layer
              let layerColor = '#94a3b8'; // Mặc định (Input)
              if (layer.type.includes('Conv')) layerColor = '#4f46e5'; // Xanh
              if (layer.type.includes('Pool')) layerColor = '#ec4899'; // Hồng
              if (layer.type.includes('Dense')) layerColor = '#eab308'; // Vàng
              if (layer.name === 'output') layerColor = '#22c55e'; // Xanh lá

              return (
                <LayerMesh
                  key={layer.id}
                  layerName={`${layer.type} (${layer.shape.join('x')})`}
                  position={[0, 0, layer.depth]}
                  count={neuronCount}
                  color={layerColor}
                  // Nếu layer nhỏ (như Dense 10), không cần grid quá to
                  gridSize={neuronCount < 100 ? Math.ceil(Math.sqrt(neuronCount)) : undefined}
                />
              );
            })}

            {/* Trục dẫn hướng */}
            <mesh position={[0, 0, 50]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 150, 8]} />
              <meshBasicMaterial color="#333" opacity={0.3} transparent />
            </mesh>
          </group>
        </Suspense>

        <Grid position={[0, -15, 0]} args={[200, 200]} cellColor="#222" sectionColor="#444" />
        <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
        
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>

      {/* --- UI Overlay --- */}
      <div className="absolute top-4 left-4 text-white pointer-events-none">
        <h1 className="text-2xl font-bold bg-black/50 p-2 rounded">CNN 3D Visualizer</h1>
        <div className="text-sm text-gray-400 px-2 mt-1">
          {loading ? (
            <span className="text-yellow-500">⏳ Initializing Tensor Engine...</span>
          ) : (
            <span className="text-green-500">● AI Engine Ready ({layers.length} layers)</span>
          )}
        </div>
      </div>
    </div>
  );
}
